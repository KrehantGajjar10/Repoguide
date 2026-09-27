import React, { useState, useEffect, useRef } from 'react';
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
import { repoSession } from '../services/repoSession';
import type { AnalysisData } from '../types';
import { DEMO_ANALYSIS_DATA } from '../data/mockData';
import type { BackendAnalysisStatus } from '../services/repositoryService';

// ---------------------------------------------------------------------------
// Status → UI stage helpers
// ---------------------------------------------------------------------------
const TERMINAL_STATUSES = new Set(['completed', 'failed']);
const POLL_INTERVAL_MS = 2500;

type StageStatus = 'completed' | 'analyzing' | 'pending';

interface UIStage {
  id: string;
  title: string;
  detail: string;
  status: StageStatus;
}

function buildStages(backendStatus: string, analysis: BackendAnalysisStatus): UIStage[] {
  const s = backendStatus;
  const fileDetail =
    analysis.file_count != null
      ? `${analysis.file_count} files · ${analysis.directory_count ?? 0} directories`
      : 'Scanning files…';
  const techDetail =
    analysis.technologies && analysis.technologies.length > 0
      ? `${analysis.technologies.length} technologies detected`
      : s === 'completed' ? 'No technologies detected' : 'Detecting technologies…';

  const completed = (title: string, detail: string): UIStage => ({
    id: title,
    title,
    detail,
    status: 'completed',
  });
  const active = (title: string, detail: string): UIStage => ({
    id: title,
    title,
    detail,
    status: 'analyzing',
  });
  const pending = (title: string, detail: string): UIStage => ({
    id: title,
    title,
    detail,
    status: 'pending',
  });

  if (s === 'created' || s === 'queued') {
    return [
      active('Queuing analysis', 'Preparing to start…'),
      pending('Repository structure', 'Waiting'),
      pending('Technology & dependencies', 'Waiting'),
    ];
  }
  if (s === 'cloning_repository') {
    return [
      completed('Queuing analysis', 'Analysis queued'),
      active('Cloning repository', 'Shallow clone in progress…'),
      pending('Repository structure', 'Waiting'),
      pending('Technology & dependencies', 'Waiting'),
    ];
  }
  if (s === 'parsing_structure') {
    return [
      completed('Queuing analysis', 'Analysis queued'),
      completed('Cloning repository', 'Clone complete'),
      active('Repository structure', fileDetail),
      pending('Technology & dependencies', 'Waiting'),
    ];
  }
  if (s === 'completed') {
    return [
      completed('Queuing analysis', 'Analysis queued'),
      completed('Cloning repository', 'Clone complete'),
      completed('Repository structure', fileDetail),
      completed('Technology & dependencies', techDetail),
    ];
  }
  if (s === 'failed') {
    return [
      completed('Queuing analysis', 'Started'),
      { id: 'failed', title: 'Analysis failed', detail: analysis.error_message ?? 'An error occurred.', status: 'analyzing' as const },
    ];
  }
  // Unknown/transient status — show a generic loading stage, never mock data
  return [
    active('Starting analysis', 'Connecting to backend…'),
    pending('Repository structure', 'Waiting'),
    pending('Technology & dependencies', 'Waiting'),
  ];
}

