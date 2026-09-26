import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Layers } from 'lucide-react';

export const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-16 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-foreground mb-4">
        <Layers className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card mb-4">
        <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-mono text-muted-foreground">Screen 03 Placeholder</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
        Project Overview
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        This screen will contain the architecture diagram, module inspector, and verified onboarding
        tasks in Chapter 2.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/analysis')}
          className="h-9 px-4 rounded border border-border bg-card text-foreground hover:bg-secondary text-[13px] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-9 px-4 rounded bg-primary text-primary-foreground font-medium text-[13px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span>Connect Another Repository</span>
        </button>
      </div>
    </main>
  );
};
