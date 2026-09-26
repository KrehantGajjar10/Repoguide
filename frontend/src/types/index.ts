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
