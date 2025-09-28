import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import logo from "@/assets/logo-final.png";
const Hero = () => {
  return <section 
    className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 relative"
    style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}
  >
      {/* Background overlay for 50% opacity */}
      <div className="absolute inset-0 bg-background/50 z-0"></div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Content */}
        <div>
          {/* Logo - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            <img 
              src={logo} 
              alt="InMinds" 
              className="h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64 lg:h-72 lg:w-72 mx-auto mb-4 sm:mb-6 drop-shadow-glow"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            חדש! סיכום אוטומטי חכם
          </div>

          {/* Main heading - Mobile Optimized */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight" style={{ contain: 'layout paint' }}>
            סיכום שיחה חכם
            <br />
            <span className="bg-gradient-to-l from-primary to-primary-hover bg-clip-text text-transparent" style={{ willChange: 'auto' }}>
              בדקה
            </span>
          </h1>

          {/* Subtitle - Mobile Optimized */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            ממלאים 3 שדות, מקבלים מסמך מסודר ללקוח — מיידית.
            <br />
            <span className="text-sm sm:text-base md:text-lg">חסכו זמן יקר ותנו שירות מקצועי יותר</span>
          </p>

          {/* CTA Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-glow text-base sm:text-lg h-auto w-full sm:w-auto min-w-[200px] glass-hover">
              <Link to="/app" className="flex items-center justify-center gap-2">
                התחל עכשיו
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="outline" size="lg" className="border-glass-border bg-glass hover:bg-glass text-foreground font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg h-auto w-full sm:w-auto min-w-[200px] glass-hover">
              <Play className="h-5 w-5 ml-2" />
              צפה בדוגמה
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-glass-border">
            <p className="text-sm text-muted-foreground mb-4">בטוח ואמין לסוכני ביטוח בישראל ובעולם</p>
            <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                אבטחת מידע
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                תאימות GDPR
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full text-fuchsia-500"></span>
                שמירה מקומית
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;