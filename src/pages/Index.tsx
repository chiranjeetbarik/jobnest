import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import JobCategories from "@/components/JobCategories";
import RealJobListings from "@/components/RealJobListings";
import Footer from "@/components/Footer";
import { usePreferences } from "@/context/PreferencesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/hooks/useJobs";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Clock, ExternalLink, Heart, Send, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useJobActions } from "@/context/JobActionsContext";

const Index = () => {
  const { preferences, isPreferencesSet } = usePreferences();
  const { saveJob, applyToJob, isJobSaved, isJobApplied } = useJobActions();

  // Fetch personalized recommendations if preferences are set
  const { data: recommendedJobs } = useJobs({
    limit: 6,
    usePreferences: isPreferencesSet,
    preferences: isPreferencesSet ? preferences : undefined
  });

  const handleSaveJob = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    saveJob(job);
  };

  const handleApplyJob = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    applyToJob(job);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Personalized Recommendations */}
        {isPreferencesSet && recommendedJobs?.jobs?.length > 0 && (
          <section className="py-16 bg-gradient-secondary">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Recommended for You
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Based on your preferences, here are jobs we think you'll love
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendedJobs.jobs.slice(0, 6).map((job: any) => (
                  <Card key={job.id} className="hover-lift border-2 hover:border-primary/50 group">
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

              <div className="text-center">
                <Link to="/search?usePreferences=true">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                    View All Recommendations
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Preferences Setup Banner */}
        {!isPreferencesSet && (
          <section className="py-12 bg-primary/5">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto border-primary/20">
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Get Personalized Job Recommendations
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Set your preferences to see jobs tailored specifically for you. 
                    We'll filter jobs based on your location, salary expectations, skills, and more.
                  </p>
                  <Link to="/preferences">
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                      <Settings className="h-5 w-5 mr-2" />
                      Set Your Preferences
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
        
        <RealJobListings />
        <JobCategories />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
