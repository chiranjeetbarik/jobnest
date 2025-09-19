import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface JobActionsContextType {
  savedJobs: Job[];
  appliedJobs: Job[];
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  applyToJob: (job: Job) => void;
  isJobSaved: (jobId: string) => boolean;
  isJobApplied: (jobId: string) => boolean;
}

const JobActionsContext = createContext<JobActionsContextType | undefined>(undefined);

export const useJobActions = () => {
  const context = useContext(JobActionsContext);
  if (!context) {
    throw new Error('useJobActions must be used within a JobActionsProvider');
  }
  return context;
};

export const JobActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedJobsData = localStorage.getItem('jobnest-saved-jobs');
    const appliedJobsData = localStorage.getItem('jobnest-applied-jobs');
    
    if (savedJobsData) {
      try {
        setSavedJobs(JSON.parse(savedJobsData));
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      }
    }
    
    if (appliedJobsData) {
      try {
        setAppliedJobs(JSON.parse(appliedJobsData));
      } catch (error) {
        console.error('Error loading applied jobs:', error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('jobnest-saved-jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem('jobnest-applied-jobs', JSON.stringify(appliedJobs));
  }, [appliedJobs]);

  const saveJob = (job: Job) => {
    setSavedJobs(prev => {
      const exists = prev.find(j => j.id === job.id);
      if (exists) return prev;
      return [...prev, job];
    });
  };

  const unsaveJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const applyToJob = (job: Job) => {
    setAppliedJobs(prev => {
      const exists = prev.find(j => j.id === job.id);
      if (exists) return prev;
      return [...prev, { ...job, appliedAt: new Date().toISOString() }];
    });
  };

  const isJobSaved = (jobId: string) => {
    return savedJobs.some(job => job.id === jobId);
  };

  const isJobApplied = (jobId: string) => {
    return appliedJobs.some(job => job.id === jobId);
  };

  const value = {
    savedJobs,
    appliedJobs,
    saveJob,
    unsaveJob,
    applyToJob,
    isJobSaved,
    isJobApplied,
  };

  return (
    <JobActionsContext.Provider value={value}>
      {children}
    </JobActionsContext.Provider>
  );
};
