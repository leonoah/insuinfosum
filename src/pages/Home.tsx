import AppNavigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  Send, 
  Shield, 
  Zap, 
  Users,
  ArrowLeft,
  CheckCircle 
} from "lucide-react";

const Home = () => {
  const steps = [
    {
      icon: FileText,
      title: "מלאו 3 שדות",
      description: "פרטי לקוח, המלצות הסוכן, והחלטות שהתקבלו"
    },
    {
      icon: Zap,
      title: "יצרו סיכום",
      description: "המערכת תייצר סיכום מובנה ומקצועי אוטומטית"
    },
    {
      icon: Send,
      title: "שלחו ללקוח",
      description: "העתיקו, שלחו במייל או בוואטסאפ בלחיצה אחת"
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "חוסך זמן",
      description: "מדקה אחת להכנת סיכום מקצועי"
    },
    {
      icon: Shield,
      title: "בטוח ופרטי", 
      description: "כל הנתונים נשמרים במכשיר שלכם בלבד"
    },
    {
      icon: Users,
      title: "מותאם לסוכנים",
      description: "פותח במיוחד לסוכני ביטוח בישראל"
    }
  ];

  return (
    <div className="min-h-screen">
      <AppNavigation />
      
      {/* Hero Section */}
      <Hero />

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              איך זה עובד?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              תהליך פשוט של 3 שלבים לסיכום מקצועי
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="glass border-glass-border rounded-2xl text-center glass-hover">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-6">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="mt-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              למה InsuNote?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              הכלי המושלם לסוכני ביטוח מקצועיים
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass border-glass-border rounded-2xl glass-hover">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-xl mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass border-glass-border rounded-2xl overflow-hidden">
            <CardContent className="p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  התוצאות מדברות בעד עצמן
                </h2>
                <p className="text-xl text-muted-foreground">
                  סוכנים שמשתמשים ב-InsuNote חוסכים זמן ומשפרים שירות
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">חיסכון של 80% בזמן</h4>
                      <p className="text-sm text-muted-foreground">במקום 10 דקות לכתיבת סיכום - רק 2 דקות</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">שירות מקצועי יותר</h4>
                      <p className="text-sm text-muted-foreground">לקוחות מקבלים סיכום מובנה ונגיש</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">אין טעויות</h4>
                      <p className="text-sm text-muted-foreground">תבנית אחידה מבטיחה אי-שכחת פרטים</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">שליחה מיידית</h4>
                      <p className="text-sm text-muted-foreground">מייל או וואטסאפ ללקוח בסיום הפגישה</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">זכירות טובה יותר</h4>
                      <p className="text-sm text-muted-foreground">לקוחות זוכרים ומבצעים יותר המלצות</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">פרטיות מלאה</h4>
                      <p className="text-sm text-muted-foreground">נתונים נשמרים רק במכשיר שלכם</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass border-glass-border rounded-2xl bg-gradient-primary">
            <CardContent className="p-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                מוכנים להתחיל?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                הצטרפו לסוכני הביטוח המקצועיים שכבר חוסכים זמן ומשפרים שירות
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 font-medium px-8 py-4 rounded-2xl text-lg min-w-[200px] shadow-xl"
                >
                  <Link to="/app" className="flex items-center gap-2">
                    צור סיכום ראשון
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                
                <p className="text-sm text-primary-foreground/70">
                  ללא הרשמה • חינם • מיידי
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
                <FileText className="h-6 w-6" />
                <span>InsuNote</span>
              </Link>
              <p className="text-muted-foreground mb-4 max-w-md">
                הכלי המוביל לסוכני ביטוח ליצירת סיכומי פגישות מקצועיים במהירות ובקלות.
              </p>
              <p className="text-sm text-muted-foreground">
                © 2024 InsuNote — כל הזכויות שמורות
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">קישורים</h4>
              <div className="space-y-3">
                <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  איך זה עובד
                </Link>
                <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  פרטיות
                </Link>
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  יצירת קשר
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">מוצר</h4>
              <div className="space-y-3">
                <Link to="/app" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  התחל עכשיו
                </Link>
                <a href="#features" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  יתרונות
                </a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  מדריך שימוש
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;