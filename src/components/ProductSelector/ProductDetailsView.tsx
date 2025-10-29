import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/products';
import { BarChart } from '@mui/x-charts/BarChart';
import { Gauge } from '@mui/x-charts/Gauge';
import { Badge } from '@/components/ui/badge';

interface ProductDetailsViewProps {
  products: SelectedProduct[];
  title?: string;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ products, title = "פירוט מוצרים" }) => {
  if (products.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        לא נבחרו מוצרים להצגה
      </div>
    );
  }

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, SelectedProduct[]>);

  // Calculate stats for charts
  const categoryAmounts = Object.entries(productsByCategory).map(([category, prods]) => ({
    category,
    amount: prods.reduce((sum, p) => sum + p.amount, 0),
  }));

  const avgFees = {
    deposit: products.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / products.length,
    accumulation: products.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / products.length,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount by Category Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">התפלגות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              height={200}
              series={[
                {
                  data: categoryAmounts.map(item => item.amount),
                  label: 'סכום (₪)',
                  color: '#10b981',
                },
              ]}
              xAxis={[{
                scaleType: 'band',
                data: categoryAmounts.map(item => item.category),
                tickLabelStyle: {
                  angle: 45,
                  textAnchor: 'start',
                  fontSize: 10,
                }
              }]}
              sx={{
                '& .MuiChartsAxis-label': {
                  fill: 'hsl(var(--foreground))',
                },
                '& .MuiChartsAxis-tick': {
                  stroke: 'hsl(var(--border))',
                },
                '& .MuiChartsAxis-tickLabel': {
                  fill: 'hsl(var(--foreground))',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Average Fees Gauges */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">ממוצע דמי ניהול</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <Gauge
                  value={avgFees.deposit}
                  width={100}
                  height={100}
                  startAngle={0}
                  endAngle={360}
                  min={0}
                  max={5}
                  text={`${avgFees.deposit.toFixed(2)}%`}
                  sx={{
                    '& .MuiGauge-valueArc': {
                      fill: '#3b82f6',
                    },
                    '& .MuiGauge-referenceArc': {
                      fill: 'hsl(var(--muted))',
                    },
                    '& text': {
                      fill: 'hsl(var(--foreground))',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }
                  }}
                />
                <div className="text-sm text-center mt-2">דמי ניהול הפקדה</div>
              </div>
              <div className="flex flex-col items-center">
                <Gauge
                  value={avgFees.accumulation}
                  width={100}
                  height={100}
                  startAngle={0}
                  endAngle={360}
                  min={0}
                  max={2}
                  text={`${avgFees.accumulation.toFixed(2)}%`}
                  sx={{
                    '& .MuiGauge-valueArc': {
                      fill: '#10b981',
                    },
                    '& .MuiGauge-referenceArc': {
                      fill: 'hsl(var(--muted))',
                    },
                    '& text': {
                      fill: 'hsl(var(--foreground))',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }
                  }}
                />
                <div className="text-sm text-center mt-2">דמי ניהול צבירה</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List by Category */}
      <div className="space-y-4">
        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
          <Card key={category} className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{PRODUCT_ICONS[category] || '📄'}</span>
                <span>{category}</span>
                <Badge variant="outline" className="mr-auto">
                  {categoryProducts.length} מוצרים
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryProducts.map((product, index) => (
                  <div 
                    key={index} 
                    className="bg-background/30 p-3 rounded-lg border border-border/50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {/* Right Column */}
                      <div className="space-y-1">
                        <div className="font-medium text-primary">{product.company}</div>
                        <div className="text-muted-foreground">{product.subCategory}</div>
                        {product.investmentTrack && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">מסלול: </span>
                            {product.investmentTrack}
                          </div>
                        )}
                      </div>
                      
                      {/* Left Column - Numbers */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">סכום:</span>
                          <span className="font-medium">₪{product.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">דמי ניהול:</span>
                          <span>{product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                        </div>
                        {product.returns !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">תשואה:</span>
                            <span className="text-green-500">{product.returns}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exposure Mini Gauges */}
                    {(product.exposureStocks !== undefined || product.exposureBonds !== undefined) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                        {product.exposureStocks !== undefined && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-12 h-12">
                              <Gauge
                                value={product.exposureStocks}
                                width={48}
                                height={48}
                                startAngle={0}
                                endAngle={360}
                                min={0}
                                max={100}
                                sx={{
                                  '& .MuiGauge-valueArc': {
                                    fill: '#3b82f6',
                                  },
                                  '& text': { display: 'none' }
                                }}
                              />
                            </div>
                            <span className="text-muted-foreground">מניות {product.exposureStocks}%</span>
                          </div>
                        )}
                        {product.exposureBonds !== undefined && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-12 h-12">
                              <Gauge
                                value={product.exposureBonds}
                                width={48}
                                height={48}
                                startAngle={0}
                                endAngle={360}
                                min={0}
                                max={100}
                                sx={{
                                  '& .MuiGauge-valueArc': {
                                    fill: '#10b981',
                                  },
                                  '& text': { display: 'none' }
                                }}
                              />
                            </div>
                            <span className="text-muted-foreground">אג"ח {product.exposureBonds}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {product.notes && (
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                        {product.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductDetailsView;
