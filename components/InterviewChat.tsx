import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { InterviewConfig, Message } from '../types';
import { generateFinalFeedback } from '../services/geminiService';
import { PhoneOff, UserCircle2, Loader2, Activity, Video, VideoOff, Mic, Clock, MessageSquare, ChevronDown, ChevronUp, Wind, AlertTriangle, BrainCircuit, Check, Wifi, Cpu } from 'lucide-react';

interface InterviewChatProps {
  config: InterviewConfig;
  onComplete: (messages: Message[]) => void;
}

type PrepStage = 'breath' | 'relax' | 'environment' | 'countdown' | 'live';
type ProcessingStep = 'uploading' | 'analyzing' | 'generating';

// --- Audio Helpers ---
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// Helper to filter non-English text
function isEnglishText(text: string): boolean {
  return /^[\u0000-\u00FF\u2000-\u206F\s]*$/.test(text);
}

// --- Modern Bar Visualizer Component ---
const AudioVisualizer = ({ audioLevel }: { audioLevel: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const barCount = 32; // Number of bars (symmetric)
    const bars: number[] = new Array(barCount).fill(0);

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate bar heights based on current audio level
      // We create a "fake" frequency distribution from the single RMS value
      const center = width / 2;
      const barWidth = 6;
      const gap = 4;
      const maxBarHeight = height * 0.8;

      for (let i = 0; i < barCount / 2; i++) {
          // Create a falloff effect where center bars are higher
          const distanceFactor = 1 - (i / (barCount / 2)); 
          const targetHeight = audioLevel * maxBarHeight * distanceFactor * (0.8 + Math.random() * 0.4);
          
          // Smooth interpolation
          bars[i] = bars[i] * 0.8 + targetHeight * 0.2;

          // Draw symmetric bars
          const xRight = center + i * (barWidth + gap);
          const xLeft = center - (i + 1) * (barWidth + gap);
          const y = (height - bars[i]) / 2;

          // Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + bars[i]);
          gradient.addColorStop(0, '#34d399'); // Emerald 400
          gradient.addColorStop(1, '#06b6d4'); // Cyan 500

          ctx.fillStyle = gradient;
          
          // Rounded caps
          ctx.beginPath();
          ctx.roundRect(xRight, y, barWidth, Math.max(4, bars[i]), 4);
          ctx.roundRect(xLeft, y, barWidth, Math.max(4, bars[i]), 4);
          ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [audioLevel]);

  return <canvas ref={canvasRef} className="w-full h-32" />;
};

export const InterviewChat: React.FC<InterviewChatProps> = ({ config, onComplete }) => {
  // State
  const [prepStage, setPrepStage] = useState<PrepStage>('breath');
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time Text & Audio
  const [currentModelText, setCurrentModelText] = useState("");
  const [currentUserText, setCurrentUserText] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Refs for callbacks
  const isEndingRef = useRef(false);
  const currentUserTextRef = useRef("");
  const currentModelTextRef = useRef("");
  const transcriptHistoryRef = useRef<Message[]>([]);

  // Exit fullscreen on unmount
  useEffect(() => {
    return () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.error("Exit fullscreen error", e));
        }
    };
  }, []);

  // Prep Sequence
  useEffect(() => {
    const sequence = async () => {
        // Breath (4s) -> Environment (3s) -> Countdown (3s)
        await new Promise(r => setTimeout(r, 4000)); setPrepStage('environment');
        await new Promise(r => setTimeout(r, 3500)); setPrepStage('countdown');
    };
    sequence();
  }, []);

  // Countdown
  useEffect(() => {
    if (prepStage === 'countdown') {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setPrepStage('live');
        }
    }
  }, [prepStage, countdown]);

  // Start Session Logic
  useEffect(() => {
    if (prepStage === 'live') {
        startLiveSession();
        const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
        return () => {
            clearInterval(timer);
            stopLiveSession();
        };
    }
  }, [prepStage]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
        transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcriptHistory, currentUserText, currentModelText]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startLiveSession = async () => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key missing. Check environment configuration.");
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });

      // Ensure context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const company = config.company || 'HCL TechBee';
      
      const systemInstruction = `
        System Role:
        You are MockMate AI – Interview Board, simulating a real ${company} managerial interview panel.
        
        You must behave like:
        - A corporate IT manager.
        - Interviewing candidates for ${config.role || 'Class XII / early-career'} roles.
        - Evaluating communication, attitude, clarity, and intent.
        - NOT expecting deep technical expertise.
        
        Tone:
        - Polite, Professional, Calm, Evaluative (not friendly coaching).
        - Persona: ${config.persona || 'Professional'}.

        Core Interview Board Rules (MANDATORY):
        1. Interview-First, Feedback-Later: Do NOT guide or correct answers during the interview. No hints, no examples, no suggestions mid-session. Feedback is delivered only after the interview ends.
        2. One Question at a Time: Ask a single question. Wait for a complete response. Detect completion via pause.
        3. Natural Manager Behavior: Use short acknowledgements like “Alright”, “Okay”, “Understood”. Do NOT praise or criticize mid-interview.
        4. Language: STRICTLY ENGLISH ONLY. If the user speaks another language, politely remind them to speak English.

        Interview Structure (STRICT ORDER):
        Phase 1: Opening
        - Say: “Good morning. This interview is for the ${company} program. Please answer clearly and honestly. Let’s begin.”
        - Pause and wait for the user to acknowledge.

        Phase 2: Core Mandatory Questions
        Ask exactly in this order:
        1. “Tell me about yourself.”
        2. “What do you know about ${company}?”
        3. “What do you know about the TechBee program, and why did you choose it?”
        4. “Where do you see yourself in the next five to ten years?”
        5. “Why do you want to become a software engineer?”

        Phase 3: Controlled Follow-Ups
        - Ask only ONE follow-up if: Answer is too short, sounds memorized, lacks clarity, or misses intent.
        - Approved styles: “Can you explain that further?”, “Could you give a specific example?”, “What do you mean by that?”
        - ❌ Do NOT ask multiple follow-ups.
        - ❌ Do NOT reframe the question with hints.

        Phase 4: Closing
        - Say: “Thank you. This concludes the interview.”
        - Then stop asking questions.

        Question Bank (Use these ONLY if specific deviation is needed or for variation):
        - “Why do you want to join ${company} specifically?”
        - “What do you understand about working and studying together?”
        - “How do you handle pressure or deadlines?”
        - “What is the difference between software and hardware?”
        - “What is an operating system?”
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
                prebuiltVoiceConfig: { 
                    voiceName: config.voice || 'Kore',
                } 
            } 
          },
          // Fix: systemInstruction should be a string directly, not wrapped in parts for the live config
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setError(null);
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isEndingRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate RMS for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setAudioLevel(prev => Math.max(prev * 0.85, rms * 5)); // Boosted responsiveness

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Transcripts
             if (message.serverContent?.outputTranscription) {
                const text = message.serverContent?.outputTranscription?.text;
                currentModelTextRef.current += text;
                setCurrentModelText(currentModelTextRef.current);
             }
             if (message.serverContent?.inputTranscription) {
                const text = message.serverContent?.inputTranscription?.text;
                
                // Filter out non-English text from display
                if (text && isEnglishText(text)) {
                    currentUserTextRef.current += text;
                    setCurrentUserText(currentUserTextRef.current);
                }
             }

             // Handle Turn Completion
             if (message.serverContent?.turnComplete) {
                 if (currentUserTextRef.current) {
                     const msg: Message = { 
                         id: Date.now().toString() + '-user', 
                         role: 'user', 
                         content: currentUserTextRef.current, 
                         timestamp: Date.now() 
                     };
                     transcriptHistoryRef.current.push(msg);
                     setTranscriptHistory([...transcriptHistoryRef.current]);
                     currentUserTextRef.current = "";
                     setCurrentUserText("");
                 }
                 if (currentModelTextRef.current) {
                     const msg: Message = { 
                         id: Date.now().toString() + '-ai', 
                         role: 'assistant', 
                         content: currentModelTextRef.current, 
                         timestamp: Date.now() 
                     };
                     transcriptHistoryRef.current.push(msg);
                     setTranscriptHistory([...transcriptHistoryRef.current]);
                     currentModelTextRef.current = "";
                     setCurrentModelText("");
                 }
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio && audioContextRef.current) {
                 const ctx = audioContextRef.current;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);
                 
                 const playbackRate = config.speed || 1.0; 
                 
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.playbackRate.value = playbackRate; 
                 source.connect(ctx.destination);
                 source.onended = () => sourcesRef.current.delete(source);
                 source.start(nextStartTimeRef.current);
                 sourcesRef.current.add(source);
                 
                 // Adjust duration calculation based on speed
                 nextStartTimeRef.current += (audioBuffer.duration / playbackRate);
             }
          },
          onclose: () => {
              setIsConnected(false);
          },
          onerror: (err) => {
              console.error("Gemini Live Error", err);
              setIsConnected(false);
              setError("Connection error. Please try again. (Check API Key/Network)");
          }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e: any) {
      console.error("Failed to start live session", e);
      setError(e.message || "Failed to start interview session.");
    }
  };

  // --- Video Logic ---
  const toggleVideo = async () => {
    if (isVideoOn) stopVideo();
    else await startVideo();
  };

  const startVideo = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsVideoOn(true);
        videoIntervalRef.current = window.setInterval(sendVideoFrame, 1000);
    } catch (err) {
        alert("Camera access failed.");
    }
  };

  const stopVideo = () => {
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
        window.clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
    }
    setIsVideoOn(false);
  };

  const sendVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !sessionRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
    sessionRef.current.then(session => {
        session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } });
    });
  };

  // --- Cleanup & End ---
  const stopLiveSession = () => {
    isEndingRef.current = true;
    stopVideo();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    if (sessionRef.current) sessionRef.current.then(session => session.close());
  };

  const handleEndInterview = async () => {
    setIsEnding(true);
    setProcessingStep('uploading');
    stopLiveSession();
    
    // Push pending text
    const finalHistory = [...transcriptHistoryRef.current];
    if (currentUserTextRef.current.trim()) finalHistory.push({ id: 'final-user', role: 'user', content: currentUserTextRef.current, timestamp: Date.now() });
    if (currentModelTextRef.current.trim()) finalHistory.push({ id: 'final-ai', role: 'assistant', content: currentModelTextRef.current, timestamp: Date.now() });

    try {
        setProcessingStep('analyzing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProcessingStep('generating');
        const analysis = await generateFinalFeedback(config, finalHistory);
        if (finalHistory.length > 0) finalHistory[finalHistory.length - 1].analysis = analysis;
        onComplete(finalHistory);
    } catch (e) {
        console.error("Report generation failed", e);
        onComplete(finalHistory);
    }
  };

  // --- Processing Screen ---
  if (processingStep) {
      return (
          <div className="flex flex-col h-screen items-center justify-center bg-slate-950 relative p-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
              <div className="z-10 text-center space-y-6 max-w-md w-full animate-fade-in">
                  <div className="relative mx-auto w-24 h-24">
                      <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      <BrainCircuit className="absolute inset-0 m-auto h-10 w-10 text-emerald-500 animate-pulse" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white">Analysis in Progress</h2>
                  
                  <div className="space-y-4 text-left bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
                      <div className={`flex items-center gap-3 ${processingStep === 'uploading' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${processingStep === 'uploading' ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></div>
                          <span>Uploading session data...</span>
                      </div>
                      <div className={`flex items-center gap-3 ${processingStep === 'analyzing' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${processingStep === 'analyzing' ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></div>
                          <span>Processing interview audio...</span>
                      </div>
                      <div className={`flex items-center gap-3 ${processingStep === 'generating' ? 'text-emerald-400' : 'text-slate-500'}`}>
                           <div className={`w-2 h-2 rounded-full ${processingStep === 'generating' ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></div>
                           <span>Generating comprehensive feedback report...</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- Prep Screens (Modernized) ---
  if (prepStage !== 'live') {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-950 relative p-6 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Breath Stage */}
            {prepStage === 'breath' && (
                <div className="z-10 flex flex-col items-center justify-center animate-fade-in text-center">
                     <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                         <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-[ping_4s_ease-in-out_infinite]"></div>
                         <div className="absolute inset-4 bg-emerald-500/20 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
                         <Wind className="w-16 h-16 text-emerald-300 relative z-10" />
                     </div>
                     <h2 className="text-4xl font-light text-white mb-2">Breathe In...</h2>
                     <p className="text-slate-400">Center yourself before we begin.</p>
                </div>
            )}

            {/* System Check Stage */}
            {prepStage === 'environment' && (
                <div className="z-10 w-full max-w-md animate-fade-in">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                            <Activity className="text-emerald-400 w-6 h-6" />
                            <h2 className="text-xl font-semibold text-white">System Check</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <Mic className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-200">Microphone</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <Check className="w-4 h-4" /> Ready
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <Wifi className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-200">Connection</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <Check className="w-4 h-4" /> Stable
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-200">Gemini 2.5 AI</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <Check className="w-4 h-4" /> Online
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-slate-500 mt-6 text-sm">Initializing secure environment...</p>
                </div>
            )}

            {/* Countdown Stage */}
            {prepStage === 'countdown' && (
                <div className="z-10 flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative">
                        <div className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 leading-none tracking-tighter tabular-nums animate-pulse">
                            {countdown}
                        </div>
                    </div>
                    <p className="text-xl text-emerald-400 font-medium mt-8 tracking-widest uppercase">Interview Starting</p>
                </div>
            )}
        </div>
    );
  }

  // --- Main Live Interface ---
  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden font-sans">
      
      {/* 1. Header Area */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
         {/* Live Badge */}
         <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-white tracking-widest">{isConnected ? "LIVE" : "CONNECTING"}</span>
         </div>

         {/* Timer */}
         <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-sm font-mono text-slate-200">{formatTime(sessionTime)}</span>
         </div>
      </div>

      {/* 2. Main Stage (Visualizer & Info) */}
      <div className="flex-1 flex flex-col relative">
         {/* Background Elements */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
         
         <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-5xl mx-auto px-6">
            
            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 animate-fade-in z-50">
                    <AlertTriangle className="text-red-500 w-6 h-6" />
                    <span className="text-red-200 font-medium">{error}</span>
                </div>
            )}

            {/* NEW Audio Visualizer */}
            <div className="w-full max-w-2xl flex flex-col items-center justify-center mb-12">
                <AudioVisualizer audioLevel={audioLevel} />
            </div>

            {/* Role Info - Bottom Left of Stage */}
            <div className="absolute bottom-10 left-6 md:left-10 text-left animate-fade-in">
               <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">{config.role}</h1>
               <div className="flex flex-col gap-1">
                   <p className="text-slate-400 text-lg flex items-center gap-2">
                      <UserCircle2 className="w-5 h-5" />
                      {config.company ? `${config.company} Interviewer` : 'Friendly Recruiter'}
                   </p>
                   {config.persona && (
                       <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-1 rounded w-fit">
                           {config.persona} Mode
                       </span>
                   )}
               </div>
            </div>

            {/* End Call Button - Bottom Right of Stage (Floating) */}
            <div className="absolute bottom-10 right-6 md:right-10 z-30">
                 <button 
                    onClick={handleEndInterview}
                    disabled={isEnding}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                >
                    {isEnding ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
                    <span>End</span>
                </button>
            </div>

            {/* User Video PIP */}
            {isVideoOn && (
                <div className="absolute top-20 right-6 w-40 h-32 md:w-56 md:h-40 bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-700 z-20">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-2 right-2 flex gap-1 items-center bg-black/50 px-2 py-0.5 rounded text-[10px] text-white">
                        <Activity className="w-3 h-3 text-emerald-500" /> Analysis On
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
         </div>
      </div>

      {/* 3. Bottom Panel - Transcript & Controls */}
      <div className="bg-slate-900 border-t border-slate-800 z-20 transition-all duration-300 flex flex-col" style={{ height: showTranscript ? '35%' : 'auto' }}>
         
         {/* Transcript Toggle Tab */}
         <div 
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex justify-center -mt-3 cursor-pointer group"
         >
             <div className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium text-slate-400 group-hover:text-white transition-colors shadow-sm">
                <MessageSquare className="w-3 h-3" />
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
                {showTranscript ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
             </div>
         </div>

         {/* Scrollable Transcript Area */}
         {showTranscript && (
             <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={transcriptScrollRef}>
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                        <div className="max-w-[80%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-slate-300 text-sm leading-relaxed">
                            <span className="block text-xs font-bold text-slate-500 mb-1">Interviewer</span>
                            Welcome! I'm ready to begin the interview for the {config.role} position.
                        </div>
                    </div>

                    {/* History */}
                    {transcriptHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none'
                            }`}>
                                <span className={`block text-xs font-bold mb-1 opacity-70`}>
                                    {msg.role === 'user' ? 'You' : 'Interviewer'}
                                </span>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Live Streaming Text */}
                    {(currentModelText || currentUserText) && (
                         <div className={`flex ${currentUserText ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                currentUserText 
                                ? 'bg-blue-600/80 text-white rounded-tr-none animate-pulse' 
                                : 'bg-slate-800/80 border border-slate-700 text-slate-300 rounded-tl-none'
                            }`}>
                                <span className={`block text-xs font-bold mb-1 opacity-70`}>
                                    {currentUserText ? 'You' : 'Interviewer'}
                                </span>
                                {currentUserText || currentModelText}
                                <span className="inline-block w-1.5 h-3 ml-1 bg-current animate-pulse align-middle"></span>
                            </div>
                        </div>
                    )}
                </div>
             </div>
         )}

         {/* Bottom Control Bar */}
         <div className="p-4 bg-slate-900 border-t border-slate-800">
             <div className="max-w-3xl mx-auto flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    {/* Camera Button */}
                    <button 
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-all ${isVideoOn ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title="Toggle Camera"
                    >
                        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    
                    {/* Mic Button (Visual only for now as stream is always open) */}
                    <button 
                        className={`p-3 rounded-full bg-slate-800 text-white border border-slate-600`}
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="text-xs text-slate-500 font-medium hidden md:block">
                     {isConnected ? "Connected via Gemini Live" : "Reconnecting..."}
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};