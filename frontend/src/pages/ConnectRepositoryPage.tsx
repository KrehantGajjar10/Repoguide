import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Terminal,
  Link2,
  ChevronRight,
  Copy,
  Check,
  History,
  FolderArchive,
  Network,
  GitMerge,
  ShieldCheck,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { Repository } from '../types';

export const ConnectRepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('https://github.com/example/campus-connect');
  const [copied, setCopied] = useState(false);
  const [recentRepos, setRecentRepos] = useState<Repository[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    repositoryService.getRecentRepositories().then(setRecentRepos);
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setAnalyzing(true);
    setConnectError(null);
    try {
      await repositoryService.connectRepositoryUrl(repoUrl.trim());
      navigate('/analysis');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect repository.');
      setAnalyzing(false);
    }
  };

  const handleScrollToConnect = (e: React.MouseEvent) => {
    e.preventDefault();
    const card = document.getElementById('connect-card');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx repoguide@latest init');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = () => {
    setRecentRepos([]);
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center max-w-3xl w-full flex flex-col items-center mb-10 md:mb-12">
        {/* Eyebrow Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card mb-5 sm:mb-6 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
          <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
            Developer Onboarding
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
          Understand any codebase. Start contributing faster.
        </h1>

        {/* Supporting Body Text */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          RepoGuide analyzes your repository, maps its architecture, and turns it into a guided
          onboarding journey you can actually verify.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#connect-card"
            onClick={handleScrollToConnect}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium text-[13px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span>Connect Repository</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => navigate('/analysis')}
            className="h-9 px-4 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-[13px] inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span>View Demo</span>
          </button>
        </div>
      </section>

      {/* Connect Repository Card */}
      <section
        id="connect-card"
        className="w-full max-w-3xl lg:max-w-4xl bg-card border border-border rounded-xl p-5 sm:p-7 md:p-8 shadow-xs mb-12 md:mb-14 transition-colors scroll-mt-20"
      >
        <div className="mb-6">
          <h2 className="text-xl font-medium text-foreground tracking-tight">Connect a repository</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Start with a GitHub repository or provide a repository URL.
          </p>
        </div>

        {/* Option 1: GitHub OAuth Connect */}
        <button
          type="button"
          onClick={() => navigate('/analysis')}
          className="w-full group flex items-center justify-between p-3.5 sm:p-4 rounded-lg bg-background border border-border hover:border-foreground/30 hover:bg-secondary/70 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded bg-secondary border border-border flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Connect with GitHub</div>
              <div className="text-xs text-muted-foreground truncate">
                Choose a repository from your GitHub account
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2">
            <span>Authorize</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-border w-full"></div>
          <span className="absolute bg-card px-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Option 2: Direct URL Input */}
        <form onSubmit={handleAnalyze} className="space-y-3">
          <label htmlFor="repoUrl" className="flex items-center gap-1.5 text-[13px] text-foreground font-medium">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Repository URL</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="repoUrl"
                type="url"
                required
                value={repoUrl}
                onChange={(e) => { setRepoUrl(e.target.value); setConnectError(null); }}
                placeholder="https://github.com/organization/project"
                className="w-full h-10 px-3.5 bg-background text-foreground border border-border rounded-md text-[13px] font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              />
              <div className="absolute right-2.5 top-2.5 hidden sm:flex items-center gap-1 pointer-events-none text-muted-foreground text-xs font-mono">
                <kbd className="px-1.5 py-0.5 border border-border rounded bg-secondary text-[10px]">⌘</kbd>
                <kbd className="px-1.5 py-0.5 border border-border rounded bg-secondary text-[10px]">V</kbd>
              </div>
            </div>
            <button
              type="submit"
              disabled={analyzing}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-medium text-[13px] inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{analyzing ? 'Connecting…' : 'Analyze Repository'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {connectError && (
            <p className="text-xs text-destructive mt-1">{connectError}</p>
          )}
        </form>

        {/* Local inspection footer */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FolderArchive className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Need local tarball inspection?</span>
          </div>
          <button
            type="button"
            onClick={handleCopyCli}
            className="text-foreground hover:underline font-mono inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>npx repoguide@latest init</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </section>

      {/* Recent Repositories Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl mb-12 md:mb-14">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">Recent Repositories</h3>
            <span className="px-1.5 py-0.2 rounded border border-border text-[11px] font-mono text-muted-foreground">
              {recentRepos.length}
            </span>
          </div>
          {recentRepos.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Clear history
            </button>
          )}
        </div>

        {recentRepos.length > 0 ? (
          <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
            {recentRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => navigate('/analysis')}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/70 transition-colors group gap-3 cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 sm:mt-0 shrink-0"></span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground group-hover:underline">
                        {repo.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        / {repo.branch}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {repo.stack.map((tech) => (
                        <span
                          key={tech}
                          className="px-1.5 py-0.5 rounded border border-border bg-background text-[11px] font-mono text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">
                    {repo.lastAnalyzed}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
            No recent repositories found.
          </div>
        )}
      </section>

      {/* Product Value Indicators (3-Column Strip) */}
      <section className="w-full max-w-3xl lg:max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 md:mb-16">
        <div className="p-5 sm:p-6 rounded-lg border border-border bg-card">
          <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center text-foreground mb-3">
            <Network className="w-4 h-4 text-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-1">Repository-aware</h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Understand structure, modules, APIs and dependencies.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-lg border border-border bg-card">
          <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center text-foreground mb-3">
            <GitMerge className="w-4 h-4 text-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-1">Guided onboarding</h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Follow a structured learning path instead of exploring randomly.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-lg border border-border bg-card">
          <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center text-foreground mb-3">
            <ShieldCheck className="w-4 h-4 text-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-1">Verified understanding</h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Complete tasks that confirm you understand the codebase.
          </p>
        </div>
      </section>
    </main>
  );
};
