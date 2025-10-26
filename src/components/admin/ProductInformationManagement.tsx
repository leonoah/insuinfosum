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
import { Upload, Search, Trash2, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface ProductInfo {
  id: string;
  product_type: string;
  track_name: string;
  company: string;
  product_code: string;
  exposure_stocks: number;
  exposure_foreign: number;
  exposure_foreign_currency: number;
  exposure_government_bonds: number;
  exposure_corporate_bonds_tradable: number;
  exposure_corporate_bonds_non_tradable: number;
  exposure_stocks_options: number;
  exposure_deposits: number;
  exposure_loans: number;
  exposure_cash: number;
  exposure_mutual_funds: number;
  exposure_other_assets: number;
  exposure_liquid_assets: number;
  exposure_non_liquid_assets: number;
  exposure_israel: number;
  exposure_foreign_and_currency: number;
  source: string;
}

export const ProductInformationManagement = () => {
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.company.toLowerCase().includes(query) ||
      product.product_type.toLowerCase().includes(query) ||
      product.track_name.toLowerCase().includes(query) ||
      product.product_code.toLowerCase().includes(query)
    );
  });

  const loadProducts = async () => {
    try {
      const pageSize = 1000;
      let allProducts: ProductInfo[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('products_information')
          .select('*')
          .order('company', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const batch = (data || []) as ProductInfo[];
        allProducts = allProducts.concat(batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('שגיאה בטעינת המוצרים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const parsePercentage = (value: string): number => {
    if (!value || value === '') return 0;
    const cleaned = value.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleAutoImport = async () => {
    try {
      setLogs([]);
      setLoading(true);
      addLog("📥 מתחיל ייבוא נתונים אוטומטי...");
      toast.info("מתחיל ייבוא נתונים...");

      // Load CSV file from public directory
      addLog("📂 טוען קובץ CSV מ-/all_funds_exposures_wide.csv");
      const response = await fetch('/all_funds_exposures_wide.csv');
      
      if (!response.ok) {
        addLog(`❌ שגיאה בטעינת הקובץ: ${response.statusText}`);
        throw new Error(`Failed to load CSV file: ${response.statusText}`);
      }
      
      const csvContent = await response.text();
      addLog(`✅ קובץ CSV נטען בהצלחה - ${csvContent.length.toLocaleString()} תווים`);
      
      const lines = csvContent.split('\n').length;
      addLog(`📊 מספר שורות בקובץ: ${lines.toLocaleString()}`);

      // Call edge function to import
      addLog("🚀 קורא ל-Edge Function לייבוא...");
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2RrY2Nqd3l5YndnbWt6YXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDcyMDUsImV4cCI6MjA2MzkyMzIwNX0.Jpz2_RIyrr2Bvpu6yrX37Z_Kl5lUhhyLerfa6G2MHJc";
      
      const importResponse = await fetch(
        'https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/import-products-csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ csvContent })
        }
      );

      addLog(`📡 תגובה מה-Edge Function - סטטוס: ${importResponse.status}`);
      const result = await importResponse.json();
      
      if (!importResponse.ok) {
        addLog(`❌ שגיאה מה-Edge Function: ${JSON.stringify(result)}`);
        throw new Error(result.error || result.message || 'Failed to import CSV');
      }

      const statsMsg = result?.stats ? ` (סה"כ: ${result.stats.total}, הוכנסו: ${result.stats.inserted}, דולגו: ${result.stats.skipped})` : '';
      addLog(`✅ ייבוא הצליח! ${result.message}${statsMsg}`);
      addLog("🔄 טוען מחדש את רשימת המוצרים...");
      await loadProducts();
      addLog(`✅ רשימת מוצרים עודכנה - סה"כ ${products.length} מוצרים`);
      toast.success(`${result.message || "הנתונים יובאו בהצלחה!"}${statsMsg}`);
      setIsDialogOpen(false);
    } catch (error) {
      addLog(`❌ שגיאה: ${error.message}`);
      console.error("❌ Error importing CSV:", error);
      toast.error(`שגיאה בייבוא הנתונים: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogs([]);
      setLoading(true);
      addLog(`📥 מתחיל ייבוא קובץ Excel: ${file.name}`);
      addLog(`📂 גודל קובץ: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      addLog(`✅ קובץ Excel נקרא בהצלחה - ${jsonData.length} שורות`);
      
      // Transform Excel data to database format
      const products = jsonData.map((row: any) => ({
        product_code: row['קוד קופה']?.toString() || '',
        company: row['חברה'] || '',
        product_type: row['סוג מוצר'] || '',
        track_name: row['שם קופה'] || '',
        exposure_stocks: parseFloat(row['חשיפה מניות']) || 0,
        exposure_foreign: parseFloat(row['חשיפה חו"ל']) || 0,
        exposure_foreign_currency: parseFloat(row['חשיפה מט"ח']) || 0,
        exposure_government_bonds: parseFloat(row['חשיפה אג"ח ממשלתי']) || 0,
        exposure_corporate_bonds_tradable: parseFloat(row['חשיפה אג"ח קונצרני סחיר']) || 0,
        exposure_corporate_bonds_non_tradable: parseFloat(row['חשיפה אג"ח קונצרני לא סחיר']) || 0,
        exposure_stocks_options: parseFloat(row['חשיפה אופציות מניות']) || 0,
        exposure_deposits: parseFloat(row['חשיפה פיקדונות']) || 0,
        exposure_loans: parseFloat(row['חשיפה הלוואות']) || 0,
        exposure_cash: parseFloat(row['חשיפה מזומנים']) || 0,
        exposure_mutual_funds: parseFloat(row['חשיפה קרנות נאמנות']) || 0,
        exposure_other_assets: parseFloat(row['חשיפה נכסים אחרים']) || 0,
        exposure_liquid_assets: parseFloat(row['חשיפה נכסים נוזלים']) || 0,
        exposure_non_liquid_assets: parseFloat(row['חשיפה נכסים לא נוזלים']) || 0,
        exposure_israel: parseFloat(row['חשיפה ישראל']) || 0,
        exposure_foreign_and_currency: parseFloat(row['חשיפה חו"ל ומט"ח']) || 0,
        source: row['מקור'] || 'Excel Import'
      }));

      addLog(`🔄 מעלה ${products.length} מוצרים למסד הנתונים...`);

      // Delete existing data
      const { error: deleteError } = await supabase
        .from('products_information')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        addLog(`❌ שגיאה במחיקת נתונים קיימים: ${deleteError.message}`);
        throw deleteError;
      }
      addLog('✅ נתונים קיימים נמחקו');

      // Insert new data in batches
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('products_information')
          .upsert(batch, { 
            onConflict: 'product_code',
            ignoreDuplicates: false 
          });

        if (insertError) {
          addLog(`❌ שגיאה בהכנסת באץ' ${i / batchSize}: ${insertError.message}`);
          throw insertError;
        }
        
        inserted += batch.length;
        addLog(`📤 הוכנסו ${inserted}/${products.length} מוצרים`);
      }

      addLog(`✅ ייבוא הצליח! ${products.length} מוצרים הוכנסו`);
      addLog("🔄 טוען מחדש את רשימת המוצרים...");
      await loadProducts();
      addLog(`✅ רשימת מוצרים עודכנה`);
      toast.success(`${products.length} מוצרים יובאו בהצלחה מקובץ Excel!`);
      setIsDialogOpen(false);
    } catch (error) {
      addLog(`❌ שגיאה: ${error.message}`);
      console.error("❌ Error importing Excel:", error);
      toast.error(`שגיאה בייבוא הנתונים: ${error.message}`);
    } finally {
      setLoading(false);
    }

    e.target.value = '';
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogs([]);
      setLoading(true);
      addLog(`📥 מתחיל ייבוא קובץ: ${file.name}`);
      addLog(`📂 גודל קובץ: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Read CSV content
      const text = await file.text();
      addLog(`✅ קובץ נקרא בהצלחה - ${text.length.toLocaleString()} תווים`);
      
      const lines = text.split('\n').length;
      addLog(`📊 מספר שורות בקובץ: ${lines.toLocaleString()}`);
      
      // Call edge function to import
      addLog("🚀 קורא ל-Edge Function לייבוא...");
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2RrY2Nqd3l5YndnbWt6YXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDcyMDUsImV4cCI6MjA2MzkyMzIwNX0.Jpz2_RIyrr2Bvpu6yrX37Z_Kl5lUhhyLerfa6G2MHJc";
      
      const response = await fetch(
        'https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/import-products-csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ csvContent: text })
        }
      );

      addLog(`📡 תגובה מה-Edge Function - סטטוס: ${response.status}`);
      const result = await response.json();
      
      if (!response.ok) {
        addLog(`❌ שגיאה מה-Edge Function: ${JSON.stringify(result)}`);
        throw new Error(result.error || result.message || 'Failed to import CSV');
      }

      const statsMsg2 = result?.stats ? ` (סה"כ: ${result.stats.total}, הוכנסו: ${result.stats.inserted}, דולגו: ${result.stats.skipped})` : '';
      addLog(`✅ ייבוא הצליח! ${result.message}${statsMsg2}`);
      addLog("🔄 טוען מחדש את רשימת המוצרים...");
      await loadProducts();
      addLog(`✅ רשימת מוצרים עודכנה`);
      toast.success(`${result.message || "הנתונים יובאו בהצלחה!"}${statsMsg2}`);
      setIsDialogOpen(false);
    } catch (error) {
      addLog(`❌ שגיאה: ${error.message}`);
      console.error("❌ Error importing CSV:", error);
      toast.error(`שגיאה בייבוא הנתונים: ${error.message}`);
    } finally {
      setLoading(false);
    }

    e.target.value = '';
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      // Fetch all products in batches to bypass 1000-row limit
      const pageSize = 1000;
      let allProducts: ProductInfo[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('products_information')
          .select('*')
          .order('company', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const batch = (data || []) as ProductInfo[];
        allProducts = allProducts.concat(batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      // Prepare data for export with all fields including all exposures
      const exportData = allProducts.map(product => ({
        'קוד קופה': product.product_code,
        'חברה': product.company,
        'סוג מוצר': product.product_type,
        'שם קופה': product.track_name,
        'חשיפה מניות': product.exposure_stocks,
        'חשיפה חו"ל': product.exposure_foreign,
        'חשיפה מט"ח': product.exposure_foreign_currency,
        'חשיפה אג"ח ממשלתי': product.exposure_government_bonds,
        'חשיפה אג"ח קונצרני סחיר': product.exposure_corporate_bonds_tradable,
        'חשיפה אג"ח קונצרני לא סחיר': product.exposure_corporate_bonds_non_tradable,
        'חשיפה אופציות מניות': product.exposure_stocks_options,
        'חשיפה פיקדונות': product.exposure_deposits,
        'חשיפה הלוואות': product.exposure_loans,
        'חשיפה מזומנים': product.exposure_cash,
        'חשיפה קרנות נאמנות': product.exposure_mutual_funds,
        'חשיפה נכסים אחרים': product.exposure_other_assets,
        'חשיפה נכסים נוזלים': product.exposure_liquid_assets,
        'חשיפה נכסים לא נוזלים': product.exposure_non_liquid_assets,
        'חשיפה ישראל': product.exposure_israel,
        'חשיפה חו"ל ומט"ח': product.exposure_foreign_and_currency,
        'מקור': product.source
      }));

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'מוצרים');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `products_information_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      toast.success(`הקובץ יוצא בהצלחה: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('שגיאה בייצוא הקובץ');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל המוצרים?')) return;

    try {
      const { error } = await supabase
        .from('products_information')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      toast.success('כל המוצרים נמחקו בהצלחה');
      loadProducts();
    } catch (error) {
      console.error('Error clearing products:', error);
      toast.error('שגיאה במחיקת המוצרים');
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-4">
      {logs.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">לוג ייבוא נתונים</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
            >
              נקה לוג
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {logs.map((log, index) => (
              <div key={index} className="text-muted-foreground whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {products.length === 0 && !loading && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted mb-4">
          <div className="flex-1">
            <h3 className="font-semibold">טעינת נתוני מוצרים</h3>
            <p className="text-sm text-muted-foreground">
              לחץ לייבוא אוטומטי של נתוני המוצרים מקובץ ה-CSV
            </p>
          </div>
          <Button
            onClick={handleAutoImport}
            disabled={loading}
            variant="default"
          >
            <Upload className="h-4 w-4 ml-2" />
            ייבא נתונים אוטומטית
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="חיפוש לפי חברה, קטגוריה או קוד קופה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Button 
          onClick={handleExportToExcel}
          variant="outline"
        >
          <Download className="h-4 w-4 ml-2" />
          ייצא לאקסל
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              ייבא מקובץ
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>ייבוא מוצרים מקובץ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-import">ייבוא מקובץ Excel (.xlsx)</Label>
                <p className="text-sm text-muted-foreground">
                  העלה קובץ Excel באותו פורמט כמו קובץ הייצוא (עם כותרות בעברית)
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  id="excel-import"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">או</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="csv-import">ייבוא מקובץ CSV</Label>
                <p className="text-sm text-muted-foreground">
                  העלה קובץ CSV עם כל המוצרים והחשיפות
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  id="csv-import"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" onClick={handleClearAll}>
          <Trash2 className="h-4 w-4 ml-2" />
          מחק הכל
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        סך הכל: {products.length} מוצרים | מוצגים: {filteredProducts.length} מוצרים
      </div>

      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">קוד קופה</TableHead>
              <TableHead className="text-right">חברה</TableHead>
              <TableHead className="text-right">סוג מוצר</TableHead>
              <TableHead className="text-right">שם קופה</TableHead>
              <TableHead className="text-right">מניות</TableHead>
              <TableHead className="text-right">חו"ל</TableHead>
              <TableHead className="text-right">מט"ח</TableHead>
              <TableHead className="text-right">אג"ח ממשלתי</TableHead>
              <TableHead className="text-right">מקור</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.product_code}</TableCell>
                <TableCell>{product.company}</TableCell>
                <TableCell>{product.product_type}</TableCell>
                <TableCell>{product.track_name}</TableCell>
                <TableCell>{product.exposure_stocks.toFixed(2)}%</TableCell>
                <TableCell>{product.exposure_foreign.toFixed(2)}%</TableCell>
                <TableCell>{product.exposure_foreign_currency.toFixed(2)}%</TableCell>
                <TableCell>{product.exposure_government_bonds.toFixed(2)}%</TableCell>
                <TableCell>{product.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
