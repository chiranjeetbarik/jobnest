// Note: MongoDB connection is not available in browser environment
// Using fallback data for development

// Fallback stats for when database is not available (updated for 42+ jobs)
const fallbackStats = {
  totalJobs: 42,
  recentJobs: 15, // Jobs from last 24 hours
  jobsWithSalary: 42, // All our fallback jobs have salary
  salaryPercentage: 100,
  sources: {
    'Indeed': 15,
    'RemoteOK': 12,
    'Glassdoor': 15
  },
  topCompanies: [
    { name: 'TechCorp Inc.', count: 1 },
    { name: 'DataFlow Analytics', count: 1 },
    { name: 'GrowthCo', count: 1 },
    { name: 'DesignStudio Pro', count: 1 },
    { name: 'StartupXYZ', count: 1 },
    { name: 'AI Innovations', count: 1 },
    { name: 'CloudTech Solutions', count: 1 },
    { name: 'InnovateCorp', count: 1 },
    { name: 'WebTech Solutions', count: 1 },
    { name: 'ServerPro Inc.', count: 1 }
  ],
  topLocations: [
    { name: 'Bangalore, India', count: 6 },
    { name: 'Mumbai, India', count: 5 },
    { name: 'Hyderabad, India', count: 4 },
    { name: 'Pune, India', count: 3 },
    { name: 'Chennai, India', count: 3 },
    { name: 'Delhi, India', count: 3 },
    { name: 'Remote', count: 4 },
    { name: 'Gurgaon, India', count: 1 },
    { name: 'Noida, India', count: 1 }
  ]
};

export async function fetchStats() {
  // For development, always use fallback data since MongoDB can't run in browser
  console.log('Using fallback stats data for development');
  return fallbackStats;
}
