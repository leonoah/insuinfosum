import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/products';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: SelectedProduct;
  recommendedProduct?: SelectedProduct;
}

const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  currentProduct,
  recommendedProduct
}) => {
  const ComparisonField: React.FC<{
    label: string;
    currentValue: string | number;
    recommendedValue: string | number;
    isAmount?: boolean;
  }> = ({ label, currentValue, recommendedValue, isAmount = false }) => {
    const formatValue = (value: string | number) => {
      if (isAmount && typeof value === 'number') {
        return `₪${value.toLocaleString()}`;
      }
      return value.toString();
    };

    const isDifferent = currentValue !== recommendedValue;

    return (
      <div className="space-y-2">
        <div className="font-medium text-sm text-muted-foreground">{label}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border ${isDifferent ? 'bg-amber-50 border-amber-200' : 'bg-muted/50'}`}>
            <div className="text-xs text-muted-foreground mb-1">מצב קיים</div>
            <div className="font-medium">{formatValue(currentValue)}</div>
          </div>
          <div className={`p-3 rounded-lg border ${isDifferent ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}>
            <div className="text-xs text-muted-foreground mb-1">מצב מוצע</div>
            <div className="font-medium">{formatValue(recommendedValue)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            השוואה בין מוצרים
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mr-auto h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {currentProduct && recommendedProduct && (
          <div className="space-y-6">
            {/* Product Headers */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">
                      {PRODUCT_ICONS[currentProduct.category] || '📄'}
                    </span>
                    מצב קיים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-medium">{currentProduct.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentProduct.company} - {currentProduct.subCategory}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">
                      {PRODUCT_ICONS[recommendedProduct.category] || '📄'}
                    </span>
                    מצב מוצע
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-medium">{recommendedProduct.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {recommendedProduct.company} - {recommendedProduct.subCategory}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Fields */}
            <div className="space-y-4">
              <ComparisonField
                label="סכום"
                currentValue={currentProduct.amount}
                recommendedValue={recommendedProduct.amount}
                isAmount
              />

              <ComparisonField
                label="דמי ניהול על הפקדה"
                currentValue={`${currentProduct.managementFeeOnDeposit}%`}
                recommendedValue={`${recommendedProduct.managementFeeOnDeposit}%`}
              />

              <ComparisonField
                label="דמי ניהול על צבירה"
                currentValue={`${currentProduct.managementFeeOnAccumulation}%`}
                recommendedValue={`${recommendedProduct.managementFeeOnAccumulation}%`}
              />

              {(currentProduct.investmentTrack || recommendedProduct.investmentTrack) && (
                <ComparisonField
                  label="מסלול השקעה"
                  currentValue={currentProduct.investmentTrack || 'לא צוין'}
                  recommendedValue={recommendedProduct.investmentTrack || 'לא צוין'}
                />
              )}

              {(currentProduct.riskLevelChange || recommendedProduct.riskLevelChange) && (
                <ComparisonField
                  label="שינוי רמת סיכון"
                  currentValue={currentProduct.riskLevelChange || 'ללא שינוי'}
                  recommendedValue={recommendedProduct.riskLevelChange || 'ללא שינוי'}
                />
              )}

              {(currentProduct.notes || recommendedProduct.notes) && (
                <div className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground">הערות</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">מצב קיים</div>
                      <div className="text-sm">{currentProduct.notes || 'אין הערות'}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">מצב מוצע</div>
                      <div className="text-sm">{recommendedProduct.notes || 'אין הערות'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-200 rounded"></div>
                <span>מצב קיים</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>מצב מוצע</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductComparisonModal;