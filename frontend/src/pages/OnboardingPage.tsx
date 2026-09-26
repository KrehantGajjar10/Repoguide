import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, CheckCircle2 } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-16 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-foreground mb-4 shadow-xs">
        <Compass className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card mb-4 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-[11px] font-mono text-muted-foreground">Screen 05 Placeholder</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
        Guided Onboarding
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        This screen will contain the interactive codebase learning path and verified onboarding
        tasks in Chapter 3.
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => navigate('/overview')}
          className="h-9 px-4 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-[13px] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/architecture')}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium text-[13px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Explore Architecture</span>
        </button>
      </div>
    </main>
  );
};
