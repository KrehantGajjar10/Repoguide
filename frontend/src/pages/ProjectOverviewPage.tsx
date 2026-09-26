import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Folder,
  Route,
  Database,
  Package,
  ArrowRight,
  Laptop,
  Network,
  ChevronRight,
  FolderOpen,
  FileCode,
  Search,
  GitBranch,
  Terminal,
  Cpu,
  Layers,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { ProjectOverviewData } from '../types';

export const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectOverviewData | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'campus-connect': true,
    'frontend': true,
    'backend': true,
    'tests': true,
  });

  useEffect(() => {
    repositoryService.getProjectOverview().then(setData);
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  if (!data) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <Layers className="w-4 h-4 animate-spin" />
          <span>Loading project overview...</span>
        </div>
      </main>
    );
  }

  const { repository, commitHash, description, metrics, architectureLayers, techStack, keyModules } = data;

  const renderMetricIcon = (icon: string) => {
    switch (icon) {
      case 'modules':
        return <Folder className="w-4 h-4 text-muted-foreground" />;
      case 'routes':
        return <Route className="w-4 h-4 text-muted-foreground" />;
      case 'models':
        return <Database className="w-4 h-4 text-muted-foreground" />;
      case 'dependencies':
        return <Package className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Folder className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderTechCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'frontend':
        return <Laptop className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'backend':
        return <Terminal className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'database':
        return <Database className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'tooling':
        return <Wrench className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const renderLayerIcon = (icon: string) => {
    switch (icon) {
      case 'devices':
        return <Laptop className="w-4 h-4 text-muted-foreground" />;
      case 'route':
        return <Route className="w-4 h-4 text-muted-foreground" />;
      case 'hub':
        return <Network className="w-4 h-4 text-muted-foreground" />;
      case 'database':
        return <Database className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Cpu className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col gap-8">
      {/* Repository Header Section */}
      <section className="flex flex-col gap-4 border-b border-border pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Repositories
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{repository.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {repository.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-card text-[11px] font-mono text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Analyzed
              </span>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                {commitHash}
              </span>
            </div>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            {/* Tech Stack Chips */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {repository.stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded border border-border bg-secondary text-[11px] font-mono text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded border border-border bg-secondary text-[11px] font-mono text-muted-foreground">
                SQLAlchemy
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/architecture')}
              className="px-3.5 py-2 rounded-md bg-card border border-border hover:bg-secondary hover:border-foreground/30 text-xs sm:text-[13px] text-foreground font-medium transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Network className="w-4 h-4 text-muted-foreground" />
              <span>Explore Architecture</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-xs sm:text-[13px] font-medium flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>Start Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Overview Metrics Grid (4 Cards) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="p-4 sm:p-5 rounded-xl border border-border bg-card flex flex-col justify-between h-28 hover:border-foreground/30 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
              {renderMetricIcon(metric.icon)}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono text-foreground font-semibold">
                {metric.value}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">{metric.detail}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Architecture Summary Flow Section */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              Architecture
            </h2>
            <p className="text-[13px] text-muted-foreground">
              A high-level view of how the major parts of the application interact.
            </p>
          </div>
          <Link
            to="/architecture"
            className="text-xs font-mono text-foreground hover:underline inline-flex items-center gap-1 group font-medium shrink-0"
          >
            <span>Explore full architecture</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
          {architectureLayers.map((layer) => (
            <div
              key={layer.step}
              onClick={() => navigate('/architecture')}
              className="p-4 rounded-lg border border-border bg-background flex flex-col justify-between gap-3 hover:border-foreground/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{layer.step}</span>
                {renderLayerIcon(layer.icon)}
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {layer.name}
                </h3>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{layer.tech}</p>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground border-t border-border pt-2 flex items-center justify-between">
                <span>{layer.runtime}</span>
                <span>{layer.port}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-Column Grid: Tech Stack & Key Modules (7 cols) + File Tree (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tech Stack & Key Modules (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Technology Stack */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
                Technology Stack
              </h2>
              <span className="text-xs font-mono text-muted-foreground">16 Detected Packages</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techStack.map((group) => (
                <div
                  key={group.category}
                  className="p-3.5 rounded-lg border border-border bg-background flex flex-col gap-2"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    {renderTechCategoryIcon(group.icon)}
                    <span>{group.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-secondary text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Key Modules */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
                  Key Modules
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Core functional boundaries identified in repository analysis.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">4 of 8 shown</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {keyModules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => navigate('/architecture')}
                  className="p-3.5 rounded-lg border border-border bg-background hover:border-foreground/30 hover:bg-secondary/70 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground group-hover:underline">
                        {mod.name}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
                        {mod.path}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Repository Structure Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
                Repository Structure
              </h2>
              <Link
                to="/architecture"
                className="text-xs font-mono text-foreground hover:underline inline-flex items-center gap-1 group font-medium"
              >
                <span>View in Explorer</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* File Tree Terminal Container */}
            <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs overflow-x-auto text-muted-foreground">
              {/* Root */}
              <div
                className="flex items-center gap-1.5 text-foreground mb-2 font-medium cursor-pointer"
                onClick={() => toggleFolder('campus-connect')}
              >
                <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>campus-connect/</span>
              </div>

              {expandedFolders['campus-connect'] && (
                <div className="pl-4 border-l border-border ml-2 flex flex-col gap-1.5">
                  {/* Frontend */}
                  <div>
                    <div
                      className="flex items-center gap-1.5 text-foreground/90 hover:text-foreground cursor-pointer transition-colors"
                      onClick={() => toggleFolder('frontend')}
                    >
                      <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>frontend/</span>
                    </div>
                    {expandedFolders['frontend'] && (
                      <div className="pl-4 border-l border-border ml-1.5 mt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Folder className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          <span>src/</span>
                        </div>
                        <div className="pl-4 border-l border-border ml-1.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <span>components/</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <span>pages/</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/80">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <span>package.json</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Backend */}
                  <div>
                    <div
                      className="flex items-center gap-1.5 text-foreground/90 hover:text-foreground cursor-pointer transition-colors mt-1"
                      onClick={() => toggleFolder('backend')}
                    >
                      <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>backend/</span>
                    </div>
                    {expandedFolders['backend'] && (
                      <div className="pl-4 border-l border-border ml-1.5 mt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Folder className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          <span>app/</span>
                        </div>
                        <div className="pl-4 border-l border-border ml-1.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <span>api/</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <span>services/</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <span>models/</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/80">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <span>main.py</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tests */}
                  <div>
                    <div
                      className="flex items-center gap-1.5 text-foreground/90 hover:text-foreground cursor-pointer transition-colors mt-1"
                      onClick={() => toggleFolder('tests')}
                    >
                      <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>tests/</span>
                    </div>
                    {expandedFolders['tests'] && (
                      <div className="pl-4 border-l border-border ml-1.5 mt-1 flex flex-col gap-1 text-muted-foreground/80">
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <span>test_api.py</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <span>test_events.py</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Root files */}
                  <div className="flex items-center gap-1.5 text-muted-foreground/80 mt-1">
                    <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span>docker-compose.yml</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground/80">
                    <FileCode className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span>README.md</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
              <span>
                Branch: <span className="text-foreground font-medium">main</span>
              </span>
              <span>42 files in tree</span>
            </div>
          </section>

          {/* Command Palette Helper Widget */}
          <div
            onClick={() => navigate('/architecture')}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-xs hover:border-foreground/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs sm:text-[13px] text-muted-foreground">
                Navigate files and modules
              </span>
            </div>
            <kbd className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-secondary text-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Onboarding Callout Banner */}
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-2 max-w-2xl z-10">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary pulse-dot"></span>
            <span>CURATED ONBOARDING PATH</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Ready to understand the codebase?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow a structured onboarding path through the project's architecture, APIs,
            authentication, and data layer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-xs sm:text-[13px] font-medium flex items-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span>Start Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            6 guided tasks · Progress tracked · Verified
          </span>
        </div>
      </section>
    </main>
  );
};
