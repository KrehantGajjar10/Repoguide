import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Laptop,
  Network,
  Lock,
  Calendar,
  Database,
  Send,
  X,
  ArrowDown,
  CornerDownRight,
  GitCommit,
  Layers,
  FileCode,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import { repoSession } from '../services/repoSession';
import type { ArchitectureData, ArchitectureNode } from '../types';
import type { BackendArchitecture, BackendArchitectureNode } from '../services/repositoryService';

// ---------------------------------------------------------------------------
// Helpers: map a backend node list to the ArchitectureNode[] the UI uses
// ---------------------------------------------------------------------------

function mapNodes(raw: BackendArchitectureNode[]): ArchitectureNode[] {
  return raw.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type as ArchitectureNode['type'],
    badge: n.badge,
    sublabel: n.sublabel,
    tech: n.tech,
    port: n.port,
    location: n.location,
    filesCount: n.filesCount,
    dependenciesCount: n.dependenciesCount,
    endpointsCount: n.endpointsCount,
    purpose: n.purpose,
    importantFiles: n.importantFiles,
    ingress: n.ingress,
    egress: n.egress,
    routes: n.routes as ArchitectureNode['routes'],
    coords: n.coords,
  }));
}

function makeArchData(b: BackendArchitecture, nodeList: BackendArchitectureNode[]): ArchitectureData {
  return {
    repository: {
      id: b.repository_id,
      name: b.repository_name,
      branch: b.default_branch ?? 'main',
      url: b.repository_url,
      stack: [],
      lastAnalyzed: 'Just analyzed',
    },
    engineSync: b.engine_sync,
    commitHash: b.commit_hash,
    nodes: mapNodes(nodeList),
  };
}

