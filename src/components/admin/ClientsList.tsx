import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Phone, Mail, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  created_at: string;
  updated_at: string;
}

export const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.includes(searchTerm) ||
      (client.client_phone && client.client_phone.includes(searchTerm)) ||
      (client.client_email && client.client_email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת רשימת הלקוחות",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== clientId));
      
      toast({
        title: "הצלחה",
        description: "הלקוח נמחק בהצלחה",
      });

    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הלקוח",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: he });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">טוען רשימת לקוחות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">לקוחות רשומים</h3>
            <p className="text-sm text-muted-foreground">
              סה"כ {clients.length} לקוחות במערכת
            </p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, ת״ז, טלפון או מייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-full sm:w-80"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-muted-foreground">סה״כ לקוחות</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.client_phone).length}
                </p>
                <p className="text-xs text-muted-foreground">עם טלפון</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.client_email).length}
                </p>
                <p className="text-xs text-muted-foreground">עם מייל</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>רשימת לקוחות</span>
            <Badge variant="secondary">
              מציג {filteredClients.length} מתוך {clients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "לא נמצאו תוצאות" : "אין לקוחות רשומים"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "נסה לשנות את מונחי החיפוש" 
                  : "לקוחות יתווספו אוטומטית בעת יצירת דוחות"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם הלקוח</TableHead>
                    <TableHead className="text-right">ת״ז</TableHead>
                    <TableHead className="text-right">טלפון</TableHead>
                    <TableHead className="text-right">מייל</TableHead>
                    <TableHead className="text-right">נוצר בתאריך</TableHead>
                    <TableHead className="text-right">עדכון אחרון</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium text-right">
                        {client.client_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {client.client_id}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.client_phone ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span dir="ltr">{client.client_phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">לא צוין</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.client_email ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span dir="ltr">{client.client_email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">לא צוין</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(client.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(client.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteClient(client.id)}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};