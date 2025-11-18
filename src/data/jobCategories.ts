export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  postedDate: string;
  featured?: boolean;
  jobUrl?: string;
}

export interface JobCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  jobCount: number;
  sampleJob: Job;
}

export const jobCategories: JobCategory[] = [
  {
    id: "software-development",
    name: "Software Development",
    icon: "Code",
    color: "bg-blue-100 text-blue-600",
    jobCount: 2847,
    sampleJob: {
      id: "1",
      title: "Senior Full Stack Developer",
      company: "TechCorp Inc.",
      location: "Bangalore, India",
      salary: "$120k - $160k",
      type: "Full-time",
      description: "We're looking for a senior full stack developer to join our growing team. You'll work on cutting-edge web applications using React, Node.js, and modern cloud technologies.",
      requirements: ["5+ years experience", "React/Node.js", "AWS/Docker", "Agile methodology"],
      postedDate: "2 days ago",
      featured: true
    }
  },
  {
    id: "data-science",
    name: "Data Science & AI",
    icon: "BarChart3",
    color: "bg-purple-100 text-purple-600",
    jobCount: 1523,
    sampleJob: {
      id: "2",
      title: "Machine Learning Engineer",
      company: "DataFlow Analytics",
      location: "Hyderabad, India",
      salary: "$130k - $180k",
      type: "Full-time",
      description: "Join our ML team to build and deploy machine learning models at scale. Work with cutting-edge AI technologies and big data platforms.",
      requirements: ["Python/R", "TensorFlow/PyTorch", "SQL", "Statistics background"],
      postedDate: "1 day ago"
    }
  },
  {
    id: "marketing",
    name: "Marketing & Sales",
    icon: "Megaphone",
    color: "bg-green-100 text-green-600",
    jobCount: 3241,
    sampleJob: {
      id: "3",
      title: "Digital Marketing Manager",
      company: "GrowthCo",
      location: "Mumbai, India",
      salary: "$75k - $95k",
      type: "Full-time",
      description: "Lead digital marketing campaigns across multiple channels. Drive user acquisition and brand awareness through innovative marketing strategies.",
      requirements: ["3+ years marketing", "Google Ads/Facebook Ads", "Analytics tools", "Content strategy"],
      postedDate: "3 days ago"
    }
  },
  {
    id: "design",
    name: "Design & Creative",
    icon: "Palette",
    color: "bg-pink-100 text-pink-600",
    jobCount: 891,
    sampleJob: {
      id: "4",
      title: "Senior UX/UI Designer",
      company: "DesignStudio Pro",
      location: "Pune, India",
      salary: "$85k - $115k",
      type: "Full-time",
      description: "Create exceptional user experiences for web and mobile applications. Collaborate with product teams to design intuitive interfaces.",
      requirements: ["Figma/Sketch", "User research", "Prototyping", "Design systems"],
      postedDate: "1 day ago"
    }
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    icon: "DollarSign",
    color: "bg-yellow-100 text-yellow-600",
    jobCount: 1876,
    sampleJob: {
      id: "5",
      title: "Financial Analyst",
      company: "InvestCorp",
      location: "Delhi, India",
      salary: "$70k - $90k",
      type: "Full-time",
      description: "Analyze financial data and market trends to support investment decisions. Prepare reports and presentations for senior management.",
      requirements: ["CFA/CPA preferred", "Excel/SQL", "Financial modeling", "Bachelor's in Finance"],
      postedDate: "2 days ago"
    }
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    icon: "Heart",
    color: "bg-red-100 text-red-600",
    jobCount: 2134,
    sampleJob: {
      id: "6",
      title: "Registered Nurse - ICU",
      company: "Metropolitan Hospital",
      location: "Chennai, India",
      salary: "$65k - $85k",
      type: "Full-time",
      description: "Provide critical care nursing in our intensive care unit. Work with a dedicated team to deliver exceptional patient care.",
      requirements: ["RN License", "ICU experience", "BLS/ACLS certified", "Bachelor's preferred"],
      postedDate: "4 days ago"
    }
  },
  {
    id: "education",
    name: "Education & Training",
    icon: "GraduationCap",
    color: "bg-indigo-100 text-indigo-600",
    jobCount: 1456,
    sampleJob: {
      id: "7",
      title: "Senior Software Engineer",
      company: "EduTech Solutions",
      location: "Gurgaon, India",
      salary: "$95k - $125k",
      type: "Full-time",
      description: "Build educational technology platforms that impact millions of students. Work on scalable systems and innovative learning tools.",
      requirements: ["5+ years engineering", "EdTech experience", "React/Python", "Passion for education"],
      postedDate: "1 day ago"
    }
  },
  {
    id: "operations",
    name: "Operations & Management",
    icon: "Settings",
    color: "bg-gray-100 text-gray-600",
    jobCount: 2658,
    sampleJob: {
      id: "8",
      title: "Operations Manager",
      company: "LogiFlow Corp",
      location: "Noida, India",
      salary: "$80k - $105k",
      type: "Full-time",
      description: "Oversee daily operations and improve process efficiency. Lead cross-functional teams to achieve operational excellence.",
      requirements: ["Operations experience", "Project management", "Process improvement", "Leadership skills"],
      postedDate: "3 days ago"
    }
  }
];