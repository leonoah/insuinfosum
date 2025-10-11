import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/insurance';
interface ComparisonSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}
const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  currentProducts,
  recommendedProducts
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

  // If no products in either state, don't show comparison
  if (currentProducts.length === 0 && recommendedProducts.length === 0) {
    return null;
  }
  return <div className="space-y-6" style={{
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  }}>
      {/* Summary Header */}
      <Card className="glass" style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        <CardHeader>
          <CardTitle className="text-xl">השוואת תיקים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="glass p-4 rounded-lg border-2 border-blue-500/30">
              <div className="text-muted-foreground text-center">מצב קיים</div>
              <div className="font-bold text-lg md:text-xl text-center">₪{totalCurrentAmount.toLocaleString()}</div>
              <div className="text-xs text-center text-muted-foreground">{currentProducts.length} מוצרים</div>
            </div>
            
            <div className="glass p-4 rounded-lg border-2 border-green-500/30">
              <div className="text-muted-foreground text-center">מצב מוצע</div>
              <div className="font-bold text-lg md:text-xl text-center">₪{totalRecommendedAmount.toLocaleString()}</div>
              <div className="text-xs text-center text-muted-foreground">{recommendedProducts.length} מוצרים</div>
            </div>
            
            <div className={`glass p-4 rounded-lg border-2 ${amountDifference >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
              <div className="text-muted-foreground text-center">הפרש</div>
              <div className={`font-bold text-lg md:text-xl text-center ${amountDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {amountDifference >= 0 ? '+' : ''}₪{amountDifference.toLocaleString()}
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {recommendedProducts.length >= currentProducts.length ? '+' : ''}{recommendedProducts.length - currentProducts.length} מוצרים
              </div>
            </div>
            
            {/* Arrow for desktop only */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      

      {/* Summary Table */}
      <Card className="glass" style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        <CardHeader>
          <CardTitle>סיכום השינויים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm" style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}>
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
                <tr className="border-b border-border/50">
                  <td className="p-1 md:p-2 font-medium">דמי ניהול (הפקדה)</td>
                  <td className="p-1 md:p-2">
                    {currentProducts.length > 0 ? (currentProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / currentProducts.length).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-1 md:p-2">
                    {recommendedProducts.length > 0 ? (recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / recommendedProducts.length).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-1 md:p-2 font-medium">
                    {currentProducts.length > 0 && recommendedProducts.length > 0 ? <span className={recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / recommendedProducts.length < currentProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / currentProducts.length ? 'text-green-500' : 'text-red-500'}>
                        {(recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / recommendedProducts.length - currentProducts.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / currentProducts.length).toFixed(2)}%
                      </span> : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-1 md:p-2 font-medium">דמי ניהול (צבירה)</td>
                  <td className="p-1 md:p-2">
                    {currentProducts.length > 0 ? (currentProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / currentProducts.length).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-1 md:p-2">
                    {recommendedProducts.length > 0 ? (recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / recommendedProducts.length).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-1 md:p-2 font-medium">
                    {currentProducts.length > 0 && recommendedProducts.length > 0 ? <span className={recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / recommendedProducts.length < currentProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / currentProducts.length ? 'text-green-500' : 'text-red-500'}>
                        {(recommendedProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / recommendedProducts.length - currentProducts.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / currentProducts.length).toFixed(2)}%
                      </span> : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ComparisonSection;