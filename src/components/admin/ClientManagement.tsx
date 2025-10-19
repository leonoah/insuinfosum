import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Coins, Plus, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  created_at: string;
  updated_at: string;
}

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    client_email: "",
    client_phone: "",
  });

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('שגיאה בטעינת הלקוחות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            client_id: formData.client_id,
            client_name: formData.client_name,
            client_email: formData.client_email || null,
            client_phone: formData.client_phone || null,
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('הלקוח עודכן בהצלחה');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{
            client_id: formData.client_id,
            client_name: formData.client_name,
            client_email: formData.client_email || null,
            client_phone: formData.client_phone || null,
          }]);

        if (error) throw error;
        toast.success('הלקוח נוסף בהצלחה');
      }

      setIsDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('שגיאה בשמירת הלקוח');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('הלקוח נמחק בהצלחה');
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('שגיאה במחיקת הלקוח');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      client_id: client.client_id,
      client_name: client.client_name,
      client_email: client.client_email || "",
      client_phone: client.client_phone || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      client_id: "",
      client_name: "",
      client_email: "",
      client_phone: "",
    });
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const clientsToInsert = jsonData.map((row: any) => ({
        client_id: row['מזהה לקוח'] || row['client_id'] || '',
        client_name: row['שם לקוח'] || row['client_name'] || '',
        client_email: row['אימייל'] || row['client_email'] || null,
        client_phone: row['טלפון'] || row['client_phone'] || null,
      }));

      const { error } = await supabase
        .from('clients')
        .insert(clientsToInsert);

      if (error) throw error;

      toast.success(`${clientsToInsert.length} לקוחות יובאו בהצלחה`);
      loadClients();
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error('שגיאה בייבוא הקובץ');
    }

    e.target.value = '';
  };

  const handleExportTemplate = () => {
    const template = [
      {
        'מזהה לקוח': '123456789',
        'שם לקוח': 'דוגמא ללקוח',
        'אימייל': 'client@example.com',
        'טלפון': '050-1234567'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'clients_template.xlsx');
    toast.success('קובץ הדוגמא הורד בהצלחה');
  };

  if (loading) {
    return <div className="text-center py-8">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-start">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף לקוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'ערוך לקוח' : 'הוסף לקוח חדש'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>מזהה לקוח *</Label>
                  <Input
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    required
                    placeholder="ת.ז. / מס' לקוח"
                  />
                </div>
                <div>
                  <Label>שם לקוח *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                    placeholder="שם מלא"
                  />
                </div>
                <div>
                  <Label>אימייל</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="050-1234567"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">שמור</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
            id="excel-import-clients"
          />
          <Label htmlFor="excel-import-clients" className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                ייבא מאקסל
              </span>
            </Button>
          </Label>
        </div>

        <Button type="button" variant="outline" onClick={handleExportTemplate}>
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          הורד דוגמת אקסל
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מזהה לקוח</TableHead>
              <TableHead className="text-right">שם לקוח</TableHead>
              <TableHead className="text-right">אימייל</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.client_id}</TableCell>
                <TableCell>{client.client_name}</TableCell>
                <TableCell>{client.client_email || '-'}</TableCell>
                <TableCell>{client.client_phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Coins className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
