import { useQuery } from '@tanstack/react-query';
import { fetchJobs } from '@/api/jobs';
import { fetchStats } from '@/api/stats';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  salary?: string;
  source: string;
  scrapedAt: string;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalJobs: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: Record<string, number>;
}

interface JobsParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  source?: string;
  usePreferences?: boolean;
  preferences?: any;
}

export const useJobs = (params: JobsParams = {}) => {
  console.log('useJobs called with params:', params);
  
  return useQuery({
    queryKey: ['jobs', JSON.stringify(params)],
    queryFn: async () => {
      console.log('useJobs queryFn executing with params:', params);
      try {
        const result = await fetchJobs(params);
        console.log('useJobs queryFn result:', result);
        return result;
      } catch (error) {
        console.error('useJobs queryFn error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Hook for job statistics
interface StatsResponse {
  totalJobs: number;
  recentJobs: number;
  jobsWithSalary: number;
  salaryPercentage: number;
  sources: Record<string, number>;
  topCompanies: Array<{ name: string; count: number }>;
  topLocations: Array<{ name: string; count: number }>;
}

export const useJobStats = () => {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: fetchStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
