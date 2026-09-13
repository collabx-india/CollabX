import React, { useState, useEffect, useRef } from 'react';
import { ProblemReport } from '../../types';
import { AIEngineService } from '../../services/aiEngineService';
import { collabxApi } from '../../services/collabxApi';
import { indexedDbService } from '../../services/indexedDbService';
import { localTranscriptionService } from '../../services/localTranscriptionService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  Mic, 
  Square, 
  Camera, 
  MapPin, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Send,
  Volume2,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ProblemReportFormProps {
  onSuccess: (problem: ProblemReport) => void;
  onCancel?: () => void;
}

export const ProblemReportForm: React.FC<ProblemReportFormProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [locality, setLocality] = useState('Harmu Bypass, Ward 14');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [affectedPop, setAffectedPop] = useState(4500);
  const [frequency, setFrequency] = useState('Every monsoon rain (15+ times/year)');

  // ====================================================
  // 1. VOICE RECORDING (MediaRecorder API)
  // ====================================================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [usingDemoVoice, setUsingDemoVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const transcribeRecordedAudio = async (blob: Blob) => {
    if (!localTranscriptionService.isSupported()) {
      setVoiceError('Local transcription is not supported on this device. You can type the report normally below.');
      return;
    }

    setIsTranscribing(true);
    setVoiceError(null);
    try {
      const transcript = await localTranscriptionService.transcribe(blob);
      if (transcript) {
        setAudioTranscript(transcript);
        setDescription(transcript);
      } else {
        setVoiceError('No speech was detected. You can type the report normally below.');
      }
    } catch (error) {
      console.warn('Local transcription unavailable:', error);
      setVoiceError('Local transcription could not run. Your audio stays on this device; you can type the report normally below.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Timer effect for voice recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startVoiceRecording = async () => {
    setVoiceError(null);
    setAudioUrl(null);
    setAudioTranscript('');
    setUsingDemoVoice(false);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('Browser Voice Recording API not supported on this browser. Please use the Demo Voice option below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlobObj = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlobObj);
        setAudioUrl(url);
        void transcribeRecordedAudio(audioBlobObj);
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setVoiceError(err.message || 'Microphone access denied or unavailable. Please check browser permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteVoiceRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioTranscript('');
    setVoiceError(null);
    setIsTranscribing(false);
    setUsingDemoVoice(false);
  };

  const handleUseDemoVoice = () => {
    deleteVoiceRecording();
    setUsingDemoVoice(true);
    const demoVoiceText = 'Every monsoon, water enters this road and school children cannot cross. The main culvert is choked and water stands for 8 hours.';
    setAudioTranscript(demoVoiceText);
    setDescription(demoVoiceText);
    if (!title) {
      setTitle('Waterlogging in Harmu bypass cutting off school access');
    }
  };

  // ====================================================
  // 2. CAMERA CAPTURE (getUserMedia Video Stream)
  // ====================================================
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'upload' | 'camera' | 'sample' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser Camera API not supported on this device. Use Upload Photo or Demo Image.');
      setCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not available.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhotoUrl(dataUrl);
        setPhotoSource('camera');
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCapturedPhotoUrl(url);
      setPhotoSource('upload');
    }
  };

  const handleUseDemoImage = () => {
    stopCamera();
    setCapturedPhotoUrl('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80');
    setPhotoSource('sample');
  };

  // ====================================================
  // 3. GPS LOCATION (navigator.geolocation)
  // ====================================================
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [usingDemoLocation, setUsingDemoLocation] = useState(false);

  const fetchBrowserGPS = () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(false);
    setUsingDemoLocation(false);

    if (!navigator.geolocation) {
      setLocationError('Browser Geolocation API is not supported on this device.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lng = parseFloat(position.coords.longitude.toFixed(4));
        setCoordinates({ lat, lng });
        setLocationSuccess(true);
        setIsLocating(false);
      },
      error => {
        console.error('GPS Location error:', error);
        setLocationError(`GPS Error: ${error.message} (Code ${error.code})`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUseDemoLocation = () => {
    setCoordinates({ lat: 23.3541, lng: 85.3211 });
    setDistrict('Ranchi');
    setLocality('Harmu Bypass, Ward 14');
    setUsingDemoLocation(true);
    setLocationSuccess(true);
    setLocationError(null);
  };

  // ====================================================
  // INSTANT AI ANALYSIS ENGINE
  // ====================================================
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  useEffect(() => {
    if (description.trim().length > 15) {
      const timer = setTimeout(() => {
        const existingProblems = storageService.getProblems();
        const analysis = AIEngineService.analyzeProblem(title, description, locality, existingProblems);
        setAiAnalysis(analysis);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setAiAnalysis(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [title, description, locality]);

  useEffect(() => {
    const syncPendingReports = () => {
      void indexedDbService.syncPendingReports(payload => collabxApi.createProblem(payload));
    };

    syncPendingReports();
    window.addEventListener('online', syncPendingReports);
    return () => window.removeEventListener('online', syncPendingReports);
  }, []);

  const [submittedProblem, setSubmittedProblem] = useState<ProblemReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCoordinates = coordinates || { lat: 23.3541, lng: 85.3211 };

    const existingProblems = storageService.getProblems();
    const finalAiAnalysis = aiAnalysis || AIEngineService.analyzeProblem(title, description, locality, existingProblems);

    const newProblem: ProblemReport = {
      id: `JH-RC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title || 'Monsoon Waterlogging in Harmu Corridor',
      description: description || 'Severe waterlogging disrupts normal traffic and pedestrian movement.',
      citizenName: currentUser.name,
      citizenPhone: '+91 98765 43210',
      district,
      panchayatOrLocality: locality,
      coordinates: finalCoordinates,
      affectedPopulation: Number(affectedPop),
      frequency,
      evidenceUrls: capturedPhotoUrl ? [capturedPhotoUrl] : [],
      audioTranscript: audioTranscript || undefined,
      hasVoiceNote: Boolean(audioUrl || audioTranscript),
      communityConfirmations: 1,
      status: 'university_matched',
      matchedUniversity: finalAiAnalysis.matchedUniversity,
      matchedDepartment: finalAiAnalysis.matchedDepartment,
      matchingScore: finalAiAnalysis.matchingScore,
      matchingReason: finalAiAnalysis.matchingReason,
      matchingExplanationBullets: finalAiAnalysis.matchingExplanationBullets,
      secondaryMatches: finalAiAnalysis.secondaryMatches,
      referredUniversities: finalAiAnalysis.matchedUniversity ? [finalAiAnalysis.matchedUniversity] : ['Birla Institute of Technology (BIT) Mesra'],
      aiAnalysis: finalAiAnalysis,
      createdAt: new Date().toISOString(),
    };

    const pendingReport = {
      title: newProblem.title,
      description: newProblem.description,
      district: newProblem.district,
      locality: newProblem.panchayatOrLocality,
      citizen_name: newProblem.citizenName,
      citizen_phone: newProblem.citizenPhone,
      coordinates: newProblem.coordinates,
      affected_population: newProblem.affectedPopulation,
      frequency: newProblem.frequency,
      evidence_urls: newProblem.evidenceUrls,
      audio_transcript: newProblem.audioTranscript || null,
      has_voice_note: newProblem.hasVoiceNote || false,
      createdAt: newProblem.createdAt,
    };

    try {
      await indexedDbService.enqueueReport({ ...pendingReport, id: newProblem.id });
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const syncResult = await indexedDbService.syncPendingReports(payload => collabxApi.createProblem(payload));
        if (syncResult.failed > 0) {
          setOfflineMessage('Saved offline – will sync when internet is available.');
        }
      } else {
        setOfflineMessage('Saved offline – will sync when internet is available.');
      }
    } catch (error) {
      console.warn('Backend sync unavailable; submission remains queued locally.', error);
      setOfflineMessage('Saved offline – will sync when internet is available.');
    }

    storageService.saveProblem(newProblem);

    // Audit log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Citizen',
      action: 'SUBMIT_PROBLEM',
      targetEntity: newProblem.id,
      details: `Problem reported at ${locality}, ${district}. AI severity: ${finalAiAnalysis.severity}/100. Matched to ${newProblem.matchedUniversity} - ${newProblem.matchedDepartment} (${newProblem.matchingScore}% match).`,
      ipHash: '10.42.12.8 [Citizen Mobile Portal]',
    });

    // Notification
    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Civic Problem Submitted & AI Matched',
      message: `Your grievance ${newProblem.id} has been processed by AI and matched to ${newProblem.matchedUniversity} (${newProblem.matchedDepartment}).`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'citizen',
    });

    setSubmittedProblem(newProblem);
  };

  if (submittedProblem) {
    const analysis = submittedProblem.aiAnalysis;
    return (
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-7 max-w-4xl mx-auto space-y-6">
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start space-x-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="gov-h2 text-emerald-950">
              Grievance Registered & Automatically Matched
            </h2>
            <p className="gov-body text-emerald-800">
              Problem ID: <span className="gov-id font-bold">{submittedProblem.id}</span> • AI has analyzed the report and routed it directly to the designated university department.
            </p>
          </div>
        </div>

        {/* AI Immediate Analysis Card */}
        <div className="p-5 bg-slate-50 rounded-lg border-2 border-gov-navy/20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-gov-saffron" />
              <h3 className="gov-h3 text-gov-navy">
                AI Problem Analysis & Institution Routing
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-gov-navy text-white rounded">
              Match Score: {submittedProblem.matchingScore || 85}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">Category</span>
              <div className="font-bold text-slate-900 text-sm">{analysis?.category || 'Civic Infrastructure'}</div>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">Priority Level</span>
              <div className="font-bold text-red-600 text-sm">{analysis?.priority || 'High'}</div>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">Duplicate Check Result</span>
              <div className="font-bold text-slate-900 text-sm">
                {analysis?.duplicateSimilarity && analysis.duplicateSimilarity > 40
                  ? `Similarity ${analysis.duplicateSimilarity}%`
                  : 'Unique Issue (0% duplicate)'}
              </div>
            </div>
          </div>

          {/* Matched Institution & Department */}
          <div className="p-4 bg-white rounded-lg border-2 border-blue-300 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase font-semibold text-blue-800 tracking-wider block">Matched University:</span>
                <span className="text-base font-bold text-gov-navy block mt-0.5">
                  {submittedProblem.matchedUniversity || 'Birla Institute of Technology (BIT) Mesra'}
                </span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-gov-navy rounded text-xs font-bold border border-blue-200">
                Department: {submittedProblem.matchedDepartment || 'Department of Civil Engineering'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block">Why this match:</span>
              <p className="text-slate-700 italic">
                {submittedProblem.matchingReason || 'Matched based on technical capability match in municipal infrastructure, drainage, and urban hydrology.'}
              </p>
              {submittedProblem.matchingExplanationBullets && submittedProblem.matchingExplanationBullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-slate-600 pt-1">
                  {submittedProblem.matchingExplanationBullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedProblem(null);
              setTitle('');
              setDescription('');
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 transition"
          >
            Submit Another Problem
          </button>

          <button
            type="button"
            onClick={() => onSuccess(submittedProblem)}
            className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded text-xs sm:text-sm font-bold flex items-center space-x-2 transition shadow-sm"
          >
            <span>View My Problems & Progress →</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-7 max-w-4xl mx-auto">
      <div className="border-b border-gov-border pb-4 mb-6">
        <div className="flex items-center space-x-2 text-gov-saffron text-sm font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>{t('Voice, Camera & GPS Enabled Reporting', 'ध्वनि, कैमरा एवं जीपीएस आधारित रिपोर्टिंग')}</span>
        </div>
        <h2 className="gov-h2 mt-1">
          {t('Report a Civic Problem', 'नागरिक समस्या दर्ज करें')}
        </h2>
        <p className="gov-body text-slate-600 mt-1">
          {t('Record voice notes, capture live photos, and pinpoint browser GPS coordinates.', 'अपनी भाषा में समस्या का विवरण दें।')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {offlineMessage && (
          <div className="rounded border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900" role="status">
            {offlineMessage}
          </div>
        )}
        {/* ==================================================== */}
        {/* 1. VOICE RECORDING SECTION (MediaRecorder API)       */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="gov-h3 flex items-center space-x-2">
              <Mic className="w-5 h-5 text-gov-saffron" />
              <span>1. Voice Note Recording (Browser MediaRecorder API)</span>
            </h3>
            <span className="gov-helper font-mono">Microphone Hardware Access</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isRecording ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="py-2.5 px-4 bg-gov-navy hover:bg-gov-navy-dark text-white rounded gov-button flex items-center space-x-2 transition shadow-xs"
              >
                <Mic className="w-4 h-4 text-gov-saffron" />
                <span>🎙️ Record Voice (Browser Mic)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded gov-button flex items-center space-x-2 animate-pulse shadow-xs"
              >
                <Square className="w-4 h-4" />
                <span>⏹️ Stop Recording ({recordingSeconds}s)</span>
              </button>
            )}

            {audioUrl && (
              <button
                type="button"
                onClick={deleteVoiceRecording}
                className="py-2.5 px-4 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded gov-button flex items-center space-x-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Recording</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUseDemoVoice}
              className="py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded gov-button flex items-center space-x-1.5 transition"
            >
              <span>🎙️ Use Sample Voice Audio</span>
            </button>
          </div>

          {/* Error Message for Voice */}
          {voiceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Real Audio Player */}
          {audioUrl && (
            <div className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-sm font-semibold text-gov-navy">
                <span>Recorded Audio Preview:</span>
                <span className="text-xs text-emerald-700 font-mono">✅ Audio Captured ({recordingSeconds}s)</span>
              </div>
              <audio controls src={audioUrl} className="w-full h-9 mt-1" />
            </div>
          )}

          {/* Audio Transcript feedback if demo or transcribed */}
          {audioTranscript && (
            <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-sm text-amber-900 flex items-start space-x-2">
              <Volume2 className="w-4 h-4 text-gov-saffron flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <label htmlFor="voice-transcript" className="gov-label block">Local Transcript (editable):</label>
                <textarea
                  id="voice-transcript"
                  value={audioTranscript}
                  onChange={event => {
                    setAudioTranscript(event.target.value);
                    setDescription(event.target.value);
                  }}
                  rows={3}
                  className="w-full rounded border border-amber-300 bg-white p-2.5 text-base text-slate-800 outline-none focus:border-gov-saffron"
                />
                {usingDemoVoice && <span className="block gov-helper text-amber-700 mt-0.5">• Preset Sample Audio Applied</span>}
              </div>
            </div>
          )}
          {isTranscribing && (
            <div className="p-2.5 bg-blue-50 rounded border border-blue-200 text-xs text-blue-800 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Loading Whisper locally and transcribing on this device...</span>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 2. CAMERA CAPTURE SECTION (getUserMedia Video Stream) */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="gov-h3 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-gov-blue" />
              <span>2. Camera Photo Evidence (Browser Video Stream)</span>
            </h3>
            <span className="gov-helper font-mono">Camera Hardware Access</span>
          </div>

          {/* Live Video Preview Stream */}
          {cameraActive && (
            <div className="relative rounded overflow-hidden bg-black max-w-md mx-auto">
              <video ref={videoRef} autoPlay playsInline className="w-full h-56 object-cover" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base rounded-md shadow-md flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 Take Snapshot</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2.5 px-4 bg-slate-800 text-white font-semibold text-sm sm:text-base rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!cameraActive && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="py-2.5 px-4 bg-gov-blue hover:bg-gov-blue-light text-white rounded text-sm sm:text-base font-semibold flex items-center space-x-2 transition shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>📷 Open Live Camera</span>
              </button>

              <label className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-sm sm:text-base font-semibold flex items-center space-x-2 cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Upload from Device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleUseDemoImage}
                className="py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-sm font-semibold flex items-center space-x-1.5 transition"
              >
                <span>📷 Use Sample Image</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Empty Photo State */}
          {!capturedPhotoUrl && !cameraActive && (
            <div className="p-4 bg-white rounded border border-dashed border-slate-300 text-sm text-slate-600 text-center space-y-1">
              <div className="font-semibold text-slate-800">No photo attached yet.</div>
              <div className="text-xs text-slate-500">Capture a photo or upload an image as evidence.</div>
            </div>
          )}

          {/* Captured / Attached Photo Display */}
          {capturedPhotoUrl && !cameraActive && (
            <div className="flex items-center space-x-3.5 p-3 bg-white rounded border border-slate-300">
              <img
                src={capturedPhotoUrl}
                alt="Captured civic evidence"
                className="w-24 h-20 object-cover rounded border border-slate-300 flex-shrink-0"
              />
              <div className="text-sm text-slate-700 space-y-1">
                <div className="font-bold text-gov-navy flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gov-green" />
                  <span>Photo Evidence Attached</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {photoSource === 'upload'
                    ? 'Photo uploaded from device'
                    : photoSource === 'camera'
                    ? 'Frame Captured from Browser Media Stream'
                    : 'Sample / Demo Image Attached'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhotoUrl(null);
                    setPhotoSource(null);
                  }}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Remove Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 3. GPS LOCATION SECTION (Geolocation API)           */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="gov-h3 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gov-green" />
              <span>3. Geolocation Geotagging (Browser Geolocation API)</span>
            </h3>
            <span className="gov-helper font-mono">GPS Hardware Access</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchBrowserGPS}
              disabled={isLocating}
              className="py-2.5 px-4 bg-gov-green hover:bg-emerald-700 text-white rounded gov-button flex items-center space-x-2 transition shadow-xs"
            >
              <MapPin className="w-4 h-4" />
              <span>{isLocating ? 'Acquiring Satellite Fix...' : '📍 Use Browser GPS Location'}</span>
            </button>

            <button
              type="button"
              onClick={handleUseDemoLocation}
              className="py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded gov-button flex items-center space-x-1.5 transition"
            >
              <span>📍 Use Sample Location</span>
            </button>
          </div>

          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {locationSuccess && coordinates && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-sm sm:text-base text-emerald-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-gov-green flex-shrink-0" />
                <span>
                  <span className="font-bold">✅ Location Captured:</span> Latitude{' '}
                  <span className="gov-id font-bold">{coordinates.lat}° N</span>, Longitude{' '}
                  <span className="gov-id font-bold">{coordinates.lng}° E</span>
                </span>
              </div>
              {usingDemoLocation && (
                <span className="gov-badge bg-amber-200 text-amber-900">
                  Sample Location
                </span>
              )}
            </div>
          )}
        </div>

        {/* Text Title Input */}
        <div>
          <label className="gov-label block mb-1.5">
            {t('Problem Title / Brief Description *', 'समस्या का शीर्षक / संक्षिप्त विवरण *')}
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Chronic monsoon waterlogging in Harmu bypass road"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-3 text-base text-slate-900 bg-white border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue"
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="gov-label block mb-1.5">
            {t('Describe the Problem in Your Own Words *', 'समस्या का पूरा विवरण लिखें *')}
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe what happens, how long water remains stagnant, what facilities are impacted..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-3 text-base text-slate-900 bg-white border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue leading-relaxed"
          ></textarea>
        </div>

        {/* Location Details: District & Locality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="gov-label block mb-1.5">
              {t('District *', 'जिला *')}
            </label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full p-3 text-base text-slate-900 bg-white border border-slate-300 rounded-md focus:border-gov-blue"
            >
              <option value="Ranchi">Ranchi (राँची)</option>
              <option value="Dhanbad">Dhanbad (धनबाद)</option>
              <option value="East Singhbhum">East Singhbhum / Jamshedpur (पूर्वी सिंहभूम)</option>
              <option value="Bokaro">Bokaro (बोकारो)</option>
              <option value="Hazaribagh">Hazaribagh (हज़ारीबाग)</option>
              <option value="Deoghar">Deoghar (देवघर)</option>
              <option value="Palamu">Palamu (पलामू)</option>
            </select>
          </div>

          <div>
            <label className="gov-label block mb-1.5">
              {t('Panchayat / Locality / Ward *', 'पंचायत / मोहल्ला / वार्ड *')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Harmu Bypass, Ward 14"
              value={locality}
              onChange={e => setLocality(e.target.value)}
              className="w-full p-3 text-base text-slate-900 bg-white border border-slate-300 rounded-md focus:border-gov-blue"
            />
          </div>
        </div>

        {/* Optional Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="gov-label block mb-1">
              {t('Estimated Affected Population', 'अनुमानित प्रभावित आबादी')}
            </label>
            <input
              type="number"
              value={affectedPop}
              onChange={e => setAffectedPop(Number(e.target.value))}
              className="w-full p-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="gov-label block mb-1">
              {t('Frequency of Occurrence', 'समस्या की आवृत्ति')}
            </label>
            <input
              type="text"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full p-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md"
            />
          </div>
        </div>

        {/* ==================================================== */}
        {/* INSTANT AI ANALYSIS CARD (Decision Support)          */}
        {/* ==================================================== */}
        {aiAnalysis && (
          <div className="bg-slate-50 rounded-lg border-2 border-blue-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-gov-blue" />
                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-gov-navy">
                  AI Analysis — Decision Support Assistant
                </span>
              </div>
              <span className="text-xs sm:text-sm bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded font-semibold">
                Confidence: {Math.round(aiAnalysis.confidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Category</span>
                <div className="font-bold text-gov-navy mt-0.5 text-sm sm:text-base">{aiAnalysis.category}</div>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Severity</span>
                <div className="font-bold text-gov-saffron mt-0.5 text-sm sm:text-base">{aiAnalysis.severity} / 100</div>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Priority</span>
                <div className="font-bold text-red-600 mt-0.5 text-sm sm:text-base">{aiAnalysis.priority}</div>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Duplicate Similarity</span>
                <div className="font-bold text-purple-700 mt-0.5 text-sm sm:text-base">{aiAnalysis.duplicateSimilarity}%</div>
              </div>
            </div>

            {aiAnalysis.duplicateCandidateTitle && (
              <div className="p-3 bg-amber-50 rounded border border-amber-300 text-sm text-amber-900 flex items-start space-x-2.5">
                <Copy className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Possible Duplicate Flagged ({aiAnalysis.duplicateSimilarity}%):</span>{' '}
                  Grievance <span className="font-mono font-bold">#{aiAnalysis.duplicateCandidateId}</span> — "{aiAnalysis.duplicateCandidateTitle}".
                  <span className="block text-xs sm:text-sm text-amber-800 mt-0.5">
                    Government officer will inspect for consolidation.
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-white rounded border border-blue-200 text-sm space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-gov-navy text-sm sm:text-base">
                  Target Match: {aiAnalysis.matchedUniversity || 'Birla Institute of Technology (BIT) Mesra'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {aiAnalysis.matchedDepartment || 'Department of Civil Engineering'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                {aiAnalysis.matchingReason}
              </p>
            </div>
          </div>
        )}

        {/* Submission Buttons */}
        <div className="pt-4 border-t border-gov-border flex items-center justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-md text-sm sm:text-base font-semibold hover:bg-slate-100"
            >
              {t('Cancel', 'रद्द करें')}
            </button>
          )}

          <button
            type="submit"
            className="px-6 py-3 bg-gov-navy hover:bg-gov-navy-dark text-white rounded-md text-base font-bold flex items-center space-x-2 transition shadow-sm"
          >
            <Send className="w-5 h-5" />
            <span>{t('Submit Grievance to Portal', 'समस्या आधिकारिक रूप से दर्ज करें')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
