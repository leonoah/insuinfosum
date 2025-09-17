import Navigation from "@/components/Navigation";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center glass p-12 rounded-2xl border-glass-border">
          <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">אופס! הדף לא נמצא</p>
          <a 
            href="/" 
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-8 py-3 rounded-2xl transition-colors"
          >
            חזור לעמוד הבית
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
