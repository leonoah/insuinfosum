import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { FallingPattern } from "@/components/ui/falling-pattern";
const Hero = () => {
  return <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-6xl mx-auto text-center">
        {/* Falling Pattern Background */}
        <FallingPattern 
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,var(--background)_60%)]"
          color="hsl(var(--primary) / 0.15)"
          backgroundColor="transparent"
          duration={200}
          blurIntensity="0.5em"
          density={0.8}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            חדש! סיכום אוטומטי חכם
          </div>

          {/* Main heading - Optimized for LCP */}
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6 leading-tight lg:text-6xl" style={{ contain: 'layout paint' }}>
            סיכום שיחה חכם
            <br />
            <span className="bg-gradient-to-l from-primary to-primary-hover bg-clip-text text-transparent" style={{ willChange: 'auto' }}>
              בדקה
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            ממלאים 3 שדות, מקבלים מסמך מסודר ללקוח — מיידית.
            <br />
            <span className="text-lg">חסכו זמן יקר ותנו שירות מקצועי יותר</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-8 py-4 rounded-2xl shadow-glow text-lg h-auto min-w-[200px] glass-hover">
              <Link to="/app" className="flex items-center gap-2">
                התחל עכשיו
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="outline" size="lg" className="border-glass-border bg-glass hover:bg-glass text-foreground font-medium px-8 py-4 rounded-2xl text-lg h-auto min-w-[200px] glass-hover">
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