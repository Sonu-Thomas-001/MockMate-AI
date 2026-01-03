import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle2, AlertCircle, TrendingUp, Lightbulb, BarChart3, Mic2, Layout } from 'lucide-react';

interface FeedbackCardProps {
  analysis: AnalysisResult;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ analysis }) => {
  const getScoreColor = (s: number, max: number = 100) => {
    const percentage = (s / max) * 100;
    if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (percentage >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const MetricBar = ({ label, score, icon: Icon }: { label: string, score: number, icon: any }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span className="flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</span>
        <span>{score}/10</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden my-4 animate-fade-in shadow-lg">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Manager's Feedback
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(analysis.score)}`}>
          Overall: {analysis.score}/100
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricBar label="Structure" score={analysis.structureScore} icon={Layout} />
          <MetricBar label="Clarity" score={analysis.clarityScore} icon={Mic2} />
          <MetricBar label="Confidence" score={analysis.confidenceScore} icon={BarChart3} />
        </div>

        <div>
          <p className="text-slate-300 leading-relaxed text-sm">{analysis.feedback}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> Strong Points
            </h4>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              {analysis.keyStrengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Missed Opportunities
            </h4>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              {analysis.keyWeaknesses?.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 border-l-4 border-l-indigo-500">
          <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Recommended phrasing
          </h4>
          <p className="text-sm text-slate-300 italic">"{analysis.improvedAnswer}"</p>
        </div>
      </div>
    </div>
  );
};
