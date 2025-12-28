import React, { useState } from 'react';
import { InterviewConfig, InterviewType, Difficulty } from '../types';
import { INTERVIEW_TYPES, DIFFICULTIES } from '../constants';
import { Button } from './Button';
import { Briefcase, Building, Layers, Code, Play } from 'lucide-react';

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [config, setConfig] = useState<InterviewConfig>({
    role: '',
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MID,
    company: '',
    topic: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.role) {
      onStart(config);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6 animate-fade-in">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Briefcase className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configure Your Interview</h1>
          <p className="text-slate-400">Tell us about the role you are targeting so we can tailor the questions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Target Role <span className="text-red-400">*</span></label>
            <div className="relative">
              <input 
                type="text"
                required
                value={config.role}
                onChange={(e) => setConfig({ ...config, role: e.target.value })}
                placeholder="e.g. Frontend Engineer, Product Manager"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
              <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Interview Type</label>
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

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Target Company <span className="text-slate-500 text-xs">(Optional)</span></label>
              <div className="relative">
                <input 
                  type="text"
                  value={config.company}
                  onChange={(e) => setConfig({ ...config, company: e.target.value })}
                  placeholder="e.g. Google, Airbnb"
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
                  placeholder="e.g. React Hooks, AWS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Layers className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">
              Start Simulation
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
