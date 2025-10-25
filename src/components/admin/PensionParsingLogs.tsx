import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface PensionParsingLog {
  id: string;
  created_at: string;
  file_name: string;
  client_name: string | null;
  kod_maslul_hashka: string | null;
  extracted_product_code: string | null;
  parsing_status: string;
  error_message: string | null;
  products_found: number;
  products_imported: number;
  raw_data: any;
}

const PensionParsingLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<PensionParsingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('pension_parsing_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast({
        title: "שגיאה בטעינת לוגים",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את כל הלוגים?")) return;

    try {
      const { error } = await supabase
        .from('pension_parsing_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "הלוגים נמחקו בהצלחה",
      });

      fetchLogs();
    } catch (error) {
      toast({
        title: "שגיאה במחיקת לוגים",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: "default",
      error: "destructive",
      partial: "secondary",
    };
    return variants[status] || "secondary";
  };

  const filteredLogs = logs.filter(log => 
    log.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.extracted_product_code?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              לוגים של פירסור קבצי מסלקה
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              נקה לוגים
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="חיפוש לפי שם קובץ, לקוח או קוד קרן..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{logs.length}</div>
                <div className="text-sm text-muted-foreground">סך הכל פירסורים</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {logs.filter(l => l.parsing_status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">הצלחות</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {logs.filter(l => l.parsing_status === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">שגיאות</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {logs.filter(l => l.kod_maslul_hashka && l.kod_maslul_hashka !== 'multiple').length}
                </div>
                <div className="text-sm text-muted-foreground">KOD נמצא</div>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[600px] w-full rounded-md border border-glass-border">
            <div className="space-y-4 p-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">טוען לוגים...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "לא נמצאו תוצאות" : "אין לוגים להצגה"}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <Card key={log.id} className="border-glass-border/50">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.parsing_status)}
                          <div>
                            <div className="font-medium">{log.file_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(log.parsing_status)}>
                          {log.parsing_status === 'success' ? 'הצליח' : 
                           log.parsing_status === 'error' ? 'נכשל' : 'חלקי'}
                        </Badge>
                      </div>

                      {log.client_name && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">לקוח: </span>
                          <span className="font-medium">{log.client_name}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {/* אינדיקטור האם נמצא KOD-MASLUL-HASHKA */}
                        <div className="flex items-center gap-2">
                          {log.kod_maslul_hashka && log.kod_maslul_hashka !== 'multiple' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                KOD-MASLUL-HASHKA נמצא בקובץ
                              </span>
                            </>
                          ) : log.kod_maslul_hashka === 'multiple' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-600">
                                KOD-MASLUL-HASHKA נמצא במספר מוצרים
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600">
                                KOD-MASLUL-HASHKA לא נמצא בקובץ
                              </span>
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {log.kod_maslul_hashka && log.kod_maslul_hashka !== 'multiple' && (
                            <div>
                              <span className="text-muted-foreground">KOD-MASLUL-HASHKA: </span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {log.kod_maslul_hashka}
                              </code>
                            </div>
                          )}
                          {log.extracted_product_code && log.extracted_product_code !== 'multiple' && (
                            <div>
                              <span className="text-muted-foreground">קוד מסלול שחולץ (ספרות 24-30): </span>
                              <code className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded font-bold text-green-800 dark:text-green-200">
                                {log.extracted_product_code}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">מוצרים שנמצאו: </span>
                          <span className="font-medium">{log.products_found}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">מוצרים שיובאו: </span>
                          <span className="font-medium">{log.products_imported}</span>
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                          <span className="font-medium">שגיאה: </span>
                          {log.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PensionParsingLogs;
