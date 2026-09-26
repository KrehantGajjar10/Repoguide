import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  ExternalLink,
  CheckCircle2,
  Circle,
  Terminal,
  RefreshCw,
  Clock,
  Check,
  FileText,
  Layers,
  Route,
  Database,
  ArrowRight,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { AnalysisData } from '../types';

export const RepositoryAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    repositoryService.getAnalysisData().then(setAnalysisData);
  }, []);

  if (!analysisData) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading analysis state...</span>
        </div>
      </main>
    );
  }

  const { repository, progress, stages, logs, metrics, daemonChannel, daemonLatency } = analysisData;

  const renderMetricIcon = (icon: string) => {
    switch (icon) {
      case 'files':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'modules':
        return <Layers className="w-4 h-4 text-muted-foreground" />;
      case 'routes':
        return <Route className="w-4 h-4 text-muted-foreground" />;
      case 'models':
        return <Database className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Repository Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-border gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <GitBranch className="w-5 h-5 text-muted-foreground shrink-0" />
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              {repository.name}
            </h1>
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <span>{repository.url.replace('https://', '')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Technology Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {repository.stack.map((tech) => (
              <span
                key={tech}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Realtime Status Pill */}
        <div className="flex items-center self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary pulse-dot"></span>
            <span className="text-xs font-mono text-foreground tracking-wide font-medium">
              Analyzing...
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Central Analysis (7 cols) + Activity Log (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Panel: Central Analysis */}
        <section className="lg:col-span-7 bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            {/* Title & Context */}
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-foreground">
                Understanding your repository
              </h2>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-xl leading-relaxed">
                RepoGuide is mapping the structure, architecture, dependencies, and development
                workflow of your codebase.
              </p>
            </div>

            {/* Progress Section */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-mono text-foreground">Analysis Progress</span>
                <span className="text-[13px] font-mono text-foreground font-medium">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Analysis Stages List */}
            <div className="mt-6 space-y-2.5">
              {stages.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isAnalyzing = stage.status === 'analyzing';

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-lg border transition-colors ${
                      isAnalyzing
                        ? 'border-primary/40 bg-secondary relative overflow-hidden'
                        : isCompleted
                        ? 'border-border/60 bg-background/50 hover:bg-secondary/60'
                        : 'border-border/30 bg-background/20 opacity-60'
                    }`}
                  >
                    {isAnalyzing && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
                    )}
                    <div className="flex items-start gap-3 pl-1 min-w-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                      ) : isAnalyzing ? (
                        <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary pulse-dot shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-foreground truncate">
                          {stage.title}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">
                          {stage.detail}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border shrink-0 ml-3 ${
                        isAnalyzing
                          ? 'border-border bg-card text-foreground font-medium'
                          : isCompleted
                          ? 'border-border bg-secondary text-muted-foreground'
                          : 'border-border/40 text-muted-foreground'
                      }`}
                    >
                      {isAnalyzing ? 'Analyzing' : isCompleted ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Panel: Analysis Activity Log */}
        <section className="lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-xs">
          {/* Activity Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-mono font-medium text-foreground">
                Analysis Activity
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>
              <span>Live streaming</span>
            </div>
          </div>

          {/* Activity Stream */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3 font-mono text-xs overflow-y-auto min-h-90">
            <div className="space-y-3">
              {logs.map((log) => {
                const isActive = log.status === 'active';
                const isCompleted = log.status === 'completed';

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2.5 pb-2.5 border-b border-border/30 ${
                      isActive ? 'bg-secondary/70 p-2 rounded-md' : !isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    ) : isActive ? (
                      <RefreshCw className="w-3.5 h-3.5 text-foreground animate-spin mt-0.5 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`leading-tight truncate ${
                          isActive ? 'text-foreground font-medium' : 'text-foreground/90'
                        }`}
                      >
                        {log.title}
                      </div>
                      <div className="text-muted-foreground text-[10px] mt-0.5 truncate">
                        {log.detail}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] ${
                        isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {log.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status footer */}
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-muted-foreground text-[10px] font-mono">
              <span>Channel: {daemonChannel}</span>
              <span>Latency: {daemonLatency}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Repository Insights Grid (4 Bento Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 transition-colors hover:border-foreground/30 shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-muted-foreground">{metric.label}</span>
              {renderMetricIcon(metric.icon)}
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-mono text-foreground tracking-tight">
              {metric.value}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-1 truncate">
              {metric.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-4 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Cancel Analysis
        </button>
        <button
          type="button"
          onClick={() => navigate('/overview')}
          className="w-full sm:w-auto px-5 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span>Continue to Project Overview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
