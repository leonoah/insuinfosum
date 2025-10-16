import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Copy, Mic } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectedProduct, ProductSelectionStep, PRODUCT_ICONS } from '@/types/products';
import { useProductTaxonomy } from '@/hooks/useProductTaxonomy';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { hierarchy, loading, error, getExposureData } = useProductTaxonomy();
  const [step, setStep] = useState<ProductSelectionStep>({ current: editingProduct ? 3 : 1 });
  const [formData, setFormData] = useState<Partial<SelectedProduct>>(() => {
    if (editingProduct) {
      return editingProduct;
    }
    return {
      type: productType,
      amount: 0,
      managementFeeOnDeposit: 0,
      managementFeeOnAccumulation: 0,
      investmentTrack: '',
      riskLevelChange: 'no-change',
      notes: ''
    };
  });

  useEffect(() => {
    if (editingProduct) {
      setStep({ 
        current: 3, 
        selectedCategory: editingProduct.category,
        selectedSubCategory: editingProduct.subCategory,
        selectedCompany: editingProduct.company
      });
      setFormData(editingProduct);
    } else {
      setStep({ current: 1 });
      setFormData({
        type: productType,
        amount: 0,
        managementFeeOnDeposit: 0,
        managementFeeOnAccumulation: 0,
        investmentTrack: '',
        riskLevelChange: 'no-change',
        notes: ''
      });
    }
  }, [editingProduct, productType]);

  const handleCategorySelect = (category: string) => {
    setStep({ current: 2, selectedCategory: category });
  };

  const handleSubCategorySelect = (subCategory: string) => {
    setStep({ ...step, current: 3, selectedSubCategory: subCategory });
  };

  const handleCompanySelect = (company: string) => {
    // Get exposure data and populate form
    if (step.selectedCategory && step.selectedSubCategory) {
      const exposureData = getExposureData(step.selectedCategory, step.selectedSubCategory, company);
      setFormData(prev => ({
        ...prev,
        ...exposureData
      }));
    }
    setStep({ ...step, selectedCompany: company });
  };

  // Handle category change in edit mode
  const handleCategoryChange = (category: string) => {
    setStep({ 
      current: 3,
      selectedCategory: category,
      selectedSubCategory: undefined,
      selectedCompany: undefined
    });
    setFormData(prev => ({
      ...prev,
      exposureStocks: undefined,
      exposureBonds: undefined,
      exposureForeignCurrency: undefined,
      exposureForeignInvestments: undefined
    }));
  };

  // Handle sub-category change in edit mode
  const handleSubCategoryChange = (subCategory: string) => {
    setStep({ 
      ...step,
      selectedSubCategory: subCategory,
      selectedCompany: undefined
    });
    setFormData(prev => ({
      ...prev,
      exposureStocks: undefined,
      exposureBonds: undefined,
      exposureForeignCurrency: undefined,
      exposureForeignInvestments: undefined
    }));
  };

  // Handle company change in edit mode
  const handleCompanyChange = (company: string) => {
    if (step.selectedCategory && step.selectedSubCategory) {
      const exposureData = getExposureData(step.selectedCategory, step.selectedSubCategory, company);
      setFormData(prev => ({
        ...prev,
        ...exposureData
      }));
    }
    setStep({ ...step, selectedCompany: company });
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
      console.log('Missing required fields:', { 
        category: step.selectedCategory, 
        subCategory: step.selectedSubCategory,
        company: step.selectedCompany 
      });
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
      exposureStocks: formData.exposureStocks,
      exposureBonds: formData.exposureBonds,
      exposureForeignCurrency: formData.exposureForeignCurrency,
      exposureForeignInvestments: formData.exposureForeignInvestments
    };

    console.log('Submitting product:', product);
    onAddProduct(product);
    handleClose();
  };

  const handleClose = () => {
    setStep({ current: 1 });
    setFormData({
      type: productType,
      amount: 0,
      managementFeeOnDeposit: 0,
      managementFeeOnAccumulation: 0,
      investmentTrack: '',
      riskLevelChange: 'no-change',
      notes: ''
    });
    onClose();
  };

  const progressValue = (step.current / 3) * 100;

  const availableSubCategories = step.selectedCategory 
    ? hierarchy.subCategories.get(step.selectedCategory) || []
    : [];

  const availableCompanies = (step.selectedCategory && step.selectedSubCategory)
    ? hierarchy.companies.get(step.selectedCategory)?.get(step.selectedSubCategory) || []
    : [];

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle>טוען מוצרים...</DialogTitle>
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
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle>שגיאה</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
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
            {step.current === 2 && 'בחר תת קטגוריה / מסלול'}
            {step.current === 3 && 'בחר חברה והזן פרטים'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>שלב {step.current} מתוך 3</span>
              <span>
                {step.current === 1 && 'בחירת קטגוריה'}
                {step.current === 2 && 'בחירת מסלול'}
                {step.current === 3 && 'בחירת חברה ופרטים'}
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step 1: Category Selection */}
          {step.current === 1 && (
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
          )}

          {/* Step 2: Sub-Category Selection */}
          {step.current === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep({ current: 1 })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  בחר מסלול עבור: {step.selectedCategory}
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

          {/* Step 3: Company Selection & Details */}
          {step.current === 3 && !step.selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep({ ...step, current: 2, selectedSubCategory: undefined })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  בחר חברה: {step.selectedCategory} - {step.selectedSubCategory}
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

          {/* Step 3: Details Form (after company selected) */}
          {step.current === 3 && step.selectedCompany && (
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
                        <SelectContent className="glass z-[100]">
                          {hierarchy.categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {PRODUCT_ICONS[category] || '📄'} {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">תת קטגוריה</label>
                      <Select 
                        value={step.selectedSubCategory} 
                        onValueChange={handleSubCategoryChange}
                        disabled={!step.selectedCategory}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="בחר תת קטגוריה" />
                        </SelectTrigger>
                        <SelectContent className="glass z-[100]">
                          {availableSubCategories.map((subCategory) => (
                            <SelectItem key={subCategory} value={subCategory}>
                              {subCategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">חברה</label>
                      <Select 
                        value={step.selectedCompany} 
                        onValueChange={handleCompanyChange}
                        disabled={!step.selectedSubCategory}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="בחר חברה" />
                        </SelectTrigger>
                        <SelectContent className="glass z-[100]">
                          {availableCompanies.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep({ ...step, selectedCompany: undefined })}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    פרטי המוצר: {step.selectedCategory} - {step.selectedSubCategory} - {step.selectedCompany}
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">סכום צבירה</label>
                  <Input
                    type="number"
                    className="glass"
                    value={formData.amount || ''}
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
                  <label className="text-sm font-medium">מסלול השקעה</label>
                  <Input
                    type="text"
                    className="glass"
                    value={formData.investmentTrack || ''}
                    onChange={(e) => setFormData({ ...formData, investmentTrack: e.target.value })}
                    placeholder="כללי"
                  />
                </div>

                {/* Exposure Data Display (Read-Only) */}
                {formData.exposureStocks !== undefined && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">חשיפה למניות (%)</label>
                      <Input
                        type="number"
                        className="glass bg-muted"
                        value={formData.exposureStocks || 0}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">חשיפה לאג"ח (%)</label>
                      <Input
                        type="number"
                        className="glass bg-muted"
                        value={formData.exposureBonds || 0}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">חשיפה למט"ח (%)</label>
                      <Input
                        type="number"
                        className="glass bg-muted"
                        value={formData.exposureForeignCurrency || 0}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">חשיפה להשקעות בחו"ל (%)</label>
                      <Input
                        type="number"
                        className="glass bg-muted"
                        value={formData.exposureForeignInvestments || 0}
                        readOnly
                      />
                    </div>
                  </>
                )}
              </div>

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
                <Button variant="outline" onClick={handleClose}>
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
  );
};

export default NewProductSelectionModal;
