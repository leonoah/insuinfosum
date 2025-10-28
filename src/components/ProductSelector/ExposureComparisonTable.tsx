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
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface CircularProgressProps {
  value: number;
  color: string;
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, color, size = 100 }) => {
  const data = [
    {
      name: 'progress',
      value: value,
      fill: color,
    },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius="70%"
        outerRadius="100%"
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={{ fill: 'hsl(var(--muted))' }}
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{value.toFixed(1)}%</span>
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

  // Helper: render small circular indicator per value
  const renderExposureCircle = (value: number | undefined, color: string) => {
    if (value === undefined || isNaN(Number(value))) {
      return <span className="text-muted-foreground">-</span>;
    }
    return <CircularProgress value={Number(value)} color={color} size={50} />;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>השוואת חשיפות - מצב קיים מול מוצע</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Circular Progress - Show if we have recommended products */}
          {recommendedWithExposure.length > 0 && (() => {
            console.log('🎯 Rendering circular progress for', recommendedWithExposure.length, 'products');
            return (
              <div>
                <h3 className="text-lg font-semibold mb-3">חשיפות ממוצעות - מצב מוצע</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Stocks */}
                  <div className="flex flex-col items-center gap-2">
                    {(() => {
                      const value = recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length;
                      console.log('📈 Stocks value:', value);
                      return (
                        <CircularProgress 
                          value={value}
                          color="hsl(var(--chart-1))"
                          size={100}
                        />
                      );
                    })()}
                    <div className="text-xs text-center text-muted-foreground">חשיפה למניות</div>
                  </div>

                  {/* Bonds */}
                  <div className="flex flex-col items-center gap-2">
                    {(() => {
                      const value = recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length;
                      console.log('📊 Bonds value:', value);
                      return (
                        <CircularProgress 
                          value={value}
                          color="hsl(var(--chart-2))"
                          size={100}
                        />
                      );
                    })()}
                    <div className="text-xs text-center text-muted-foreground">חשיפה לאג"ח</div>
                  </div>

                  {/* Foreign Currency */}
                  <div className="flex flex-col items-center gap-2">
                    <CircularProgress 
                      value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / recommendedWithExposure.length}
                      color="hsl(var(--chart-3))"
                      size={100}
                    />
                    <div className="text-xs text-center text-muted-foreground">חשיפה למט"ח</div>
                  </div>

                  {/* Foreign Investments */}
                  <div className="flex flex-col items-center gap-2">
                    <CircularProgress 
                      value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / recommendedWithExposure.length}
                      color="hsl(var(--chart-4))"
                      size={100}
                    />
                    <div className="text-xs text-center text-muted-foreground">חשיפה להשקעות בחו"ל</div>
                  </div>
                </div>
              </div>
            );
          })()}

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
                        <TableCell className="text-right">{renderExposureCircle(product.exposureStocks, 'hsl(var(--chart-1))')}</TableCell>
                        <TableCell className="text-right">{renderExposureCircle(product.exposureBonds, 'hsl(var(--chart-2))')}</TableCell>
                        <TableCell className="text-right">{renderExposureCircle(product.exposureForeignCurrency, 'hsl(var(--chart-3))')}</TableCell>
                        <TableCell className="text-right">{renderExposureCircle(product.exposureForeignInvestments, 'hsl(var(--chart-4))')}</TableCell>
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
                         <TableCell className="text-right">{renderExposureCircle(product.exposureStocks, 'hsl(var(--chart-1))')}</TableCell>
                         <TableCell className="text-right">{renderExposureCircle(product.exposureBonds, 'hsl(var(--chart-2))')}</TableCell>
                         <TableCell className="text-right">{renderExposureCircle(product.exposureForeignCurrency, 'hsl(var(--chart-3))')}</TableCell>
                         <TableCell className="text-right">{renderExposureCircle(product.exposureForeignInvestments, 'hsl(var(--chart-4))')}</TableCell>
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
