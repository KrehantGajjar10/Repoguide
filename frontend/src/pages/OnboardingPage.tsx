import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Lock,
  Network,
  Workflow,
  Database,
  GitBranch,
  ExternalLink,
  Flag,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { OnboardingJourneyData } from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [journeyData, setJourneyData] = useState<OnboardingJourneyData | null>(null);

  useEffect(() => {
    repositoryService.getOnboardingJourney().then(data => {
      setJourneyData(data);
    });
  }, []);

  if (!journeyData) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Loading onboarding journey...</span>
        </div>
      </main>
    );
  }

  const { repository, tasks, competencies, keyFiles, requestLifecycle } = journeyData;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1.5">
          <nav className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors duration-150">
              Repositories
            </Link>
            <span>/</span>
            <Link
              to="/overview"
              className="text-foreground hover:text-primary font-medium transition-colors duration-150"
            >
              {repository.name}
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Onboarding</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Your onboarding journey
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Build a practical understanding of the codebase, one verified step at a time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Link
            to="/architecture"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary hover:border-muted-foreground/30 text-xs sm:text-sm font-medium transition-colors duration-150 shadow-xs"
          >
            <Network className="w-4 h-4 text-muted-foreground" />
            <span>Explore Architecture</span>
          </Link>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base sm:text-lg font-medium text-foreground">
              {journeyData.completedTasks} of {journeyData.totalTasks} tasks completed
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-secondary text-foreground font-medium">
              {journeyData.progressPercent}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>~{journeyData.estimatedTotalMinutes} min total estimated onboarding</span>
          </div>
        </div>

        {/* Clean Neutral Horizontal Bar */}
        <div className="w-full h-2 rounded bg-secondary overflow-hidden p-0.5 border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${journeyData.progressPercent}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-muted-foreground gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              {journeyData.completedTasks} completed
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
              {journeyData.inProgressTasks} in progress
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
              {journeyData.upcomingTasks} upcoming
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Next checkpoint: {journeyData.nextCheckpoint}
          </span>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Current Task Highlight Card */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-4 relative overflow-hidden shadow-xs">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono tracking-wider font-semibold text-primary uppercase">
                  CURRENT TASK
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Task {journeyData.currentTask.number} of 0{journeyData.totalTasks}
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                {journeyData.currentTask.title}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {journeyData.currentTask.description}
              </p>
            </div>

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono px-2.5 py-1 rounded border border-border bg-secondary text-foreground">
                {journeyData.currentTask.difficulty || 'Intermediate'}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded border border-border bg-secondary text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> ~
                {journeyData.currentTask.estimatedMinutes} min
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded border border-border bg-secondary text-foreground">
                {journeyData.currentTask.category || 'API · Architecture'}
              </span>
            </div>

            {/* Interactive verification notice */}
            <div className="p-3 rounded-md bg-secondary/40 border border-border flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>
                You’ll verify your understanding with an interactive path-tracing exercise at the
                end of this task.
              </span>
            </div>

            {/* Card Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/onboarding/task/api-request-flow')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
              >
                <span>Continue Task</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/onboarding/task/api-request-flow')}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>Preview Verification</span>
              </button>
            </div>
          </section>

          {/* 2. Onboarding Path (Vertical Timeline List) */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Onboarding path
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-secondary text-muted-foreground">
                  {tasks.length} tasks
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Linear progression required
              </span>
            </div>

            {/* Timeline Container */}
            <div className="relative pl-6 space-y-6">
              {/* Connecting Line */}
              <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />

              {tasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isInProgress = task.status === 'in_progress';
                const isLocked = task.status === 'locked';

                return (
                  <div
                    key={task.id}
                    className={`relative flex items-start gap-4 ${isLocked ? 'opacity-70' : ''}`}
                  >
                    {/* Node Icon */}
                    {isCompleted && (
                      <div className="relative z-10 w-5 h-5 -ml-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-card">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                    {isInProgress && (
                      <div className="relative z-10 w-5 h-5 -ml-6 rounded-full bg-card border-2 border-primary flex items-center justify-center ring-4 ring-card">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    )}
                    {isLocked && (
                      <div className="relative z-10 w-5 h-5 -ml-6 rounded-full border border-border bg-card flex items-center justify-center ring-4 ring-card">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      </div>
                    )}

                    {/* Task Card Container */}
                    <div
                      className={`flex-1 rounded-lg border transition-colors duration-150 ${
                        isInProgress
                          ? 'border-border bg-secondary/50 p-4 shadow-xs'
                          : 'border-border bg-secondary/20 p-3.5 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono ${
                              isInProgress ? 'text-primary font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            {task.number}
                          </span>
                          <h4
                            className={`text-sm sm:text-base font-medium ${
                              isInProgress
                                ? 'text-primary font-semibold'
                                : isLocked
                                  ? 'text-muted-foreground'
                                  : 'text-foreground'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {isInProgress && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border bg-card text-primary font-medium">
                              Current
                            </span>
                          )}
                        </div>

                        {isCompleted && (
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                            {task.estimatedMinutes} min ·{' '}
                            <span className="text-primary font-medium">Verified ✓</span>
                          </span>
                        )}
                        {isInProgress && (
                          <Link
                            to="/onboarding/task/api-request-flow"
                            className="text-xs sm:text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {isLocked && (
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>
                              {task.estimatedMinutes} min · {task.tag || 'Locked'}
                            </span>
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                          isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {task.description}
                      </p>

                      {isInProgress && task.checkpointNote && (
                        <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-3 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {task.estimatedMinutes} min
                          </span>
                          <span>·</span>
                          <span>{task.checkpointNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column / Learning Context Panel (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 'Why this matters' Card */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-base font-semibold text-foreground">Why this matters</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Understanding request flow helps you locate where frontend actions become backend
              operations and where business logic is executed.
            </p>

            {/* Key Files & Directories */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider block">
                Key Files &amp; Directories
              </span>
              <ul className="space-y-1.5">
                {keyFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-secondary/40 border border-border"
                  >
                    <span className="text-xs font-mono text-primary font-medium">{file.path}</span>
                    <span className="text-[11px] text-muted-foreground">{file.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Request Lifecycle Map */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider block">
                Request Lifecycle Map
              </span>
              <div className="p-3 rounded-md bg-secondary/30 border border-border space-y-1.5 text-xs font-mono text-center">
                {requestLifecycle.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <div className="py-1.5 px-2 rounded bg-card border border-border text-foreground font-medium">
                      {stage}
                    </div>
                    {idx < requestLifecycle.length - 1 && (
                      <div className="text-muted-foreground/60 flex justify-center py-0.5">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <Link
                to="/architecture"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:underline pt-1"
              >
                <span>View in Architecture Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Verification Preview */}
            <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <Flag className="w-3.5 h-3.5" />
                <span>Checkpoint Preview</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {journeyData.checkpointPreview}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section: 'What you'll master in this codebase' */}
      <section className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            What you'll master in this codebase
          </h3>
          <span className="text-xs font-mono text-muted-foreground">
            {competencies.length} key competencies
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {competencies.map(comp => {
            const renderIcon = () => {
              switch (comp.icon) {
                case 'architecture':
                  return <Network className="w-4 h-4 text-primary" />;
                case 'api':
                  return <Workflow className="w-4 h-4 text-primary" />;
                case 'data':
                  return <Database className="w-4 h-4 text-primary" />;
                case 'workflow':
                  return <GitBranch className="w-4 h-4 text-primary" />;
                default:
                  return <Network className="w-4 h-4 text-primary" />;
              }
            };

            return (
              <div
                key={comp.id}
                className="p-4 rounded-xl border border-border bg-card space-y-2 hover:border-muted-foreground/30 transition-colors duration-150 shadow-xs"
              >
                <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center">
                  {renderIcon()}
                </div>
                <h4 className="text-sm sm:text-base font-medium text-foreground">{comp.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Persistent Bottom Sticky Action Bar */}
      <div className="sticky bottom-0 z-40 w-full border-t border-border bg-card/95 backdrop-blur px-4 sm:px-6 lg:px-8 py-3 mt-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/architecture"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Architecture</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Task 04: {journeyData.currentTask.title}</span>
              <span>·</span>
              <span className="text-primary font-medium">
                {journeyData.progressPercent}% completed
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding/task/api-request-flow')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <span>Continue Task</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
