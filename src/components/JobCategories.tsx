import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jobCategories, JobCategory } from "@/data/jobCategories";
import { useNavigate } from "react-router-dom";
import { useJobStats } from "@/hooks/useJobs";
import { useEffect, useState } from "react";
import { fetchCategoryCounts } from "@/api/categoryCounts";
import * as Icons from "lucide-react";

const JobCategories = () => {
  const navigate = useNavigate();
  const { data: stats } = useJobStats();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    (async () => {
      const c = await fetchCategoryCounts();
      setCounts(c);
    })();
  }, []);

  const handleCategoryClick = (category: JobCategory) => {
    navigate(`/category/${category.id}`);
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-6 w-6" /> : <Icons.Briefcase className="h-6 w-6" />;
  };

  return (
    <>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-in-up">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Explore Job Categories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover opportunities across various industries. Click on any category to see real job listings from our database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobCategories.map((category, index) => (
              <Card
                key={category.id}
                className={`cursor-pointer hover-lift fade-in-up stagger-${(index % 4) + 1} border-2 hover:border-primary/50 group`}
                onClick={() => handleCategoryClick(category)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                    {getIcon(category.icon)}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {counts && typeof counts[category.id] === 'number' && (
                    <p className="text-muted-foreground mb-4">
                      {counts[category.id].toLocaleString()} jobs available
                    </p>
                  )}
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-accent/50">
                      {category.sampleJob.company}
                    </Badge>
                    <p className="text-sm text-foreground font-medium">
                      {category.sampleJob.title}
                    </p>
                    {/* Removed sample location from card */}
                    <Button 
                      variant="outline" 
                      className="mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/category/${category.id}`); }}
                    >
                      Browse Jobs
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
              onClick={() => navigate('/search')}
            >
              Browse All Categories
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default JobCategories;