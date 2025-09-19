import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/data/jobCategories";
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Star,
  Bookmark,
  ExternalLink,
  CheckCircle 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailModal = ({ job, open, onOpenChange }: JobDetailModalProps) => {
  const { user } = useAuth();
  const { openModal } = useAuthModal();

  if (!job) return null;

  const handleApply = () => {
    if (!user) {
      openModal('login');
      return;
    }
    console.log("Applying to job:", job.id);
    // Handle job application logic
  };

  const handleSave = () => {
    console.log("Saving job:", job.id);
    // Handle save job logic
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {job.title}
              </DialogTitle>
              <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{job.postedDate}</span>
                </div>
              </div>
            </div>
            {job.featured && (
              <Badge className="bg-warning text-warning-foreground">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 bg-success/10 px-3 py-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="font-semibold text-success">{job.salary}</span>
            </div>
            <Badge variant="secondary">{job.type}</Badge>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Job Description</h3>
            <p className="text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Requirements</h3>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleApply}
              className="flex-1 bg-gradient-primary hover:opacity-90 hover-lift"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSave}
              className="hover-lift"
              size="lg"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Save Job
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>AI Match Score:</strong> This job is a 95% match based on your profile and preferences
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};