import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, FileText, Eye, Plus, Loader2, CheckCircle } from "lucide-react";
import { PensionParser } from "@/utils/pensionParser";
import { PensionFileData, PensionProduct } from "@/types/pension";
import { SelectedProduct } from "@/types/products";

interface PensionFileImportProps {
  onProductsSelected: (products: SelectedProduct[]) => void;
  onClose: () => void;
}

const PensionFileImport = ({ onProductsSelected, onClose }: PensionFileImportProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pensionData, setPensionData] = useState<PensionFileData | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showProductDetails, setShowProductDetails] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await PensionParser.parsePensionFile(file);
      setPensionData(data);
      setShowProductDetails(true);
      
      const fileCount = file.name.toLowerCase().endsWith('.zip') ? 'מקבצים מרובים' : 'מהקובץ';
      toast({
        title: "הקובץ נפרש בהצלחה",
        description: `נמצאו ${data?.summary.products.length} מוצרים ${fileCount}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בקריאת הקובץ",
        description: error instanceof Error ? error.message : "לא ניתן לפרש את הקובץ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSampleData = () => {
    setPensionData(PensionParser.samplePensionData);
    setShowProductDetails(true);
    
    toast({
      title: "נטענו נתונים לדוגמה",
      description: `נמצאו ${PensionParser.samplePensionData.summary.products.length} מוצרים במסלקה`,
    });
  };

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (!pensionData) return;
    
    if (selectedProducts.size === pensionData.summary.products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(pensionData.summary.products.map(p => p.id)));
    }
  };

  const handleImportSelected = () => {
    if (!pensionData || selectedProducts.size === 0) return;

    const productsToImport = pensionData.summary.products
      .filter(product => selectedProducts.has(product.id))
      .map(product => {
        const basicProduct = PensionParser.convertPensionProductToInsuranceProduct(product);
        
        // כעת נבצע התאמה חכמה עם מספר קופה
        // (הלוגיקה כבר נמצאת ב-ExcelImport, אבל כאן נדאג שה-productNumber מועבר)
        return {
          ...basicProduct,
          productNumber: product.policyNumber // משתמשים במספר פוליסה כמספר קופה
        };
      });

    onProductsSelected(productsToImport);
    
    toast({
      title: "המוצרים יובאו בהצלחה",
      description: `${productsToImport.length} מוצרים נוספו למצב הקיים`,
    });

    onClose();
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'פעיל' ? 'default' : 'secondary';
  };

  const getProductTypeColor = (type: string) => {
    const colors = {
      'קרן השתלמות': 'text-blue-600',
      'קופת גמל': 'text-green-600',
      'חברת ביטוח': 'text-purple-600',
      'קרן פנסיה חדשה': 'text-orange-600',
      'ביטוח משכנתא': 'text-red-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  if (!showProductDetails) {
    return (
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            טעינת נתונים ממסלקה פנסיונית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="border-2 border-dashed border-glass-border rounded-lg p-8 hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.xml,.zip"
                onChange={handleFileUpload}
                className="hidden"
                id="pension-file-upload"
                disabled={isLoading}
              />
              <Label
                htmlFor="pension-file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                ) : (
                  <DollarSign className="w-12 h-12 text-muted-foreground" />
                )}
                <div className="text-center">
                  <div className="font-medium">
                    {isLoading ? "מפרש קובץ..." : "העלה קובץ מסלקה פנסיונית"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    קבצי PDF, XML או ZIP (עם מספר XMLs)
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">או</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              onClick={handleUseSampleData}
              disabled={isLoading}
              className="w-full"
            >
              <Eye className="w-4 h-4 ml-2" />
              השתמש בנתונים לדוגמה
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• הקובץ יפורש אוטומטית ויציג את המוצרים הקיימים</p>
            <p>• ניתן לבחור אילו מוצרים לייבא למערכת</p>
            <p>• המידע יועבר למצב הקיים בבחירת המוצרים</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pensionData) return null;

  const { summary } = pensionData;

  return (
    <Card className="glass border-glass-border max-w-4xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          מסלקה פנסיונית - {summary.clientName}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          תאריך דוח: {summary.reportDate} • {summary.products.length} מוצרים נמצאו
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* סיכום כללי */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary.totalByType).map(([type, amount]) => (
            <div key={type} className="text-center space-y-1">
              <div className={`text-sm font-medium ${getProductTypeColor(type)}`}>
                {type}
              </div>
              <div className="text-lg font-bold">
                ₪{amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* רשימת מוצרים */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">בחירת מוצרים לייבוא</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedProducts.size === summary.products.length ? "בטל הכל" : "בחר הכל"}
            </Button>
          </div>

          <ScrollArea className="h-80 w-full rounded-md border border-glass-border p-4">
            <div className="space-y-3">
              {summary.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg border border-glass-border/50 hover:bg-muted/20 transition-colors"
                >
                  <Checkbox
                    id={product.id}
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => handleProductToggle(product.id)}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={product.id}
                        className="font-medium cursor-pointer"
                      >
                        {product.company} - {product.productType}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(product.status)}>
                          {product.status}
                        </Badge>
                        <span className="font-bold">
                          ₪{product.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>פוליסה: {product.policyNumber}</div>
                      {product.managementFeeFromBalance > 0 && (
                        <div>דמי ניהול: {product.managementFeeFromBalance}%</div>
                      )}
                      {product.annualReturn > 0 && (
                        <div>תשואה: {product.annualReturn}%</div>
                      )}
                      {product.projectedMonthlyPension && (
                        <div>קצבה צפויה: ₪{product.projectedMonthlyPension.toLocaleString()}</div>
                      )}
                    </div>

                    {product.lastDeposit && (
                      <div className="text-xs text-muted-foreground">
                        הפקדה אחרונה: עובד ₪{product.lastDeposit.employee.toLocaleString()} 
                        {product.lastDeposit.employer > 0 && ` | מעסיק ₪${product.lastDeposit.employer.toLocaleString()}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <Button
            onClick={handleImportSelected}
            disabled={selectedProducts.size === 0}
            className="flex-1"
          >
            <Plus className="w-4 h-4 ml-2" />
            ייבא {selectedProducts.size} מוצרים נבחרים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PensionFileImport;