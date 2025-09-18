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

    type SheetCandidate = {
      name: string;
      headers: string[];
      idx: {
        productType: number;
        manufacturer: number;
        product: number;
        accumulation: number;
        depositFee: number;
        accumulationFee: number;
        investmentTrack: number;
        policyNumber: number;
        premium: number;
      };
      savingsCount: number;
      insuranceCount: number;
      dataRows: any[][];
    };

    const candidates: SheetCandidate[] = [];

    const normalize = (v: any) => parseFloat((v ?? '').toString().replace(/[^\d.-]/g, '')) || 0;
    const str = (v: any) => (v ?? '').toString().trim();

    // First pass: collect candidates and estimate counts per sheet
    Object.keys(workbook.Sheets).forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row by requiring both "מוצר" and ("צבירה" or "פרמיה")
      let headerRow = -1;
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (!row) continue;
        const includesProduct = row.some(cell => typeof cell === 'string' && cell.includes('מוצר'));
        const includesAccumulation = row.some(cell => typeof cell === 'string' && cell.includes('צבירה'));
        const includesPremium = row.some(cell => typeof cell === 'string' && cell.includes('פרמיה'));
        if (includesProduct && (includesAccumulation || includesPremium)) {
          headerRow = i;
          break;
        }
      }
      if (headerRow === -1) return;

      const headers = (jsonData[headerRow] as string[]).map(h => String(h || ''));
      const dataRows = jsonData.slice(headerRow + 1) as any[][];

      const getColumnIndex = (keywords: string[]) =>
        headers.findIndex(header => header && keywords.some(keyword => header.toString().includes(keyword)));

      const idx = {
        productType: getColumnIndex(['סוג מוצר']),
        manufacturer: getColumnIndex(['יצרן']),
        product: getColumnIndex(['מוצר']),
        accumulation: getColumnIndex(['צבירה']),
        depositFee: getColumnIndex(['דמי ניהול מהפקדה']),
        accumulationFee: getColumnIndex(['דמי ניהול מצבירה']),
        investmentTrack: getColumnIndex(['מסלולי השקעה', 'מסלול']),
        policyNumber: getColumnIndex(['פוליסה', 'חשבון']),
        premium: getColumnIndex(['פרמיה'])
      };

      let savingsCount = 0;
      let insuranceCount = 0;
      dataRows.forEach(row => {
        const productName = idx.product >= 0 ? str(row[idx.product]) : '';
        if (!productName) return;
        const acc = idx.accumulation >= 0 ? normalize(row[idx.accumulation]) : 0;
        const prem = idx.premium >= 0 ? normalize(row[idx.premium]) : 0;
        if (acc > 0) savingsCount++;
        if (prem > 0) insuranceCount++;
      });

      candidates.push({ name: sheetName, headers, idx, savingsCount, insuranceCount, dataRows });
    });

    // Choose the single best sheet for each category to avoid duplicates
    const savingsSheet = candidates.reduce<SheetCandidate | undefined>((best, c) =>
      c.savingsCount > (best?.savingsCount ?? 0) ? c : best,
    undefined);

    const insuranceSheet = candidates.reduce<SheetCandidate | undefined>((best, c) =>
      c.insuranceCount > (best?.insuranceCount ?? 0) ? c : best,
    undefined);

    // Second pass: extract rows only from the chosen sheets
    if (savingsSheet && savingsSheet.savingsCount > 0) {
      const { idx, dataRows } = savingsSheet;
      dataRows.forEach(row => {
        const productName = idx.product >= 0 ? str(row[idx.product]) : '';
        const accumulation = idx.accumulation >= 0 ? normalize(row[idx.accumulation]) : 0;
        if (!productName || accumulation <= 0) return;
        savings.push({
          productType: idx.productType >= 0 ? str(row[idx.productType]) : '',
          manufacturer: idx.manufacturer >= 0 ? str(row[idx.manufacturer]) : '',
          productName,
          planName: '', // ignore plan name per requirements
          accumulation,
          depositFee: idx.depositFee >= 0 ? normalize(row[idx.depositFee]) : 0,
          accumulationFee: idx.accumulationFee >= 0 ? normalize(row[idx.accumulationFee]) : 0,
          investmentTrack: idx.investmentTrack >= 0 ? str(row[idx.investmentTrack]) : '',
          policyNumber: idx.policyNumber >= 0 ? str(row[idx.policyNumber]) : ''
        });
      });
    }

    if (insuranceSheet && insuranceSheet.insuranceCount > 0) {
      const { idx, dataRows } = insuranceSheet;
      dataRows.forEach(row => {
        const productName = idx.product >= 0 ? str(row[idx.product]) : '';
        const premium = idx.premium >= 0 ? normalize(row[idx.premium]) : 0;
        if (!productName || premium <= 0) return;
        insurance.push({
          productType: idx.productType >= 0 ? str(row[idx.productType]) : '',
          manufacturer: idx.manufacturer >= 0 ? str(row[idx.manufacturer]) : '',
          product: productName,
          premium,
          policyNumber: idx.policyNumber >= 0 ? str(row[idx.policyNumber]) : ''
        });
      });
    }

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
    let productCounter = 0;

    // Generate products from selected savings
    selectedSavings.forEach(index => {
      const savingsProduct = importedData.savings[index];
      if (savingsProduct) {
        productCounter++;
        const product: SelectedProduct = {
          id: `savings-${Date.now()}-${productCounter}`,
          company: savingsProduct.manufacturer,
          productName: savingsProduct.productName || savingsProduct.productType,
          subType: '',
          amount: savingsProduct.accumulation,
          managementFeeOnDeposit: savingsProduct.depositFee || 0,
          managementFeeOnAccumulation: savingsProduct.accumulationFee || 0,
          investmentTrack: savingsProduct.investmentTrack || '',
          riskLevelChange: '',
          notes: savingsProduct.policyNumber || '',
          type: 'current'
        };
        selectedProducts.push(product);
      }
    });

    // Generate products from selected insurance
    selectedInsurance.forEach(index => {
      const insuranceProduct = importedData.insurance[index];
      if (insuranceProduct) {
        productCounter++;
        const product: SelectedProduct = {
          id: `insurance-${Date.now()}-${productCounter}`,
          company: insuranceProduct.manufacturer,
          productName: insuranceProduct.product || insuranceProduct.productType,
          subType: '',
          amount: insuranceProduct.premium,
          managementFeeOnDeposit: 0,
          managementFeeOnAccumulation: 0,
          investmentTrack: '',
          riskLevelChange: '',
          notes: insuranceProduct.policyNumber || '',
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