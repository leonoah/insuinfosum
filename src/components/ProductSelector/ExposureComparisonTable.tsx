import React from 'react';
import { SelectedProduct } from '@/types/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface ExposureBarProps {
  value: number;
  color: string;
  label: string;
}

const ExposureBar: React.FC<ExposureBarProps> = ({ value, color, label }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value.toFixed(1)}%</span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${value}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

interface ExposureComparisonTableProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

const ExposureComparisonTable: React.FC<ExposureComparisonTableProps> = ({
  currentProducts,
  recommendedProducts
}) => {
  // Only show products that have exposure data (includeExposureData is true by default)
  const currentWithExposure = currentProducts.filter(p => 
    p.includeExposureData !== false &&
    (p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined)
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.includeExposureData !== false &&
    (p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined)
  );

  console.log('ExposureComparisonTable - Current with exposure:', currentWithExposure.length);
  console.log('ExposureComparisonTable - Recommended with exposure:', recommendedWithExposure.length);
  
  if (recommendedWithExposure.length > 0) {
    const avgStocks = recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length;
    const avgBonds = recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length;
    console.log('📊 Average exposure - Stocks:', avgStocks, 'Bonds:', avgBonds);
    console.log('📊 Sample product exposures:', recommendedWithExposure.slice(0, 2).map(p => ({
      company: p.company,
      stocks: p.exposureStocks,
      bonds: p.exposureBonds,
      currency: p.exposureForeignCurrency,
      foreign: p.exposureForeignInvestments
    })));
  }

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    console.log('ExposureComparisonTable - Returning null, no products with exposure');
    return null;
  }

  const formatExposure = (value: number | undefined): string => {
    if (value === undefined) return '-';
    // Ensure value is treated as percentage (0-100 range)
    const numValue = Number(value);
    return `${numValue.toFixed(2)}%`;
  };

  const calculateDifference = (current: number | undefined, recommended: number | undefined): string => {
    if (current === undefined || recommended === undefined) return '-';
    const diff = recommended - current;
    if (Math.abs(diff) < 0.01) return '0%';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}%`;
  };

  const getDifferenceColor = (current: number | undefined, recommended: number | undefined): string => {
    if (current === undefined || recommended === undefined) return '';
    const diff = recommended - current;
    if (diff === 0) return 'text-muted-foreground';
    return diff > 0 ? 'text-success' : 'text-destructive';
  };

  // Helper: render exposure value as text
  const renderExposureValue = (value: number | undefined) => {
    if (value === undefined || isNaN(Number(value))) {
      return <span className="text-muted-foreground">-</span>;
    }
    return <span className="font-medium">{Number(value).toFixed(1)}%</span>;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>השוואת חשיפות - מצב קיים מול מוצע</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bars - Show if we have recommended products */}
          {recommendedWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">חשיפות ממוצעות - מצב מוצע</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExposureBar
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length}
                  color="hsl(var(--chart-1))"
                  label="חשיפה למניות"
                />
                <ExposureBar
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length}
                  color="hsl(var(--chart-2))"
                  label="חשיפה לאג״ח"
                />
                <ExposureBar
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / recommendedWithExposure.length}
                  color="hsl(var(--chart-3))"
                  label="חשיפה למט״ח"
                />
                <ExposureBar
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / recommendedWithExposure.length}
                  color="hsl(var(--chart-4))"
                  label="חשיפה להשקעות בחו״ל"
                />
              </div>
            </div>
          )}

          {/* Current Products Table */}
          {currentWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">מצב קיים</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">מוצר</TableHead>
                      <TableHead className="text-right">חשיפה למניות</TableHead>
                      <TableHead className="text-right">חשיפה לאג"ח</TableHead>
                      <TableHead className="text-right">חשיפה למט"ח</TableHead>
                      <TableHead className="text-right">חשיפה להשקעות בחו"ל</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentWithExposure.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.category}</div>
                            <div className="text-sm text-muted-foreground">{product.company} - {product.subCategory}</div>
                          </div>
                        </TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureStocks)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureBonds)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignCurrency)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignInvestments)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Recommended Products Table */}
          {recommendedWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">מצב מוצע</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">מוצר</TableHead>
                      <TableHead className="text-right">חשיפה למניות</TableHead>
                      <TableHead className="text-right">חשיפה לאג"ח</TableHead>
                      <TableHead className="text-right">חשיפה למט"ח</TableHead>
                      <TableHead className="text-right">חשיפה להשקעות בחו"ל</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendedWithExposure.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.category}</div>
                            <div className="text-sm text-muted-foreground">{product.company} - {product.subCategory}</div>
                          </div>
                        </TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureStocks)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureBonds)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignCurrency)}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignInvestments)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ExposureComparisonTable };
export default ExposureComparisonTable;