function buildLogs(backendStatus: string, analysis: BackendAnalysisStatus) {
  const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logs = [];

  if (['queued', 'cloning_repository', 'parsing_structure', 'completed', 'failed'].includes(backendStatus)) {
    logs.push({ id: 'l1', title: 'Analysis task queued', detail: `repository_id=${analysis.repository_id}`, timestamp: ts(), status: 'completed' as const });
  }
  if (['cloning_repository', 'parsing_structure', 'completed', 'failed'].includes(backendStatus)) {
    logs.push({ id: 'l2', title: 'Starting shallow clone', detail: 'git clone --depth 1', timestamp: ts(), status: 'completed' as const });
  }
  if (backendStatus === 'cloning_repository') {
    logs.push({ id: 'l3', title: 'Cloning repository…', detail: analysis.repository_url ?? '', timestamp: ts(), status: 'active' as const });
  }
  if (['parsing_structure', 'completed'].includes(backendStatus)) {
    logs.push({ id: 'l4', title: 'Clone complete', detail: `branch: ${analysis.default_branch ?? 'unknown'}`, timestamp: ts(), status: 'completed' as const });
    logs.push({ id: 'l5', title: 'Walking file tree…', detail: `max 10,000 files`, timestamp: ts(), status: backendStatus === 'parsing_structure' ? 'active' as const : 'completed' as const });
  }
  if (backendStatus === 'completed') {
    logs.push({ id: 'l6', title: 'Structure analysis complete', detail: `${analysis.file_count ?? 0} files · ${analysis.directory_count ?? 0} dirs`, timestamp: ts(), status: 'completed' as const });
    logs.push({ id: 'l7', title: 'Technology detection complete', detail: (analysis.technologies ?? []).join(', ') || 'none detected', timestamp: ts(), status: 'completed' as const });
    logs.push({ id: 'l8', title: 'Cleanup: temporary directory removed', detail: 'repository_temp deleted', timestamp: ts(), status: 'completed' as const });
  }
  if (backendStatus === 'failed') {
    logs.push({ id: 'lf', title: 'Analysis failed', detail: analysis.error_message ?? 'Unknown error', timestamp: ts(), status: 'active' as const });
  }

  if (logs.length === 0) {
    // No known status yet — show a single loading entry, never mock data
    return [{ id: 'l0', title: 'Connecting to backend…', detail: '', timestamp: ts(), status: 'active' as const }];
  }
  return logs;
}

function buildMetrics(analysis: BackendAnalysisStatus, hasRealSession: boolean) {
  // For a real session that failed, return empty metrics — never mock data.
  if (hasRealSession && analysis.status === 'failed') {
    return [
      { id: 'm1', label: 'Files', value: '—', detail: 'Analysis failed', icon: 'files' as const },
      { id: 'm2', label: 'Technologies', value: '—', detail: 'Analysis failed', icon: 'modules' as const },
      { id: 'm3', label: 'Top extension', value: '—', detail: 'Analysis failed', icon: 'routes' as const },
      { id: 'm4', label: 'Branch', value: '—', detail: 'Analysis failed', icon: 'models' as const },
    ];
  }
  // For in-progress real sessions, return loading placeholders — never mock data.
  if (analysis.status !== 'completed') {
    return [
      { id: 'm1', label: 'Files',         value: '—', detail: 'Analyzing…', icon: 'files' as const },
      { id: 'm2', label: 'Technologies',  value: '—', detail: 'Analyzing…', icon: 'modules' as const },
      { id: 'm3', label: 'Top extension', value: '—', detail: 'Analyzing…', icon: 'routes' as const },
      { id: 'm4', label: 'Branch',        value: '—', detail: 'Analyzing…', icon: 'models' as const },
    ];
  }
  const techs = analysis.technologies ?? [];
  const exts = analysis.extension_counts ?? {};
  const topExt = Object.entries(exts).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      id: 'm1',
      label: 'Files',
      value: analysis.file_count ?? 0,
      detail: `${analysis.directory_count ?? 0} directories`,
      icon: 'files' as const,
    },
    {
      id: 'm2',
      label: 'Technologies',
      value: techs.length,
      detail: techs.slice(0, 3).join(', ') || 'none detected',
      icon: 'modules' as const,
    },
    {
      id: 'm3',
      label: 'Top extension',
      value: topExt ? topExt[0] : '—',
      detail: topExt ? `${topExt[1]} files` : 'no source files',
      icon: 'routes' as const,
    },
    {
      id: 'm4',
      label: 'Branch',
      value: analysis.default_branch ?? '—',
      detail: analysis.repository_name ?? '',
      icon: 'models' as const,
    },
  ];
}

