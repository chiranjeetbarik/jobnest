import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Briefcase, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobStats } from "@/hooks/useJobs";
import heroImage from "@/assets/hero-job-search.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const { data: stats, isLoading } = useJobStats();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create search parameters
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (location.trim()) {
      params.set('location', location.trim());
    }
    
    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative bg-gradient-secondary py-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img
          src={heroImage}
          alt="Job Search Platform"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Find Your{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Perfect Career Match
            </span>{" "}
              Today
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Match you with the perfect opportunities from thousands of job listings across the web.
            </p>
          </div>

          <form onSubmit={handleSearch} className="fade-in-up stagger-1">
            <div className="bg-card p-6 rounded-2xl shadow-medium max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg border-0 bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-12 h-12 text-lg border-0 bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  className="h-12 px-8 bg-gradient-primary hover:opacity-90 hover-lift text-lg font-semibold"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Jobs
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-12 fade-in-up stagger-2">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex items-center space-x-2">
                <div className="bg-success/10 p-2 rounded-lg">
                  <Briefcase className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? "..." : stats?.totalJobs ? `${(stats.totalJobs / 1000).toFixed(1)}k+` : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">Jobs Listed</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-info/10 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">Smart</p>
                  <p className="text-sm text-muted-foreground">Job Matching</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-warning/10 p-2 rounded-lg">
                  <Search className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? "..." : stats?.recentJobs || "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">New Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;