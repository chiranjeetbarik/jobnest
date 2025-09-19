import React, { createContext, useContext, useState, useEffect } from 'react';

export interface JobPreferences {
  // Job Categories
  preferredCategories: string[];
  
  // Location Preferences
  preferredLocations: string[];
  remoteWork: boolean;
  willingToRelocate: boolean;
  
  // Salary Preferences
  minSalary: number;
  maxSalary: number;
  currency: string;
  
  // Job Type Preferences
  jobTypes: string[]; // full-time, part-time, contract, internship
  experienceLevel: string[]; // entry, mid, senior, executive
  
  // Company Preferences
  companySize: string[]; // startup, small, medium, large, enterprise
  industries: string[];
  
  // Work Preferences
  workArrangement: string[]; // onsite, hybrid, remote
  
  // Skills & Keywords
  requiredSkills: string[];
  preferredSkills: string[];
  excludeKeywords: string[];
  
  // Job Sources
  preferredSources: string[]; // Indeed, RemoteOK, Glassdoor, etc.
  
  // Notification Preferences
  emailNotifications: boolean;
  instantNotifications: boolean;
  weeklyDigest: boolean;
}

const defaultPreferences: JobPreferences = {
  preferredCategories: [],
  preferredLocations: [],
  remoteWork: false,
  willingToRelocate: false,
  minSalary: 0,
  maxSalary: 1000000,
  currency: 'USD',
  jobTypes: ['full-time'],
  experienceLevel: [],
  companySize: [],
  industries: [],
  workArrangement: [],
  requiredSkills: [],
  preferredSkills: [],
  excludeKeywords: [],
  preferredSources: ['Indeed', 'RemoteOK', 'Glassdoor'],
  emailNotifications: true,
  instantNotifications: false,
  weeklyDigest: true,
};

interface PreferencesContextType {
  preferences: JobPreferences;
  updatePreferences: (newPreferences: Partial<JobPreferences>) => void;
  resetPreferences: () => void;
  isPreferencesSet: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<JobPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('jobnest-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('jobnest-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (newPreferences: Partial<JobPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('jobnest-preferences');
  };

  // Check if user has set meaningful preferences (not just defaults)
  const isPreferencesSet = 
    preferences.preferredCategories.length > 0 ||
    preferences.preferredLocations.length > 0 ||
    preferences.requiredSkills.length > 0 ||
    preferences.minSalary > 0 ||
    preferences.experienceLevel.length > 0;

  const value = {
    preferences,
    updatePreferences,
    resetPreferences,
    isPreferencesSet,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
