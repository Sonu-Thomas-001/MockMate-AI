import React, { useState } from 'react';
import { SetupForm } from './components/SetupForm';
import { InterviewChat } from './components/InterviewChat';
import { SummaryReport } from './components/SummaryReport';
import { InterviewConfig, Message } from './types';
import { BrainCircuit } from 'lucide-react';

type AppState = 'landing' | 'setup' | 'interview' | 'summary';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const startSetup = () => setAppState('setup');
  
  const handleStartInterview = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setAppState('interview');
  };

  const handleCompleteInterview = (msgs: Message[]) => {
    setMessages(msgs);
    setAppState('summary');
  };

  const handleRestart = () => {
    setConfig(null);
    setMessages([]);
    setAppState('landing');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header - Hidden in Interview Mode to maximize space */}
      {appState !== 'interview' && (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
              <BrainCircuit className="h-8 w-8 text-emerald-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                MockMate AI
              </span>
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-emerald-400 transition-colors">How it works</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">About</a>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col relative">
        {/* Landing Page */}
        {appState === 'landing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Voice-First Interview Simulator
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Ace Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Early Career Interview
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
              MockMate AI simulates real managerial interviews using live voice, evaluates how you speak—not just what you say—and delivers structured feedback to make you job-ready.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={startSetup}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
              >
                Start Free Simulation
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl w-full">
              {[
                { title: 'Voice-Based Engine', desc: 'Interact naturally with an AI manager that listens, pauses, and speaks like a human.' },
                { title: 'TechBee & Campus Ready', desc: 'Tailored specifically for early career programs, freshers, and trainee roles.' },
                { title: 'Confidence Scoring', desc: 'We analyze your fillers, pauses, and tone to help you sound more professional.' }
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'setup' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <SetupForm onStart={handleStartInterview} />
          </div>
        )}

        {appState === 'interview' && config && (
          <InterviewChat config={config} onComplete={handleCompleteInterview} />
        )}

        {appState === 'summary' && (
          <SummaryReport messages={messages} onRestart={handleRestart} />
        )}
      </main>
    </div>
  );
};

export default App;
