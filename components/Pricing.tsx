import React from 'react';
import { Button } from './Button';
import { Check, X, Zap } from 'lucide-react';

interface PricingProps {
  onBack: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      desc: "Perfect for students and first-time job seekers.",
      features: [
        "3 AI Interviews per month",
        "Basic Scoring (0-100)",
        "Standard Interview Persona",
        "Text Transcript Access"
      ],
      notIncluded: [
        "Detailed Behavioral Analysis",
        "Video Body Language Analysis",
        "Custom Scenarios",
        "Priority Support"
      ],
      cta: "Get Started",
      variant: "secondary" as const
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      desc: "For serious candidates wanting deep insights.",
      popular: true,
      features: [
        "Unlimited AI Interviews",
        "Advanced Behavioral Analysis",
        "All Personas (Stern, Friendly, etc.)",
        "Voice & Tone Analysis",
        "Interview History & Progress Tracking",
        "Detailed Strength/Weakness Report"
      ],
      notIncluded: [
        "Custom Company Profiles",
        "ATS Resume Scanning"
      ],
      cta: "Start Pro Trial",
      variant: "primary" as const
    },
    {
      name: "Campus / Enterprise",
      price: "Custom",
      period: "",
      desc: "For universities and placement cells.",
      features: [
        "Bulk Student Licenses",
        "Custom Role Configuration",
        "Dashboard for Placement Officers",
        "Aggregate Performance Analytics",
        "Dedicated Success Manager",
        "API Access"
      ],
      notIncluded: [],
      cta: "Contact Sales",
      variant: "secondary" as const
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-slate-400">Invest in your career with the ultimate preparation tool.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div key={i} className={`relative bg-slate-900 rounded-2xl p-8 border ${plan.popular ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-800'} flex flex-col`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white" /> Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-300">{plan.name}</h3>
              <div className="flex items-baseline mt-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-500 ml-2 text-sm">{plan.period}</span>
              </div>
              <p className="text-slate-400 text-sm mt-3">{plan.desc}</p>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
              {plan.notIncluded.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 opacity-50">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-500">{feature}</span>
                </div>
              ))}
            </div>

            <Button variant={plan.variant} className="w-full" onClick={onBack}>
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};