import { useState } from "react";
import AppNavigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsuranceManagement } from "@/components/admin/InsuranceManagement";
import { AgentInfo } from "@/components/admin/AgentInfo";
import { ClientsList } from "@/components/admin/ClientsList";
import { ReportsLog } from "@/components/admin/ReportsLog";
import { Shield, Building2, User, Users, FileText } from "lucide-react";

const Admin = () => {
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="insurance" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              חברות ביטוח
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              פרטי הסוכן
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              לקוחות
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              לוג דוחות
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
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;