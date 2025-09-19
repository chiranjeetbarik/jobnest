// Note: MongoDB connection is not available in browser environment
// Using fallback data for development

// Expanded fallback data with 50+ jobs across all categories
const fallbackJobs = [
  // Software Development Jobs (15 jobs)
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=example1',
    salary: '$120k - $160k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'React Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/react-dev',
    salary: '$70k - $100k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '7',
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=example7',
    salary: '$85k - $115k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '9',
    title: 'Frontend Developer',
    company: 'WebTech Solutions',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/frontend-dev',
    salary: '$60k - $90k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10',
    title: 'Backend Developer',
    company: 'ServerPro Inc.',
    location: 'Hyderabad, India',
    jobUrl: 'https://indeed.com/viewjob?jk=backend10',
    salary: '$75k - $105k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '11',
    title: 'Node.js Developer',
    company: 'APIFirst Corp',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/nodejs-dev',
    salary: '$80k - $110k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '12',
    title: 'Python Developer',
    company: 'DataCorp Solutions',
    location: 'Chennai, India',
    jobUrl: 'https://glassdoor.com/job/python-dev',
    salary: '$70k - $95k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '13',
    title: 'Java Developer',
    company: 'Enterprise Systems',
    location: 'Pune, India',
    jobUrl: 'https://indeed.com/viewjob?jk=java13',
    salary: '$85k - $120k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '14',
    title: 'Mobile App Developer',
    company: 'MobileTech Inc.',
    location: 'Bangalore, India',
    jobUrl: 'https://glassdoor.com/job/mobile-dev',
    salary: '$75k - $105k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '15',
    title: 'Software Engineer',
    company: 'CodeCraft Ltd.',
    location: 'Delhi, India',
    jobUrl: 'https://remoteok.io/remote-jobs/software-eng',
    salary: '$65k - $95k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '16',
    title: 'Angular Developer',
    company: 'FrontendPro',
    location: 'Noida, India',
    jobUrl: 'https://indeed.com/viewjob?jk=angular16',
    salary: '$70k - $100k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '17',
    title: 'Vue.js Developer',
    company: 'ModernWeb Co.',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/vuejs-dev',
    salary: '$68k - $98k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '18',
    title: 'Full Stack Engineer',
    company: 'TechStack Solutions',
    location: 'Gurgaon, India',
    jobUrl: 'https://glassdoor.com/job/fullstack18',
    salary: '$90k - $130k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '19',
    title: 'Software Architect',
    company: 'ArchTech Corp',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=architect19',
    salary: '$140k - $180k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '20',
    title: 'Lead Developer',
    company: 'DevLead Inc.',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/lead-dev20',
    salary: '$110k - $150k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  },

  // Data Science & AI Jobs (10 jobs)
  {
    id: '2',
    title: 'Machine Learning Engineer',
    company: 'DataFlow Analytics',
    location: 'Hyderabad, India',
    jobUrl: 'https://remoteok.io/remote-jobs/ml-engineer',
    salary: '$100k - $140k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    title: 'Data Scientist',
    company: 'AI Innovations',
    location: 'Chennai, India',
    jobUrl: 'https://glassdoor.com/job/data-scientist',
    salary: '$95k - $125k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '21',
    title: 'AI Research Scientist',
    company: 'DeepMind Labs',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=ai21',
    salary: '$130k - $170k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '43',
    title: 'Machine Learning Engineer',
    company: 'ML Tech Bangalore',
    location: 'Bangalore, India',
    jobUrl: 'https://glassdoor.com/job/ml-bangalore43',
    salary: '$105k - $135k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '44',
    title: 'Senior Machine Learning Engineer',
    company: 'AI Bangalore Corp',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=ml-senior44',
    salary: '$120k - $160k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '22',
    title: 'Data Analyst',
    company: 'Analytics Pro',
    location: 'Pune, India',
    jobUrl: 'https://glassdoor.com/job/data-analyst22',
    salary: '$60k - $85k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '23',
    title: 'ML Ops Engineer',
    company: 'MLFlow Systems',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/mlops23',
    salary: '$105k - $135k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '24',
    title: 'Computer Vision Engineer',
    company: 'VisionTech AI',
    location: 'Hyderabad, India',
    jobUrl: 'https://indeed.com/viewjob?jk=cv24',
    salary: '$115k - $145k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '25',
    title: 'NLP Engineer',
    company: 'Language AI Corp',
    location: 'Chennai, India',
    jobUrl: 'https://glassdoor.com/job/nlp25',
    salary: '$110k - $140k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '26',
    title: 'Data Engineer',
    company: 'BigData Solutions',
    location: 'Mumbai, India',
    jobUrl: 'https://remoteok.io/remote-jobs/data-eng26',
    salary: '$90k - $120k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '27',
    title: 'Business Intelligence Analyst',
    company: 'BI Analytics Inc.',
    location: 'Delhi, India',
    jobUrl: 'https://indeed.com/viewjob?jk=bi27',
    salary: '$70k - $95k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '28',
    title: 'Deep Learning Researcher',
    company: 'Neural Networks Lab',
    location: 'Bangalore, India',
    jobUrl: 'https://glassdoor.com/job/dl28',
    salary: '$125k - $165k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  },

  // Marketing & Sales Jobs (8 jobs)
  {
    id: '3',
    title: 'Digital Marketing Manager',
    company: 'GrowthCo',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/marketing-manager',
    salary: '$80k - $120k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '29',
    title: 'SEO Specialist',
    company: 'SearchPro Marketing',
    location: 'Delhi, India',
    jobUrl: 'https://indeed.com/viewjob?jk=seo29',
    salary: '$45k - $65k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '30',
    title: 'Content Marketing Manager',
    company: 'ContentCorp',
    location: 'Pune, India',
    jobUrl: 'https://glassdoor.com/job/content30',
    salary: '$60k - $85k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '31',
    title: 'Social Media Manager',
    company: 'SocialBuzz Agency',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/social31',
    salary: '$50k - $75k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '32',
    title: 'Sales Manager',
    company: 'SalesPro Inc.',
    location: 'Bangalore, India',
    jobUrl: 'https://indeed.com/viewjob?jk=sales32',
    salary: '$70k - $100k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '33',
    title: 'Performance Marketing Specialist',
    company: 'AdTech Solutions',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/perf33',
    salary: '$65k - $90k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '34',
    title: 'Email Marketing Manager',
    company: 'MailCorp',
    location: 'Chennai, India',
    jobUrl: 'https://remoteok.io/remote-jobs/email34',
    salary: '$55k - $80k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '35',
    title: 'Business Development Manager',
    company: 'BizDev Corp',
    location: 'Hyderabad, India',
    jobUrl: 'https://indeed.com/viewjob?jk=bizdev35',
    salary: '$75k - $105k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString()
  },

  // Design & Creative Jobs (8 jobs)
  {
    id: '4',
    title: 'Senior UX/UI Designer',
    company: 'DesignStudio Pro',
    location: 'Pune, India',
    jobUrl: 'https://indeed.com/viewjob?jk=example4',
    salary: '$90k - $130k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '36',
    title: 'Graphic Designer',
    company: 'CreativeWorks',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/graphic36',
    salary: '$40k - $60k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '37',
    title: 'Product Designer',
    company: 'ProductDesign Co.',
    location: 'Bangalore, India',
    jobUrl: 'https://remoteok.io/remote-jobs/product37',
    salary: '$85k - $115k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '38',
    title: 'Web Designer',
    company: 'WebDesign Studio',
    location: 'Delhi, India',
    jobUrl: 'https://indeed.com/viewjob?jk=web38',
    salary: '$50k - $75k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '39',
    title: 'Motion Graphics Designer',
    company: 'MotionCorp',
    location: 'Chennai, India',
    jobUrl: 'https://glassdoor.com/job/motion39',
    salary: '$60k - $85k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '40',
    title: 'Brand Designer',
    company: 'BrandCraft Agency',
    location: 'Remote',
    jobUrl: 'https://remoteok.io/remote-jobs/brand40',
    salary: '$70k - $95k',
    source: 'RemoteOK',
    scrapedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '41',
    title: 'Interaction Designer',
    company: 'InteractiveDesign Ltd.',
    location: 'Hyderabad, India',
    jobUrl: 'https://indeed.com/viewjob?jk=interact41',
    salary: '$80k - $110k',
    source: 'Indeed',
    scrapedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '42',
    title: 'Creative Director',
    company: 'Creative Solutions Inc.',
    location: 'Mumbai, India',
    jobUrl: 'https://glassdoor.com/job/creative42',
    salary: '$120k - $160k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
  },

  // Product Manager
  {
    id: '8',
    title: 'Product Manager',
    company: 'InnovateCorp',
    location: 'Delhi, India',
    jobUrl: 'https://glassdoor.com/job/product-manager',
    salary: '$110k - $150k',
    source: 'Glassdoor',
    scrapedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function fetchJobs(params: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  source?: string;
  usePreferences?: boolean;
  preferences?: any;
} = {}) {
  // For development, always use fallback data since MongoDB can't run in browser
  console.log('fetchJobs called with params:', params);
  
  const { page = 1, limit = 20, search = '', location = '', source = '', usePreferences = false, preferences } = params;
  
  let filteredJobs = [...fallbackJobs];
  console.log('Initial jobs count:', filteredJobs.length);

  // Apply preferences filtering if enabled
  if (usePreferences && preferences) {
    console.log('Applying preferences filtering:', preferences);
    
    // Filter by preferred categories
    if (preferences.preferredCategories?.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        return preferences.preferredCategories.some((category: string) => {
          const categoryKeywords: Record<string, string[]> = {
            "Software Development": ["developer", "software", "engineer", "programming", "frontend", "backend", "fullstack", "react", "node", "python", "java"],
            "Data Science & AI": ["data scientist", "machine learning", "AI", "artificial intelligence", "data analyst", "data engineer", "ML engineer"],
            "Marketing & Sales": ["marketing", "sales", "digital marketing", "marketing manager", "sales manager"],
            "Design & Creative": ["designer", "UX", "UI", "graphic", "creative", "design"],
            "Product Management": ["product manager", "product", "PM"]
          };
          
          const keywords = categoryKeywords[category] || [category.toLowerCase()];
          return keywords.some(keyword => 
            job.title.toLowerCase().includes(keyword.toLowerCase())
          );
        });
      });
      console.log('After category filter:', filteredJobs.length);
    }

    // Filter by preferred locations
    if (preferences.preferredLocations?.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        preferences.preferredLocations.some((loc: string) => 
          job.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
      console.log('After location preferences filter:', filteredJobs.length);
    }

    // Filter by remote work preference
    if (preferences.remoteWork) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes('remote')
      );
      console.log('After remote work filter:', filteredJobs.length);
    }

    // Filter by salary range
    if (preferences.minSalary > 0 || preferences.maxSalary < 1000000) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.salary) return false;
        
        // Extract salary numbers from string like "$70k - $100k"
        const salaryMatch = job.salary.match(/\$?(\d+)k?\s*-\s*\$?(\d+)k?/);
        if (salaryMatch) {
          const minJobSalary = parseInt(salaryMatch[1]) * (salaryMatch[1].length <= 2 ? 1000 : 1);
          const maxJobSalary = parseInt(salaryMatch[2]) * (salaryMatch[2].length <= 2 ? 1000 : 1);
          
          return maxJobSalary >= preferences.minSalary && minJobSalary <= preferences.maxSalary;
        }
        return true;
      });
      console.log('After salary filter:', filteredJobs.length);
    }

    // Filter by required skills
    if (preferences.requiredSkills?.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        preferences.requiredSkills.some((skill: string) => 
          job.title.toLowerCase().includes(skill.toLowerCase())
        )
      );
      console.log('After required skills filter:', filteredJobs.length);
    }

    // Exclude jobs with unwanted keywords
    if (preferences.excludeKeywords?.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        !preferences.excludeKeywords.some((keyword: string) => 
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.company.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      console.log('After exclude keywords filter:', filteredJobs.length);
    }

    // Filter by preferred sources
    if (preferences.preferredSources?.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        preferences.preferredSources.includes(job.source)
      );
      console.log('After preferred sources filter:', filteredJobs.length);
    }
  }
  
  // Apply search filter - handle multiple search terms and partial matches
  if (search) {
    const searchLower = search.toLowerCase();
    console.log('Searching for:', searchLower);
    
    filteredJobs = filteredJobs.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(searchLower);
      const companyMatch = job.company.toLowerCase().includes(searchLower);
      
      // Also check individual words
      const searchWords = searchLower.split(' ');
      const wordMatch = searchWords.every(word => 
        job.title.toLowerCase().includes(word) || 
        job.company.toLowerCase().includes(word)
      );
      
      return titleMatch || companyMatch || wordMatch;
    });
    
    console.log('After search filter:', filteredJobs.length);
  }
  
  // Apply location filter
  if (location) {
    console.log('Filtering by location:', location);
    const locationLower = location.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(locationLower)
    );
    console.log('After location filter:', filteredJobs.length);
  }
  
  // Apply source filter
  if (source) {
    filteredJobs = filteredJobs.filter(job => job.source === source);
  }
  
  // Apply pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(filteredJobs.length / limitNum);
  
  console.log('Final result:', {
    totalJobs: filteredJobs.length,
    paginatedJobs: paginatedJobs.length,
    currentPage: pageNum
  });
  
  return {
    jobs: paginatedJobs,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalJobs: filteredJobs.length,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    },
    stats: {
      'Indeed': 15,
      'RemoteOK': 12,
      'Glassdoor': 15
    }
  };
}
