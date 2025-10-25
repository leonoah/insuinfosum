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
import { Upload, Search, Trash2 } from "lucide-react";

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
      const { data, error } = await supabase
        .from('products_information')
        .select('*')
        .order('company', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
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

  const handleAutoImport = async () => {
    try {
      setLoading(true);
      toast.info("מתחיל ייבוא נתונים...");

      // Load CSV file from data directory
      const response = await fetch('/src/data/all_funds_exposures_wide.csv');
      const csvContent = await response.text();

      // Call edge function to import
      const importResponse = await fetch(
        'https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/import-products-csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvContent })
        }
      );

      const result = await importResponse.json();
      
      if (!importResponse.ok) {
        throw new Error(result.error || 'Failed to import CSV');
      }

      await loadProducts();
      toast.success(result.message || "הנתונים יובאו בהצלחה!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("שגיאה בייבוא הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Read CSV content
      const text = await file.text();
      
      // Call edge function to import
      const response = await fetch(
        'https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/import-products-csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvContent: text })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import CSV');
      }

      await loadProducts();
      toast.success(result.message || "הנתונים יובאו בהצלחה!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("שגיאה בייבוא הנתונים");
    } finally {
      setLoading(false);
    }

    e.target.value = '';
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              ייבא מ-CSV
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>ייבוא מוצרים מקובץ CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                העלה את קובץ ה-CSV עם כל המוצרים והחשיפות. הקובץ צריך להכיל את העמודות הבאות:
                סוג מוצר, שם קופה, שם חברה, קוד קופה, וכל נתוני החשיפה.
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                id="csv-import"
              />
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
