import type { Repository, AnalysisData } from '../types';
import { RECENT_REPOSITORIES, DEMO_ANALYSIS_DATA } from '../data/mockData';

export const repositoryService = {
  getRecentRepositories: async (): Promise<Repository[]> => {
    return Promise.resolve([...RECENT_REPOSITORIES]);
  },

  getAnalysisData: async (): Promise<AnalysisData> => {
    return Promise.resolve({ ...DEMO_ANALYSIS_DATA });
  },

  connectRepositoryUrl: async (url: string): Promise<{ success: boolean; repoId: string }> => {
    return Promise.resolve({
      success: true,
      repoId: url.includes('campus') ? 'campusconnect' : 'campusconnect',
    });
  },
};
