import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, Trash2, Eye, AlertCircle } from "lucide-react";

const Privacy = () => {
  const principles = [
    {
      icon: Shield,
      title: "שמירה מקומית בלבד",
      description: "כל הנתונים שלכם נשמרים במכשיר שלכם בלבד ולעולם לא נשלחים לשרתים חיצוניים."
    },
    {
      icon: Lock,
      title: "הצפנה מקומית",
      description: "המידע נשמר בצורה מוצפנת במכשיר, כך שרק אתם יכולים לגשת אליו."
    },
    {
      icon: Database,
      title: "ללא איסוף נתונים",
      description: "אנחנו לא אוספים, לא שומרים ולא מעבדים שום מידע אישי של הלקוחות שלכם."
    },
    {
      icon: Trash2,
      title: "מחיקה מלאה",
      description: "אתם יכולים למחוק את כל הנתונים בכל רגע, ללא שאריות במקום אחר."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              פרטיות ואבטחת מידע
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ב-InsuNote אנחנו מבינים כמה חשוב לשמור על פרטיות המידע של הלקוחות שלכם. 
              הנה איך אנחנו מבטיחים אבטחה מקסימלית.
            </p>
          </div>

          {/* Alert */}
          <Card className="glass border-glass-border rounded-2xl mb-12 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">חשוב לדעת</h3>
                  <p className="text-muted-foreground">
                    <strong>InsuNote פועל במלואו במכשיר שלכם.</strong> אין לנו שרתים, אין לנו מסד נתונים, 
                    ואין לנו גישה למידע שלכם. הכל נשמר אצלכם ונשאר אצלכם.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Principles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {principles.map((principle, index) => (
              <Card key={index} className="glass border-glass-border rounded-2xl glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/20 rounded-xl">
                      <principle.icon className="h-5 w-5 text-primary" />
                    </div>
                    {principle.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Privacy Policy */}
          <div className="space-y-8">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  מה אנחנו לא רואים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>אנחנו לא רואים ולא יכולים לראות:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                  <li>פרטי הלקוחות שלכם (שמות, מספרי זהות, טלפונים, אימיילים)</li>
                  <li>תוכן הפגישות וההמלצות שאתם כותבים</li>
                  <li>החלטות שהתקבלו או מסמכים שנדונו</li>
                  <li>כל מידע אחר שאתם מכניסים למערכת</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  המידע הזה נשמר במכשיר שלכם בלבד, ברמת הצפנה הגבוהה ביותר של הדפדפן.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle>שמירת טיוטות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  כאשר אתם שומרים טיוטה, המידע נשמר באחסון המקומי של הדפדפן (localStorage) 
                  במכשיר שלכם. זה אומר:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                  <li>רק אתם יכולים לגשת לטיוטות השמורות</li>
                  <li>הטיוטות לא נשלחות לאף מקום ברשת</li>
                  <li>מחיקת המטמון של הדפדפן תמחק את הטיוטות</li>
                  <li>מכשיר אחר לא יוכל לראות טיוטות שנשמרו במכשיר אחר</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle>שליחת סיכומים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  כאשר אתם שולחים סיכום באמצעות:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                  <li><strong>מייל:</strong> נפתחת אפליקציית המייל שלכם עם הטקסט המוכן. אנחנו לא שולחים את המייל</li>
                  <li><strong>וואטסאפ:</strong> נפתח וואטסאפ ווב עם הטקסט המוכן. אנחנו לא שולחים את ההודעה</li>
                  <li><strong>העתקה:</strong> הטקסט מועתק ללוח המקומי שלכם. אנחנו לא רואים מה הועתק</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  בכל המקרים, אתם קובעים בעצמכם מה לשלוח, למי ומתי.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle>תאימות לחוקי פרטיות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  InsuNote תואם לחוקי הפרטיות המחמירים ביותר:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                  <li><strong>GDPR (תקנת הפרטיות האירופית):</strong> מלא תאימות מכיוון שאין עיבוד נתונים</li>
                  <li><strong>חוק הגנת הפרטיות הישראלי:</strong> תאימות מלאה</li>
                  <li><strong>תקנות רשות שוק ההון:</strong> מתאים לסוכני ביטוח מורשים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle>איך למחוק נתונים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  למחיקת כל הנתונים השמורים במכשיר:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground mr-4">
                  <li>היכנסו להגדרות הדפדפן שלכם</li>
                  <li>חפשו "מחק נתוני גלישה" או "Clear browsing data"</li>
                  <li>ודאו שמסומן "Local Storage" או "Site data"</li>
                  <li>בחרו את האתר של InsuNote או מחקו הכל</li>
                </ol>
                <p className="text-muted-foreground leading-relaxed">
                  לחלופין, פשוט אל תשמרו טיוטות וכל המידע יימחק אוטומטית כשתסגרו את הדף.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact */}
          <Card className="glass border-glass-border rounded-2xl mt-16">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                יש לכם שאלות על פרטיות?
              </h2>
              <p className="text-muted-foreground mb-6">
                אנחנו זמינים לכל שאלה או הבהרה לגבי אבטחת המידע
              </p>
              <p className="text-sm text-muted-foreground">
                עדכון אחרון: דצמבר 2024
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;