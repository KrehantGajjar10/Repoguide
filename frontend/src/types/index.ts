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

export interface OnboardingTask {
  id: string;
  slug: string;
  number: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked';
  estimatedMinutes: number;
  verifiedNote?: string;
  tag?: string;
  difficulty?: string;
  category?: string;
  checkpointNote?: string;
}

export interface OnboardingJourneyData {
  repository: Repository;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  upcomingTasks: number;
  progressPercent: number;
  estimatedTotalMinutes: number;
  nextCheckpoint: string;
  currentTask: OnboardingTask;
  tasks: OnboardingTask[];
  keyFiles: { path: string; role: string }[];
  requestLifecycle: string[];
  competencies: {
    id: string;
    title: string;
    description: string;
    icon: 'architecture' | 'api' | 'data' | 'workflow';
  }[];
  checkpointPreview: string;
}

export interface PipelineStep {
  step: string;
  label: string;
  title: string;
  description: string;
  badge?: string;
  filePath: string;
  icon: 'devices' | 'router' | 'memory' | 'database';
}

export interface RelevantFileItem {
  path: string;
  lines: string;
}

export interface TaskVerificationData {
  taskId: string;
  taskNumber: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  category: string;
  overallProgress: {
    completed: number;
    total: number;
    percent: number;
  };
  branch: string;
  commitHash: string;
  pipelineSteps: PipelineStep[];
  relevantFiles: RelevantFileItem[];
  taskPrompt: string;
  hint: string;
  initialExplanation: string;
  maxCharacters: number;
  successFeedback: {
    score: string;
    title: string;
    subtitle: string;
    checklist: { label: string; verified: boolean }[];
    whatYouUnderstood: string;
  };
  reviewFeedback: {
    status: string;
    title: string;
    subtitle: string;
    checklist: { label: string; verified: boolean }[];
    diagnostic: string;
  };
}

export interface VerifiedDomain {
  id: string;
  number: string;
  title: string;
  description: string;
  tags: string;
  status: string;
}

export interface VerificationHistoryItem {
  number: string;
  title: string;
  description: string;
  duration: string;
  verified: boolean;
}

export interface CompletionReportData {
  repository: Repository;
  totalTasks: number;
  verifiedTasks: number;
  totalDuration: string;
  summaryMetrics: {
    modules: number;
    routes: number;
    models: number;
    dependencies: number;
  };
  pipeline: string[];
  domains: VerifiedDomain[];
  history: VerificationHistoryItem[];
}

