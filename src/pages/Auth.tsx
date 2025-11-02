import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "כתובת אימייל לא תקינה" }).max(255, { message: "אימייל ארוך מדי" }),
  password: z.string().min(6, { message: "סיסמה חייבת להכיל לפחות 6 תווים" }).max(72, { message: "סיסמה ארוכה מדי" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/app");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/app");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "שגיאה בנתונים",
        description: validation.error.errors[0].message,
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          },
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "שגיאה בהרשמה",
            description: error.message,
          });
        } else {
          toast({
            title: "נרשמת בהצלחה",
            description: "בדוק את האימייל שלך לאימות החשבון",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "שגיאה בהתחברות",
            description: error.message,
          });
        } else {
          toast({
            title: "התחברת בהצלחה",
            description: "מעביר אותך לאפליקציה...",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSignUp ? "הרשמה" : "התחברות"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "צור חשבון חדש" : "הזן את פרטי ההתחברות שלך"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={72}
                />
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    הסיסמה חייבת להכיל לפחות 6 תווים
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isSignUp ? "נרשם..." : "מתחבר...") : (isSignUp ? "הירשם" : "התחבר")}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                  className="text-sm"
                >
                  {isSignUp ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הירשם"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
