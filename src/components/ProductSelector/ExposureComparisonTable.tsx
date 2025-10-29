import React, { useState, useEffect } from 'react';
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
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { BarChart } from '@mui/x-charts/BarChart';

interface ExposureBarProps {
  value: number;
  color: string;
  label: string;
}

const ExposureBar: React.FC<ExposureBarProps> = ({ value, color, label }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{animatedValue.toFixed(1)}%</span>
      </div>
      <div className="h-12 flex items-center">
        <BarChart
          series={[{ data: [animatedValue], color }]}
          xAxis={[{ scaleType: 'band', data: [''] }]}
          yAxis={[{ max: 100 }]}
          height={50}
          margin={{ top: 5, bottom: 5, left: 5, right: 5 }}
          slotProps={{
            bar: {
              rx: 4,
            },
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

  // Helper: render exposure value with animated gauge chart
  const AnimatedGauge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <Gauge
        value={animatedValue}
        width={100}
        height={100}
        valueMin={0}
        valueMax={100}
        cornerRadius="50%"
        sx={(theme) => ({
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 20,
            fontWeight: 'bold',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: color,
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: 'hsl(var(--muted))',
          },
        })}
        text={({ value }) => `${value.toFixed(1)}%`}
      />
    );
  };

  const renderExposureValue = (value: number | undefined, color: string) => {
    if (value === undefined || isNaN(Number(value))) {
      return <span className="text-muted-foreground">-</span>;
    }
    const numValue = Number(value);
    return (
      <div className="flex flex-col items-center">
        <AnimatedGauge value={numValue} color={color} />
      </div>
    );
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
                         <TableCell className="text-right">{renderExposureValue(product.exposureStocks, 'hsl(var(--chart-1))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureBonds, 'hsl(var(--chart-2))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignCurrency, 'hsl(var(--chart-3))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignInvestments, 'hsl(var(--chart-4))')}</TableCell>
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
                         <TableCell className="text-right">{renderExposureValue(product.exposureStocks, 'hsl(var(--chart-1))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureBonds, 'hsl(var(--chart-2))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignCurrency, 'hsl(var(--chart-3))')}</TableCell>
                         <TableCell className="text-right">{renderExposureValue(product.exposureForeignInvestments, 'hsl(var(--chart-4))')}</TableCell>
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
