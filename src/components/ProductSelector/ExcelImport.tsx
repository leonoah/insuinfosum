import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectedProduct } from '@/types/insurance';
import * as XLSX from 'xlsx';

interface ExcelData {
  savings: SavingsProduct[];
  insurance: InsuranceProduct[];
  kpis: KPIData;
}

interface SavingsProduct {
  productType: string;
  manufacturer: string;
  productName: string;
  planName: string;
  accumulation: number;
  depositFee: number;
  accumulationFee: number;
  investmentTrack: string;
  policyNumber: string;
}

interface InsuranceProduct {
  productType: string;
  manufacturer: string;
  product: string;
  premium: number;
  policyNumber: string;
}

interface KPIData {
  savingsProductCount: number;
  totalAccumulation: number;
  avgAccumulationFee: number;
  avgDepositFee: number;
  insurancePolicyCount: number;
  totalMonthlyPremium: number;
}

interface ExcelImportProps {
  onDataImported: (data: ExcelData) => void;
  onProductsSelected: (products: SelectedProduct[]) => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onDataImported, onProductsSelected }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importedData, setImportedData] = useState<ExcelData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSavings, setSelectedSavings] = useState<Set<number>>(new Set());
  const [selectedInsurance, setSelectedInsurance] = useState<Set<number>>(new Set());
  const [showProductSelection, setShowProductSelection] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus('idle');
    setErrorMessage('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      
      const processedData = await processExcelData(workbook);
      
      setImportedData(processedData);
      setImportStatus('success');
      setShowProductSelection(true);
      onDataImported(processedData);
      
    } catch (error) {
      console.error('Excel import error:', error);
      setErrorMessage('שגיאה בעיבוד הקובץ. אנא וודא שהקובץ תקין וכולל את הנתונים הנדרשים.');
      setImportStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcelData = async (workbook: XLSX.WorkBook): Promise<ExcelData> => {
    const savings: SavingsProduct[] = [];
    const insurance: InsuranceProduct[] = [];

    // Process all sheets looking for relevant data
    Object.keys(workbook.Sheets).forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row and data
      let headerRow = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (row && row.some(cell => 
          typeof cell === 'string' && 
          (cell.includes('סוג מוצר') || cell.includes('צבירה') || cell.includes('פרמיה'))
        )) {
          headerRow = i;
          break;
        }
      }

      if (headerRow === -1) return;

      const headers = jsonData[headerRow] as string[];
      const dataRows = jsonData.slice(headerRow + 1) as any[][];

      // Map column indices
      const getColumnIndex = (keywords: string[]) => {
        return headers.findIndex(header => 
          header && keywords.some(keyword => 
            header.toString().includes(keyword)
          )
        );
      };

      const productTypeIndex = getColumnIndex(['סוג מוצר']);
      const manufacturerIndex = getColumnIndex(['יצרן']);
      const productIndex = getColumnIndex(['מוצר']);
      const planNameIndex = getColumnIndex(['שם תוכנית']);
      const accumulationIndex = getColumnIndex(['צבירה']);
      const depositFeeIndex = getColumnIndex(['דמי ניהול מהפקדה']);
      const accumulationFeeIndex = getColumnIndex(['דמי ניהול מצבירה']);
      const investmentTrackIndex = getColumnIndex(['מסלולי השקעה']);
      const policyNumberIndex = getColumnIndex(['פוליסה', 'חשבון']);
      const premiumIndex = getColumnIndex(['פרמיה']);

      // Process data rows
      dataRows.forEach(row => {
        if (!row || row.length === 0) return;

        const productType = row[productTypeIndex]?.toString().trim() || '';
        if (!productType) return;

        // Check if it's a savings product
        if (productType.includes('קופת גמל') || 
            productType.includes('קרן פנסיה') || 
            productType.includes('קרן השתלמות')) {
          
          const accumulation = parseFloat(
            row[accumulationIndex]?.toString().replace(/[₪,\s]/g, '') || '0'
          );
          
          if (accumulation > 0) {
            savings.push({
              productType,
              manufacturer: row[manufacturerIndex]?.toString() || '',
              productName: row[productIndex]?.toString() || '',
              planName: row[planNameIndex]?.toString() || '',
              accumulation,
              depositFee: parseFloat(
                row[depositFeeIndex]?.toString().replace('%', '') || '0'
              ),
              accumulationFee: parseFloat(
                row[accumulationFeeIndex]?.toString().replace('%', '') || '0'
              ),
              investmentTrack: row[investmentTrackIndex]?.toString() || '',
              policyNumber: row[policyNumberIndex]?.toString() || ''
            });
          }
        }

        // Check if it's an insurance product (if premium exists)
        if (premiumIndex !== -1 && row[premiumIndex]) {
          const premium = parseFloat(
            row[premiumIndex]?.toString().replace(/[₪,\s]/g, '') || '0'
          );
          
          if (premium > 0) {
            insurance.push({
              productType,
              manufacturer: row[manufacturerIndex]?.toString() || '',
              product: row[productIndex]?.toString() || '',
              premium,
              policyNumber: row[policyNumberIndex]?.toString() || ''
            });
          }
        }
      });
    });

    // Calculate KPIs
    const kpis = calculateKPIs(savings, insurance);

    return { savings, insurance, kpis };
  };

  const handleSavingsSelection = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedSavings);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedSavings(newSelected);
  };

  const handleInsuranceSelection = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedInsurance);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedInsurance(newSelected);
  };

  const handleGenerateCurrentState = () => {
    if (!importedData) return;

    const selectedProducts: SelectedProduct[] = [];

    // Generate products from selected savings
    selectedSavings.forEach(index => {
      const savingsProduct = importedData.savings[index];
      if (savingsProduct) {
        const product: SelectedProduct = {
          id: `savings-${Date.now()}-${index}`,
          company: savingsProduct.manufacturer,
          productName: savingsProduct.productName,
          subType: savingsProduct.planName || 'כללי',
          amount: savingsProduct.accumulation,
          managementFeeOnDeposit: savingsProduct.depositFee,
          managementFeeOnAccumulation: savingsProduct.accumulationFee,
          investmentTrack: savingsProduct.investmentTrack || 'כללי',
          riskLevelChange: '',
          notes: `מס' פוליסה: ${savingsProduct.policyNumber}`,
          type: 'current'
        };
        selectedProducts.push(product);
      }
    });

    // Generate products from selected insurance
    selectedInsurance.forEach(index => {
      const insuranceProduct = importedData.insurance[index];
      if (insuranceProduct) {
        const product: SelectedProduct = {
          id: `insurance-${Date.now()}-${index}`,
          company: insuranceProduct.manufacturer,
          productName: insuranceProduct.product,
          subType: 'ביטוח',
          amount: insuranceProduct.premium * 12, // Convert monthly to yearly
          managementFeeOnDeposit: 0,
          managementFeeOnAccumulation: 0,
          investmentTrack: 'לא רלוונטי',
          riskLevelChange: '',
          notes: `פרמיה חודשית: ${insuranceProduct.premium} ₪ | פוליסה: ${insuranceProduct.policyNumber}`,
          type: 'current'
        };
        selectedProducts.push(product);
      }
    });

    onProductsSelected(selectedProducts);
  };

  const calculateKPIs = (savings: SavingsProduct[], insurance: InsuranceProduct[]): KPIData => {
    const totalAccumulation = savings.reduce((sum, product) => sum + product.accumulation, 0);
    
    // Weighted average accumulation fee
    const weightedAccumulationFee = savings.reduce((sum, product) => {
      return sum + (product.accumulationFee * product.accumulation);
    }, 0) / (totalAccumulation || 1);

    // Simple average deposit fee
    const avgDepositFee = savings.reduce((sum, product) => sum + product.depositFee, 0) / (savings.length || 1);
    
    const totalMonthlyPremium = insurance.reduce((sum, product) => sum + product.premium, 0);

    return {
      savingsProductCount: savings.length,
      totalAccumulation,
      avgAccumulationFee: weightedAccumulationFee,
      avgDepositFee,
      insurancePolicyCount: insurance.length,
      totalMonthlyPremium
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייבוא מצב קיים מאקסל
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">העלה קובץ אקסל</p>
              <p className="text-sm text-muted-foreground">
                המערכת תזהה אוטומטית טאבים של מוצרי חיסכון וביטוח
              </p>
              <div className="pt-4">
                <label className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    disabled={isProcessing}
                    asChild
                  >
                    <span>
                      {isProcessing ? 'מעבד קובץ...' : 'בחר קובץ'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {importStatus === 'success' && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                הקובץ יובא בהצלחה! נמצאו {importedData?.savings.length || 0} מוצרי חיסכון
                {importedData?.insurance.length ? ` ו-${importedData.insurance.length} מוצרי ביטוח` : ''}
              </AlertDescription>
            </Alert>
          )}

          {importStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* KPIs Display */}
      {importedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {importedData.kpis.savingsProductCount}
                </div>
                <div className="text-sm text-muted-foreground">מוצרי חיסכון</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(importedData.kpis.totalAccumulation)}
                </div>
                <div className="text-sm text-muted-foreground">סך צבירה</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatPercentage(importedData.kpis.avgAccumulationFee)}
                </div>
                <div className="text-sm text-muted-foreground">דמי ניהול ממוצעים מצבירה</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatPercentage(importedData.kpis.avgDepositFee)}
                </div>
                <div className="text-sm text-muted-foreground">דמי ניהול ממוצעים מהפקדה</div>
              </div>
            </CardContent>
          </Card>

          {importedData.kpis.insurancePolicyCount > 0 && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {importedData.kpis.insurancePolicyCount}
                    </div>
                    <div className="text-sm text-muted-foreground">פוליסות ביטוח</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(importedData.kpis.totalMonthlyPremium)}
                    </div>
                    <div className="text-sm text-muted-foreground">סך פרמיה חודשית</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Data Preview */}
      {importedData && importedData.savings.length > 0 && showProductSelection && (
        <Card>
          <CardHeader>
            <CardTitle>בחירת מוצרי חיסכון - מצב קיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importedData.savings.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedSavings.has(index)}
                      onCheckedChange={(checked) => handleSavingsSelection(index, checked as boolean)}
                    />
                    <div className="space-y-1">
                      <div className="font-medium">{product.productType}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.manufacturer} | {product.productName}
                      </div>
                      {product.planName && (
                        <Badge variant="outline">{product.planName}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="font-bold">{formatCurrency(product.accumulation)}</div>
                    <div className="text-xs text-muted-foreground">
                      דמי ניהול: {formatPercentage(product.accumulationFee)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Selection */}
      {importedData && importedData.insurance.length > 0 && showProductSelection && (
        <Card>
          <CardHeader>
            <CardTitle>בחירת מוצרי ביטוח - מצב קיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importedData.insurance.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedInsurance.has(index)}
                      onCheckedChange={(checked) => handleInsuranceSelection(index, checked as boolean)}
                    />
                    <div className="space-y-1">
                      <div className="font-medium">{product.productType}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.manufacturer} | {product.product}
                      </div>
                    </div>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="font-bold">{formatCurrency(product.premium)}</div>
                    <div className="text-xs text-muted-foreground">פרמיה חודשית</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Current State Button */}
      {showProductSelection && (selectedSavings.size > 0 || selectedInsurance.size > 0) && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium">
                נבחרו {selectedSavings.size} מוצרי חיסכון ו-{selectedInsurance.size} מוצרי ביטוח
              </div>
              <Button 
                onClick={handleGenerateCurrentState}
                className="w-full"
                size="lg"
              >
                צור מצב קיים
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview - Old version, keep for when not in selection mode */}
      {importedData && importedData.savings.length > 0 && !showProductSelection && (
        <Card>
          <CardHeader>
            <CardTitle>תצוגה מקדימה - מוצרי חיסכון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importedData.savings.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{product.productType}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.manufacturer} | {product.productName}
                    </div>
                    {product.planName && (
                      <Badge variant="outline">{product.planName}</Badge>
                    )}
                  </div>
                  <div className="text-left space-y-1">
                    <div className="font-bold">{formatCurrency(product.accumulation)}</div>
                    <div className="text-xs text-muted-foreground">
                      דמי ניהול: {formatPercentage(product.accumulationFee)}
                    </div>
                  </div>
                </div>
              ))}
              {importedData.savings.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  ועוד {importedData.savings.length - 5} מוצרים...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelImport;