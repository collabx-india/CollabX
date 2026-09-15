export type TranscriptionProgressState = {
  stage: 'preparing' | 'downloading' | 'initializing' | 'transcribing' | 'completed' | 'error';
  message: string;
  percent?: number;
};

export type ProgressCallback = (state: TranscriptionProgressState) => void;

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

const PRIMARY_MODEL = 'onnx-community/whisper-tiny.en';

let activeTranscriberInstance: ActiveTranscriber | null = null;
let activeTranscriberPromise: Promise<ActiveTranscriber> | null = null;

export const isWebGpuAvailable = async (): Promise<boolean> => {
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

export const checkIsModelCached = async (modelId = PRIMARY_MODEL): Promise<boolean> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }
  try {
    const cache = await caches.open('transformers-cache');
    const requests = await cache.keys();
    if (!requests || requests.length === 0) {
      return false;
    }
    return requests.some(req => req.url.includes(modelId));
  } catch (err) {
    console.warn('[LocalTranscription] Cache check warning:', err);
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

const loadPipelineForBackend = async (
  backend: BackendType,
  onProgress?: ProgressCallback
): Promise<ActiveTranscriber> => {
  const { pipeline, env } = await import('@huggingface/transformers');

  // Enable Transformers.js browser caching
  env.useBrowserCache = true;
  env.allowRemoteModels = true;

  const progressCallback = (info: any) => {
    if ((info.status === 'progress_total' || info.status === 'progress') && typeof info.progress === 'number') {
      const pct = Math.min(100, Math.max(0, Math.round(info.progress)));
      onProgress?.({
        stage: 'downloading',
        percent: pct,
        message: `Preparing voice recognition...\nDownloading AI model: ${pct}%`,
      });
    } else if (info.status === 'ready' || info.status === 'done') {
      onProgress?.({
        stage: 'initializing',
        message: 'Initializing local AI...',
      });
    }
  };

  if (backend === 'webgpu') {
    console.info(`[LocalTranscription] Loading ${PRIMARY_MODEL} on WebGPU...`);
    const transcriber = await pipeline('automatic-speech-recognition', PRIMARY_MODEL, {
      device: 'webgpu',
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'q4',
      },
      progress_callback: progressCallback,
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

  console.info(`[LocalTranscription] Loading ${PRIMARY_MODEL} on WASM (dtype: q8)...`);
  const transcriber = await pipeline('automatic-speech-recognition', PRIMARY_MODEL, {
    device: 'wasm',
    dtype: 'q8',
    progress_callback: progressCallback,
  });
  console.info('[LocalTranscription] Successfully loaded Whisper on WASM.');
  return {
    backend: 'wasm',
    transcribe: transcriber as unknown as LocalTranscriber,
  };
};

const getOrLoadTranscriber = async (
  forcedBackend?: BackendType,
  onProgress?: ProgressCallback
): Promise<ActiveTranscriber> => {
  if (activeTranscriberInstance && (!forcedBackend || activeTranscriberInstance.backend === forcedBackend)) {
    return activeTranscriberInstance;
  }

  if (activeTranscriberPromise) {
    return activeTranscriberPromise;
  }

  activeTranscriberPromise = (async () => {
    if (forcedBackend === 'wasm') {
      const wasmInstance = await loadPipelineForBackend('wasm', onProgress);
      activeTranscriberInstance = wasmInstance;
      return wasmInstance;
    }

    const webGpuSupported = await isWebGpuAvailable();
    if (webGpuSupported) {
      try {
        const webGpuInstance = await loadPipelineForBackend('webgpu', onProgress);
        activeTranscriberInstance = webGpuInstance;
        return webGpuInstance;
      } catch (webGpuLoadError) {
        console.warn('[LocalTranscription] WebGPU initialization failed, falling back to WASM:', webGpuLoadError);
      }
    }

    const wasmInstance = await loadPipelineForBackend('wasm', onProgress);
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

  async transcribe(
    blob: Blob,
    onProgress?: ProgressCallback
  ): Promise<string> {
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

      // 1. Cache-awareness check before showing long loading state
      if (!activeTranscriberInstance) {
        const isCached = await checkIsModelCached(PRIMARY_MODEL);
        if (isCached) {
          onProgress?.({
            stage: 'preparing',
            message: 'Voice recognition ready',
          });
        } else {
          onProgress?.({
            stage: 'preparing',
            message: 'Preparing voice recognition for first use...',
          });
        }
      }

      // 2. Lazily load the transcriber singleton (prefers WebGPU, falls back to WASM on failure)
      let currentTranscriber = await getOrLoadTranscriber(undefined, onProgress);

      // 3. Indicate transcribing stage
      onProgress?.({
        stage: 'transcribing',
        message: 'Transcribing your recording...',
      });

      // 4. Run inference
      try {
        const result = await currentTranscriber.transcribe(audioData, {
          chunk_length_s: 30,
          stride_length_s: 5,
        });

        onProgress?.({
          stage: 'completed',
          message: 'Voice transcription complete.',
        });

        return result?.text ? result.text.trim() : '';
      } catch (inferenceError) {
        console.warn(
          `[LocalTranscription] Inference error on ${currentTranscriber.backend} backend:`,
          inferenceError
        );

        // 5. If WebGPU inference failed, fall back to WASM and retry inference once
        if (currentTranscriber.backend === 'webgpu') {
          console.info('[LocalTranscription] Retrying inference once using WASM fallback backend...');
          activeTranscriberInstance = null;
          activeTranscriberPromise = null;

          onProgress?.({
            stage: 'initializing',
            message: 'Retrying on WebAssembly fallback...',
          });

          const fallbackTranscriber = await getOrLoadTranscriber('wasm', onProgress);

          onProgress?.({
            stage: 'transcribing',
            message: 'Transcribing your recording...',
          });

          const retryResult = await fallbackTranscriber.transcribe(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
          });

          onProgress?.({
            stage: 'completed',
            message: 'Voice transcription complete.',
          });

          return retryResult?.text ? retryResult.text.trim() : '';
        }

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