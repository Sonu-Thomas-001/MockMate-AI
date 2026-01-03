import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { InterviewConfig, InterviewType, Difficulty } from '../types';
import { INTERVIEW_TYPES, DIFFICULTIES, PERSONAS, VOICES } from '../constants';
import { Button } from './Button';
import { Briefcase, Building, Layers, Code, Play, Zap, User, Mic2, Gauge, Square, Loader2, Volume2 } from 'lucide-react';

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
}

// --- Audio Helpers for Preview ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [config, setConfig] = useState<InterviewConfig>({
    role: '',
    type: InterviewType.TECHBEE,
    difficulty: Difficulty.FRESHER,
    company: '',
    topic: '',
    mode: 'standard',
    persona: 'Professional',
    voice: 'Kore',
    speed: 1.0
  });

  // Voice Preview State
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.role) {
      // Trigger Fullscreen for immersion
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request denied or not supported:", err);
      }

      // Stop any playing audio before starting
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      onStart(config);
    }
  };

  const handlePreviewVoice = async (voiceName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If currently playing this voice, stop it
    if (playingVoice === voiceName) {
        if (currentSourceRef.current) {
            currentSourceRef.current.stop();
            currentSourceRef.current = null;
        }
        setPlayingVoice(null);
        return;
    }

    // Stop any other voice playing
    if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
    }

    setLoadingVoice(voiceName);
    setPlayingVoice(null);

    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");

        // Initialize Audio Context if needed
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: "Hello! I am ready to begin your interview simulation." }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio returned");

        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
            setPlayingVoice(null);
            currentSourceRef.current = null;
        };

        source.start();
        currentSourceRef.current = source;
        setPlayingVoice(voiceName);

    } catch (err) {
        console.error("Failed to preview voice:", err);
        alert("Could not preview voice. Please check your connection.");
    } finally {
        setLoadingVoice(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
      return () => {
          if (currentSourceRef.current) currentSourceRef.current.stop();
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full p-6 animate-fade-in">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Briefcase className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Setup Your Interview</h1>
          <p className="text-slate-400">Configure your session for MockMate AI.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Target Role <span className="text-red-400">*</span></label>
            <div className="relative">
              <input 
                type="text"
                required
                value={config.role}
                onChange={(e) => setConfig({ ...config, role: e.target.value })}
                placeholder="e.g. Software Trainee, HCL TechBee Aspirant"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
              <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Program / Interview Type</label>
              <div className="relative">
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value as InterviewType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {INTERVIEW_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <Layers className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Experience Level</label>
              <div className="relative">
                <select
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <Code className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>
          </div>

          {/* AI Persona Configuration */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 space-y-6">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
               <Zap className="h-4 w-4 text-emerald-400" /> AI Interviewer Settings
            </h3>
            
            <div className="space-y-4">
                {/* Persona Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Interviewer Persona</label>
                    <div className="relative">
                        <select
                            value={config.persona}
                            onChange={(e) => setConfig({ ...config, persona: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            {PERSONAS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                    </div>
                </div>

                {/* Voice Selection Grid */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex justify-between">
                        <span>Voice Selection</span>
                        <span className="text-xs text-slate-500 font-normal">Preview to find the best match</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {VOICES.map(v => {
                            const isSelected = config.voice === v.value;
                            const isPlaying = playingVoice === v.value;
                            const isLoading = loadingVoice === v.value;

                            return (
                                <div 
                                    key={v.value}
                                    onClick={() => setConfig({ ...config, voice: v.value })}
                                    className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
                                        isSelected 
                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                <Mic2 className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                    {v.label.split(' ')[0]}
                                                </span>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                                    {v.label.split('(')[1]?.replace(')', '')}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => handlePreviewVoice(v.value, e)}
                                            disabled={!!loadingVoice && !isLoading}
                                            className={`p-2 rounded-full transition-colors z-10 hover:bg-white/10 ${
                                                isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                                            }`}
                                            title="Preview Voice"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isPlaying ? (
                                                <Square className="w-4 h-4 fill-current" />
                                            ) : (
                                                <Play className="w-4 h-4 fill-current" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Active Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Speaking Speed Slider */}
            <div className="space-y-3 pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-slate-400" /> Speaking Pace
                    </label>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
                        {config.speed?.toFixed(1)}x
                    </span>
                </div>
                <input 
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={config.speed}
                    onChange={(e) => setConfig({...config, speed: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-medium">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Target Company <span className="text-slate-500 text-xs">(Optional)</span></label>
              <div className="relative">
                <input 
                  type="text"
                  value={config.company}
                  onChange={(e) => setConfig({ ...config, company: e.target.value })}
                  placeholder="e.g. HCL, TCS, Infosys"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Building className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>

             <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Focus Topic <span className="text-slate-500 text-xs">(Optional)</span></label>
              <div className="relative">
                <input 
                  type="text"
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                  placeholder="e.g. Basic Java, Communication"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Layers className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">
              Enter Interview Room
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
