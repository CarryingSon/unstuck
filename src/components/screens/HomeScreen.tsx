import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Keyboard, Mic, FileUp, Camera, Sparkles, HelpCircle, Shield, Zap, Layout, Users, ChevronRight, Home, Square } from 'lucide-react';
import { motion } from 'motion/react';

export function HomeScreen({
  taskText,
  setTaskText,
  error,
  onNext,
}: {
  taskText: string;
  setTaskText: (value: string) => void;
  error?: string;
  onNext: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const taskTextRef = useRef(taskText);
  const recordSecondsRef = useRef(0);
  const voiceUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef('');

  useEffect(() => {
    taskTextRef.current = taskText;
  }, [taskText]);

  useEffect(() => {
    recordSecondsRef.current = recordSeconds;
  }, [recordSeconds]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !cameraStreamRef.current) return;
    const video = videoRef.current;
    video.srcObject = cameraStreamRef.current;
    void video.play().catch(() => {
      setMediaError('Camera preview could not start automatically. Please allow camera access.');
    });
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
      if (voiceUrlRef.current) {
        URL.revokeObjectURL(voiceUrlRef.current);
      }
    };
  }, []);

  const appendToTask = (value: string) => {
    const current = taskTextRef.current.trim();
    const next = current ? `${current}\n${value}` : value;
    taskTextRef.current = next;
    setTaskText(next);
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const stopAudioStream = () => {
    if (!audioStreamRef.current) return;
    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const stopCameraStream = () => {
    if (!cameraStreamRef.current) return;
    cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json')
    ) {
      try {
        const content = await file.text();
        const normalized = content.trim().slice(0, 2000);
        if (normalized) {
          setTaskText(normalized);
        } else {
          appendToTask(`Uploaded file: ${file.name}`);
        }
      } catch {
        appendToTask(`Uploaded file: ${file.name}`);
      }
    } else {
      appendToTask(`Uploaded file: ${file.name}`);
    }

    event.target.value = '';
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMediaError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      transcriptBufferRef.current = '';
      setTranscriptPreview('');
      setMediaError('');

      const preferredMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const mimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 0) {
          if (voiceUrlRef.current) {
            URL.revokeObjectURL(voiceUrlRef.current);
          }
          const nextUrl = URL.createObjectURL(audioBlob);
          voiceUrlRef.current = nextUrl;
          setVoiceNoteUrl(nextUrl);
          appendToTask(`Voice note recorded (${formatDuration(recordSecondsRef.current)}).`);
        }

        const finalTranscript = transcriptBufferRef.current.trim();
        if (finalTranscript) {
          setTranscriptPreview(finalTranscript);
          appendToTask(`Transcript: ${finalTranscript}`);
        }

        setIsRecording(false);
        setIsTranscribing(false);
        setRecordSeconds(0);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        recognitionRef.current = null;
        stopAudioStream();
      };

      recorder.start(200);
      setRecordSeconds(0);
      setIsRecording(true);

      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            const text = String(result?.[0]?.transcript ?? '').trim();
            if (!text) continue;

            if (result.isFinal) {
              transcriptBufferRef.current = `${transcriptBufferRef.current} ${text}`.trim();
            } else {
              interim = `${interim} ${text}`.trim();
            }
          }

          setTranscriptPreview(`${transcriptBufferRef.current} ${interim}`.trim());
        };

        recognition.onerror = () => {
          setIsTranscribing(false);
        };

        recognition.onend = () => {
          setIsTranscribing(false);
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
          setIsTranscribing(true);
        } catch {
          setIsTranscribing(false);
        }
      }
    } catch {
      setMediaError('Microphone access was denied or is unavailable.');
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
    }
    mediaRecorderRef.current.stop();
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }
    void startVoiceRecording();
  };

  const openCamera = async () => {
    if (isCameraOpen) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('Camera access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
      setMediaError('');
    } catch {
      setMediaError('Camera access was denied or is unavailable.');
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    stopCameraStream();
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setMediaError('Camera is not ready yet. Please try again in a second.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMediaError('Could not capture photo from camera stream.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(imageDataUrl);
    appendToTask(`Photo captured at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    closeCamera();
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 md:px-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-primary/60 font-semibold mb-12">
        <Home className="w-4 h-4" />
        <span>Home</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-primary">Start Your Path</span>
      </div>

      {/* Main Hero Section */}
      <div className="text-center mb-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 bg-primary/15 text-accent rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        >
          Welcome Back!
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-ink mb-6 tracking-tight">
          What's making you feel <span className="text-primary italic">stuck</span>?
        </h1>
        <p className="text-xl text-ink/60 font-medium max-w-2xl mx-auto">
          Don't worry, we'll figure it out together. Describe your task in any way that feels easiest.
        </p>
      </div>

      {/* Main Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl soft-shadow border border-primary/10 mb-20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        {/* Input Methods (Top Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 relative z-10">
          <button
            onClick={() => textAreaRef.current?.focus()}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/30"
          >
            <Keyboard className="w-10 h-10" strokeWidth={2} />
            <span className="font-bold text-sm">Type it out</span>
          </button>
          
          <button
            onClick={toggleVoiceRecording}
            className={`group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] transition-all hover:-translate-y-2 hover:shadow-lg ${
              isRecording
                ? 'bg-accent text-white shadow-accent/35'
                : 'bg-secondary/20 text-accent hover:bg-secondary hover:text-white hover:shadow-secondary/30'
            }`}
          >
            {isRecording ? <Square className="w-10 h-10 fill-current" strokeWidth={2} /> : <Mic className="w-10 h-10" strokeWidth={2} />}
            <span className="font-bold text-sm">{isRecording ? `Stop (${formatDuration(recordSeconds)})` : 'Voice note'}</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] bg-accent/10 text-accent transition-all hover:bg-accent hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/30"
          >
            <FileUp className="w-10 h-10" strokeWidth={2} />
            <span className="font-bold text-sm">Upload file</span>
          </button>
          
          <button
            onClick={openCamera}
            className={`group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] transition-all hover:-translate-y-2 hover:shadow-lg ${
              isCameraOpen
                ? 'bg-accent text-white shadow-accent/35'
                : 'bg-primary/5 text-primary hover:bg-primary hover:text-white hover:shadow-primary/30'
            }`}
          >
            <Camera className="w-10 h-10" strokeWidth={2} />
            <span className="font-bold text-sm">{isCameraOpen ? 'Camera on' : 'Take photo'}</span>
          </button>
        </div>

        {(isCameraOpen || voiceNoteUrl || capturedPhotoUrl || transcriptPreview || mediaError) && (
          <div className="mb-8 relative z-10 space-y-4">
            {isCameraOpen && (
              <div className="rounded-[2rem] overflow-hidden border border-primary/20 bg-surface">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-72 md:h-96 bg-black object-cover" />
                <div className="flex flex-wrap items-center gap-3 p-4 bg-bg/70 border-t border-primary/10">
                  <button
                    onClick={capturePhoto}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-accent transition-colors"
                  >
                    Capture photo
                  </button>
                  <button
                    onClick={closeCamera}
                    className="px-5 py-2.5 rounded-xl bg-surface border border-primary/20 text-ink/70 font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Close camera
                  </button>
                </div>
              </div>
            )}

            {!isCameraOpen && capturedPhotoUrl && (
              <div className="rounded-2xl overflow-hidden border border-primary/15 bg-surface">
                <img src={capturedPhotoUrl} alt="Captured preview" className="w-full h-44 object-cover" />
              </div>
            )}

            {voiceNoteUrl && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/15 bg-surface p-3">
                <audio controls src={voiceNoteUrl} className="h-10 max-w-full" />
                <button
                  onClick={() => {
                    if (voiceUrlRef.current) {
                      URL.revokeObjectURL(voiceUrlRef.current);
                      voiceUrlRef.current = null;
                    }
                    setVoiceNoteUrl(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                >
                  Remove voice note
                </button>
              </div>
            )}

            {transcriptPreview && (
              <div className="rounded-2xl border border-primary/15 bg-surface p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-primary">
                    Transcript {isTranscribing ? '(listening...)' : ''}
                  </p>
                  <button
                    onClick={() => {
                      transcriptBufferRef.current = '';
                      setTranscriptPreview('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-sm text-ink/70 leading-relaxed">{transcriptPreview}</p>
              </div>
            )}

            {mediaError && <p className="text-sm text-accent font-semibold">{mediaError}</p>}
          </div>
        )}

        {/* Task Input Area */}
        <div className="relative mb-2 z-10">
          <textarea
            ref={textAreaRef}
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            className="w-full h-44 md:h-52 bg-bg rounded-[2rem] p-6 md:p-8 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:bg-white transition-all resize-none text-lg leading-relaxed border-2 border-transparent focus:border-primary/20"
            placeholder="e.g. I have a 2000-word essay on climate change due Friday and I haven't even started researching..."
          />
          {error && <p className="mt-2 text-sm text-accent font-semibold">{error}</p>}
          <button
            onClick={() => {
              const starter = "I need help starting. My first tiny step could be:";
              setTaskText(taskText.trim() ? `${taskText}\n\n${starter}` : starter);
              textAreaRef.current?.focus();
            }}
            className="absolute bottom-6 right-6 text-primary/40 hover:text-primary transition-colors"
            title="Need help?"
          >
            <HelpCircle className="w-8 h-8" strokeWidth={2} />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center relative z-10">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="flex items-center justify-center gap-4 px-8 md:px-12 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all w-full md:w-auto min-w-[250px]"
          >
            <Sparkles className="w-8 h-8 fill-white/20" strokeWidth={2} />
            Help me get Unstuck!
          </motion.button>
          
          {/* Footer Message */}
          <div className="flex items-center gap-2 mt-8 text-ink/30 text-sm font-semibold">
            <Shield className="w-4 h-4" />
            <span>Your secrets are safe with us.</span>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-sm">
            <Zap className="w-8 h-8" strokeWidth={2} />
          </div>
          <h3 className="font-bold text-ink text-xl">Instant Clarity</h3>
          <p className="text-ink/50 font-medium leading-relaxed">We break down the big scary things into tiny, doable steps.</p>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-secondary/20 text-accent flex items-center justify-center mb-2 shadow-sm">
            <Layout className="w-8 h-8" strokeWidth={2} />
          </div>
          <h3 className="font-bold text-ink text-xl">Visual Roadmap</h3>
          <p className="text-ink/50 font-medium leading-relaxed">See your path to success as a beautiful, interactive map.</p>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-sm">
            <Users className="w-8 h-8" strokeWidth={2} />
          </div>
          <h3 className="font-bold text-ink text-xl">Friendly Guide</h3>
          <p className="text-ink/50 font-medium leading-relaxed">Your fluffy companion is here to cheer you on every step.</p>
        </div>
      </div>

      {/* Character Companion */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-12 right-12 w-40 h-40 hidden xl:block pointer-events-none"
      >
        <div className="absolute -top-16 -left-20 bg-white p-4 rounded-3xl rounded-br-none shadow-xl border border-primary/10 text-sm font-bold text-ink max-w-[180px] leading-tight">
          "Hey! I'm here to help you get unstuck. What's on your mind?"
        </div>
        <img 
          src="/logo.png" 
          alt="Friendly Companion" 
          className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply brightness-125 contrast-125"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadChange}
      />
    </div>
  );
}
