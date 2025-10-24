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
import Papa from "papaparse";

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

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        encoding: 'UTF-8',
        complete: async (results) => {
          const productsToInsert = results.data
            .filter((row: any) => row['קוד קופה']) // רק שורות עם קוד קופה
            .map((row: any) => ({
              product_type: row['סוג מוצר'] || '',
              track_name: row['שם קופה'] || '',
              company: row['שם חברה'] || '',
              product_code: String(row['קוד קופה'] || '').trim(),
              exposure_stocks: parsePercentage(row['חשיפה למניות']),
              exposure_foreign: parsePercentage(row['חשיפה לחו"ל']),
              exposure_foreign_currency: parsePercentage(row['חשיפה למט"ח']),
              exposure_government_bonds: parsePercentage(row['אג"ח ממשלתיות סחירות']),
              exposure_corporate_bonds_tradable: parsePercentage(row['אג"ח קונצרני סחיר ותעודות סל אג"חיות']),
              exposure_corporate_bonds_non_tradable: parsePercentage(row['אג"ח קונצרניות לא סחירות']),
              exposure_stocks_options: parsePercentage(row['מניות, אופציות ותעודות סל מנייתיות']),
              exposure_deposits: parsePercentage(row['פיקדונות']),
              exposure_loans: parsePercentage(row['הלוואות']),
              exposure_cash: parsePercentage(row['מזומנים ושווי מזומנים']),
              exposure_mutual_funds: parsePercentage(row['קרנות נאמנות']),
              exposure_other_assets: parsePercentage(row['נכסים אחרים']),
              exposure_liquid_assets: parsePercentage(row['נכסים סחירים ונזילים']),
              exposure_non_liquid_assets: parsePercentage(row['נכסים לא סחירים']),
              exposure_israel: parsePercentage(row['נכסים בארץ']),
              exposure_foreign_and_currency: parsePercentage(row['נכסים בחו"ל ובמט"ח']),
              source: row['מקור'] || 'csv',
            }));

          // מחיקת הטבלה הקיימת וייבוא מחדש
          const { error: deleteError } = await supabase
            .from('products_information')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // מחק הכל

          if (deleteError) {
            console.error('Error deleting old products:', deleteError);
          }

          // הוספת המוצרים החדשים
          const { error } = await supabase
            .from('products_information')
            .insert(productsToInsert);

          if (error) throw error;

          toast.success(`${productsToInsert.length} מוצרים יובאו בהצלחה`);
          loadProducts();
          setIsDialogOpen(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast.error('שגיאה בפענוח הקובץ');
        }
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('שגיאה בייבוא הקובץ');
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
