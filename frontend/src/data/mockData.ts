import type { Repository, AnalysisData } from '../types';

export const RECENT_REPOSITORIES: Repository[] = [
  {
    id: 'campusconnect',
    name: 'CampusConnect',
    branch: 'main',
    url: 'https://github.com/example/campus-connect',
    stack: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL'],
    lastAnalyzed: 'Analyzed 2h ago',
  },
  {
    id: 'openstore',
    name: 'OpenStore',
    branch: 'production',
    url: 'https://github.com/example/openstore',
    stack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
    lastAnalyzed: 'Analyzed yesterday',
  },
  {
    id: 'cloudmesh',
    name: 'CloudMesh-Core',
    branch: 'dev',
    url: 'https://github.com/example/cloudmesh',
    stack: ['Go', 'gRPC', 'Kubernetes', 'Redis'],
    lastAnalyzed: 'Analyzed 3d ago',
  },
];

export const DEMO_ANALYSIS_DATA: AnalysisData = {
  repository: RECENT_REPOSITORIES[0],
  progress: 68,
  stages: [
    {
      id: 'stage-1',
      title: 'Repository structure',
      detail: '42 files · 8 directories',
      status: 'completed',
    },
    {
      id: 'stage-2',
      title: 'Technology & dependencies',
      detail: '12 dependencies identified',
      status: 'completed',
    },
    {
      id: 'stage-3',
      title: 'Application architecture',
      detail: 'Frontend → API → Services → Database',
      status: 'completed',
    },
    {
      id: 'stage-4',
      title: 'API & data flow',
      detail: 'Mapping endpoints and their relationships...',
      status: 'analyzing',
    },
    {
      id: 'stage-5',
      title: 'Authentication & security',
      detail: 'JWT & session policy discovery',
      status: 'pending',
    },
    {
      id: 'stage-6',
      title: 'Testing & development workflow',
      detail: 'Pytest & Vitest suite configurations',
      status: 'pending',
    },
  ],
  logs: [
    {
      id: 'log-1',
      title: 'Scanning project structure',
      detail: 'Discovered directory tree root',
      timestamp: '42s ago',
      status: 'completed',
    },
    {
      id: 'log-2',
      title: 'Identified application entry points',
      detail: 'src/main.py, app/page.tsx',
      timestamp: '35s ago',
      status: 'completed',
    },
    {
      id: 'log-3',
      title: 'Reading package dependencies',
      detail: 'fastapi, uvicorn, pydantic, react',
      timestamp: '28s ago',
      status: 'completed',
    },
    {
      id: 'log-4',
      title: 'Mapping API routes',
      detail: 'GET /api/v1/users, POST /api/v1/auth',
      timestamp: '12s ago',
      status: 'active',
    },
    {
      id: 'log-5',
      title: 'Inspecting database models',
      detail: 'User, Session, Campus, Enrollment',
      timestamp: 'Queued',
      status: 'queued',
    },
    {
      id: 'log-6',
      title: 'Tracing authentication flow',
      detail: 'Session cookies & Bearer schemas',
      timestamp: 'Queued',
      status: 'queued',
    },
  ],
  metrics: [
    {
      id: 'files',
      label: 'Files analyzed',
      value: 42,
      detail: '+14 parsed in this run',
      icon: 'files',
    },
    {
      id: 'modules',
      label: 'Modules detected',
      value: 8,
      detail: 'Boundaries inferred',
      icon: 'modules',
    },
    {
      id: 'routes',
      label: 'API routes',
      value: 18,
      detail: 'RESTful endpoints',
      icon: 'routes',
    },
    {
      id: 'models',
      label: 'Database models',
      value: 9,
      detail: 'SQLAlchemy schemas',
      icon: 'models',
    },
  ],
  daemonChannel: '#analysis-daemon-01',
  daemonLatency: '14ms',
};
