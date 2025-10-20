import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectedProduct } from '@/types/products';
import * as XLSX from 'xlsx';
import { useProductTaxonomy } from '@/hooks/useProductTaxonomy';
import { matchCategory, matchSubCategory, matchCompany } from '@/utils/productMatcher';

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

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsSelected: (products: SelectedProduct[]) => void;
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({ 
  isOpen, 
  onClose, 
  onProductsSelected 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importedData, setImportedData] = useState<ExcelData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSavings, setSelectedSavings] = useState<Set<number>>(new Set());
  const [selectedInsurance, setSelectedInsurance] = useState<Set<number>>(new Set());
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  
  // Load taxonomy for smart matching
  const { 
    getAllCategories, 
    getAllSubCategories, 
    getAllCompanies, 
    getExposureData, 
    getSubCategoriesForCategoryAndCompany,
    loading: taxonomyLoading 
  } = useProductTaxonomy();

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

    const savingsMap = new Map<string, SavingsProduct>();
    const insuranceMap = new Map<string, InsuranceProduct>();

    // Process each sheet
    Object.keys(workbook.Sheets).forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row with "סוג מוצר" column (the main products table)
      let headerRow = -1;
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (!row) continue;
        const hasMainColumns = row.some(cell => 
          typeof cell === 'string' && 
          cell.includes('סוג מוצר')
        );
        if (hasMainColumns) {
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
        investmentTrack: getColumnIndex(['מסלולי השקעה']),
        policyNumber: getColumnIndex(['פוליסה', 'חשבון']),
        premium: getColumnIndex(['פרמיה'])
      };

      // Process each row individually
      dataRows.forEach((row, rowIndex) => {
        if (!row || row.length === 0) return;

        const productType = idx.productType >= 0 ? normalizeText(row[idx.productType]) : '';
        const manufacturer = idx.manufacturer >= 0 ? normalizeText(row[idx.manufacturer]) : '';
        const productName = idx.product >= 0 ? normalizeText(row[idx.product]) : '';
        const policyNumber = idx.policyNumber >= 0 ? normalizeText(row[idx.policyNumber]) : '';

        // Skip rows without essential information or without manufacturer
        if (!productType && !manufacturer && !productName) {
          return;
        }
        
        // Skip products without manufacturer (prevents "לא צוין" entries)
        if (!manufacturer) {
          return;
        }

        const accumulationRaw = idx.accumulation >= 0 ? row[idx.accumulation] : null;
        const accumulation = accumulationRaw ? 
          parseFloat(accumulationRaw.toString().replace(/[₪,\s]/g, '')) || 0 : 0;

        const premiumRaw = idx.premium >= 0 ? row[idx.premium] : null;
        const premium = premiumRaw ? 
          parseFloat(premiumRaw.toString().replace(/[₪,\s]/g, '')) || 0 : 0;

        if (accumulation > 0 && productName && manufacturer) {
          const depositFee = idx.depositFee >= 0 ?
            parseFloat((row[idx.depositFee] || '').toString().replace('%', '')) || 0 : 0;
          const accumulationFee = idx.accumulationFee >= 0 ?
            parseFloat((row[idx.accumulationFee] || '').toString().replace('%', '')) || 0 : 0;
          const investmentTrack = idx.investmentTrack >= 0 ?
            normalizeText(row[idx.investmentTrack]) : '';

          // Create unique key for deduplication
          const key = `${productType}|${manufacturer}|${productName}|${policyNumber}`;
          const existingSavings = savingsMap.get(key);

          if (!existingSavings) {
            const savingsProduct: SavingsProduct = {
              productType,
              manufacturer,
              productName,
              planName: '',
              accumulation,
              depositFee,
              accumulationFee,
              investmentTrack,
              policyNumber
            };
            savingsMap.set(key, savingsProduct);
          } else {
            // Merge data to avoid duplicates while keeping the most complete information
            existingSavings.accumulation = Math.max(existingSavings.accumulation, accumulation);
            if (!existingSavings.investmentTrack && investmentTrack) {
              existingSavings.investmentTrack = investmentTrack;
            }
            if (!existingSavings.depositFee && depositFee) {
              existingSavings.depositFee = depositFee;
            }
            if (!existingSavings.accumulationFee && accumulationFee) {
              existingSavings.accumulationFee = accumulationFee;
            }
          }
        }

        if (premium > 0 && productName && manufacturer) {
          const key = `${productType}|${manufacturer}|${productName}|${policyNumber}`;
          const existingInsurance = insuranceMap.get(key);

          if (!existingInsurance) {
            const insuranceProduct: InsuranceProduct = {
              productType,
              manufacturer,
              product: productName,
              premium,
              policyNumber
            };
            insuranceMap.set(key, insuranceProduct);
          } else {
            // Merge premium data (take the maximum)
            existingInsurance.premium = Math.max(existingInsurance.premium, premium);
          }
        }
      });
    });

    const savings = Array.from(savingsMap.values());
    const insurance = Array.from(insuranceMap.values());
    const kpis = calculateKPIs(savings, insurance);

    return { savings, insurance, kpis };
  };

  const calculateKPIs = (savings: SavingsProduct[], insurance: InsuranceProduct[]): KPIData => {
    const totalAccumulation = savings.reduce((sum, product) => sum + product.accumulation, 0);
    
    const weightedAccumulationFee = savings.reduce((sum, product) => {
      return sum + (product.accumulationFee * product.accumulation);
    }, 0) / (totalAccumulation || 1);

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

  // Smart matching function with improved logic
  const smartMatchProduct = (productType: string, subCategory: string, company: string, productNumber?: string) => {
    console.log('🔍 Excel Dialog Product Matching Summary:');
    console.log(`   Input: Category="${productType}", SubCategory="${subCategory}", Company="${company}", ProductNumber="${productNumber || 'N/A'}"`);
    
    // Helper function to extract numbers with priority: parentheses first, then by length
    const extractNumbers = (text: string): string[] => {
      // First, try to find numbers in parentheses - these are usually fund numbers
      const numbersInParentheses = text.match(/\((\d+)\)/g);
      if (numbersInParentheses && numbersInParentheses.length > 0) {
        return numbersInParentheses.map(match => match.replace(/[()]/g, ''));
      }
      
      // If no parentheses, extract all numbers and sort by length (longer numbers first)
      const allNumbers = text.match(/\d+/g);
      if (allNumbers) {
        return allNumbers.sort((a, b) => b.length - a.length);
      }
      
      return [];
    };
    
    // PRIORITY 1: Search by product number - try ALL extracted numbers with priority
    // Collect numbers with priority: parentheses first, then by length
    const numbersToSearch: string[] = [];
    
    // Check each field in order of importance
    const fields = [
      subCategory,    // Most likely to contain fund number in parentheses
      productType,    // Second most likely
      productNumber,  // Explicit product number field
      company         // Least likely but still check
    ];
    
    fields.forEach(field => {
      if (field) {
        const numbers = extractNumbers(field);
        numbersToSearch.push(...numbers);
      }
    });
    
    // Remove duplicates while preserving order
    const uniqueNumbers = [...new Set(numbersToSearch)];
    
    console.log(`🔢 Found ${uniqueNumbers.length} numbers to check (prioritized): ${uniqueNumbers.join(', ')}`);
    
    // Try each number in the DB until we find a match
    for (const numToSearch of uniqueNumbers) {
      console.log(`   Checking number: ${numToSearch}`);
      const directMatch = getExposureData('', '', '', numToSearch);
      if (directMatch) {
        console.log('✅ FOUND by Product Number:', directMatch);
        return {
          category: directMatch.category,
          subCategory: directMatch.newTrackName,
          company: directMatch.company,
          exposureStocks: directMatch.exposureStocks,
          exposureBonds: directMatch.exposureBonds,
          exposureForeignCurrency: directMatch.exposureForeignCurrency,
          exposureForeignInvestments: directMatch.exposureForeignInvestments,
          exposureIsrael: directMatch.exposureIsrael,
          exposureIlliquidAssets: directMatch.exposureIlliquidAssets,
          productNumber: directMatch.productNumber
        };
      }
    }
    
    if (uniqueNumbers.length > 0) {
      console.log(`⚠️ None of the numbers found in taxonomy: ${uniqueNumbers.join(', ')}`);
    }
    
    // PRIORITY 2: Try semantic matching
    const categories = getAllCategories();
    const companies = getAllCompanies();
    
    const matchedCategory = matchCategory(productType, categories);
    const matchedCompany = matchCompany(company, companies);
    
    console.log(`📊 Matched Category: "${matchedCategory}", Company: "${matchedCompany}"`);
    
    // PRIORITY 3: If we have category and company, get filtered subcategory list
    if (matchedCategory && matchedCompany) {
      const relevantSubCategories = getSubCategoriesForCategoryAndCompany(matchedCategory, matchedCompany);
      console.log(`📋 Found ${relevantSubCategories.length} subcategories for ${matchedCompany} - ${matchedCategory}`);
      
      // Try to find any number in any of the relevant subcategories
      for (const numToSearch of uniqueNumbers) {
        const subCatWithNumber = relevantSubCategories.find(sc => sc.includes(numToSearch));
        if (subCatWithNumber) {
          console.log(`✅ Found subcategory with number: "${subCatWithNumber}"`);
          const exposureData = getExposureData(matchedCompany, matchedCategory, subCatWithNumber, numToSearch);
          return {
            category: matchedCategory,
            subCategory: subCatWithNumber,
            company: matchedCompany,
            exposureStocks: exposureData?.exposureStocks,
            exposureBonds: exposureData?.exposureBonds,
            exposureForeignCurrency: exposureData?.exposureForeignCurrency,
            exposureForeignInvestments: exposureData?.exposureForeignInvestments,
            exposureIsrael: exposureData?.exposureIsrael,
            exposureIlliquidAssets: exposureData?.exposureIlliquidAssets,
            assetComposition: exposureData?.assetComposition,
            productNumber: numToSearch
          };
        }
      }
      
      // Match subcategory from the filtered list
      const matchedSubCategory = matchSubCategory(subCategory, relevantSubCategories);
      console.log(`🎯 Best subcategory match: "${matchedSubCategory}"`);
      
      const exposureData = getExposureData(matchedCompany, matchedCategory, matchedSubCategory, uniqueNumbers[0]);
      return {
        category: matchedCategory,
        subCategory: matchedSubCategory,
        company: matchedCompany,
        exposureStocks: exposureData?.exposureStocks,
        exposureBonds: exposureData?.exposureBonds,
        exposureForeignCurrency: exposureData?.exposureForeignCurrency,
        exposureForeignInvestments: exposureData?.exposureForeignInvestments,
        exposureIsrael: exposureData?.exposureIsrael,
        exposureIlliquidAssets: exposureData?.exposureIlliquidAssets,
        assetComposition: exposureData?.assetComposition,
        productNumber: uniqueNumbers[0] || undefined
      };
    }
    
    // FALLBACK: General semantic matching if no category/company match
    const allSubCategories = getAllSubCategories();
    const matchedSubCategory = matchSubCategory(subCategory, allSubCategories);
    
    console.log('⚠️ Fallback to general matching');
    console.log(`   Result: Category="${matchedCategory}", SubCategory="${matchedSubCategory}", Company="${matchedCompany}"`);
    
    const exposureData = getExposureData(matchedCompany, matchedCategory, matchedSubCategory, uniqueNumbers[0]);
    
    return {
      category: matchedCategory,
      subCategory: matchedSubCategory,
      company: matchedCompany,
      exposureStocks: exposureData?.exposureStocks,
      exposureBonds: exposureData?.exposureBonds,
      exposureForeignCurrency: exposureData?.exposureForeignCurrency,
      exposureForeignInvestments: exposureData?.exposureForeignInvestments,
      exposureIsrael: exposureData?.exposureIsrael,
      exposureIlliquidAssets: exposureData?.exposureIlliquidAssets,
      assetComposition: exposureData?.assetComposition,
      productNumber: uniqueNumbers[0] || undefined
    };
  };

  // Filter and search logic
  const { filteredSavings, filteredInsurance, manufacturers, categories } = useMemo(() => {
    if (!importedData) return { filteredSavings: [], filteredInsurance: [], manufacturers: [], categories: [] };

    const allProducts = [...importedData.savings, ...importedData.insurance];
    const uniqueManufacturers = [...new Set(allProducts.map(p => 'manufacturer' in p ? p.manufacturer : ''))].filter(Boolean);
    const uniqueCategories = [...new Set(allProducts.map(p => p.productType))].filter(Boolean);

    const filterBySearch = (product: any) => {
      const searchableText = `${product.manufacturer} ${product.productName || product.product} ${product.productType}`.toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    };

    const filterByManufacturer = (product: any) => {
      return manufacturerFilter === 'all' || product.manufacturer === manufacturerFilter;
    };

    const filterByCategory = (product: any) => {
      return categoryFilter === 'all' || product.productType === categoryFilter;
    };

    const filteredSavings = importedData.savings.filter(product => 
      filterBySearch(product) && filterByManufacturer(product) && filterByCategory(product)
    );

    const filteredInsurance = importedData.insurance.filter(product => 
      filterBySearch(product) && filterByManufacturer(product) && filterByCategory(product)
    );

    return {
      filteredSavings,
      filteredInsurance,
      manufacturers: uniqueManufacturers,
      categories: uniqueCategories
    };
  }, [importedData, searchTerm, manufacturerFilter, categoryFilter]);

  const handleSelectAllSavings = () => {
    if (selectedSavings.size === filteredSavings.length) {
      setSelectedSavings(new Set());
    } else {
      const allIndices = filteredSavings.map((_, index) => 
        importedData!.savings.findIndex(s => s === filteredSavings[index])
      );
      setSelectedSavings(new Set(allIndices));
    }
  };

  const handleSelectAllInsurance = () => {
    if (selectedInsurance.size === filteredInsurance.length) {
      setSelectedInsurance(new Set());
    } else {
      const allIndices = filteredInsurance.map((_, index) => 
        importedData!.insurance.findIndex(i => i === filteredInsurance[index])
      );
      setSelectedInsurance(new Set(allIndices));
    }
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

    selectedSavings.forEach(index => {
      const savingsProduct = importedData.savings[index];
      if (savingsProduct) {
        productCounter++;
        
        // Smart match the product
        const matched = smartMatchProduct(
          savingsProduct.productType || savingsProduct.productName,
          savingsProduct.investmentTrack || savingsProduct.planName || '',
          savingsProduct.manufacturer
        );

        const product: SelectedProduct = {
          id: `savings-${Date.now()}-${productCounter}`,
          category: matched.category || savingsProduct.productType,
          subCategory: matched.subCategory,
          company: matched.company || savingsProduct.manufacturer,
          amount: savingsProduct.accumulation,
          managementFeeOnDeposit: savingsProduct.depositFee || 0,
          managementFeeOnAccumulation: savingsProduct.accumulationFee || 0,
          investmentTrack: savingsProduct.investmentTrack || '',
          riskLevelChange: '',
          notes: savingsProduct.policyNumber || '',
          type: 'current',
          includeExposureData: !!(matched.exposureStocks || matched.exposureBonds || matched.exposureForeignCurrency || matched.exposureForeignInvestments),
          exposureStocks: matched.exposureStocks,
          exposureBonds: matched.exposureBonds,
          exposureForeignCurrency: matched.exposureForeignCurrency,
          exposureForeignInvestments: matched.exposureForeignInvestments,
          productNumber: matched.productNumber
        };
        selectedProducts.push(product);
      }
    });

    selectedInsurance.forEach(index => {
      const insuranceProduct = importedData.insurance[index];
      if (insuranceProduct) {
        productCounter++;
        
        // Smart match the insurance product
        const matched = smartMatchProduct(
          insuranceProduct.productType || insuranceProduct.product,
          '',
          insuranceProduct.manufacturer
        );
        
        const product: SelectedProduct = {
          id: `insurance-${Date.now()}-${productCounter}`,
          category: matched.category || insuranceProduct.productType,
          subCategory: matched.subCategory,
          company: matched.company || insuranceProduct.manufacturer,
          amount: insuranceProduct.premium,
          managementFeeOnDeposit: 0,
          managementFeeOnAccumulation: 0,
          investmentTrack: '',
          riskLevelChange: '',
          notes: insuranceProduct.policyNumber || '',
          type: 'current',
          includeExposureData: !!(matched.exposureStocks || matched.exposureBonds || matched.exposureForeignCurrency || matched.exposureForeignInvestments),
          exposureStocks: matched.exposureStocks,
          exposureBonds: matched.exposureBonds,
          exposureForeignCurrency: matched.exposureForeignCurrency,
          exposureForeignInvestments: matched.exposureForeignInvestments,
          productNumber: matched.productNumber
        };
        selectedProducts.push(product);
      }
    });

    onProductsSelected(selectedProducts);
    handleClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const resetDialog = () => {
    setImportStatus('idle');
    setImportedData(null);
    setShowProductSelection(false);
    setSearchTerm('');
    setCategoryFilter('all');
    setManufacturerFilter('all');
    setSelectedSavings(new Set());
    setSelectedInsurance(new Set());
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייבוא מצב קיים מאקסל
          </DialogTitle>
          <DialogDescription>
            העלה קובץ אקסל כדי לייבא את המצב הקיים של הלקוח
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showProductSelection ? (
            <>
              {/* Upload Section */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    הקובץ יובא בהצלחה! נמצאו {importedData?.savings.length || 0} מוצרי חיסכון
                    {importedData?.insurance.length ? ` ו-${importedData.insurance.length} מוצרי ביטוח` : ''}
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="חפש מוצר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {manufacturers.length > 0 && (
                  <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="בחר יצרן" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל היצרנים</SelectItem>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* KPIs */}
              {importedData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">
                          {importedData.kpis.savingsProductCount}
                        </div>
                        <div className="text-xs text-muted-foreground">מוצרי חיסכון</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(importedData.kpis.totalAccumulation)}
                        </div>
                        <div className="text-xs text-muted-foreground">סך צבירה</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">
                          {importedData.kpis.insurancePolicyCount}
                        </div>
                        <div className="text-xs text-muted-foreground">מוצרי ביטוח</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(importedData.kpis.totalMonthlyPremium)}
                        </div>
                        <div className="text-xs text-muted-foreground">פרמיה חודשית</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Products Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Savings Products */}
                {filteredSavings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>מוצרי חיסכון ({filteredSavings.length})</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllSavings}
                        >
                          {selectedSavings.size === filteredSavings.length ? 'בטל בחירת הכל' : 'בחר הכל'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {filteredSavings.map((product, index) => {
                          const originalIndex = importedData!.savings.findIndex(s => s === product);
                          return (
                            <div key={originalIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
                              <Checkbox
                                checked={selectedSavings.has(originalIndex)}
                                onCheckedChange={(checked) => 
                                  handleSavingsSelection(originalIndex, checked as boolean)
                                }
                              />
                              <div className="flex-1 text-right">
                                <div className="font-medium">{product.manufacturer}</div>
                                <div className="text-sm text-muted-foreground">{product.productName}</div>
                                <div className="text-sm">
                                  <Badge variant="secondary">{product.productType}</Badge>
                                  <span className="ml-2">{formatCurrency(product.accumulation)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Insurance Products */}
                {filteredInsurance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>מוצרי ביטוח ({filteredInsurance.length})</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllInsurance}
                        >
                          {selectedInsurance.size === filteredInsurance.length ? 'בטל בחירת הכל' : 'בחר הכל'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {filteredInsurance.map((product, index) => {
                          const originalIndex = importedData!.insurance.findIndex(i => i === product);
                          return (
                            <div key={originalIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
                              <Checkbox
                                checked={selectedInsurance.has(originalIndex)}
                                onCheckedChange={(checked) => 
                                  handleInsuranceSelection(originalIndex, checked as boolean)
                                }
                              />
                              <div className="flex-1 text-right">
                                <div className="font-medium">{product.manufacturer}</div>
                                <div className="text-sm text-muted-foreground">{product.product}</div>
                                <div className="text-sm">
                                  <Badge variant="secondary">{product.productType}</Badge>
                                  <span className="ml-2">{formatCurrency(product.premium)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  ביטול
                </Button>
                <Button 
                  onClick={handleGenerateCurrentState}
                  disabled={selectedSavings.size === 0 && selectedInsurance.size === 0}
                >
                  יצר מצב קיים ({selectedSavings.size + selectedInsurance.size} מוצרים)
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportDialog;