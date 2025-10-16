import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectedProduct } from '@/types/products';
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
    setSelectedSavings(new Set());
    setSelectedInsurance(new Set());

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
    const normalizeText = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      return value
        .toString()
        .replace(/[\u200E\u200F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const parseNumber = (value: unknown): number => {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
      const cleaned = value
        .toString()
        .replace(/[₪,\s]/g, '')
        .replace(/\u00A0/g, '')
        .replace(/,/g, '')
        .replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parsePercentage = (value: unknown): number => {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
      const cleaned = value
        .toString()
        .replace('%', '')
        .replace(/,/g, '.')
        .replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const savingsMap = new Map<string, SavingsProduct>();
    const insuranceMap = new Map<string, InsuranceProduct>();

    const sheetEntries = Object.entries(workbook.Sheets);

    const findHeaderRow = (rows: any[][], requiredColumns: string[][]) => {
      for (let i = 0; i < Math.min(40, rows.length); i++) {
        const row = rows[i];
        if (!row) continue;
        const normalizedRow = row.map(cell => normalizeText(cell));
        const hasRequired = requiredColumns.every(columnKeywords =>
          columnKeywords.some(keyword =>
            normalizedRow.some(header => header.includes(keyword))
          )
        );

        if (hasRequired) {
          return { index: i, headers: normalizedRow };
        }
      }
      return null;
    };

    const getColumnIndex = (headers: string[], keywords: string[]) =>
      headers.findIndex(header =>
        header && keywords.some(keyword => header.includes(keyword))
      );

    sheetEntries.forEach(([sheetName, worksheet]) => {
      if (!worksheet) return;

      const normalizedSheetName = normalizeText(sheetName);
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!rows.length) return;

      if (normalizedSheetName.includes('חיסכון')) {
        const headerInfo = findHeaderRow(rows, [
          ['מוצר', 'סוג מוצר'],
          ['צבירה']
        ]);

        if (!headerInfo) return;

        const { index: headerRowIndex, headers } = headerInfo;
        const dataRows = rows.slice(headerRowIndex + 1);

        const idx = {
          productType: getColumnIndex(headers, ['סוג מוצר', 'קטגוריה', 'מסלול']),
          product: getColumnIndex(headers, ['מוצר', 'שם מוצר']),
          planName: getColumnIndex(headers, ['שם תוכנית', 'שם תכנית', 'תוכנית', 'תכנית']),
          manufacturer: getColumnIndex(headers, ['יצרן', 'חברה', 'ספק']),
          accumulation: getColumnIndex(headers, ['צבירה']),
          depositFee: getColumnIndex(headers, ['דמי ניהול מהפקדה']),
          accumulationFee: getColumnIndex(headers, ['דמי ניהול מצבירה']),
          investmentTrack: getColumnIndex(headers, ['מסלולי השקעה', 'מסלול השקעה']),
          policyNumber: getColumnIndex(headers, ['פוליסה', 'מספר חשבון', 'מספר פוליסה'])
        };

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;

          const productName = idx.product >= 0 ? normalizeText(row[idx.product]) : '';
          const accumulation = idx.accumulation >= 0 ? parseNumber(row[idx.accumulation]) : 0;

          if (!productName && accumulation === 0) {
            return;
          }

          const savingsProduct: SavingsProduct = {
            productType: idx.productType >= 0 ? normalizeText(row[idx.productType]) : '',
            manufacturer: idx.manufacturer >= 0 ? normalizeText(row[idx.manufacturer]) : '',
            productName,
            planName: idx.planName >= 0 ? normalizeText(row[idx.planName]) : '',
            accumulation,
            depositFee: idx.depositFee >= 0 ? parsePercentage(row[idx.depositFee]) : 0,
            accumulationFee: idx.accumulationFee >= 0 ? parsePercentage(row[idx.accumulationFee]) : 0,
            investmentTrack: idx.investmentTrack >= 0 ? normalizeText(row[idx.investmentTrack]) : '',
            policyNumber: idx.policyNumber >= 0 ? normalizeText(row[idx.policyNumber]) : ''
          };

          const key = [
            savingsProduct.productName,
            savingsProduct.planName,
            savingsProduct.manufacturer,
            savingsProduct.policyNumber
          ].join('|');

          if (!savingsMap.has(key)) {
            savingsMap.set(key, savingsProduct);
          } else {
            const existing = savingsMap.get(key)!;
            existing.accumulation = Math.max(existing.accumulation, savingsProduct.accumulation);
            if (!existing.depositFee && savingsProduct.depositFee) {
              existing.depositFee = savingsProduct.depositFee;
            }
            if (!existing.accumulationFee && savingsProduct.accumulationFee) {
              existing.accumulationFee = savingsProduct.accumulationFee;
            }
            if (!existing.investmentTrack && savingsProduct.investmentTrack) {
              existing.investmentTrack = savingsProduct.investmentTrack;
            }
            if (!existing.planName && savingsProduct.planName) {
              existing.planName = savingsProduct.planName;
            }
            if (!existing.manufacturer && savingsProduct.manufacturer) {
              existing.manufacturer = savingsProduct.manufacturer;
            }
          }
        });
      }

      if (normalizedSheetName.includes('ביטוח')) {
        const headerInfo = findHeaderRow(rows, [
          ['סוג מוצר'],
          ['מוצר'],
          ['פרמיה']
        ]);

        if (!headerInfo) return;

        const { index: headerRowIndex, headers } = headerInfo;
        const dataRows = rows.slice(headerRowIndex + 1);

        const idx = {
          productType: getColumnIndex(headers, ['סוג מוצר']),
          manufacturer: getColumnIndex(headers, ['יצרן', 'חברה', 'ספק']),
          product: getColumnIndex(headers, ['מוצר', 'שם מוצר']),
          premium: getColumnIndex(headers, ['פרמיה', 'פרמיה חודשית']),
          policyNumber: getColumnIndex(headers, ['פוליסה', 'מספר פוליסה'])
        };

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;

          const productName = idx.product >= 0 ? normalizeText(row[idx.product]) : '';
          const premium = idx.premium >= 0 ? parseNumber(row[idx.premium]) : 0;

          if (!productName && premium === 0) {
            return;
          }

          const insuranceProduct: InsuranceProduct = {
            productType: idx.productType >= 0 ? normalizeText(row[idx.productType]) : '',
            manufacturer: idx.manufacturer >= 0 ? normalizeText(row[idx.manufacturer]) : '',
            product: productName,
            premium,
            policyNumber: idx.policyNumber >= 0 ? normalizeText(row[idx.policyNumber]) : ''
          };

          const key = [
            insuranceProduct.productType,
            insuranceProduct.manufacturer,
            insuranceProduct.product,
            insuranceProduct.policyNumber
          ].join('|');

          if (!insuranceMap.has(key)) {
            insuranceMap.set(key, insuranceProduct);
          } else {
            const existing = insuranceMap.get(key)!;
            existing.premium = Math.max(existing.premium, insuranceProduct.premium);
            if (!existing.manufacturer && insuranceProduct.manufacturer) {
              existing.manufacturer = insuranceProduct.manufacturer;
            }
          }
        });
      }
    });

    const savings = Array.from(savingsMap.values());
    const insurance = Array.from(insuranceMap.values());

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
        const notesParts = [
          savingsProduct.planName ? `תוכנית: ${savingsProduct.planName}` : '',
          savingsProduct.policyNumber ? `פוליסה: ${savingsProduct.policyNumber}` : ''
        ].filter(Boolean);

        const baseCategory =
          toBaseSavingsCategory(savingsProduct.productType || savingsProduct.productName) ||
          toBaseSavingsCategory(savingsProduct.productName) ||
          toBaseSavingsCategory(savingsProduct.planName);

        const product: SelectedProduct = {
          id: `savings-${Date.now()}-${productCounter}`,
          category: baseCategory || (savingsProduct.productName || savingsProduct.productType || 'מוצר חיסכון'),
          subCategory: savingsProduct.planName || savingsProduct.productType || '',
          company: savingsProduct.manufacturer || savingsProduct.productType || 'לא צוין',
          amount: savingsProduct.accumulation,
          managementFeeOnDeposit: savingsProduct.depositFee || 0,
          managementFeeOnAccumulation: savingsProduct.accumulationFee || 0,
          investmentTrack: savingsProduct.investmentTrack || '',
          riskLevelChange: '',
          notes: notesParts.join(' | '),
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
          category: insuranceProduct.product || insuranceProduct.productType || 'מוצר ביטוח',
          subCategory: insuranceProduct.productType || '',
          company: insuranceProduct.manufacturer || insuranceProduct.productType || 'לא צוין',
          amount: insuranceProduct.premium,
          managementFeeOnDeposit: 0,
          managementFeeOnAccumulation: 0,
          investmentTrack: '',
          riskLevelChange: '',
          notes: insuranceProduct.policyNumber ? `פוליסה: ${insuranceProduct.policyNumber}` : '',
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
    return `${(percentage || 0).toFixed(2)}%`;
  };

  // Map raw Excel savings labels to base product categories used by the app
  const toBaseSavingsCategory = (text: string | undefined): string => {
    if (!text) return '';
    // Remove RTL marks, punctuation, and collapse spaces
    const t = text
      .toString()
      .replace(/[\u200E\u200F]/g, '')
      .replace(/["'\-()\[\]{}.,:;!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Helpful aliases commonly seen in reports
    const aliases: Array<{ test: RegExp; result: string }> = [
      // Pension fund variations
      { test: /(קרן\s*)?פנסיה(\s*חדשה)?(\s*מקיפה)?/u, result: 'קרן פנסיה' },
      { test: /פנסיה(\s*חדשה)?(\s*מקיפה)?/u, result: 'קרן פנסיה' },
      // Study fund
      { test: /(קרן\s*)?השתלמות/u, result: 'קרן השתלמות' },
      // Provident fund (including investment variations)
      { test: /(קופת\s*)?גמל(\s*להשקעה)?/u, result: 'קופת גמל' },
      // Managers insurance
      { test: /ביטוח\s*מנהלים/u, result: 'ביטוח מנהלים' },
      { test: /מנהלים/u, result: 'ביטוח מנהלים' }
    ];

    for (const { test, result } of aliases) {
      if (test.test(t)) return result;
    }

    // Fallback contains checks
    if (t.includes('פנסיה')) return 'קרן פנסיה';
    if (t.includes('השתלמות')) return 'קרן השתלמות';
    if (t.includes('גמל')) return 'קופת גמל';
    if (t.includes('מנהלים')) return 'ביטוח מנהלים';

    return '';
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
                      <div className="space-y-1 text-right">
                        <div className="font-medium">{toBaseSavingsCategory(product.productName || product.productType) || product.productName || product.productType}</div>
                        <div className="text-sm text-muted-foreground">
                          {[product.manufacturer, product.productType].filter(Boolean).join(' | ')}
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
                    <div className="space-y-1 text-right">
                      <div className="font-medium">{product.product || product.productType}</div>
                      <div className="text-sm text-muted-foreground">
                        {[product.manufacturer, product.productType].filter(Boolean).join(' | ')}
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
                    <div className="font-medium">{toBaseSavingsCategory(product.productType || product.productName) || product.productType || product.productName}</div>
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