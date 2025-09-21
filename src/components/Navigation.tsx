import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-updated.png";

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <img src={logo} alt="InMinds" className="h-6 w-6" />
            <span>InMinds</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
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
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-6 rounded-2xl shadow-glow"
            >
              <Link to="/app">התחל סיכום</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-glass-border mt-4 pt-4 pb-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href) 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <Button 
                asChild 
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-2xl w-fit"
              >
                <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                  התחל סיכום
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AppNavigation;