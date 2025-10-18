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

interface ExposureComparisonTableProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

const ExposureComparisonTable: React.FC<ExposureComparisonTableProps> = ({
  currentProducts,
  recommendedProducts
}) => {
  // Only show products that have exposure data
  const currentWithExposure = currentProducts.filter(p => 
    p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined
  );

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    return null;
  }

  const formatExposure = (value: number | undefined): string => {
    return value !== undefined ? `${value}%` : '-';
  };

  const calculateDifference = (current: number | undefined, recommended: number | undefined): string => {
    if (current === undefined || recommended === undefined) return '-';
    const diff = recommended - current;
    if (diff === 0) return '0%';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff}%`;
  };

  const getDifferenceColor = (current: number | undefined, recommended: number | undefined): string => {
    if (current === undefined || recommended === undefined) return '';
    const diff = recommended - current;
    if (diff === 0) return 'text-muted-foreground';
    return diff > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>השוואת חשיפות - מצב קיים מול מוצע</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
                        <TableCell>{formatExposure(product.exposureStocks)}</TableCell>
                        <TableCell>{formatExposure(product.exposureBonds)}</TableCell>
                        <TableCell>{formatExposure(product.exposureForeignCurrency)}</TableCell>
                        <TableCell>{formatExposure(product.exposureForeignInvestments)}</TableCell>
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
                        <TableCell>{formatExposure(product.exposureStocks)}</TableCell>
                        <TableCell>{formatExposure(product.exposureBonds)}</TableCell>
                        <TableCell>{formatExposure(product.exposureForeignCurrency)}</TableCell>
                        <TableCell>{formatExposure(product.exposureForeignInvestments)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Comparison Summary */}
          {currentWithExposure.length > 0 && recommendedWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">השוואה - שינויים בחשיפות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-hover">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">שינוי חשיפה למניות</div>
                      <div className={`text-2xl font-bold ${getDifferenceColor(
                        currentWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / currentWithExposure.length,
                        recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length
                      )}`}>
                        {calculateDifference(
                          currentWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / currentWithExposure.length,
                          recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-hover">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">שינוי חשיפה לאג"ח</div>
                      <div className={`text-2xl font-bold ${getDifferenceColor(
                        currentWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / currentWithExposure.length,
                        recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length
                      )}`}>
                        {calculateDifference(
                          currentWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / currentWithExposure.length,
                          recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-hover">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">שינוי חשיפה למט"ח</div>
                      <div className={`text-2xl font-bold ${getDifferenceColor(
                        currentWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / currentWithExposure.length,
                        recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / recommendedWithExposure.length
                      )}`}>
                        {calculateDifference(
                          currentWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / currentWithExposure.length,
                          recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / recommendedWithExposure.length
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-hover">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">שינוי חשיפה להשקעות בחו"ל</div>
                      <div className={`text-2xl font-bold ${getDifferenceColor(
                        currentWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / currentWithExposure.length,
                        recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / recommendedWithExposure.length
                      )}`}>
                        {calculateDifference(
                          currentWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / currentWithExposure.length,
                          recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / recommendedWithExposure.length
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