function buildRepository(analysis: BackendAnalysisStatus) {
  return {
    id: analysis.repository_id,
    name: analysis.repository_name ?? analysis.repository_url ?? 'Repository',
    branch: analysis.default_branch ?? 'main',
    url: analysis.repository_url ?? '',
    stack: analysis.technologies ?? [],
    lastAnalyzed: analysis.analysis_completed_at
      ? `Analyzed ${new Date(analysis.analysis_completed_at).toLocaleTimeString()}`
      : 'Analyzing…',
  };
}

function statusLabel(backendStatus: string): string {
  const map: Record<string, string> = {
    created: 'Starting…',
    queued: 'Queued',
    cloning_repository: 'Cloning…',
    parsing_structure: 'Analyzing…',
    completed: 'Complete',
    failed: 'Failed',
  };
  return map[backendStatus] ?? 'Analyzing…';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RepositoryAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendAnalysisStatus | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const repoId = repoSession.get();

  useEffect(() => {
    // No real repo ID — fall back to mock data so demo mode still works
    if (!repoId) {
      repositoryService.getAnalysisData().then(setAnalysisData);
      return;
    }

    const poll = async () => {
      try {
        const status = await repositoryService.getAnalysisStatus(repoId);
        setBackendStatus(status);
        setPollError(null);

        if (TERMINAL_STATUSES.has(status.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        setPollError(err instanceof Error ? err.message : 'Could not reach backend.');
      }
    };

    // Immediate first poll
    poll();
    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [repoId]);

  // Build display data from backend response or mock
  const displayData: AnalysisData = (() => {
    if (backendStatus) {
      const status = backendStatus.status;
      return {
        repository: buildRepository(backendStatus),
        progress: backendStatus.progress,
        stages: buildStages(status, backendStatus),
        logs: buildLogs(status, backendStatus),
        metrics: buildMetrics(backendStatus, !!repoId),
        daemonChannel: `repo-${backendStatus.repository_id.slice(0, 8)}`,
        daemonLatency: status === 'completed' ? '—' : '~2.5s',
      };
    }
    return analysisData ?? DEMO_ANALYSIS_DATA;
  })();

  // Show spinner only while we have a repoId but haven't gotten first response
  if (repoId && !backendStatus && !pollError) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading analysis state...</span>
        </div>
      </main>
    );
  }

  if (!repoId && !analysisData) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading analysis state...</span>
        </div>
      </main>
    );
  }

  const { repository, progress, stages, logs, metrics, daemonChannel, daemonLatency } = displayData;
  const isComplete = backendStatus?.status === 'completed';
  const isFailed = backendStatus?.status === 'failed';
  const isLive = backendStatus
    ? !TERMINAL_STATUSES.has(backendStatus.status)
    : true;

  const renderMetricIcon = (icon: string) => {
    switch (icon) {
      case 'files': return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'modules': return <Layers className="w-4 h-4 text-muted-foreground" />;
      case 'routes': return <Route className="w-4 h-4 text-muted-foreground" />;
      case 'models': return <Database className="w-4 h-4 text-muted-foreground" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
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
            {isLive && <span className="w-2 h-2 rounded-full bg-primary pulse-dot"></span>}
            {isComplete && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            {isFailed && <span className="w-2 h-2 rounded-full bg-destructive"></span>}
            <span className="text-xs font-mono text-foreground tracking-wide font-medium">
              {backendStatus ? statusLabel(backendStatus.status) : 'Analyzing...'}
            </span>
          </div>
        </div>
      </div>

      {/* Poll error banner (non-crashing) */}
      {pollError && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-border bg-card text-xs font-mono text-muted-foreground">
          Backend unreachable: {pollError} — showing last known state.
        </div>
      )}

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
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>}
              <span>{isLive ? 'Live streaming' : 'Stream ended'}</span>
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
                      isFailed
                        ? <Circle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        : <RefreshCw className="w-3.5 h-3.5 text-foreground animate-spin mt-0.5 shrink-0" />
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
          onClick={() => { repoSession.clear(); navigate('/'); }}
          className="w-full sm:w-auto px-4 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Cancel Analysis
        </button>
        <button
          type="button"
          onClick={() => navigate('/overview')}
          disabled={isLive && !!repoId}
          className="w-full sm:w-auto px-5 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Project Overview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
