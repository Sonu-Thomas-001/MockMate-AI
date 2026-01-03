import React, { useState, useEffect, useRef } from 'react';
import { InterviewConfig, Message, AnalysisResult } from '../types';
import { generateInterviewTurn } from '../services/geminiService';
import { Button } from './Button';
import { Mic, Video, MicOff, VideoOff, Volume2, Square, VolumeX, PhoneOff, UserCircle2 } from 'lucide-react';

interface InterviewChatProps {
  config: InterviewConfig;
  onComplete: (messages: Message[]) => void;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({ config, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Camera/Self-view state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS State
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Initial Startup
  useEffect(() => {
    const startSession = async () => {
      try {
        setupCamera();
        // Initial setup for speech recognition
        if (typeof window !== 'undefined') {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true; // Changed to true for live captioning effect
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let interimTranscript = '';
              let finalTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                } else {
                  interimTranscript += event.results[i][0].transcript;
                }
              }
              
              // We append final transcript to state, and show interim in UI
              if (finalTranscript) {
                  setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript);
              }
              
              // For UI visualization only - we might want a separate state for "live preview"
              // But for simplicity, we rely on inputText updates or a separate ref if we wanted perfect "streaming" text
            };

            recognition.onerror = (event: any) => {
              console.error('Speech recognition error', event.error);
              setIsListening(false);
            };

            recognition.onend = () => {
              setIsListening(false);
            };

            recognitionRef.current = recognition;
          }
        }

        const result = await generateInterviewTurn(config, [], null);
        
        const initialMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.nextQuestion,
            timestamp: Date.now(),
            analysis: result // Store analysis even if not shown
        };
        
        setMessages([initialMessage]);
        setCurrentQuestion(result.nextQuestion);
        speak(result.nextQuestion);
        
      } catch (e) {
        console.error("Failed to start", e);
      } finally {
        setIsLoading(false);
      }
    };
    startSession();

    return () => {
        stopCamera();
        window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TTS Function
  const speak = (text: string) => {
      if (isMuted) return;
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a professional sounding female/neutral voice
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                             voices.find(v => v.name.includes('Samantha')) ||
                             voices.find(v => v.lang === 'en-US');
                             
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0; // Normal pace
      utterance.pitch = 1.0;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraEnabled(true);
      }
    } catch (e) {
      console.log("Camera access denied or unavailable", e);
    }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Build history for AI
      const history = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.role === 'assistant' ? `${m.analysis ? JSON.stringify(m.analysis) : ''} ${m.content}` : m.content }]
      }));

      const analysis = await generateInterviewTurn(config, history, userMsg.content);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analysis.nextQuestion,
        timestamp: Date.now(),
        analysis: analysis
      };

      setMessages(prev => [...prev, assistantMsg]);
      setCurrentQuestion(analysis.nextQuestion);
      speak(analysis.nextQuestion);

      if (analysis.isInterviewOver) {
        // Delay to let the TTS finish saying "Thank you..."
        setTimeout(() => onComplete([...newMessages, assistantMsg]), 4000);
      }

    } catch (error) {
      console.error("Error fetching reply", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
      if (!isMuted) {
          window.speechSynthesis.cancel();
          setSpeaking(false);
      }
      setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      
      {/* 1. Main Visual Area (Simulated Video Call) */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        
        {/* Interviewer Avatar / Placeholder */}
        <div className="relative mb-8">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 flex items-center justify-center bg-slate-800 shadow-2xl transition-all duration-500 ${speaking ? 'border-emerald-500 scale-105' : 'border-slate-700'}`}>
                <UserCircle2 className="w-20 h-20 md:w-32 md:h-32 text-slate-500" />
            </div>
            {speaking && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Speaking
                </div>
            )}
        </div>

        {/* AI Question Subtitles */}
        <div className="max-w-3xl w-full text-center space-y-4 z-10">
             <h2 className="text-2xl md:text-3xl font-medium text-white leading-relaxed drop-shadow-md transition-all">
                "{currentQuestion}"
             </h2>
             {isLoading && (
                 <p className="text-slate-400 text-sm animate-pulse">Thinking...</p>
             )}
        </div>

        {/* User Self-View (Floating) */}
        <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-2xl z-20">
             <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transform scale-x-[-1] ${cameraEnabled ? 'opacity-100' : 'opacity-0'}`} 
            />
            <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">YOU</div>
        </div>

      </div>

      {/* 2. User Interaction Area (Bottom) */}
      <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 p-6 pb-8 transition-all duration-300">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
            
            {/* Live Caption / Input Preview */}
            <div className={`w-full text-center transition-all ${inputText ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-lg text-emerald-400 font-medium italic">
                    "{inputText}"
                </p>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-6">
                
                {/* Mute Toggle */}
                <button 
                    onClick={toggleMute}
                    className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                    title="Toggle Audio"
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                {/* Main Action Button (Mic / Stop) */}
                <div className="relative group">
                    <button 
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                            isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
                            : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                    >
                        {isListening ? <Square className="w-8 h-8 text-white fill-current" /> : <Mic className="w-8 h-8 text-white" />}
                    </button>
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-400 whitespace-nowrap">
                        {isListening ? 'Tap to Send' : 'Tap to Speak'}
                    </span>
                </div>

                {/* End Call Button */}
                <button 
                    onClick={() => onComplete(messages)}
                    className="p-4 rounded-full bg-slate-800 text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    title="End Interview"
                >
                    <PhoneOff className="w-6 h-6" />
                </button>
            </div>

            {/* Hidden Text Input for Fallback/Accessibility */}
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full bg-transparent border-none text-transparent focus:ring-0 h-1"
                aria-hidden="true"
            />
        </div>
      </div>
    </div>
  );
};
