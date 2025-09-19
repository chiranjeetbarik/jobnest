import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/hooks/useJobs";
import { useState } from "react";
import { JobDetailModal } from "./JobDetailModal";
import { ExternalLink, MapPin, Building2, Clock } from "lucide-react";

const RealJobListings = () => {
  const { data, isLoading, error } = useJobs({ limit: 12 });
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">Latest Job Opportunities</h2>
            <p className="text-muted-foreground">Unable to load jobs at the moment. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-in-up">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Latest Job Opportunities
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fresh job listings scraped from top job boards. Updated in real-time.
            </p>
            {data && (
              <div className="flex justify-center gap-4 mt-6">
                <Badge variant="secondary" className="px-3 py-1">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index} className="fade-in-up">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))
              : data?.jobs.map((job, index) => (
                  <Card
                    key={job.id}
                    className={`cursor-pointer hover-lift fade-in-up stagger-${(index % 3) + 1} border-2 hover:border-primary/50 group`}
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
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.jobUrl, '_blank');
                          }}
                          className="px-3"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="text-center mt-12 fade-in-up stagger-4">
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 hover-lift px-8"
            >
              View All Jobs ({data?.pagination.totalJobs || 0})
            </Button>
          </div>
        </div>
      </section>

      <JobDetailModal
        job={selectedJob}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};

export default RealJobListings;
