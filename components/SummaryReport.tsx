import React from 'react';
import { Message, AnalysisResult } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Button } from './Button';
import { RotateCcw, CheckCircle2, AlertTriangle, Quote, Brain, Mic, Code, Lightbulb, TrendingUp } from 'lucide-react';

interface SummaryReportProps {
  messages: Message[];
  onRestart: () => void;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({ messages, onRestart }) => {
  // Get the final analysis from the last message (Assistant)
  const finalMessage = messages.slice().reverse().find(m => m.role === 'assistant' && m.analysis);
  const analysis: AnalysisResult | undefined = finalMessage?.analysis;

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <h2 className="text-xl text-slate-300 mb-4">No analysis data available.</h2>
        <Button onClick={onRestart}>Back to Home</Button>
      </div>
    );
  }

  // Data for Radar Chart
  const radarData = [
    { subject: 'Technical', A: analysis.technicalScore || 0, fullMark: 100 },
    { subject: 'Communication', A: analysis.communicationScore || 0, fullMark: 100 },
    { subject: 'Problem Solving', A: analysis.problemSolvingScore || 0, fullMark: 100 },
    { subject: 'Confidence', A: analysis.confidenceScore || 0, fullMark: 100 },
    { subject: 'Clarity', A: analysis.clarityScore || 0, fullMark: 100 },
  ];

  // Helper for Circular Score Color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (score >= 60) return 'text-yellow-400 stroke-yellow-500';
    return 'text-red-400 stroke-red-500';
  };

  const scoreColor = getScoreColor(analysis.score);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-20 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-1">Interview Analysis</h1>
           <p className="text-slate-400">Detailed breakdown of your performance</p>
        </div>
        <Button variant="secondary" onClick={onRestart}>
            <RotateCcw className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Left Column: Overall Score & Quote */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                 <Brain className="w-32 h-32 text-white" />
             </div>

             <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-6 border-b border-slate-800 pb-2">Overall Score</h3>
                <div className="flex justify-center py-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                            <circle 
                                cx="50%" cy="50%" r="40" 
                                stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={circumference} 
                                strokeDashoffset={strokeDashoffset} 
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${scoreColor.split(' ')[1]}`} 
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-5xl font-bold ${scoreColor.split(' ')[0]}`}>{analysis.score}</span>
                            <span className="text-slate-500 text-sm font-medium">/ 100</span>
                        </div>
                    </div>
                </div>
             </div>
             
             <div className="mt-8 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 relative">
                 <Quote className="absolute -top-3 -left-2 w-8 h-8 text-slate-600 bg-slate-900 rounded-full p-1" />
                 <p className="text-slate-300 italic text-sm leading-relaxed text-center px-2">
                    "{analysis.summaryQuote}"
                 </p>
             </div>
        </div>

        {/* Right Column: Skill Breakdown (Radar Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">Skill Breakdown</h3>
            <div className="flex-1 w-full h-[300px] md:h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Candidate"
                            dataKey="A"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="#3b82f6"
                            fillOpacity={0.2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Strengths */}
          <div className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-950/5 group-hover:bg-emerald-950/10 transition-colors"></div>
              <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400 mb-6">
                      <CheckCircle2 className="w-6 h-6" /> Top Strengths
                  </h3>
                  <div className="space-y-4">
                      {analysis.keyStrengths?.map((strength, i) => (
                          <div key={i} className="flex gap-3 items-start">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <p className="text-slate-300 text-sm leading-relaxed">{strength}</p>
                          </div>
                      ))}
                      {(!analysis.keyStrengths || analysis.keyStrengths.length === 0) && (
                          <p className="text-slate-500 italic">No specific strengths detected.</p>
                      )}
                  </div>
              </div>
          </div>

          {/* Areas for Growth */}
          <div className="bg-slate-900 border border-amber-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-950/5 group-hover:bg-amber-950/10 transition-colors"></div>
              <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-amber-400 mb-6">
                      <AlertTriangle className="w-6 h-6" /> Areas for Growth
                  </h3>
                  <div className="space-y-4">
                      {analysis.keyWeaknesses?.map((weakness, i) => (
                          <div key={i} className="flex gap-3 items-start">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <p className="text-slate-300 text-sm leading-relaxed">{weakness}</p>
                          </div>
                      ))}
                       {(!analysis.keyWeaknesses || analysis.keyWeaknesses.length === 0) && (
                          <p className="text-slate-500 italic">No specific areas for growth detected.</p>
                      )}
                  </div>
              </div>
          </div>

      </div>
      
      {/* Footer / Detailed Feedback */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
           <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-indigo-400" /> 
               Comprehensive Feedback
           </h3>
           <p className="text-slate-300 leading-relaxed text-sm md:text-base">
               {analysis.feedback}
           </p>
      </div>

    </div>
  );
};