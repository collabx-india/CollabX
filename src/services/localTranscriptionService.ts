type TranscriptionResult = { text: string };
type LocalTranscriber = (
  audio: Float32Array,
  options?: { chunk_length_s?: number; stride_length_s?: number; language?: string; task?: string }
) => Promise<TranscriptionResult>;

type BackendType = 'webgpu' | 'wasm';

interface ActiveTranscriber {
  backend: BackendType;
  transcribe: LocalTranscriber;
}

let activeTranscriberInstance: ActiveTranscriber | null = null;
let activeTranscriberPromise: Promise<ActiveTranscriber> | null = null;

const isWebGpuAvailable = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch (err) {
    console.warn('[LocalTranscription] WebGPU adapter check failed:', err);
    return false;
  }
};

const getAudioContext = (): typeof AudioContext => {
  const audioContext =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!audioContext) {
    throw new Error('This browser does not support local audio transcription.');
  }
  return audioContext;
};

const resampleAudio = (audioBuffer: AudioBuffer, targetSampleRate = 16000): Float32Array => {
  const sourceLength = audioBuffer.length;
  if (sourceLength === 0) {
    return new Float32Array(0);
  }

  const mono = new Float32Array(sourceLength);
  const numberOfChannels = audioBuffer.numberOfChannels;

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let index = 0; index < sourceLength; index += 1) {
      mono[index] += channelData[index] / numberOfChannels;
    }
  }

  if (audioBuffer.sampleRate === targetSampleRate) {
    return mono;
  }

  const targetLength = Math.max(1, Math.floor((sourceLength * targetSampleRate) / audioBuffer.sampleRate));
  const resampled = new Float32Array(targetLength);
  const ratio = (sourceLength - 1) / Math.max(1, targetLength - 1);

  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(sourceLength - 1, lowerIndex + 1);
    const weight = sourceIndex - lowerIndex;
    resampled[index] = mono[lowerIndex] * (1 - weight) + mono[upperIndex] * weight;
  }

  return resampled;
};

const loadPipelineForBackend = async (backend: BackendType): Promise<ActiveTranscriber> => {
  const { pipeline } = await import('@huggingface/transformers');

  if (backend === 'webgpu') {
    console.info('[LocalTranscription] Attempting to load Whisper model on WebGPU...');
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      device: 'webgpu',
      dtype: 'fp32',
    });
    console.info('[LocalTranscription] Successfully loaded Whisper on WebGPU.');
    return {
      backend: 'webgpu',
      transcribe: transcriber as unknown as LocalTranscriber,
    };
  }

  if (!('WebAssembly' in window)) {
    throw new Error('This browser cannot run the local transcription model via WebAssembly.');
  }

  console.info('[LocalTranscription] Loading Whisper model on WASM (dtype: q8)...');
  const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
    device: 'wasm',
    dtype: 'q8',
  });
  console.info('[LocalTranscription] Successfully loaded Whisper on WASM.');
  return {
    backend: 'wasm',
    transcribe: transcriber as unknown as LocalTranscriber,
  };
};

const getOrLoadTranscriber = async (forcedBackend?: BackendType): Promise<ActiveTranscriber> => {
  // If we already have a loaded instance matching the requested backend, reuse it
  if (activeTranscriberInstance && (!forcedBackend || activeTranscriberInstance.backend === forcedBackend)) {
    return activeTranscriberInstance;
  }

  // If a load is currently pending, await the existing cached Promise (singleton)
  if (activeTranscriberPromise) {
    return activeTranscriberPromise;
  }

  activeTranscriberPromise = (async () => {
    // If explicitly forced (e.g. falling back to wasm after webgpu failure)
    if (forcedBackend === 'wasm') {
      const wasmInstance = await loadPipelineForBackend('wasm');
      activeTranscriberInstance = wasmInstance;
      return wasmInstance;
    }

    // Check if WebGPU is available and prefer it
    const webGpuSupported = await isWebGpuAvailable();
    if (webGpuSupported) {
      try {
        const webGpuInstance = await loadPipelineForBackend('webgpu');
        activeTranscriberInstance = webGpuInstance;
        return webGpuInstance;
      } catch (webGpuLoadError) {
        console.warn('[LocalTranscription] WebGPU initialization failed, falling back to WASM:', webGpuLoadError);
      }
    }

    // Fall back to WASM backend
    const wasmInstance = await loadPipelineForBackend('wasm');
    activeTranscriberInstance = wasmInstance;
    return wasmInstance;
  })()
    .catch(error => {
      activeTranscriberInstance = null;
      throw error;
    })
    .finally(() => {
      activeTranscriberPromise = null;
    });

  return activeTranscriberPromise;
};

export const localTranscriptionService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('WebAssembly' in window || (typeof navigator !== 'undefined' && 'gpu' in navigator)) &&
      Boolean(
        window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      )
    );
  },

  async transcribe(blob: Blob): Promise<string> {
    const AudioContextClass = getAudioContext();
    const audioContext = new AudioContextClass();

    try {
      const arrayBuffer = await blob.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return '';
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      if (audioBuffer.length === 0 || audioBuffer.duration < 0.1) {
        return '';
      }

      const audioData = resampleAudio(audioBuffer);
      if (audioData.length === 0) {
        return '';
      }

      // 1. Get or lazily load the transcriber (prefers WebGPU, falls back to WASM on init failure)
      let currentTranscriber = await getOrLoadTranscriber();

      // 2. Attempt inference with the loaded model
      try {
        const result = await currentTranscriber.transcribe(audioData, {
          chunk_length_s: 30,
          stride_length_s: 5,
        });
        return result?.text ? result.text.trim() : '';
      } catch (inferenceError) {
        console.warn(
          `[LocalTranscription] Inference error on ${currentTranscriber.backend} backend:`,
          inferenceError
        );

        // 3. If WebGPU inference failed, fall back to WASM and retry inference once
        if (currentTranscriber.backend === 'webgpu') {
          console.info('[LocalTranscription] Retrying inference once using WASM fallback backend...');
          activeTranscriberInstance = null;
          activeTranscriberPromise = null;

          const fallbackTranscriber = await getOrLoadTranscriber('wasm');
          const retryResult = await fallbackTranscriber.transcribe(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
          });
          return retryResult?.text ? retryResult.text.trim() : '';
        }

        // If it was already on WASM or retry failed, rethrow
        throw inferenceError;
      }
    } finally {
      try {
        await audioContext.close();
      } catch (closeErr) {
        console.warn('[LocalTranscription] AudioContext close notice:', closeErr);
      }
    }
  },
};