import React, { useState, useEffect, useRef } from 'react';
import { InterviewConfig, Message, AnalysisResult } from '../types';
import { generateInterviewTurn } from '../services/geminiService';
import { Button } from './Button';
import { FeedbackCard } from './FeedbackCard';
import { Mic, Send, Video, MicOff, VideoOff, Volume2, User } from 'lucide-react';

interface InterviewChatProps {
  config: InterviewConfig;
  onComplete: (messages: Message[]) => void;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({ config, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Loading first question
  const [isRecording, setIsRecording] = useState(false);
  
  // Camera/Self-view state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial Startup
  useEffect(() => {
    const startSession = async () => {
      try {
        // Setup Camera if possible (simulated immersion)
        setupCamera();
        
        // Fetch first question
        const result = await generateInterviewTurn(config, [], null);
        
        const initialMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.nextQuestion,
          timestamp: Date.now(),
          analysis: undefined // First message has no analysis
        };
        setMessages([initialMessage]);
      } catch (e) {
        console.error("Failed to start", e);
      } finally {
        setIsLoading(false);
      }
    };
    startSession();

    return () => {
        stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

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
      // Prepare history for API
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

      if (analysis.isInterviewOver) {
        // Wait a bit then finish
        setTimeout(() => onComplete([...newMessages, assistantMsg]), 2000);
      }

    } catch (error) {
      console.error("Error fetching reply", error);
      // Add error message to chat or show toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if(e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header / Camera Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Interview: {config.role}
          </h2>
          <p className="text-xs text-slate-400">{config.type} • {config.difficulty}</p>
        </div>
        
        {/* Self View */}
        <div className="relative w-32 h-24 bg-black rounded-lg overflow-hidden border border-slate-600 shadow-inner">
           <video 
             ref={videoRef} 
             autoPlay 
             muted 
             playsInline 
             className={`w-full h-full object-cover ${cameraEnabled ? 'opacity-100' : 'opacity-0'}`} 
           />
           {!cameraEnabled && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-500">
               <VideoOff className="h-6 w-6" />
             </div>
           )}
           <div className="absolute bottom-1 right-1 bg-black/50 px-1 rounded text-[10px] text-white">YOU</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 container mx-auto max-w-4xl">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              {/* Avatar */}
              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <div className="font-bold text-white text-xs">AI</div>}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2">
                {/* Text Content */}
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {/* Analysis Card (Only for AI messages that have analysis) */}
                {msg.analysis && (
                  <FeedbackCard analysis={msg.analysis} />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] animate-pulse">
            <div className="h-10 w-10 rounded-full bg-emerald-600/50 flex-shrink-0"></div>
            <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none h-16 w-32 border border-slate-700/50 flex items-center gap-2">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto relative flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-[60px] scrollbar-hide"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <Button 
                variant="primary" 
                size="md" 
                className="h-full rounded-xl"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
            >
                <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-2">
            AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};
