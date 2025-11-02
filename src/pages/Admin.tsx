import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppNavigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InsuranceManagement } from "@/components/admin/InsuranceManagement";
import { AgentInfo } from "@/components/admin/AgentInfo";
import { ClientsList } from "@/components/admin/ClientsList";
import { ClientManagement } from "@/components/admin/ClientManagement";
import { ReportsLog } from "@/components/admin/ReportsLog";
import { ProductInformationManagement } from "@/components/admin/ProductInformationManagement";
import PensionParsingLogs from "@/components/admin/PensionParsingLogs";
import { Shield, Building2, User, Users, FileText, Database, UserPlus, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Admin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("נדרשת התחברות");
        navigate("/auth?redirect=/admin");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        setIsAdmin(false);
        toast.error("אין לך הרשאות גישה לעמוד זה");
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <AppNavigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>אין הרשאת גישה</AlertTitle>
            <AlertDescription>
              אין לך הרשאות מנהל לצפות בעמוד זה. אנא פנה למנהל המערכת.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">פנל ניהול</h1>
          </div>
          <p className="text-muted-foreground">
            ניהול מידע חברות ביטוח, פרטי הסוכן, לקוחות ודוחות
          </p>
        </div>

        <Tabs defaultValue="insurance" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="insurance" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              חברות ביטוח
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              מוצרים וחשיפות
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              פרטי הסוכן
            </TabsTrigger>
            <TabsTrigger value="manage-clients" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              ניהול לקוחות
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              רשימת לקוחות
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              לוג דוחות
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              לוגי מסלקה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  ניהול חברות ביטוח ומוצרים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InsuranceManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  ניהול מוצרים ונתוני חשיפה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductInformationManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  מידע על הסוכן
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentInfo />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-clients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  ניהול לקוחות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  לקוחות קיימים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  לוג דוחות שהופקו
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportsLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  לוגי פירסור מסלקה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PensionParsingLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;