export interface Repository {
  id: string;
  name: string;
  branch: string;
  url: string;
  stack: string[];
  lastAnalyzed: string;
}

export interface AnalysisStage {
  id: string;
  title: string;
  detail: string;
  status: 'completed' | 'analyzing' | 'pending';
}

export interface AnalysisActivityLog {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  status: 'completed' | 'active' | 'queued';
}

export interface AnalysisMetric {
  id: string;
  label: string;
  value: number | string;
  detail: string;
  icon: 'files' | 'modules' | 'routes' | 'models';
}

export interface AnalysisData {
  repository: Repository;
  progress: number;
  stages: AnalysisStage[];
  logs: AnalysisActivityLog[];
  metrics: AnalysisMetric[];
  daemonChannel: string;
  daemonLatency: string;
}

export interface ProjectMetric {
  id: string;
  label: string;
  value: number | string;
  detail: string;
  icon: 'modules' | 'routes' | 'models' | 'dependencies';
}

export interface ArchitectureLayer {
  step: string;
  name: string;
  tech: string;
  runtime: string;
  port: string;
  icon: 'devices' | 'route' | 'hub' | 'database';
}

export interface TechStackGroup {
  category: string;
  icon: 'frontend' | 'backend' | 'database' | 'tooling';
  items: string[];
}

export interface KeyModule {
  id: string;
  name: string;
  path: string;
  description: string;
}

export interface FileTreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: FileTreeNode[];
}

export interface ProjectOverviewData {
  repository: Repository;
  commitHash: string;
  description: string;
  metrics: ProjectMetric[];
  architectureLayers: ArchitectureLayer[];
  techStack: TechStackGroup[];
  keyModules: KeyModule[];
  fileTree: FileTreeNode;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'client' | 'gateway' | 'service' | 'storage' | 'worker';
  badge: string;
  sublabel: string;
  tech: string;
  port?: string;
  location: string;
  filesCount: number;
  dependenciesCount: string;
  endpointsCount: string;
  purpose: string;
  importantFiles: { name: string; role: string }[];
  ingress: string[];
  egress: { name: string; note: string }[];
  routes: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; action: string }[];
  coords: { x: number; y: number };
}

export interface ArchitectureData {
  repository: Repository;
  engineSync: string;
  commitHash: string;
  nodes: ArchitectureNode[];
}
