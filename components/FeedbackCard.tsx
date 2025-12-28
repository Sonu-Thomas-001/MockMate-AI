import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle2, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';

interface FeedbackCardProps {
  analysis: AnalysisResult;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ analysis }) => {
  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (s >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden my-4 animate-fade-in">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Feedback & Analysis
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(analysis.score)}`}>
          Score: {analysis.score}/100
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <p className="text-slate-300 leading-relaxed">{analysis.feedback}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Strong Points
            </h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              {analysis.keyStrengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50">
            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Areas for Improvement
            </h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              {analysis.keyWeaknesses?.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Better Answer
          </h4>
          <p className="text-sm text-slate-300 italic">"{analysis.improvedAnswer}"</p>
        </div>
      </div>
    </div>
  );
};
