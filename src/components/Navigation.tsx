import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-final.png";

const AppNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { label: "בית", href: "/" },
    { label: "איך זה עובד", href: "/how-it-works" },
    { label: "פרטיות", href: "/privacy" },
    { label: "יצירת קשר", href: "/contact" },
    { label: "ניהול", href: "/admin" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-md border-b border-glass-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground hover:text-primary transition-colors min-w-0 flex-shrink-0"
          >
            <img src={logo} alt="InMinds" className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">InMinds</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  isActive(item.href) 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <Button 
              asChild 
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-4 lg:px-6 rounded-2xl shadow-glow whitespace-nowrap"
            >
              <Link to="/app">התחל סיכום</Link>
            </Button>
          </div>

          {/* Mobile menu button - Enhanced touch target */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-lg flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "סגור תפריט" : "פתח תפריט"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation - Enhanced for touch */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-glass-border mt-2 sm:mt-4 pt-4 pb-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-base font-medium transition-colors hover:text-primary hover:bg-glass/50 rounded-xl px-4 py-3 text-center min-h-[44px] flex items-center justify-center ${
                    isActive(item.href) 
                      ? "text-primary bg-glass/30" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-4 mt-2 border-t border-glass-border">
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-2xl w-full h-12 text-base"
                >
                  <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                    התחל סיכום
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AppNavigation;