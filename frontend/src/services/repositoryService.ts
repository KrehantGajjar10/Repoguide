import type {
  Repository,
  AnalysisData,
  ProjectOverviewData,
  ArchitectureData,
  OnboardingJourneyData,
  TaskVerificationData,
  CompletionReportData,
} from '../types';
import {
  RECENT_REPOSITORIES,
  DEMO_ANALYSIS_DATA,
  DEMO_PROJECT_OVERVIEW_DATA,
  DEMO_ARCHITECTURE_DATA,
  DEMO_ONBOARDING_JOURNEY,
  DEMO_TASK_VERIFICATION,
  DEMO_COMPLETION_REPORT,
} from '../data/mockData';

// ---------------------------------------------------------------------------
// Backend API client
// ---------------------------------------------------------------------------
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export interface BackendRepository {
  id: string;
  url: string;
  name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BackendErrorDetail {
  status: string;
  message: string;
}

interface BackendValidationError {
  detail: { msg: string }[] | BackendErrorDetail;
}

async function apiFetch<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const err = (await response.json()) as BackendValidationError;
      if (Array.isArray(err.detail)) {
        message = err.detail.map((d) => d.msg).join('; ');
      } else if (err.detail && typeof err.detail === 'object' && 'message' in err.detail) {
        message = (err.detail as BackendErrorDetail).message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>('POST', path, body);
}

function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>('GET', path);
}

// ---------------------------------------------------------------------------
// Backend analysis types
// ---------------------------------------------------------------------------
export interface BackendAnalysisStatus {
  repository_id: string;
  status: string;
  progress: number;
  message: string;
  file_count: number | null;
  directory_count: number | null;
  technologies: string[] | null;
  top_level_dirs: string[] | null;
  extension_counts: Record<string, number> | null;
  default_branch: string | null;
  repository_name: string | null;
  repository_url: string | null;
  analysis_started_at: string | null;
  analysis_completed_at: string | null;
  error_message: string | null;
}

export const repositoryService = {
  getRecentRepositories: async (): Promise<Repository[]> => {
    return Promise.resolve([...RECENT_REPOSITORIES]);
  },

  getCompletionReport: async (): Promise<CompletionReportData> => {
    return Promise.resolve({ ...DEMO_COMPLETION_REPORT });
  },

  getAnalysisData: async (): Promise<AnalysisData> => {
    return Promise.resolve({ ...DEMO_ANALYSIS_DATA });
  },

  getProjectOverview: async (): Promise<ProjectOverviewData> => {
    return Promise.resolve({ ...DEMO_PROJECT_OVERVIEW_DATA });
  },

  getArchitectureData: async (): Promise<ArchitectureData> => {
    return Promise.resolve({ ...DEMO_ARCHITECTURE_DATA });
  },

  getOnboardingJourney: async (): Promise<OnboardingJourneyData> => {
    return Promise.resolve({ ...DEMO_ONBOARDING_JOURNEY });
  },

  getTaskVerificationData: async (taskId?: string): Promise<TaskVerificationData> => {
    void taskId;
    return Promise.resolve({ ...DEMO_TASK_VERIFICATION });
  },

  verifyTaskAnswer: async (
    taskId: string,
    answer: string
  ): Promise<{
    status: 'verified' | 'review';
    score: string;
    title: string;
    subtitle: string;
    checklist: { label: string; verified: boolean }[];
    feedback: string;
  }> => {
    void taskId;
    // Deterministic client-side evaluation based on key architectural concepts
    const lower = answer.toLowerCase();
    const hasFrontend =
      lower.includes('frontend') ||
      lower.includes('events.ts') ||
      lower.includes('client') ||
      lower.includes('registerforevent');
    const hasRoute =
      lower.includes('fastapi') ||
      lower.includes('route') ||
      lower.includes('events.py') ||
      lower.includes('post') ||
      lower.includes('endpoint');
    const hasService =
      lower.includes('event_service') ||
      lower.includes('eventservice') ||
      lower.includes('service') ||
      lower.includes('capacity') ||
      lower.includes('business');
    const hasDatabase =
      lower.includes('model') ||
      lower.includes('event.py') ||
      lower.includes('postgresql') ||
      lower.includes('sqlalchemy') ||
      lower.includes('eventattendee') ||
      lower.includes('database') ||
      lower.includes('persist');

    const allVerified = hasFrontend && hasRoute && hasService && hasDatabase;

    if (allVerified) {
      return Promise.resolve({
        status: 'verified',
        score: '100% Score',
        title: 'Understanding verified',
        subtitle:
          'Your explanation correctly identified the major components involved in the request flow.',
        checklist: [
          { label: 'Frontend request', verified: true },
          { label: 'API route', verified: true },
          { label: 'Service layer', verified: true },
          { label: 'Database model', verified: true },
        ],
        feedback:
          'You cleanly traced how API contracts decouple client state from backend business logic in event_service.py and identified the atomic persistence cycle in the PostgreSQL model layer.',
      });
    }

    return Promise.resolve({
      status: 'review',
      score: 'Partial',
      title: 'Almost there — needs clarification',
      subtitle:
        'Your trace captures the frontend and HTTP router, but omits the core service layer transaction.',
      checklist: [
        { label: 'Frontend request', verified: hasFrontend },
        { label: 'API route', verified: hasRoute },
        { label: 'Missing: Service logic', verified: hasService },
        { label: 'Missing: DB model commit', verified: hasDatabase },
      ],
      feedback:
        'Make sure to mention app/services/event_service.py where capacity validation occurs prior to writing to app/models/event.py.',
    });
  },

  connectRepositoryUrl: async (url: string): Promise<{ success: boolean; repoId: string }> => {
    const repo = await apiPost<BackendRepository>('/api/v1/repositories', { url });
    return { success: true, repoId: repo.id };
  },

  startAnalysis: async (repoId: string): Promise<{ status: string; message: string }> => {
    const result = await apiPost<{ repository_id: string; status: string; message: string }>(
      `/api/v1/repositories/${repoId}/analyze`,
      {}
    );
    return { status: result.status, message: result.message };
  },

  getAnalysisStatus: async (repoId: string): Promise<BackendAnalysisStatus> => {
    return apiGet<BackendAnalysisStatus>(`/api/v1/repositories/${repoId}/analysis`);
  },
};