export const ArchitectureExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  // Three separate node datasets stored in state
  const [backendArch, setBackendArch] = useState<BackendArchitecture | null>(null);
  const [data, setData] = useState<ArchitectureData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeView, setActiveView] = useState<'logical' | 'dataflow' | 'deptree'>('logical');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const repoId = repoSession.get();

  useEffect(() => {
    if (repoId) {
      repositoryService.getRepositoryArchitecture(repoId)
        .then((b) => {
          setBackendArch(b);
          const initial = makeArchData(b, b.nodes);
          setData(initial);
          if (initial.nodes.length > 0) setSelectedNodeId(initial.nodes[0].id);
        })
        .catch((err) => {
          setLoadError(err instanceof Error ? err.message : 'Failed to load architecture.');
        });
    } else {
      repositoryService.getArchitectureData().then((archData) => {
        setData(archData);
        if (archData.nodes.length > 0) setSelectedNodeId(archData.nodes[0].id);
      });
    }
  }, [repoId]);

  // Rebuild data when activeView changes (real session only)
  useEffect(() => {
    if (!backendArch) return;
    const nodeList =
      activeView === 'dataflow' ? backendArch.dataflow_nodes :
      activeView === 'deptree'  ? backendArch.deptree_nodes  :
                                  backendArch.nodes;
    const rebuilt = makeArchData(backendArch, nodeList);
    setData(rebuilt);
    if (rebuilt.nodes.length > 0) setSelectedNodeId(rebuilt.nodes[0].id);
  }, [activeView, backendArch]);

  // Active nodes for current view
  const activeNodes = useMemo<ArchitectureNode[]>(() => data?.nodes ?? [], [data]);

  const selectedNode = useMemo<ArchitectureNode | undefined>(() => {
    return activeNodes.find((n) => n.id === selectedNodeId) || activeNodes[0];
  }, [activeNodes, selectedNodeId]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return activeNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tech.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeNodes, searchQuery]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(70, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  if (loadError) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground font-mono text-center">
          <span className="text-destructive">{loadError}</span>
          <span className="text-xs">Analysis may not be complete. Return to the analysis page and wait for completion.</span>
        </div>
      </main>
    );
  }

  if (!data || !selectedNode) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <Layers className="w-4 h-4 animate-spin" />
          <span>Loading architecture explorer...</span>
        </div>
      </main>
    );
  }

  const { repository, engineSync, commitHash } = data;

  const renderNodeIcon = (type: string, isSelected: boolean) => {
    const iconClass = `w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`;
    switch (type) {
      case 'client':
        return <Laptop className={iconClass} />;
      case 'gateway':
        return <Network className={iconClass} />;
      case 'service':
        return <Lock className={iconClass} />;
      case 'storage':
        return <Database className={iconClass} />;
      case 'worker':
        return <Send className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  return (
    <div className={`flex-1 flex flex-col w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Page Header */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-3 border-b border-border bg-card shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb & Title */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              <Link to="/" className="hover:text-foreground transition-colors">
                Repositories
              </Link>
              <span>/</span>
              <Link to="/overview" className="hover:text-foreground transition-colors">
                {repository.name}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Architecture</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                Architecture Explorer
              </h1>
              <p className="hidden sm:block text-xs sm:text-[13px] text-muted-foreground">
                Explore how the major components of this repository connect and communicate.
              </p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary border border-border text-xs font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{engineSync}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground font-medium text-xs sm:text-[13px] hover:opacity-90 transition-opacity shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>Start Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Container */}
      <main className="flex-1 flex flex-col p-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full gap-4">
        {/* Interactive Canvas Card */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-xs relative min-h-145">
          {/* Inside Canvas Top Toolbar */}
          <div className="h-12 w-full px-3 sm:px-4 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0 z-20">
            {/* Left: Search architecture input */}
            <div className="relative w-56 sm:w-72">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, services..."
                className="w-full h-8 pl-8 pr-10 rounded-md bg-background border border-border text-foreground text-xs font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono text-muted-foreground pointer-events-none">
                ⌘K
              </kbd>

              {/* Search suggestions dropdown */}
              {searchQuery.trim() && (
                <div className="absolute top-9 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-30 overflow-hidden divide-y divide-border">
                  {filteredNodes.length > 0 ? (
                    filteredNodes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNodeId(n.id);
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-secondary cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-foreground">{n.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{n.tech}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground text-center font-mono">
                      No matching architecture components
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center: View Toggles */}
            <div className="hidden md:flex items-center p-0.5 rounded-lg bg-background border border-border text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveView('logical')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeView === 'logical'
                    ? 'bg-secondary text-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Logical View
              </button>
              <button
                type="button"
                onClick={() => setActiveView('dataflow')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeView === 'dataflow'
                    ? 'bg-secondary text-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Data Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveView('deptree')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeView === 'deptree'
                    ? 'bg-secondary text-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dependency Tree
              </button>
            </div>

            {/* Right: Zoom & Graph controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-md border border-border bg-background">
                <button
                  type="button"
                  onClick={() => handleZoom(10)}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-l-md transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] font-mono text-muted-foreground border-x border-border">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(-10)}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-r-md transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetZoom}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Canvas Area + Inspector Layout */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Interactive Graph Canvas */}
            <div className="flex-1 relative overflow-auto p-4 sm:p-8 flex items-center justify-center bg-background/50 min-h-110">
              {/* Scalable Container */}
              <div
                className="relative transition-transform duration-200 ease-out origin-center w-full max-w-200 h-130 my-auto"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                {/* SVG Connector Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker
                      id="arch-arrow"
                      markerHeight="6"
                      markerWidth="6"
                      orient="auto-start-reverse"
                      refX="5"
                      refY="5"
                      viewBox="0 0 10 10"
                    >
                      <path d="M 0 1.5 L 5 5 L 0 8.5 z" fill="currentColor" className="text-muted-foreground" />
                    </marker>
                    <marker
                      id="arch-arrow-active"
                      markerHeight="6"
                      markerWidth="6"
                      orient="auto-start-reverse"
                      refX="5"
                      refY="5"
                      viewBox="0 0 10 10"
                    >
                      <path d="M 0 1.5 L 5 5 L 0 8.5 z" fill="currentColor" className="text-primary" />
                    </marker>
                  </defs>

                  {/* 1. Frontend to API Layer */}
                  <path
                    d="M 400 95 L 400 155"
                    fill="none"
                    markerEnd="url(#arch-arrow)"
                    stroke="currentColor"
                    strokeDasharray={activeView === 'dataflow' ? '4 4' : '3 3'}
                    strokeWidth="1.5"
                    className="text-border"
                  />

                  {/* 2. API Layer to Auth Service */}
                  <path
                    d="M 330 220 L 220 280"
                    fill="none"
                    markerEnd={selectedNodeId === 'api-layer' || selectedNodeId === 'auth-service' ? 'url(#arch-arrow-active)' : 'url(#arch-arrow)'}
                    stroke="currentColor"
                    strokeWidth={selectedNodeId === 'api-layer' || selectedNodeId === 'auth-service' ? '2' : '1.5'}
                    className={selectedNodeId === 'api-layer' || selectedNodeId === 'auth-service' ? 'text-primary' : 'text-border'}
                  />

                  {/* 3. API Layer to Event Service */}
                  <path
                    d="M 470 220 L 580 280"
                    fill="none"
                    markerEnd={selectedNodeId === 'api-layer' || selectedNodeId === 'event-service' ? 'url(#arch-arrow-active)' : 'url(#arch-arrow)'}
                    stroke="currentColor"
                    strokeWidth={selectedNodeId === 'api-layer' || selectedNodeId === 'event-service' ? '2' : '1.5'}
                    className={selectedNodeId === 'api-layer' || selectedNodeId === 'event-service' ? 'text-primary' : 'text-border'}
                  />

                  {/* 4. Auth Service to Database */}
                  <path
                    d="M 220 355 L 340 430"
                    fill="none"
                    markerEnd="url(#arch-arrow)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-border"
                  />

                  {/* 5. Event Service to Database */}
                  <path
                    d="M 580 355 L 460 430"
                    fill="none"
                    markerEnd="url(#arch-arrow)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-border"
                  />

                  {/* 6. Event Service to Queue Worker */}
                  <path
                    d="M 670 320 L 720 320"
                    fill="none"
                    markerEnd="url(#arch-arrow)"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    className="text-border"
                  />
                </svg>

                {/* NODE 1: Frontend (Top) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('frontend');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute left-1/2 -translate-x-1/2 top-2 w-64 sm:w-72 rounded-lg border p-3 transition-all cursor-pointer shadow-xs ${
                    selectedNodeId === 'frontend'
                      ? 'bg-card border-2 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground border border-border">
                      Application
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">Port 5173</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderNodeIcon('client', selectedNodeId === 'frontend')}
                    <span className="text-sm font-semibold text-foreground">Frontend</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    Client application (Vite SPA · React 18 · TS)
                  </p>
                </div>

                {/* NODE 2: API Layer (Center) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('api-layer');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute left-1/2 -translate-x-1/2 top-36 w-72 sm:w-80 rounded-lg border p-3.5 transition-all cursor-pointer shadow-md ${
                    selectedNodeId === 'api-layer'
                      ? 'bg-card border-2 border-primary ring-4 ring-primary/10 shadow-xl'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary text-primary-foreground font-medium">
                      Gateway / API
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
                      <span className="text-[11px] font-mono text-muted-foreground">Port 8000</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderNodeIcon('gateway', selectedNodeId === 'api-layer')}
                      <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                        API Layer
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-foreground px-1.5 py-0.5 rounded bg-secondary border border-border">
                      FastAPI
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    HTTP endpoints, CORS &amp; schema validation via Pydantic
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Selected Focus</span>
                    <span className="text-foreground font-medium flex items-center gap-1">
                      Inspector Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* NODE 3: Auth Service (Left Branch) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('auth-service');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute left-2 sm:left-6 top-72 w-56 sm:w-64 rounded-lg border p-3 transition-all cursor-pointer shadow-xs ${
                    selectedNodeId === 'auth-service'
                      ? 'bg-card border-2 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground border border-border">
                      Service
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">src/auth/</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderNodeIcon('service', selectedNodeId === 'auth-service')}
                    <span className="text-sm font-semibold text-foreground">Auth Service</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    JWT claims, OAuth2 scopes &amp; tokens
                  </p>
                </div>

                {/* NODE 4: Event Service (Right Branch) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('event-service');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute right-24 sm:right-36 top-72 w-56 sm:w-64 rounded-lg border p-3 transition-all cursor-pointer shadow-xs ${
                    selectedNodeId === 'event-service'
                      ? 'bg-card border-2 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground border border-border">
                      Service
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">src/events/</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${selectedNodeId === 'event-service' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold text-foreground">Event Service</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    Event registration queues &amp; ticketing
                  </p>
                </div>

                {/* NODE 5: Database (Bottom Center) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('database');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute left-1/2 -translate-x-1/2 bottom-2 w-64 sm:w-72 rounded-lg border p-3 transition-all cursor-pointer shadow-xs ${
                    selectedNodeId === 'database'
                      ? 'bg-card border-2 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground border border-border">
                      Data Store
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">Port 5432</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderNodeIcon('storage', selectedNodeId === 'database')}
                    <span className="text-sm font-semibold text-foreground">Database</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    PostgreSQL 15 · SQLAlchemy ORM &amp; Alembic
                  </p>
                </div>

                {/* NODE 6: Queue Worker (Far Right) */}
                <div
                  onClick={() => {
                    setSelectedNodeId('queue-worker');
                    setIsInspectorOpen(true);
                  }}
                  className={`absolute right-0 top-72 w-36 sm:w-40 rounded-lg border border-dashed p-2.5 transition-all cursor-pointer shadow-xs ${
                    selectedNodeId === 'queue-worker'
                      ? 'bg-card border-solid border-2 border-primary ring-2 ring-primary/20'
                      : 'bg-background/80 border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1 py-0.2 rounded text-[9px] font-mono text-muted-foreground">
                      Async Task
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderNodeIcon('worker', selectedNodeId === 'queue-worker')}
                    <span className="text-xs font-medium text-foreground">Queue Worker</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    Celery + Redis bus
                  </p>
                </div>
              </div>

              {/* Bottom Left: Graph Legend */}
              <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2.5 z-20 text-xs shadow-xs hidden sm:block">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Architecture Taxonomy
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-primary"></span>
                    <span>Application</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-muted-foreground"></span>
                    <span>Gateway / API</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-secondary border border-border"></span>
                    <span>Service</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-card border border-border"></span>
                    <span>Data Store</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Component Details (Inspector Sidebar) */}
            {isInspectorOpen && (
              <aside className="w-full lg:w-90 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col shrink-0 z-20 overflow-y-auto max-h-125 lg:max-h-none">
                {/* Panel Header */}
                <div className="p-4 border-b border-border bg-secondary/60 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card text-foreground border border-border">
                        {selectedNode.tech}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Analyzed
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">
                      {selectedNode.name}
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground">{selectedNode.location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInspectorOpen(false)}
                    className="w-7 h-7 rounded hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                    title="Close Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-5 text-xs sm:text-[13px] flex-1">
                  {/* Purpose Section */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Module Purpose
                    </label>
                    <p className="text-muted-foreground leading-relaxed">{selectedNode.purpose}</p>
                  </div>

                  {/* Important Files */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        Important Files
                      </label>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {selectedNode.importantFiles.length} detected
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      {selectedNode.importantFiles.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-2 rounded bg-background border border-border hover:border-foreground/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{file.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupling / Dependencies */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">
                      Topology Coupling
                    </label>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded bg-background border border-border">
                        <span className="text-muted-foreground block mb-1 text-[11px]">
                          Incoming Connections (Ingress)
                        </span>
                        <div className="flex flex-col gap-1">
                          {selectedNode.ingress.map((item) => (
                            <div key={item} className="flex items-center gap-1.5 text-foreground font-medium">
                              <ArrowDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedNode.egress.length > 0 && (
                        <div className="p-2.5 rounded bg-background border border-border">
                          <span className="text-muted-foreground block mb-1 text-[11px]">
                            Outgoing Calls (Egress)
                          </span>
                          <ul className="space-y-1 text-foreground">
                            {selectedNode.egress.map((item) => (
                              <li key={item.name} className="flex items-center gap-1.5">
                                <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {item.name} <span className="text-muted-foreground font-normal">({item.note})</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Related REST APIs */}
                  {selectedNode.routes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Exported HTTP Routes
                        </label>
                        <span className="text-[11px] font-mono text-muted-foreground">v1 schema</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {selectedNode.routes.map((rt) => (
                          <div
                            key={rt.path + rt.method}
                            className="flex items-center justify-between p-1.5 rounded bg-background border border-border"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`px-1.5 py-0.2 rounded font-semibold text-[9px] border ${
                                  rt.method === 'GET'
                                    ? 'bg-secondary text-foreground border-border'
                                    : 'bg-card text-foreground border-border'
                                }`}
                              >
                                {rt.method}
                              </span>
                              <span className="text-foreground truncate">{rt.path}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{rt.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions inside sidebar */}
                <div className="p-3 border-t border-border bg-secondary/40 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className="w-full py-1.5 px-3 rounded-md bg-secondary border border-border hover:border-foreground/30 text-foreground font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Module Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1 text-center text-muted-foreground hover:text-foreground text-xs font-mono transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Open in GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Repository Context Strip */}
        <div className="w-full p-3 px-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase text-[10px]">Location:</span>
            <span className="px-2 py-0.5 rounded bg-secondary border border-border text-foreground font-medium">
              {selectedNode.location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase text-[10px]">Files:</span>
            <span className="text-foreground font-medium">{selectedNode.filesCount} files</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase text-[10px]">Dependencies:</span>
            <span className="text-foreground">{selectedNode.dependenciesCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase text-[10px]">Endpoints:</span>
            <span className="text-foreground">{selectedNode.endpointsCount}</span>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border pt-1 sm:pt-0 sm:pl-3 text-muted-foreground">
            <GitCommit className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>main ({commitHash})</span>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="w-full pt-1 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span>Graph verified: CampusConnect event-driven modular monolith topology.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground hidden md:block">
              Step 1 of 6: Architecture verification ready
            </span>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-xs sm:text-[13px] hover:opacity-90 transition-opacity shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
