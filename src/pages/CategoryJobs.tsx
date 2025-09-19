import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useJobActions } from "@/context/JobActionsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JobDetailModal } from "@/components/JobDetailModal";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink,
  Filter,
  SlidersHorizontal,
  Heart,
  Send
} from "lucide-react";
import { jobCategories } from "@/data/jobCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CategoryJobs = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { saveJob, applyToJob, isJobSaved, isJobApplied } = useJobActions();

  // Find the category details
  const category = jobCategories.find(cat => cat.id === categoryId);

  // Create search terms based on category
  const getCategorySearchTerms = (categoryName: string) => {
    const searchTerms: Record<string, string[]> = {
      "Software Development": ["developer", "software", "engineer", "programming", "coding", "frontend", "backend", "fullstack", "react", "node", "python", "java"],
      "Data Science & AI": ["data scientist", "machine learning", "AI", "artificial intelligence", "data analyst", "data engineer", "ML engineer", "python", "tensorflow", "pytorch"],
      "Marketing & Sales": ["marketing", "sales", "digital marketing", "marketing manager", "sales manager", "marketing coordinator", "business development"],
      "Design & Creative": ["designer", "UX", "UI", "graphic designer", "web designer", "creative", "design", "figma", "photoshop"],
      "Finance & Accounting": ["finance", "accounting", "financial analyst", "accountant", "bookkeeper", "CFO", "financial", "audit"],
      "Healthcare & Medical": ["healthcare", "medical", "nurse", "doctor", "physician", "medical assistant", "healthcare", "hospital"],
      "Education & Training": ["teacher", "education", "training", "instructor", "professor", "tutor", "educational", "learning"],
      "Operations & Management": ["operations", "manager", "management", "operations manager", "project manager", "team lead", "supervisor"]
    };
    
    return searchTerms[categoryName] || [categoryName.toLowerCase()];
  };

  const searchTerms = category ? getCategorySearchTerms(category.name) : [];
  const searchQuery_combined = searchQuery || searchTerms.join(" OR ");

  // Fetch jobs with category-specific search
  const { data, isLoading, error } = useJobs({
    page: currentPage,
    limit: 20,
    search: searchQuery_combined,
    location: locationFilter,
    source: sourceFilter
  });

  const handleJobClick = (job: any) => {
    setSelectedJob({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: `Real job opportunity at ${job.company}. Visit the job URL for full details.`,
      requirements: ["Check job URL for requirements"],
      salary: job.salary || "Salary not specified",
      type: "Full-time",
      posted: new Date(job.scrapedAt).toLocaleDateString(),
      url: job.jobUrl
    });
    setModalOpen(true);
  };

  const handleSaveJob = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    saveJob(job);
  };

  const handleApplyJob = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    applyToJob(job);
    // Open the job URL in a new tab
    window.open(job.jobUrl, '_blank');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Category Header */}
        <section className="bg-gradient-secondary py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="mb-6 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-2xl mb-6 ${category.color}`}>
                  <div className="h-12 w-12 flex items-center justify-center">
                    {/* Icon placeholder - you can add the actual icon here */}
                    <Building2 className="h-8 w-8" />
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {category.name}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Discover the latest opportunities in {category.name.toLowerCase()}. 
                  {data && ` ${data.pagination.totalJobs} jobs available`}
                </p>

                {data && (
                  <div className="flex justify-center gap-4">
                    <Badge variant="secondary" className="px-4 py-2">
                      {data.pagination.totalJobs} Total Jobs
                    </Badge>
                    {Object.entries(data.stats).map(([source, count]) => (
                      <Badge key={source} variant="outline" className="px-3 py-1">
                        {source}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder={`Search ${category.name.toLowerCase()} jobs...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12"
                  />
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-12 h-12 w-full md:w-64"
                  />
                </div>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-12 w-full md:w-48">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sources</SelectItem>
                    <SelectItem value="Indeed">Indeed</SelectItem>
                    <SelectItem value="RemoteOK">RemoteOK</SelectItem>
                    <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="h-12 px-8">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load jobs. Please try again later.</p>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data?.jobs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground mb-6">
                  No jobs found in {category.name.toLowerCase()} with your current filters.
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("");
                    setSourceFilter("");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {data?.pagination.totalJobs} Jobs in {category.name}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {data?.pagination.totalPages}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {data?.jobs.map((job, index) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover-lift border-2 hover:border-primary/50 group"
                      onClick={() => handleJobClick(job)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <Badge 
                            variant="secondary" 
                            className={`px-2 py-1 text-xs ${
                              job.source === 'Indeed' ? 'bg-blue-100 text-blue-800' :
                              job.source === 'RemoteOK' ? 'bg-green-100 text-green-800' :
                              job.source === 'Glassdoor' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {job.source}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(job.scrapedAt)}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        
                        <div className="flex items-center text-muted-foreground mb-2">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{job.company}</span>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{job.location}</span>
                        </div>
                        
                        {job.salary && (
                          <div className="mb-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {job.salary}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          >
                            View Details
                          </Button>
                          <Button 
                            variant={isJobSaved(job.id) ? "default" : "ghost"}
                            size="sm"
                            onClick={(e) => handleSaveJob(job, e)}
                            className="px-3"
                            title={isJobSaved(job.id) ? "Job Saved" : "Save Job"}
                          >
                            <Heart className={`h-4 w-4 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button 
                            variant={isJobApplied(job.id) ? "default" : "ghost"}
                            size="sm"
                            onClick={(e) => handleApplyJob(job, e)}
                            className="px-3"
                            title={isJobApplied(job.id) ? "Applied" : "Apply Now"}
                          >
                            <Send className={`h-4 w-4 ${isJobApplied(job.id) ? 'text-green-600' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(job.jobUrl, '_blank');
                            }}
                            className="px-3"
                            title="Open Job URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!data.pagination.hasPrevPage}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      disabled={!data.pagination.hasNextPage}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>

      <JobDetailModal
        job={selectedJob}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};

export default CategoryJobs;
