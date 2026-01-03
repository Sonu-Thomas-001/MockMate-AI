import React from 'react';
import { Button } from './Button';
import { Target, Users, Code2, Globe2 } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Democratizing Career Success</h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          We believe everyone deserves a fair shot at their dream job. MockMate AI bridges the gap between talent and opportunity by providing elite-level coaching at scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
               <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Interview anxiety affects 93% of job seekers. Our mission is to eliminate this barrier through safe, realistic practice. We're building a world where candidates are judged on their true potential, not their performance anxiety.
            </p>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
               <Code2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Powered by Gemini</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Built on Google's Gemini 2.5 Flash architecture, our multimodal AI processes audio, video, and context simultaneously. This allows for interruptions, natural pacing, and deep semantic understanding that old chatbot interviewers simply can't match.
            </p>
         </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 md:p-12 mb-16">
          <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                  <h2 className="text-3xl font-bold text-white">Who is this for?</h2>
                  <ul className="space-y-4">
                      <li className="flex gap-4">
                          <Users className="w-6 h-6 text-blue-400 shrink-0" />
                          <div>
                              <h4 className="text-white font-semibold">Early Career & Freshers</h4>
                              <p className="text-sm text-slate-400">Perfect for campus placements (TechBee, TCS, Infosys) and first-time job hunters.</p>
                          </div>
                      </li>
                      <li className="flex gap-4">
                          <Globe2 className="w-6 h-6 text-purple-400 shrink-0" />
                          <div>
                              <h4 className="text-white font-semibold">Non-Native English Speakers</h4>
                              <p className="text-sm text-slate-400">Practice your professional communication in a judgment-free environment.</p>
                          </div>
                      </li>
                  </ul>
              </div>
              <div className="flex-1 w-full bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
                      <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                          <div className="h-4 bg-slate-700 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                      </div>
                  </div>
                   <div className="space-y-3">
                       <div className="h-2 bg-slate-800 rounded w-full"></div>
                       <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                       <div className="h-2 bg-slate-800 rounded w-4/6"></div>
                   </div>
                   <div className="mt-6 text-center">
                       <span className="text-xs font-mono text-emerald-500">System Status: Operational</span>
                   </div>
              </div>
          </div>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Application
        </Button>
      </div>
    </div>
  );
};