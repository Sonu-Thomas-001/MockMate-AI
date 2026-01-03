import React from 'react';
import { Button } from './Button';
import { Settings, Mic, BarChart3, ArrowRight, BrainCircuit } from 'lucide-react';

interface HowItWorksProps {
  onBack: () => void;
  onStart: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onBack, onStart }) => {
  const steps = [
    {
      icon: Settings,
      title: "1. Configure Your Session",
      desc: "Select your target role, experience level, and the persona of your AI interviewer. Choose a voice that sounds natural to you.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      icon: Mic,
      title: "2. Real-time Interview",
      desc: "Speak naturally with our advanced AI. It listens to your tone, analyzes your answers, and adapts its follow-up questions in real-time.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      icon: BarChart3,
      title: "3. Detailed Analytics",
      desc: "Get an instant comprehensive report covering technical accuracy, communication skills, confidence scores, and specific improvement tips.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Master the Art of the Interview</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          MockMate AI combines Gemini's advanced reasoning with real-time audio processing to create the most realistic interview simulation available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
        {/* Connector Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/30 via-emerald-500/30 to-purple-500/30 -z-10"></div>

        {steps.map((step, i) => (
          <div key={i} className={`relative p-8 rounded-2xl bg-slate-900 border ${step.border} shadow-xl hover:translate-y-[-5px] transition-transform duration-300`}>
             <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-6 mx-auto border ${step.border}`}>
               <step.icon className={`w-8 h-8 ${step.color}`} />
             </div>
             <h3 className="text-xl font-bold text-white mb-3 text-center">{step.title}</h3>
             <p className="text-slate-400 text-center leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
            Ready to test your skills?
          </h2>
          <p className="text-slate-400">Join thousands of candidates securing their dream jobs.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="secondary" onClick={onBack}>Back to Home</Button>
           <Button onClick={onStart} size="lg" className="group">
             Start Free Simulation <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </Button>
        </div>
      </div>
    </div>
  );
};