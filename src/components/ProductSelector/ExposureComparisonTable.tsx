import React from 'react';
import { SelectedProduct } from '@/types/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from '@mui/x-charts/Gauge';

interface ExposureComparisonTableProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

const ExposureComparisonTable: React.FC<ExposureComparisonTableProps> = ({
  currentProducts,
  recommendedProducts
}) => {
  // Only show products that are marked to be included in exposure summary
  const currentWithExposure = currentProducts.filter(p => 
    p.includeExposureData === true &&
    (p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined)
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.includeExposureData === true &&
    (p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined)
  );

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    return null;
  }

  // Helper to render a single exposure as a semicircular gauge

  const ExposureGauge: React.FC<{ value: number | undefined; label: string; color: string }> = ({ value, label, color }) => {
    const numericValue = typeof value === 'number' ? value : 0;
    return (
      <div className="flex flex-col items-center gap-2 bg-background/50 rounded-lg p-3">
        <Gauge
          value={numericValue}
          width={100}
          height={70}
          startAngle={-90}
          endAngle={90}
          min={0}
          max={100}
          sx={{
            '& .MuiGauge-valueArc': {
              fill: color,
            },
            '& .MuiGauge-referenceArc': {
              fill: 'hsl(var(--muted))',
            },
            '& text': {
              fill: 'hsl(var(--foreground))',
              fontWeight: 600,
            }
          }}
        />
        <div className="text-xs text-center font-medium text-foreground">{label}</div>
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
          {/* Current Products - Arc Gauges */}
          {currentWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">מצב קיים</h3>
              <div className="space-y-3">
                {currentWithExposure.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <div className="font-medium">
                      {product.category}
                    </div>
                    <div className="text-sm text-muted-foreground">{product.company} - {product.subCategory}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <ExposureGauge value={product.exposureStocks} label="חשיפה למניות" color="#3b82f6" />
                      <ExposureGauge value={product.exposureBonds} label='חשיפה לאג"ח' color="#10b981" />
                      <ExposureGauge value={product.exposureForeignCurrency} label='חשיפה למט"ח' color="#f59e0b" />
                      <ExposureGauge value={product.exposureForeignInvestments} label='חשיפה להשקעות בחו"ל' color="#8b5cf6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Products - Arc Gauges */}
          {recommendedWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">מצב מוצע</h3>
              <div className="space-y-3">
                {recommendedWithExposure.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <div className="font-medium">
                      {product.category}
                    </div>
                    <div className="text-sm text-muted-foreground">{product.company} - {product.subCategory}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <ExposureGauge value={product.exposureStocks} label="חשיפה למניות" color="#3b82f6" />
                      <ExposureGauge value={product.exposureBonds} label='חשיפה לאג"ח' color="#10b981" />
                      <ExposureGauge value={product.exposureForeignCurrency} label='חשיפה למט"ח' color="#f59e0b" />
                      <ExposureGauge value={product.exposureForeignInvestments} label='חשיפה להשקעות בחו"ל' color="#8b5cf6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Summary - Arc Gauges */}
          {currentWithExposure.length > 0 && recommendedWithExposure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">השוואת חשיפות ממוצעות</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ExposureGauge
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureStocks || 0), 0) / recommendedWithExposure.length}
                  label="חשיפה למניות"
                  color="#3b82f6"
                />
                <ExposureGauge
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureBonds || 0), 0) / recommendedWithExposure.length}
                  label='חשיפה לאג"ח'
                  color="#10b981"
                />
                <ExposureGauge
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignCurrency || 0), 0) / recommendedWithExposure.length}
                  label='חשיפה למט"ח'
                  color="#f59e0b"
                />
                <ExposureGauge
                  value={recommendedWithExposure.reduce((sum, p) => sum + (p.exposureForeignInvestments || 0), 0) / recommendedWithExposure.length}
                  label='חשיפה להשקעות בחו"ל'
                  color="#8b5cf6"
                />
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
