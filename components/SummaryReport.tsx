import React from 'react';
import { Message } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from './Button';
import { Trophy, RotateCcw, Download, Mic, Activity, Brain } from 'lucide-react';

interface SummaryReportProps {
  messages: Message[];
  onRestart: () => void;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({ messages, onRestart }) => {
  // Extract analysis data only from Assistant messages that have analysis
  const analyses = messages
    .filter(m => m.role === 'assistant' && m.analysis)
    .map((m, index) => ({
      question: `Q${index + 1}`,
      score: m.analysis?.score || 0,
      confidence: m.analysis?.confidenceScore ? m.analysis.confidenceScore * 10 : 0, // Scale to 100
      clarity: m.analysis?.clarityScore ? m.analysis.clarityScore * 10 : 0, // Scale to 100
      feedback: m.analysis?.feedback
    }));

  const averageScore = Math.round(
    analyses.reduce((acc, curr) => acc + curr.score, 0) / (analyses.length || 1)
  );

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in pb-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30 mb-4">
          <Trophy className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Interview Feedback Dashboard</h1>
        <p className="text-slate-400">Comprehensive analysis of your performance.</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wide">Overall Readiness</span>
          <span className={`text-5xl font-bold ${averageScore >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {averageScore}%
          </span>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
             <Mic className="h-6 w-6 text-blue-400 mb-2" />
             <span className="text-2xl font-bold text-white">
                {Math.round(analyses.reduce((acc, c) => acc + c.clarity, 0) / (analyses.length || 1))}%
             </span>
             <span className="text-xs text-slate-500 mt-1">Voice Clarity</span>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
             <Activity className="h-6 w-6 text-purple-400 mb-2" />
             <span className="text-2xl font-bold text-white">
                {Math.round(analyses.reduce((acc, c) => acc + c.confidence, 0) / (analyses.length || 1))}%
             </span>
             <span className="text-xs text-slate-500 mt-1">Confidence</span>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
             <Brain className="h-6 w-6 text-pink-400 mb-2" />
             <span className="text-2xl font-bold text-white">{analyses.length}</span>
             <span className="text-xs text-slate-500 mt-1">Questions Analyzed</span>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
            <h3 className="text-slate-200 font-medium mb-4">Performance Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyses}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="question" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Overall Score" />
                  <Area type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} fillOpacity={0} name="Confidence" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
      </div>

      {/* Detailed Question Review */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">Detailed Question Analysis</h2>
        {analyses.map((item, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-slate-200">Question {idx + 1}</h4>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                    item.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                }`}>
                    Score: {item.score}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{item.feedback}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Button variant="secondary" onClick={onRestart}>
          <RotateCcw className="mr-2 h-4 w-4" /> Start New Session
        </Button>
      </div>
    </div>
  );
};