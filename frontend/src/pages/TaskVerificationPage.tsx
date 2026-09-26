import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Check,
  CheckCircle2,
  Circle,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Info,
  Laptop,
  Lightbulb,
  Lock,
  Workflow,
  RotateCcw,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { TaskVerificationData } from '../types';

type VerificationState = 'input' | 'verified' | 'review';

export const TaskVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState<TaskVerificationData | null>(null);
  const [activeState, setActiveState] = useState<VerificationState>('input');
  const [explanation, setExplanation] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    repositoryService.getTaskVerificationData().then(data => {
      setTaskData(data);
      setExplanation(data.initialExplanation);
    });
  }, []);

  if (!taskData) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Loading task details...</span>
        </div>
      </main>
    );
  }

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate brief client verification analysis
    setTimeout(async () => {
      const result = await repositoryService.verifyTaskAnswer(taskData.taskId, explanation);
      setIsVerifying(false);
      setActiveState(result.status);
    }, 450);
  };

  const handleSaveDraft = () => {
    setSaveMessage('Draft response saved locally.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const charCount = explanation.length;
  const maxChars = taskData.maxCharacters || 1000;

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Sub-Header: Breadcrumbs & Branch info */}
      <div className="w-full bg-secondary/30 border-b border-border px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <nav className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors duration-150">
              Repositories
            </Link>
            <span>/</span>
            <Link
              to="/overview"
              className="text-foreground hover:text-primary font-medium transition-colors duration-150"
            >
              CampusConnect
            </Link>
            <span>/</span>
            <Link
              to="/onboarding"
              className="hover:text-foreground transition-colors duration-150"
            >
              Onboarding
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">{taskData.title}</span>
          </nav>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-card border border-border text-xs font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              branch: {taskData.branch}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-card border border-border text-xs font-mono text-muted-foreground">
              commit: {taskData.commitHash}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Task Hero / Header Card */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {/* Eyebrow status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary border border-border text-xs font-mono text-primary font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  {taskData.taskNumber}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary/50 border border-border text-muted-foreground">
                  {taskData.difficulty}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary/50 border border-border text-muted-foreground">
                  {taskData.estimatedTime}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {taskData.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {taskData.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                {taskData.description}
              </p>
            </div>

            {/* Progress Mini-Dashboard */}
            <div className="flex flex-col items-start lg:items-end min-w-52.5 p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs text-muted-foreground">Overall Progress</span>
                <span className="text-xs font-mono text-primary font-medium">
                  {taskData.overallProgress.completed} / {taskData.overallProgress.total} completed (
                  {taskData.overallProgress.percent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${taskData.overallProgress.percent}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                Next milestone unlocked upon verification
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Primary Workspace & Verification (8 Cols) */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. Repository Context Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/20">
                <div>
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-primary" />
                    <span className="text-sm sm:text-base font-semibold text-foreground">
                      Repository context
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use the repository structure and architecture below to trace the request flow.
                  </p>
                </div>
                <Link
                  to="/architecture"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors duration-150"
                >
                  <span>View architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 space-y-4">
                {/* Flow Visualization Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                  {taskData.pipelineSteps.map(step => {
                    const renderStepIcon = () => {
                      switch (step.icon) {
                        case 'devices':
                          return <Laptop className="w-3.5 h-3.5 text-muted-foreground" />;
                        case 'router':
                          return <Workflow className="w-3.5 h-3.5 text-muted-foreground" />;
                        case 'memory':
                          return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
                        case 'database':
                          return <Database className="w-3.5 h-3.5 text-muted-foreground" />;
                        default:
                          return <Workflow className="w-3.5 h-3.5 text-muted-foreground" />;
                      }
                    };

                    return (
                      <div
                        key={step.step}
                        className="p-3 rounded-lg border border-border bg-secondary/30 flex flex-col justify-between hover:border-muted-foreground/30 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                              {step.label}
                            </span>
                            {renderStepIcon()}
                          </div>
                          <span className="text-sm font-semibold text-foreground block">
                            {step.title}
                          </span>
                          {step.badge ? (
                            <div className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-foreground mt-1 inline-block">
                              {step.badge}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-border text-xs font-mono text-primary truncate">
                          {step.filePath}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Relevant Files Clickable Monospace List */}
                <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                  <span className="text-[11px] font-mono text-muted-foreground block mb-2 font-semibold uppercase tracking-wider">
                    RELEVANT REPOSITORY FILES
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {taskData.relevantFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-card border border-border text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-foreground truncate">{file.path}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {file.lines}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Task Instructions Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Your task</h2>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {taskData.taskPrompt}
              </p>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-medium">Hint:</strong> {taskData.hint}
                </div>
              </div>
            </div>

            {/* 3. Verification State Tabs & Workspace Interface */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {/* Workspace Header & Inspection State Switcher */}
              <div className="px-4 py-3 border-b border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary" />
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    Your explanation
                  </span>
                </div>

                {/* Tab switcher to demonstrate states */}
                <div className="inline-flex p-1 rounded-md bg-card border border-border text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveState('input')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeState === 'input'
                        ? 'bg-secondary text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    [Input Workspace]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveState('verified')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeState === 'verified'
                        ? 'bg-secondary text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    [Verified Result]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveState('review')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeState === 'review'
                        ? 'bg-secondary text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    [Needs Review Result]
                  </button>
                </div>
              </div>

              {/* STATE 1: ACTIVE INPUT WORKSPACE */}
              {activeState === 'input' && (
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>Code-tracing explanation &amp; flow breakdown:</span>
                      <span className="text-primary font-medium">
                        {charCount} / {maxChars} characters
                      </span>
                    </div>

                    <div className="relative rounded-lg border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                      <textarea
                        value={explanation}
                        onChange={e => setExplanation(e.target.value.slice(0, maxChars))}
                        placeholder="e.g. When the user clicks Register in EventCard.tsx, the client invokes registerForEvent() in src/api/events.ts..."
                        rows={8}
                        className="w-full bg-transparent p-3.5 font-mono text-xs sm:text-sm text-foreground placeholder:text-muted-foreground resize-y border-none focus:outline-none focus:ring-0 leading-relaxed"
                      />
                    </div>
                  </div>

                  {saveMessage && (
                    <div className="text-xs font-mono text-primary flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      <span>RepoGuide uses this response to verify your understanding of the repository.</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer"
                      >
                        Save &amp; Continue Later
                      </button>
                      <button
                        type="button"
                        disabled={isVerifying || charCount === 0}
                        onClick={handleVerify}
                        className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Understanding</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: SUCCESSFUL VERIFICATION (Verified Result) */}
              {activeState === 'verified' && (
                <div className="p-5 space-y-5">
                  <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <Check className="w-4 h-4 stroke-3" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {taskData.successFeedback.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {taskData.successFeedback.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-card border border-border text-primary font-medium shrink-0">
                        {taskData.successFeedback.score}
                      </span>
                    </div>

                    {/* Verified Breakdown Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border text-xs sm:text-sm">
                      {taskData.successFeedback.checklist.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-md bg-card border border-border flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-foreground truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Technical Takeaways */}
                    <div className="p-3 rounded-md bg-card border border-border space-y-1">
                      <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                        What you understood:
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {taskData.successFeedback.whatYouUnderstood}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveState('input')}
                      className="px-3.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      ← Re-edit Response
                    </button>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Link
                        to="/architecture"
                        className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
                      >
                        Review Architecture
                      </Link>
                      <button
                        type="button"
                        onClick={() => navigate('/onboarding')}
                        className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Continue to Next Task</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 3: NEEDS REVIEW FEEDBACK (Almost there) */}
              {activeState === 'review' && (
                <div className="p-5 space-y-5">
                  <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground shrink-0">
                          <Info className="w-4 h-4 text-foreground" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {taskData.reviewFeedback.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {taskData.reviewFeedback.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-card border border-border text-muted-foreground font-medium shrink-0">
                        {taskData.reviewFeedback.status}
                      </span>
                    </div>

                    {/* Missing Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                      {taskData.reviewFeedback.checklist.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-md bg-card border border-border flex items-center gap-2"
                        >
                          {item.verified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-foreground truncate">{item.label}</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground truncate">{item.label}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-md bg-card border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground font-medium">Diagnostic:</strong>{' '}
                      {taskData.reviewFeedback.diagnostic}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveState('input')}
                      className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      Review Context
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveState('input')}
                      className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Progress & Context Sidebar (4 Cols) */}
          <aside className="xl:col-span-4 space-y-6">
            {/* 1. Onboarding Progress Timeline Card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Onboarding Progress</h2>
                  <span className="text-xs text-muted-foreground">
                    CampusConnect Developer Path
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary border border-border text-primary font-medium">
                  {taskData.overallProgress.percent}%
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-3 text-xs sm:text-sm">
                {/* Step 01 */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <div className="w-px h-6 bg-border my-0.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-primary font-medium">01 Project Structure</span>
                      <span className="text-[11px] text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Monorepo modules &amp; config hierarchy
                    </p>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <div className="w-px h-6 bg-border my-0.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-primary font-medium">
                        02 Application Architecture
                      </span>
                      <span className="text-[11px] text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Frontend, API &amp; microservices flow
                    </p>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <div className="w-px h-6 bg-border my-0.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-primary font-medium">03 Authentication</span>
                      <span className="text-[11px] text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      JWT lifecycle &amp; route guards
                    </p>
                  </div>
                </div>

                {/* Step 04 (Current Active) */}
                <div className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50 border border-primary/40 shadow-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="w-px h-6 bg-border my-1" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-primary font-semibold">
                        04 API Request Flow
                      </span>
                      <span className="text-[11px] font-mono text-primary font-medium">Current</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Trace client to persistent storage
                    </p>
                  </div>
                </div>

                {/* Step 05 */}
                <div className="flex items-start gap-3 opacity-60">
                  <div className="flex flex-col items-center">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <div className="w-px h-6 bg-border my-0.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-muted-foreground">
                        05 Database &amp; Data Model
                      </span>
                      <span className="text-[11px] text-muted-foreground">Upcoming</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      PostgreSQL schemas &amp; migrations
                    </p>
                  </div>
                </div>

                {/* Step 06 */}
                <div className="flex items-start gap-3 opacity-60">
                  <div className="flex flex-col items-center">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-muted-foreground">06 Final Verification</span>
                      <span className="text-[11px] text-muted-foreground">Upcoming</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Comprehensive repository quiz
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Progress Bar Meter */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Path completion rate</span>
                  <span className="font-mono text-primary">50% complete</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/2 rounded-full" />
                </div>
              </div>
            </div>

            {/* 2. Architecture Reference Mini-Card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Architecture Reference</h3>
                <Workflow className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The CampusConnect service pattern isolates transport interfaces from domain controllers.
              </p>

              {/* Compact Vertical Pipeline Diagram */}
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-card border border-border">
                  <span className="text-foreground">Client: Next.js / React</span>
                  <span className="text-muted-foreground">Port 3000</span>
                </div>
                <div className="flex justify-center text-muted-foreground/60 py-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-card border border-border">
                  <span className="text-foreground">API Layer: FastAPI</span>
                  <span className="text-muted-foreground">Route guards</span>
                </div>
                <div className="flex justify-center text-muted-foreground/60 py-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-card border border-border">
                  <span className="text-foreground">Service: EventService</span>
                  <span className="text-muted-foreground">Rules &amp; Auth</span>
                </div>
                <div className="flex justify-center text-muted-foreground/60 py-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-card border border-border">
                  <span className="text-foreground">Storage: PostgreSQL</span>
                  <span className="text-muted-foreground">SQLAlchemy ORM</span>
                </div>
              </div>

              <Link
                to="/architecture"
                className="inline-flex items-center justify-between w-full p-2 rounded-lg bg-secondary/40 hover:bg-secondary border border-border text-xs sm:text-sm font-medium text-primary transition-colors"
              >
                <span>Open Architecture Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3. Task Navigation Quick Footer */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 shadow-xs">
              <Link
                to="/onboarding"
                className="inline-flex items-center justify-between w-full px-3 py-2 rounded-lg border border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Onboarding Path</span>
                </span>
                <span className="font-mono text-xs">Task 03</span>
              </Link>
              <div className="inline-flex items-center justify-between w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-muted-foreground text-xs sm:text-sm opacity-80">
                <span>Next: Database &amp; Data Model</span>
                <span className="font-mono text-xs">Task 05 →</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
