import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { InsuranceCompany, InsuranceProduct, SelectedProduct, ProductSelectionStep, PRODUCT_ICONS, INVESTMENT_TRACKS } from '@/types/insurance';
import insuranceData from '@/data/insurers_products_il.json';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: SelectedProduct) => void;
  productType: 'current' | 'recommended';
  existingProducts?: SelectedProduct[];
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  productType,
  existingProducts = []
}) => {
  const [step, setStep] = useState<ProductSelectionStep>({ current: 1 });
  const [formData, setFormData] = useState<Partial<SelectedProduct>>(() => ({
    type: productType,
    subType: '',
    amount: 0,
    managementFeeOnDeposit: 0,
    managementFeeOnAccumulation: 0,
    investmentTrack: '',
    riskLevelChange: 'no-change',
    notes: ''
  }));

  const companies = insuranceData as InsuranceCompany[];
  const allProducts = companies.flatMap(company => 
    company.מוצרים.map(product => ({ ...product, company: company.שם_חברה }))
  );
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.שם, p])).values()
  );

  const selectedProductData = uniqueProducts.find(p => p.שם === step.selectedProduct);
  const availableCompanies = selectedProductData 
    ? companies.filter(c => c.מוצרים.some(p => p.שם === step.selectedProduct))
    : [];
  
  const selectedCompanyData = availableCompanies.find(c => c.שם_חברה === step.selectedCompany);
  const selectedProductFromCompany = selectedCompanyData?.מוצרים.find(p => p.שם === step.selectedProduct);

  const handleProductSelect = (productName: string) => {
    setStep({ current: 2, selectedProduct: productName });
  };

  const handleCompanySelect = (companyName: string) => {
    setStep({ ...step, current: 3, selectedCompany: companyName });
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
      selectedProduct: existingProduct.productName,
      selectedCompany: existingProduct.company
    });
  };

  const handleSubmit = () => {
    if (!step.selectedCompany || !step.selectedProduct) {
      console.log('Missing required fields:', { company: step.selectedCompany, product: step.selectedProduct });
      return;
    }

    const validSubTypes = selectedProductFromCompany?.תתי_סוגים?.filter(st => st && st.trim() !== '') || [];
    const defaultSubType = validSubTypes.length > 0 ? validSubTypes[0] : '';

    const product: SelectedProduct = {
      id: `${Date.now()}`,
      company: step.selectedCompany,
      productName: step.selectedProduct,
      subType: formData.subType || defaultSubType,
      amount: formData.amount || 0,
      managementFeeOnDeposit: formData.managementFeeOnDeposit || 0,
      managementFeeOnAccumulation: formData.managementFeeOnAccumulation || 0,
      investmentTrack: formData.investmentTrack || '',
      riskLevelChange: formData.riskLevelChange === 'no-change' ? '' : formData.riskLevelChange || '',
      notes: formData.notes || '',
      type: productType
    };

    console.log('Submitting product:', product);
    onAddProduct(product);
    handleClose();
  };

  const handleClose = () => {
    setStep({ current: 1 });
    setFormData({
      type: productType,
      subType: '',
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

  // Filter out empty or invalid subtypes
  const validSubTypes = selectedProductFromCompany?.תתי_סוגים?.filter(subType => 
    subType && typeof subType === 'string' && subType.trim() !== ''
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {productType === 'current' ? 'הוסף מוצר קיים' : 'הוסף מוצר מוצע'}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {step.current === 1 && 'בחר את סוג המוצר הפיננסי'}
            {step.current === 2 && 'בחר את החברה המבטחת'}
            {step.current === 3 && 'הזן את פרטי המוצר'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>שלב {step.current} מתוך 3</span>
              <span>
                {step.current === 1 && 'בחירת מוצר'}
                {step.current === 2 && 'בחירת חברה'}
                {step.current === 3 && 'פרטים נוספים'}
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step 1: Product Selection */}
          {step.current === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">בחר סוג מוצר</h3>
              
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
                            <span className="text-2xl">{PRODUCT_ICONS[product.productName] || '📄'}</span>
                            <div>
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-sm text-muted-foreground">{product.company}</div>
                            </div>
                          </div>
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-muted-foreground mb-3">או בחר מוצר חדש</h4>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uniqueProducts.map((product) => (
                  <div
                    key={product.שם}
                    className="glass-hover p-4 text-center cursor-pointer"
                    onClick={() => handleProductSelect(product.שם)}
                  >
                    <div className="text-4xl mb-2">
                      {PRODUCT_ICONS[product.שם] || '📄'}
                    </div>
                    <div className="font-medium text-sm">{product.שם}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Company Selection */}
          {step.current === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep({ current: 1 })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  בחר חברה עבור: {step.selectedProduct}
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableCompanies.map((company) => (
                  <div
                    key={company.שם_חברה}
                    className="glass-hover p-4 text-center cursor-pointer"
                    onClick={() => handleCompanySelect(company.שם_חברה)}
                  >
                    <div className="font-medium text-lg mb-1">{company.שם_חברה}</div>
                    <div className="text-sm text-muted-foreground">{company.קטגוריה}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details Form */}
          {step.current === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep({ ...step, current: 2 })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  פרטי המוצר: {step.selectedProduct} - {step.selectedCompany}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">סוג מסלול</label>
                  <Select 
                    value={formData.subType || ''} 
                    onValueChange={(value) => setFormData({ ...formData, subType: value })}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="בחר סוג מסלול" />
                    </SelectTrigger>
                    <SelectContent>
                      {validSubTypes.map((subType) => (
                        <SelectItem key={`subtype-${subType}`} value={subType}>
                          {subType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">סכום צבירה (₪)</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="glass"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">דמי ניהול מהפקדה (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.managementFeeOnDeposit}
                    onChange={(e) => setFormData({ ...formData, managementFeeOnDeposit: Number(e.target.value) })}
                    className="glass"
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">דמי ניהול מצבירה (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.managementFeeOnAccumulation}
                    onChange={(e) => setFormData({ ...formData, managementFeeOnAccumulation: Number(e.target.value) })}
                    className="glass"
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">מסלול השקעה</label>
                  <Select 
                    value={formData.investmentTrack || ''} 
                    onValueChange={(value) => setFormData({ ...formData, investmentTrack: value })}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="בחר מסלול השקעה" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TRACKS.map((track) => (
                        <SelectItem key={`track-${track}`} value={track}>
                          {track}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {productType === 'recommended' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">שינוי רמת סיכון</label>
                    <Select 
                      value={formData.riskLevelChange || 'no-change'} 
                      onValueChange={(value) => setFormData({ ...formData, riskLevelChange: value as any })}
                    >
                      <SelectTrigger className="glass">
                        <SelectValue placeholder="בחר שינוי סיכון" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="no-change" value="no-change">ללא שינוי</SelectItem>
                        <SelectItem key="decrease" value="ירידה">ירידת סיכון</SelectItem>
                        <SelectItem key="increase" value="העלאה">העלאת סיכון</SelectItem>
                        <SelectItem key="redistribute" value="פיזור מחדש">פיזור מחדש</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">הערות נוספות</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="glass"
                  placeholder="הוסף הערות או הסברים נוספים..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  ביטול
                </Button>
                <Button onClick={handleSubmit}>
                  הוסף מוצר
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionModal;