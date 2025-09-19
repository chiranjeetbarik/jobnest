import React, { useState } from 'react';
import { useJobActions } from "@/context/JobActionsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobDetailModal } from "@/components/JobDetailModal";
import { 
  Heart, 
  Send, 
  Building2, 
  MapPin, 
  Clock, 
  ExternalLink,
  Trash2,
  BookmarkCheck,
  CheckCircle
} from "lucide-react";

const Dashboard = () => {
  const { savedJobs, appliedJobs, unsaveJob } = useJobActions();
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

  const handleUnsaveJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unsaveJob(jobId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const JobCard = ({ job, type, onUnsave }: { job: any; type: 'saved' | 'applied'; onUnsave?: (jobId: string, e: React.MouseEvent) => void }) => (
    <Card
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
          
          {type === 'saved' && onUnsave && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => onUnsave(job.id, e)}
              className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Remove from saved"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          {type === 'applied' && (
            <Button 
              variant="ghost" 
              size="sm"
              className="px-3 text-green-600"
              title="Applied"
              disabled
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          
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
  );

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your saved jobs and track your applications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Jobs you've bookmarked
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applied Jobs</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appliedJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Jobs you've applied to
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
                <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedJobs.length + appliedJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total job interactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Job Lists */}
          <Tabs defaultValue="saved" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Saved Jobs ({savedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="applied" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Applied Jobs ({appliedJobs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="saved" className="mt-6">
              {savedJobs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Saved Jobs</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start saving jobs you're interested in to see them here
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Browse Jobs
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      type="saved" 
                      onUnsave={handleUnsaveJob}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="applied" className="mt-6">
              {appliedJobs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Jobs you apply to will appear here for easy tracking
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Find Jobs to Apply
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {appliedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      type="applied"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

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

export default Dashboard;
