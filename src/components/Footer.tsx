import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram 
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">JobNest</h3>
                <p className="text-xs text-muted-foreground">Smart Job Discovery</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Match you with the perfect opportunities from thousands of job listings across the web.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="sm" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Browse Jobs</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Post a Job</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Career Advice</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Salary Guide</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Company Reviews</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Job Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Software Development</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Data Science</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Marketing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Design</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Finance</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Stay Connected</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">hello@jobnest.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">+91 8260971233</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Bhubaneswar, India</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Get Job Alerts</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Your email" 
                  className="text-sm"
                />
                <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; 2024 JobNest. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;