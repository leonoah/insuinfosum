import React from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/insurance';

interface ComparisonViewProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  currentProducts,
  recommendedProducts,
  onClose
}) => {
  const getRiskIcon = (change?: string) => {
    switch (change) {
      case 'ירידה':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'העלאה':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'פיזור מחדש':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (change?: string) => {
    switch (change) {
      case 'ירידה':
        return 'text-green-500';
      case 'העלאה':
        return 'text-red-500';
      case 'פיזור מחדש':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const totalCurrentAmount = currentProducts.reduce((sum, p) => sum + p.amount, 0);
  const totalRecommendedAmount = recommendedProducts.reduce((sum, p) => sum + p.amount, 0);
  const amountDifference = totalRecommendedAmount - totalCurrentAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">השוואת תיקים</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="glass p-3 rounded-lg">
            <div className="text-muted-foreground text-center">סה"כ קיים</div>
            <div className="font-bold text-center">₪{totalCurrentAmount.toLocaleString()}</div>
          </div>
          <div className="glass p-3 rounded-lg">
            <div className="text-muted-foreground text-center">סה"כ מוצע</div>
            <div className="font-bold text-center">₪{totalRecommendedAmount.toLocaleString()}</div>
          </div>
          <div className={`glass p-3 rounded-lg ${amountDifference >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
            <div className="text-muted-foreground text-center">הפרש</div>
            <div className={`font-bold text-center ${amountDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {amountDifference >= 0 ? '+' : ''}₪{amountDifference.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Products */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-blue-400">מצב קיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📋</div>
                <div>אין מוצרים קיימים</div>
              </div>
            ) : (
              currentProducts.map((product) => (
                <div key={product.id} className="bg-background/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{PRODUCT_ICONS[product.productName] || '📄'}</span>
                    <div>
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.company} - {product.subType}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>סכום:</span>
                      <span className="font-medium">₪{product.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>דמי ניהול:</span>
                      <span>{product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                    </div>
                    {product.investmentTrack && (
                      <div className="flex justify-between">
                        <span>מסלול:</span>
                        <span>{product.investmentTrack}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recommended Products */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-green-400">מצב מוצע</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">💡</div>
                <div>אין המלצות</div>
              </div>
            ) : (
              recommendedProducts.map((product) => (
                <div key={product.id} className="bg-background/30 p-4 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{PRODUCT_ICONS[product.productName] || '📄'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.company} - {product.subType}
                      </div>
                    </div>
                    {product.riskLevelChange && (
                      <div className="flex items-center gap-1">
                        {getRiskIcon(product.riskLevelChange)}
                        <span className={`text-xs ${getChangeColor(product.riskLevelChange)}`}>
                          {product.riskLevelChange}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>סכום:</span>
                      <span className="font-medium">₪{product.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>דמי ניהול:</span>
                      <span>{product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                    </div>
                    {product.investmentTrack && (
                      <div className="flex justify-between">
                        <span>מסלול:</span>
                        <span>{product.investmentTrack}</span>
                      </div>
                    )}
                    {product.notes && (
                      <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        {product.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>סיכום השינויים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-1 md:p-2">קטגוריה</th>
                  <th className="text-right p-1 md:p-2">מצב קיים</th>
                  <th className="text-right p-1 md:p-2">המלצה</th>
                  <th className="text-right p-1 md:p-2">שינוי</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-1 md:p-2 font-medium">סה"כ צבירה</td>
                  <td className="p-1 md:p-2">₪{totalCurrentAmount.toLocaleString()}</td>
                  <td className="p-1 md:p-2">₪{totalRecommendedAmount.toLocaleString()}</td>
                  <td className={`p-1 md:p-2 font-medium ${amountDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {amountDifference >= 0 ? '+' : ''}₪{amountDifference.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-1 md:p-2 font-medium">מספר מוצרים</td>
                  <td className="p-1 md:p-2">{currentProducts.length}</td>
                  <td className="p-1 md:p-2">{recommendedProducts.length}</td>
                  <td className={`p-1 md:p-2 font-medium ${recommendedProducts.length >= currentProducts.length ? 'text-green-500' : 'text-red-500'}`}>
                    {recommendedProducts.length >= currentProducts.length ? '+' : ''}{recommendedProducts.length - currentProducts.length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonView;