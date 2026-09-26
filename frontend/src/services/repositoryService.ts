import type {
  Repository,
  AnalysisData,
  ProjectOverviewData,
  ArchitectureData,
  OnboardingJourneyData,
  TaskVerificationData,
} from '../types';
import {
  RECENT_REPOSITORIES,
  DEMO_ANALYSIS_DATA,
  DEMO_PROJECT_OVERVIEW_DATA,
  DEMO_ARCHITECTURE_DATA,
  DEMO_ONBOARDING_JOURNEY,
  DEMO_TASK_VERIFICATION,
} from '../data/mockData';

export const repositoryService = {
  getRecentRepositories: async (): Promise<Repository[]> => {
    return Promise.resolve([...RECENT_REPOSITORIES]);
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
    return Promise.resolve({
      success: true,
      repoId: url.includes('campus') ? 'campusconnect' : 'campusconnect',
    });
  },
};

