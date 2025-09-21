import AppNavigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  FileText, 
  User, 
  MessageSquare, 
  CheckCircle, 
  Zap, 
  Send,
  ArrowLeft,
  Clock,
  Shield
} from "lucide-react";

const HowItWorks = () => {
  const detailedSteps = [
    {
      icon: User,
      title: "שלב 1: פרטי הלקוח",
      description: "מלאו את הפרטים הבסיסיים של הלקוח והנושאים שנדונו בפגישה",
      fields: ["שם הלקוח", "טלפון ואימייל", "תאריך הפגישה", "נושאי ביטוח שנדונו"],
      time: "30 שניות"
    },
    {
      icon: MessageSquare,
      title: "שלב 2: המלצות הסוכן",
      description: "רשמו את המצב הקיים, הפערים שזוהו וההמלצות שלכם",
      fields: ["מצב ביטוחי קיים", "פערים וסיכונים", "המלצות לשיפור", "הערכת עלות"],
      time: "60 שניות"
    },
    {
      icon: CheckCircle,
      title: "שלב 3: החלטות",
      description: "סכמו את ההחלטות שהתקבלו והפעולות הנדרשות",
      fields: ["מה הוחלט לבצע", "מסמכים להביא", "לוחות זמנים", "אישורים נדרשים"],
      time: "30 שניות"
    }
  ];

  const outputOptions = [
    {
      icon: FileText,
      title: "העתקה ללוח",
      description: "העתיקו את הטקסט המוכן להדבקה במקום הרצוי"
    },
    {
      icon: Send,
      title: "שליחת מייל",
      description: "פתחו אפליקציית המייל עם הסיכום המוכן לשליחה"
    },
    {
      icon: MessageSquare,
      title: "שליחת וואטסאפ",
      description: "שלחו את הסיכום ישירות בוואטסאפ ללקוח"
    }
  ];

  return (
    <div className="min-h-screen">
      <AppNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              איך InMinds עובד?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              תהליך פשוט ומהיר ליצירת סיכומי פגישות מקצועיים. 
              רק 3 שלבים בין הפגישה לסיכום ללקוח.
            </p>
          </div>

          {/* Process Overview */}
          <Card className="glass border-glass-border rounded-2xl mb-16">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">מהיר</h3>
                  <p className="text-sm text-muted-foreground">2 דקות בלבד להכנת סיכום מלא</p>
                </div>
                
                <div>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">בטוח</h3>
                  <p className="text-sm text-muted-foreground">כל הנתונים נשמרים במכשיר שלכם</p>
                </div>
                
                <div>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">יעיל</h3>
                  <p className="text-sm text-muted-foreground">סיכום מובנה ומקצועי אוטומטית</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Steps */}
          <div className="space-y-8 mb-16">
            {detailedSteps.map((step, index) => (
              <Card key={index} className="glass border-glass-border rounded-2xl glass-hover">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl shrink-0">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm text-primary font-medium">{step.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:mr-auto">
                      <h4 className="font-medium text-foreground mb-3">שדות למילוי:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {step.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Output Options */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              אפשרויות שליחה ושיתוף
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {outputOptions.map((option, index) => (
                <Card key={index} className="glass border-glass-border rounded-2xl text-center glass-hover">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-xl mb-4">
                      <option.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Example Preview */}
          <Card className="glass border-glass-border rounded-2xl mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground text-center mb-6">
                דוגמה לסיכום שנוצר
              </h2>
              
              <div className="bg-muted/20 rounded-xl p-6">
                <div className="text-sm font-mono leading-relaxed text-foreground">
                  <div className="font-bold mb-4">
                    נושא: סיכום פגישת ביטוח – משה כהן – 15 בדצמבר 2024
                  </div>
                  
                  <div className="mb-4">
                    שלום משה,<br />
                    להלן סיכום הפגישה שלנו:
                  </div>
                  
                  <div className="mb-4">
                    <strong>פרטי הלקוח:</strong><br />
                    • שם: משה כהן<br />
                    • טלפון: 050-1234567<br />
                    • אימייל: moshe@email.com<br />
                    • נושאים שנדונו: בריאות, חיים
                  </div>
                  
                  <div className="mb-4">
                    <strong>המלצות הסוכן:</strong><br />
                    • מצב קיים: כיסוי בריאות בסיסי בלבד<br />
                    • פערים/סיכונים: אין כיסוי סיעוד וביטוח חיים<br />
                    • המלצות: הוספת ביטוח סיעוד ועדכון ביטוח חיים
                  </div>
                  
                  <div className="mb-4">
                    <strong>החלטות שהתקבלו:</strong><br />
                    לבדוק הצעות מחיר לביטוח סיעוד ולקבוע פגישה נוספת
                  </div>
                  
                  <div>
                    בברכה,<br />
                    הסוכן שלכם
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Card className="glass border-glass-border rounded-2xl bg-gradient-primary">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-primary-foreground mb-4">
                  מוכנים לנסות?
                </h2>
                <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                  התחילו עכשיו ותראו כמה קל זה ליצור סיכומים מקצועיים
                </p>
                
                <Button 
                  asChild 
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 font-medium px-8 py-4 rounded-2xl text-lg min-w-[200px] shadow-xl"
                >
                  <Link to="/app" className="flex items-center gap-2">
                    התחל עכשיו
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;