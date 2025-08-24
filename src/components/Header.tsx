import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, User, LogIn } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-card shadow-soft border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">JobNest</h1>
                  <p className="text-xs text-muted-foreground">Smart Job Discovery</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAuth("login")}
                className="hover-lift"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button 
                size="sm"
                onClick={() => handleAuth("register")}
                className="bg-gradient-primary hover:opacity-90 hover-lift"
              >
                <User className="h-4 w-4 mr-2" />
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
};

export default Header;