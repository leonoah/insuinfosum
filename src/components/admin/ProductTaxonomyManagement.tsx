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
import { Pencil, Trash2, Plus, Upload, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface ProductTaxonomyItem {
  id: string;
  company: string;
  category: string;
  sub_category: string;
  exposure_stocks: number;
  exposure_bonds: number;
  exposure_foreign_currency: number;
  exposure_foreign_investments: number;
}

export const ProductTaxonomyManagement = () => {
  const [products, setProducts] = useState<ProductTaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductTaxonomyItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    category: "",
    sub_category: "",
    exposure_stocks: 0,
    exposure_bonds: 0,
    exposure_foreign_currency: 0,
    exposure_foreign_investments: 0,
  });

  // Get unique values for dropdowns
  const uniqueCompanies = Array.from(new Set(products.map(p => p.company))).sort();
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();
  const uniqueSubCategories = Array.from(new Set(products.map(p => p.sub_category))).sort();

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products_taxonomy')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products_taxonomy')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('המוצר עודכן בהצלחה');
      } else {
        const { error } = await supabase
          .from('products_taxonomy')
          .insert([formData]);

        if (error) throw error;
        toast.success('המוצר נוסף בהצלחה');
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('שגיאה בשמירת המוצר');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

    try {
      const { error } = await supabase
        .from('products_taxonomy')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('המוצר נמחק בהצלחה');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('שגיאה במחיקת המוצר');
    }
  };

  const handleEdit = (product: ProductTaxonomyItem) => {
    setEditingProduct(product);
    setFormData({
      company: product.company,
      category: product.category,
      sub_category: product.sub_category,
      exposure_stocks: product.exposure_stocks,
      exposure_bonds: product.exposure_bonds,
      exposure_foreign_currency: product.exposure_foreign_currency,
      exposure_foreign_investments: product.exposure_foreign_investments,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      company: "",
      category: "",
      sub_category: "",
      exposure_stocks: 0,
      exposure_bonds: 0,
      exposure_foreign_currency: 0,
      exposure_foreign_investments: 0,
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

      const productsToInsert = jsonData.map((row: any) => ({
        company: row['חברה'] || row['company'] || '',
        category: row['קטגוריה'] || row['category'] || '',
        sub_category: row['תת קטגוריה'] || row['sub_category'] || '',
        exposure_stocks: parseFloat(row['חשיפה מניות'] || row['exposure_stocks'] || 0),
        exposure_bonds: parseFloat(row['חשיפה אגח'] || row['exposure_bonds'] || 0),
        exposure_foreign_currency: parseFloat(row['חשיפה מטח'] || row['exposure_foreign_currency'] || 0),
        exposure_foreign_investments: parseFloat(row['חשיפה השקעות חול'] || row['exposure_foreign_investments'] || 0),
      }));

      const { error } = await supabase
        .from('products_taxonomy')
        .insert(productsToInsert);

      if (error) throw error;

      toast.success(`${productsToInsert.length} מוצרים יובאו בהצלחה`);
      loadProducts();
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error('שגיאה בייבוא הקובץ');
    }

    e.target.value = '';
  };

  const handleExportTemplate = () => {
    const template = [
      {
        'חברה': 'דוגמא לחברה',
        'קטגוריה': 'דוגמא לקטגוריה',
        'תת קטגוריה': 'דוגמא לתת קטגוריה',
        'חשיפה מניות': 50,
        'חשיפה אגח': 30,
        'חשיפה מטח': 10,
        'חשיפה השקעות חול': 10
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products_taxonomy_template.xlsx');
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
              הוסף מוצר חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'ערוך מוצר' : 'הוסף מוצר חדש'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>חברה</Label>
                  <Input
                    list="companies-list"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                    placeholder="בחר מהרשימה או הקלד חדש"
                  />
                  <datalist id="companies-list">
                    {uniqueCompanies.map((company) => (
                      <option key={company} value={company} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label>קטגוריה</Label>
                  <Input
                    list="categories-list"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    placeholder="בחר מהרשימה או הקלד חדש"
                  />
                  <datalist id="categories-list">
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label>תת קטגוריה</Label>
                  <Input
                    list="sub-categories-list"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    required
                    placeholder="בחר מהרשימה או הקלד חדש"
                  />
                  <datalist id="sub-categories-list">
                    {uniqueSubCategories.map((subCategory) => (
                      <option key={subCategory} value={subCategory} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label>חשיפה מניות (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exposure_stocks}
                    onChange={(e) => setFormData({ ...formData, exposure_stocks: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>חשיפה אג"ח (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exposure_bonds}
                    onChange={(e) => setFormData({ ...formData, exposure_bonds: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>חשיפה מט"ח (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exposure_foreign_currency}
                    onChange={(e) => setFormData({ ...formData, exposure_foreign_currency: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>חשיפה השקעות חו"ל (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exposure_foreign_investments}
                    onChange={(e) => setFormData({ ...formData, exposure_foreign_investments: parseFloat(e.target.value) || 0 })}
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
            id="excel-import"
          />
          <Label htmlFor="excel-import" className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 ml-2" />
                ייבא מאקסל
              </span>
            </Button>
          </Label>
        </div>

        <Button type="button" variant="outline" onClick={handleExportTemplate}>
          <Download className="h-4 w-4 ml-2" />
          הורד דוגמת אקסל
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">חברה</TableHead>
              <TableHead className="text-right">קטגוריה</TableHead>
              <TableHead className="text-right">תת קטגוריה</TableHead>
              <TableHead className="text-right">מניות (%)</TableHead>
              <TableHead className="text-right">אג"ח (%)</TableHead>
              <TableHead className="text-right">מט"ח (%)</TableHead>
              <TableHead className="text-right">חו"ל (%)</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.company}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.sub_category}</TableCell>
                <TableCell>{product.exposure_stocks}</TableCell>
                <TableCell>{product.exposure_bonds}</TableCell>
                <TableCell>{product.exposure_foreign_currency}</TableCell>
                <TableCell>{product.exposure_foreign_investments}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
