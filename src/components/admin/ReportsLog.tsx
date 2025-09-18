import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Eye, Calendar, Check, X, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Report {
  id: string;
  client_id: string;
  client_name: string;
  report_content?: string;
  generated_at: string;
  sent_at?: string;
  status: 'generated' | 'sent' | 'failed';
  created_at: string;
}

export const ReportsLog = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    let filtered = reports.filter(report =>
      report.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.client_id.includes(searchTerm)
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports_log')
        .select('*')
        .order('generated_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setReports(data.map(report => ({
          ...report,
          status: report.status as 'generated' | 'sent' | 'failed'
        })));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת לוג הדוחות",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports_log')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
      
      toast({
        title: "הצלחה",
        description: "הדוח נמחק בהצלחה",
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הדוח",
        variant: "destructive"
      });
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: 'sent' | 'failed') => {
    try {
      const { error } = await supabase
        .from('reports_log')
        .update({ 
          status: newStatus,
          sent_at: newStatus === 'sent' ? new Date().toISOString() : null
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: newStatus,
              sent_at: newStatus === 'sent' ? new Date().toISOString() : report.sent_at
            }
          : report
      ));
      
      toast({
        title: "הצלחה",
        description: `סטטוס הדוח עודכן ל${newStatus === 'sent' ? 'נשלח' : 'נכשל'}`,
      });

    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון סטטוס הדוח",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: he });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'נשלח';
      case 'failed':
        return 'נכשל';
      default:
        return 'נוצר';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">טוען לוג דוחות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">לוג דוחות</h3>
            <p className="text-sm text-muted-foreground">
              סה"כ {reports.length} דוחות במערכת
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם לקוח או ת״ז..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="generated">נוצר</option>
            <option value="sent">נשלח</option>
            <option value="failed">נכשל</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-xs text-muted-foreground">סה״כ דוחות</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'generated').length}
                </p>
                <p className="text-xs text-muted-foreground">נוצרו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'sent').length}
                </p>
                <p className="text-xs text-muted-foreground">נשלחו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'failed').length}
                </p>
                <p className="text-xs text-muted-foreground">נכשלו</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>דוחות שהופקו</span>
            <Badge variant="secondary">
              מציג {filteredReports.length} מתוך {reports.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "לא נמצאו תוצאות" : "אין דוחות במערכת"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "נסה לשנות את מונחי החיפוש" 
                  : "דוחות יתווספו אוטומטית בעת יצירתם"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">לקוח</TableHead>
                    <TableHead className="text-right">ת״ז</TableHead>
                    <TableHead className="text-right">תאריך יצירה</TableHead>
                    <TableHead className="text-right">תאריך שליחה</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium text-right">
                        {report.client_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {report.client_id}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(report.generated_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.sent_at ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(report.sent_at)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">לא נשלח</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={getStatusVariant(report.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(report.status)}
                          {getStatusText(report.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {report.report_content && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>
                                    דוח עבור {report.client_name}
                                  </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh]">
                                  <div className="p-4">
                                    <pre className="whitespace-pre-wrap font-sans text-sm">
                                      {report.report_content}
                                    </pre>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {report.status === 'generated' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatus(report.id, 'sent')}
                                title="סמן כנשלח"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatus(report.id, 'failed')}
                                title="סמן כנכשל"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteReport(report.id)}
                            title="מחק דוח"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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