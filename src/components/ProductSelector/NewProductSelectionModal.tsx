import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Copy, Mic, Search, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectedProduct, ProductSelectionStep, PRODUCT_ICONS } from '@/types/products';
import { useProductTaxonomy } from '@/hooks/useProductTaxonomy';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VoiceProductInput from './VoiceProductInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIProductEditDialog } from './AIProductEditDialog';

interface NewProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: SelectedProduct) => void;
  productType: 'current' | 'recommended';
  existingProducts?: SelectedProduct[];
  editingProduct?: SelectedProduct | null;
}

const NewProductSelectionModal: React.FC<NewProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  productType,
  existingProducts = [],
  editingProduct = null
}) => {
  const { hierarchy, loading, error, getExposureData, getCompaniesForCategory, getSubCategoriesForCategoryAndCompany } = useProductTaxonomy();
  const { toast } = useToast();
  const [step, setStep] = useState<ProductSelectionStep>({ current: editingProduct ? 3 : 1 });
  const [inputMode, setInputMode] = useState<'manual' | 'voice'>('manual');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Partial<SelectedProduct> | null>(null);
  const [searchingExposure, setSearchingExposure] = useState(false);
  const [exposureSearchResults, setExposureSearchResults] = useState<string | null>(null);
  const [isAIEditDialogOpen, setIsAIEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SelectedProduct>>(() => {
    if (editingProduct) {
      return editingProduct;
    }
    const initialData: Partial<SelectedProduct> = {
      type: productType,
      amount: 0,
      managementFeeOnDeposit: 0,
      managementFeeOnAccumulation: 0,
      investmentTrack: '',
      riskLevelChange: '',
      notes: '',
      includeExposureData: false,
      includeStocksInSummary: true,
      includeBondsInSummary: true,
      includeForeignCurrencyInSummary: true,
      includeForeignInvestmentsInSummary: true
    };
    return initialData;
  });

  useEffect(() => {
    if (editingProduct) {
      setStep({ 
        current: 3, 
        selectedCategory: editingProduct.category,
        selectedSubCategory: editingProduct.subCategory,
        selectedCompany: editingProduct.company
      });
      
      // Load fresh exposure data from products_information table
      const exposureData = getExposureData(
        editingProduct.company, 
        editingProduct.category, 
        editingProduct.subCategory,
        editingProduct.productNumber
      );
      
      // Merge editing product with fresh exposure data from DB
      const updatedFormData = {
        ...editingProduct,
        ...(exposureData && {
          exposureStocks: exposureData.exposureStocks,
          exposureBonds: exposureData.exposureBonds,
          exposureForeignCurrency: exposureData.exposureForeignCurrency,
          exposureForeignInvestments: exposureData.exposureForeignInvestments,
          exposureIsrael: exposureData.exposureIsrael,
          exposureIlliquidAssets: exposureData.exposureIlliquidAssets,
          assetComposition: exposureData.assetComposition
        })
      };
      
      setFormData(updatedFormData);
      setInitialFormData(updatedFormData);
    } else {
      setStep({ current: 1 });
      const initialData: Partial<SelectedProduct> = {
        type: productType,
        amount: 0,
        managementFeeOnDeposit: 0,
        managementFeeOnAccumulation: 0,
        investmentTrack: '',
        riskLevelChange: '',
        notes: '',
        includeExposureData: false,
        includeStocksInSummary: true,
        includeBondsInSummary: true,
        includeForeignCurrencyInSummary: true,
        includeForeignInvestmentsInSummary: true
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [isOpen, editingProduct, productType]);

  const handleCategorySelect = (category: string) => {
    setStep({ current: 2, selectedCategory: category });
  };

  const handleCompanySelect = (company: string) => {
    setStep({ ...step, current: 3, selectedCompany: company });
  };

  const handleSubCategorySelect = (subCategory: string) => {
    // Update step first
    setStep({ ...step, selectedSubCategory: subCategory });
    
    // Get exposure data and populate form - pass productNumber if available
    if (step.selectedCategory && step.selectedCompany) {
      const trackName = subCategory || '';
      const productNumber = formData.productNumber;
      const exposureData = getExposureData(step.selectedCompany, step.selectedCategory, trackName, productNumber);
      
      if (exposureData) {
        setFormData(prev => ({
          ...prev,
          productNumber: exposureData.productNumber || prev.productNumber,
          exposureStocks: exposureData.exposureStocks,
          exposureBonds: exposureData.exposureBonds,
          exposureForeignCurrency: exposureData.exposureForeignCurrency,
          exposureForeignInvestments: exposureData.exposureForeignInvestments,
          exposureIsrael: exposureData.exposureIsrael,
          exposureIlliquidAssets: exposureData.exposureIlliquidAssets,
          assetComposition: exposureData.assetComposition
        }));
      }
    }
  };

  // Handle category change in edit mode
  const handleCategoryChange = (category: string) => {
    // Reset company and subcategory when category changes - always require reselection
    const newStep = {
      current: 3,
      selectedCategory: category,
      selectedCompany: undefined,
      selectedSubCategory: undefined
    };
    
    setStep(newStep as ProductSelectionStep);
    
    // Clear exposure data
    setFormData(prev => ({
      ...prev,
      exposureStocks: undefined,
      exposureBonds: undefined,
      exposureForeignCurrency: undefined,
      exposureForeignInvestments: undefined,
      exposureIsrael: undefined,
      exposureIlliquidAssets: undefined,
      assetComposition: undefined
    }));
  };

  // Handle company change in edit mode
  const handleCompanyChange = (company: string) => {
    // Reset subcategory when company changes
    setStep({ 
      ...step,
      selectedCompany: company,
      selectedSubCategory: undefined
    });
    
    // Clear product number and exposure data until a new track is chosen
    setFormData(prev => ({
      ...prev,
      productNumber: undefined,
      exposureStocks: undefined,
      exposureBonds: undefined,
      exposureForeignCurrency: undefined,
      exposureForeignInvestments: undefined,
      exposureIsrael: undefined,
      exposureIlliquidAssets: undefined,
      assetComposition: undefined
    }));
  };

  // Handle sub-category change in edit mode
  const handleSubCategoryChange = (subCategory: string) => {
    setStep({ 
      ...step,
      selectedSubCategory: subCategory
    });
    
    // Update product number and exposure data
    if (step.selectedCompany && step.selectedCategory) {
      const trackName = subCategory || '';
      const productNumber = formData.productNumber;
      const exposureData = getExposureData(step.selectedCompany, step.selectedCategory, trackName, productNumber);
      
      if (exposureData) {
        setFormData(prev => ({
          ...prev,
          productNumber: exposureData.productNumber || prev.productNumber,
          exposureStocks: exposureData.exposureStocks,
          exposureBonds: exposureData.exposureBonds,
          exposureForeignCurrency: exposureData.exposureForeignCurrency,
          exposureForeignInvestments: exposureData.exposureForeignInvestments,
          exposureIsrael: exposureData.exposureIsrael,
          exposureIlliquidAssets: exposureData.exposureIlliquidAssets,
          assetComposition: exposureData.assetComposition
        }));
      }
    }
  };

  const handleDuplicate = (existingProduct: SelectedProduct) => {
    setFormData({
      ...existingProduct,
      id: `${Date.now()}`,
      type: productType,
      notes: existingProduct.notes + ' (העתק)'
    });
    setStep({
      current: 3,
      selectedCategory: existingProduct.category,
      selectedSubCategory: existingProduct.subCategory,
      selectedCompany: existingProduct.company
    });
  };

  const handleSubmit = () => {
    if (!step.selectedCompany || !step.selectedCategory || !step.selectedSubCategory) {
      return;
    }

    const product: SelectedProduct = {
      id: editingProduct ? editingProduct.id : `${Date.now()}`,
      category: step.selectedCategory,
      subCategory: step.selectedSubCategory,
      company: step.selectedCompany,
      amount: formData.amount || 0,
      managementFeeOnDeposit: formData.managementFeeOnDeposit || 0,
      managementFeeOnAccumulation: formData.managementFeeOnAccumulation || 0,
      investmentTrack: formData.investmentTrack || '',
      riskLevelChange: formData.riskLevelChange === 'no-change' ? '' : formData.riskLevelChange || '',
      notes: formData.notes || '',
      type: productType,
      returns: formData.returns,
      includeExposureData: formData.exposureStocks !== undefined,
      exposureStocks: formData.exposureStocks,
      exposureBonds: formData.exposureBonds,
      exposureForeignCurrency: formData.exposureForeignCurrency,
      exposureForeignInvestments: formData.exposureForeignInvestments,
      exposureIsrael: formData.exposureIsrael,
      exposureIlliquidAssets: formData.exposureIlliquidAssets,
      assetComposition: formData.assetComposition,
      productNumber: formData.productNumber,
      includeStocksInSummary: formData.includeStocksInSummary ?? true,
      includeBondsInSummary: formData.includeBondsInSummary ?? true,
      includeForeignCurrencyInSummary: formData.includeForeignCurrencyInSummary ?? true,
      includeForeignInvestmentsInSummary: formData.includeForeignInvestmentsInSummary ?? true
    };

    onAddProduct(product);
    handleClose();
  };

  const handleVoiceProductAnalyzed = (voiceData: any) => {
    // Prefer exact category match from AI, then fallback to includes
    const categoriesList = Array.from(hierarchy.categories as any);
    const matchedCategory =
      categoriesList.find((cat: string) => cat === voiceData.category) ||
      categoriesList.find((cat: string) => voiceData.productName?.includes(cat) || voiceData.category?.includes(cat));
    
    if (matchedCategory) {
      const key = matchedCategory as string;
      const subCatsRaw = (hierarchy.subCategories.get(key) || []) as unknown;
      const subCats: string[] = Array.isArray(subCatsRaw)
        ? (subCatsRaw as string[])
        : Array.from((subCatsRaw as Set<string>) || []);

      // Try to match sub-category/track from voice data (fullProduct.track_name already passed as subCategory)
      const norm = (s?: string) => (s || '').toString().trim().toLowerCase();
      const target = norm(voiceData.subCategory || voiceData.productName);

      const pickSubCat = (): string => {
        const exact = subCats.find((sc) => norm(sc) === target);
        if (exact) return exact;
        const contains = subCats.find((sc) => norm(sc).includes(target) || (target && target.includes(norm(sc))));
        if (contains) return contains;
        if (target.includes('מניות')) {
          const mn = subCats.find((sc) => norm(sc).includes('מניות'));
          if (mn) return mn;
        }
        if (target.includes('אג"ח')) {
          const ag = subCats.find((sc) => norm(sc).includes('אג"ח'));
          if (ag) return ag;
        }
        return subCats[0] || 'מסלול כללי';
      };

      const matchedSubCat = pickSubCat();
      
      setStep({
        current: 3,
        selectedCategory: key,
        selectedSubCategory: matchedSubCat,
        selectedCompany: voiceData.company || ''
      });
      
      setFormData({
        type: productType,
        amount: voiceData.amount || 0,
        managementFeeOnDeposit: voiceData.managementFeeOnDeposit || 0,
        managementFeeOnAccumulation: voiceData.managementFeeOnAccumulation || 0,
        investmentTrack: matchedSubCat,
        riskLevelChange: 'no-change',
        notes: voiceData.transcribedText || '',
        productNumber: voiceData.productNumber || '',
        // Exposures (if provided from DB match)
        exposureStocks: voiceData.exposureStocks,
        exposureBonds: voiceData.exposureBonds,
        exposureForeignCurrency: voiceData.exposureForeignCurrency,
        exposureForeignInvestments: voiceData.exposureForeignInvestments,
      });
      
      // Switch to manual mode to show the form
      setInputMode('manual');
    }
  };

  const handleApplyAIChanges = (updatedProduct: SelectedProduct) => {
    // Update form data and step with the AI changes
    setFormData({
      ...updatedProduct,
      type: productType
    });
    setStep({
      current: 3,
      selectedCategory: updatedProduct.category,
      selectedCompany: updatedProduct.company,
      selectedSubCategory: updatedProduct.subCategory
    });
  };

  const handleSearchExposure = async () => {
    if (!step.selectedCompany || !step.selectedCategory || !step.selectedSubCategory) {
      toast({
        title: "שגיאה",
        description: "נא לבחור קטגוריה, חברה ותת קטגוריה לפני החיפוש",
        variant: "destructive"
      });
      return;
    }

    setSearchingExposure(true);
    setExposureSearchResults(null);

    try {
      // Build product name from company and sub-category
      const productName = `${step.selectedCompany} ${step.selectedSubCategory}${formData.investmentTrack ? ` ${formData.investmentTrack}` : ''}`.trim();
      
      toast({
        title: "מחפש ברשת...",
        description: `מחפש נתוני חשיפות עבור ${productName}`
      });

      const response = await fetch(`https://eoodkccjwyybwgmkzarx.supabase.co/functions/v1/search-exposure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2RrY2Nqd3l5YndnbWt6YXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDcyMDUsImV4cCI6MjA2MzkyMzIwNX0.Jpz2_RIyrr2Bvpu6yrX37Z_Kl5lUhhyLerfa6G2MHJc`
        },
        body: JSON.stringify({
          company: step.selectedCompany,
          category: step.selectedCategory,
          subCategory: step.selectedSubCategory,
          investmentTrack: formData.investmentTrack || '',
          productName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search exposure data');
      }

      const data = await response.json();
      
      if (data.exposureData) {
        setExposureSearchResults(data.summary);
        
        // Automatically populate the form with found data
        setFormData({
          ...formData,
          exposureStocks: data.exposureData.exposureStocks ?? formData.exposureStocks,
          exposureBonds: data.exposureData.exposureBonds ?? formData.exposureBonds,
          exposureForeignCurrency: data.exposureData.exposureForeignCurrency ?? formData.exposureForeignCurrency,
          exposureForeignInvestments: data.exposureData.exposureForeignInvestments ?? formData.exposureForeignInvestments,
          exposureIsrael: data.exposureData.exposureIsrael ?? formData.exposureIsrael,
          exposureIlliquidAssets: data.exposureData.exposureIlliquidAssets ?? formData.exposureIlliquidAssets
        });

        toast({
          title: "נמצאו נתוני חשיפות!",
          description: "הנתונים עודכנו בטופס"
        });
      } else {
        toast({
          title: "לא נמצאו נתונים",
          description: "לא הצלחנו למצוא נתוני חשיפות למוצר זה",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching exposure:', error);
      toast({
        title: "שגיאה בחיפוש",
        description: "אירעה שגיאה בחיפוש נתוני החשיפות",
        variant: "destructive"
      });
    } finally {
      setSearchingExposure(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleCloseRequest = () => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep({ current: 1 });
    setInputMode('manual');
    setShowCloseConfirm(false);
    const resetData: Partial<SelectedProduct> = {
      type: productType,
      amount: 0,
      managementFeeOnDeposit: 0,
      managementFeeOnAccumulation: 0,
      investmentTrack: '',
      riskLevelChange: '',
      notes: '',
      includeExposureData: false,
      includeStocksInSummary: true,
      includeBondsInSummary: true,
      includeForeignCurrencyInSummary: true,
      includeForeignInvestmentsInSummary: true
    };
    setFormData(resetData);
    setInitialFormData(null);
    onClose();
  };

  const progressValue = (step.current / 3) * 100;

  // Get available options, and add the current values if they don't exist (KEEP ORIGINAL case)
  const availableCategories = [...hierarchy.categories];
  if (editingProduct && step.selectedCategory && !availableCategories.includes(step.selectedCategory)) {
    availableCategories.push(step.selectedCategory);
  }

  // Filter companies by category
  const availableCompanies = step.selectedCategory
    ? getCompaniesForCategory(step.selectedCategory)
    : hierarchy.companies;
  const availableCompaniesWithCurrent = [...availableCompanies];
  if (editingProduct && step.selectedCompany && !availableCompaniesWithCurrent.includes(step.selectedCompany)) {
    availableCompaniesWithCurrent.push(step.selectedCompany);
  }

  // Filter subcategories by category and company
  const availableSubCategories = step.selectedCategory && step.selectedCompany
    ? getSubCategoriesForCategoryAndCompany(step.selectedCategory, step.selectedCompany)
    : [];
  const availableSubCategoriesWithCurrent = [...availableSubCategories];
  if (editingProduct && step.selectedSubCategory && !availableSubCategoriesWithCurrent.includes(step.selectedSubCategory)) {
    availableSubCategoriesWithCurrent.push(step.selectedSubCategory);
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle>טוען מוצרים...</DialogTitle>
            <DialogDescription>אנא המתן בזמן שאנו טוענים את רשימת המוצרים</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle>שגיאה</DialogTitle>
            <DialogDescription>אירעה שגיאה בטעינת המוצרים</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass" onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {editingProduct 
                  ? (productType === 'current' ? 'ערוך מוצר קיים' : 'ערוך מוצר מוצע')
                : (productType === 'current' ? 'הוסף מוצר קיים' : 'הוסף מוצר מוצע')
              }
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {step.current === 1 && 'בחר קטגוריה'}
            {step.current === 2 && 'בחר חברה'}
            {step.current === 3 && 'בחר תת קטגוריה / מסלול והזן פרטים'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice/Manual Toggle */}
          {!editingProduct && step.current === 1 && (
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'manual' | 'voice')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">בחירה ידנית</TabsTrigger>
                <TabsTrigger value="voice">
                  <Mic className="h-4 w-4 ml-2" />
                  הקלטה קולית
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="voice" className="mt-4">
                <VoiceProductInput onProductAnalyzed={handleVoiceProductAnalyzed} />
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>שלב {step.current} מתוך 3</span>
                      <span>בחירת קטגוריה</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>

                  {/* Category Selection Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">בחר קטגוריה</h3>
                    
                    {/* Duplicate existing products */}
                    {existingProducts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-md font-medium text-muted-foreground">העתק מוצר קיים</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {existingProducts.map((product) => (
                            <div
                              key={product.id}
                              className="glass-hover p-3 cursor-pointer"
                              onClick={() => handleDuplicate(product)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{PRODUCT_ICONS[product.category] || '📄'}</span>
                                  <div>
                                    <div className="font-medium">{product.category}</div>
                                    <div className="text-sm text-muted-foreground">{product.company} - {product.subCategory}</div>
                                  </div>
                                </div>
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-4">
                          <h4 className="text-md font-medium text-muted-foreground mb-3">או בחר קטגוריה חדשה</h4>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {hierarchy.categories.map((category) => (
                        <div
                          key={category}
                          className="glass-hover p-4 text-center cursor-pointer"
                          onClick={() => handleCategorySelect(category)}
                        >
                          <div className="text-4xl mb-2">
                            {PRODUCT_ICONS[category] || '📄'}
                          </div>
                          <div className="font-medium text-sm">{category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Show progress bar and content for steps 2 and 3, or when editing */}
          {(step.current !== 1 || editingProduct) && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>שלב {step.current} מתוך 3</span>
                  <span>
                    {step.current === 1 && 'בחירת קטגוריה'}
                    {step.current === 2 && 'בחירת חברה'}
                    {step.current === 3 && 'בחירת מסלול ופרטים'}
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            </>
          )}

          {/* Step 1: Category Selection (when already selected or editing) - Content moved to Tabs above */}

          {/* Step 2: Company Selection */}
          {step.current === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep({ current: 1 })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  בחר חברה עבור: {step.selectedCategory}
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableCompanies.map((company) => (
                  <div
                    key={company}
                    className="glass-hover p-4 text-center cursor-pointer"
                    onClick={() => handleCompanySelect(company)}
                  >
                    <div className="font-medium text-lg">{company}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Sub-Category Selection & Details */}
          {step.current === 3 && !step.selectedSubCategory && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep({ ...step, current: 2, selectedCompany: undefined })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  בחר מסלול: {step.selectedCategory} - {step.selectedCompany}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSubCategories.map((subCategory) => (
                  <div
                    key={subCategory}
                    className="glass-hover p-4 text-center cursor-pointer"
                    onClick={() => handleSubCategorySelect(subCategory)}
                  >
                    <div className="font-medium">{subCategory}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details Form (after subcategory selected) */}
          {step.current === 3 && step.selectedSubCategory && (
            <div className="space-y-4">
              {editingProduct ? (
                <div className="space-y-4 mb-4">
                  <h3 className="text-lg font-semibold">עריכת מוצר</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass p-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">קטגוריה</label>
                      <Select value={step.selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                          <SelectContent className="z-[9999] bg-popover text-popover-foreground shadow-lg">
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {PRODUCT_ICONS[category] || '📄'} {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">חברה</label>
                        <Select 
                          key={`company-${step.selectedCategory || 'none'}`}
                          value={step.selectedCompany}
                          onValueChange={handleCompanyChange}
                          disabled={!step.selectedCategory}
                        >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="בחר חברה" />
                        </SelectTrigger>
                          <SelectContent className="z-[9999] bg-popover text-popover-foreground shadow-lg">
                          {availableCompaniesWithCurrent.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">מסלול השקעה</label>
                        <Select 
                          key={`sub-${step.selectedCompany || 'none'}`}
                          value={step.selectedSubCategory}
                          onValueChange={handleSubCategoryChange}
                          disabled={!step.selectedCompany}
                        >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="בחר מסלול השקעה" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-popover text-popover-foreground shadow-lg">
                          {availableSubCategoriesWithCurrent.map((subCategory) => (
                            <SelectItem key={subCategory} value={subCategory}>
                              {subCategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep({ ...step, selectedSubCategory: undefined })}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    פרטי המוצר: {step.selectedCategory} - {step.selectedCompany} - {step.selectedSubCategory}
                  </h3>
                </div>
              )}

              {/* AI Edit Button */}
              <Button
                onClick={() => setIsAIEditDialogOpen(true)}
                variant="outline"
                className="w-full mb-4 h-12 border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                <Building2 className="w-5 h-5 ml-2 text-primary" />
                <span className="text-base">עריכה מהירה עם AI</span>
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">סכום צבירה</label>
                  <Input
                    type="number"
                    className="glass"
                    value={formData.amount ? Math.round(formData.amount) : ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">דמי ניהול מהפקדה (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="glass"
                    value={formData.managementFeeOnDeposit || ''}
                    onChange={(e) => setFormData({ ...formData, managementFeeOnDeposit: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">דמי ניהול מצבירה (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="glass"
                    value={formData.managementFeeOnAccumulation || ''}
                    onChange={(e) => setFormData({ ...formData, managementFeeOnAccumulation: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">תשואה (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="glass"
                    value={formData.returns || ''}
                    onChange={(e) => setFormData({ ...formData, returns: parseFloat(e.target.value) || undefined })}
                    placeholder="0"
                  />
                </div>

                {/* Product Number Display */}
                {formData.productNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">מספר קרן</label>
                    <Input
                      type="text"
                      className="glass bg-muted"
                      value={formData.productNumber}
                      readOnly
                    />
                  </div>
                )}
              </div>

              {/* Exposure Data Section */}
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">נתוני חשיפות</h4>
                  <div className="flex gap-2">
                    {step.selectedCompany && step.selectedCategory && step.selectedSubCategory && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSearchExposure}
                        disabled={searchingExposure}
                      >
                        <Search className="h-4 w-4 ml-2" />
                        {searchingExposure ? 'מחפש...' : 'חפש ערכי חשיפות'}
                      </Button>
                    )}
                    {formData.exposureStocks === undefined && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            exposureStocks: 0,
                            exposureBonds: 0,
                            exposureForeignCurrency: 0,
                            exposureForeignInvestments: 0
                          });
                        }}
                      >
                        הוסף נתוני חשיפה
                      </Button>
                    )}
                  </div>
                </div>

                {exposureSearchResults && (
                  <Alert className="bg-primary/10">
                    <AlertDescription>
                      <strong>תוצאות חיפוש:</strong> {exposureSearchResults}
                    </AlertDescription>
                  </Alert>
                )}

                {formData.exposureStocks === undefined ? (
                  <div className="glass p-4 text-center text-muted-foreground">
                    אין נתוני חשיפה
                  </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">חשיפה למניות (%)</label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeStocks"
                            checked={formData.includeStocksInSummary ?? true}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, includeStocksInSummary: checked as boolean })
                            }
                          />
                          <Label htmlFor="includeStocks" className="text-xs cursor-pointer">
                            כלול בסיכום
                          </Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="glass"
                        value={formData.exposureStocks ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            setFormData({ ...formData, exposureStocks: val });
                          } else if (e.target.value === '') {
                            setFormData({ ...formData, exposureStocks: 0 });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">חשיפה לאג"ח (%)</label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeBonds"
                            checked={formData.includeBondsInSummary ?? true}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, includeBondsInSummary: checked as boolean })
                            }
                          />
                          <Label htmlFor="includeBonds" className="text-xs cursor-pointer">
                            כלול בסיכום
                          </Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="glass"
                        value={formData.exposureBonds ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            setFormData({ ...formData, exposureBonds: val });
                          } else if (e.target.value === '') {
                            setFormData({ ...formData, exposureBonds: 0 });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">חשיפה למט"ח (%)</label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeForeignCurrency"
                            checked={formData.includeForeignCurrencyInSummary ?? true}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, includeForeignCurrencyInSummary: checked as boolean })
                            }
                          />
                          <Label htmlFor="includeForeignCurrency" className="text-xs cursor-pointer">
                            כלול בסיכום
                          </Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="glass"
                        value={formData.exposureForeignCurrency ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            setFormData({ ...formData, exposureForeignCurrency: val });
                          } else if (e.target.value === '') {
                            setFormData({ ...formData, exposureForeignCurrency: 0 });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">חשיפה להשקעות בחו"ל (%)</label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeForeignInvestments"
                            checked={formData.includeForeignInvestmentsInSummary ?? true}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, includeForeignInvestmentsInSummary: checked as boolean })
                            }
                          />
                          <Label htmlFor="includeForeignInvestments" className="text-xs cursor-pointer">
                            כלול בסיכום
                          </Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="glass"
                        value={formData.exposureForeignInvestments ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            setFormData({ ...formData, exposureForeignInvestments: val });
                          } else if (e.target.value === '') {
                            setFormData({ ...formData, exposureForeignInvestments: 0 });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Exposure info removed - will be asked globally for all products */}

              <div className="space-y-2">
                <label className="text-sm font-medium">הערות</label>
                <Textarea
                  className="glass min-h-[100px]"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="הערות נוספות..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseRequest}>
                  ביטול
                </Button>
                <Button onClick={handleSubmit}>
                  {editingProduct ? 'עדכן' : 'הוסף'} מוצר
                </Button>
              </div>
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>סגירה ללא שמירה?</AlertDialogTitle>
            <AlertDialogDescription>
              יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור ללא שמירה?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>המשך עריכה</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>סגור ללא שמירה</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AIProductEditDialog
        isOpen={isAIEditDialogOpen}
        onClose={() => setIsAIEditDialogOpen(false)}
        currentProduct={formData}
        onApplyChanges={handleApplyAIChanges}
        allProducts={existingProducts}
      />
    </>
  );
};

export default NewProductSelectionModal;
