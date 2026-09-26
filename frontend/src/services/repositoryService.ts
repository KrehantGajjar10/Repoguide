import type {
  Repository,
  AnalysisData,
  ProjectOverviewData,
  ArchitectureData,
} from '../types';
import {
  RECENT_REPOSITORIES,
  DEMO_ANALYSIS_DATA,
  DEMO_PROJECT_OVERVIEW_DATA,
  DEMO_ARCHITECTURE_DATA,
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

  connectRepositoryUrl: async (url: string): Promise<{ success: boolean; repoId: string }> => {
    return Promise.resolve({
      success: true,
      repoId: url.includes('campus') ? 'campusconnect' : 'campusconnect',
    });
  },
};
