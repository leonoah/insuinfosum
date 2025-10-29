import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedProduct } from '@/types/products';
import { Gauge } from '@mui/x-charts/Gauge';
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface ReturnsComparisonSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

const ReturnsComparisonSection: React.FC<ReturnsComparisonSectionProps> = ({
  currentProducts,
  recommendedProducts,
}) => {
  // Filter products with returns data
  const currentReturnsProducts = currentProducts.filter(
    product => typeof product.returns === 'number'
  );
  const recommendedReturnsProducts = recommendedProducts.filter(
    product => typeof product.returns === 'number'
  );

  // Calculate average returns
  const avgCurrentReturn =
    currentReturnsProducts.length > 0
      ? currentReturnsProducts.reduce((sum, product) => sum + (product.returns || 0), 0) /
        currentReturnsProducts.length
      : null;

  const avgRecommendedReturn =
    recommendedReturnsProducts.length > 0
      ? recommendedReturnsProducts.reduce((sum, product) => sum + (product.returns || 0), 0) /
        recommendedReturnsProducts.length
      : null;

  const hasReturnsData = avgCurrentReturn !== null || avgRecommendedReturn !== null;

  if (!hasReturnsData) {
    return null;
  }

  const returnsDifference =
    avgCurrentReturn !== null && avgRecommendedReturn !== null
      ? avgRecommendedReturn - avgCurrentReturn
      : null;

  // Prepare data for bar chart
  const chartData = [
    ...(avgCurrentReturn !== null
      ? [{ type: 'קיים', returns: Number(avgCurrentReturn.toFixed(2)) }]
      : []),
    ...(avgRecommendedReturn !== null
      ? [{ type: 'מוצע', returns: Number(avgRecommendedReturn.toFixed(2)) }]
      : []),
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          השוואת תשואות - מצב קיים מול מוצע
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gauges Comparison */}
          <div className="flex flex-wrap justify-center items-center gap-8">
            {/* Current Portfolio Gauge */}
            {avgCurrentReturn !== null && (
              <div className="flex flex-col items-center">
                <Gauge
                  value={avgCurrentReturn}
                  width={140}
                  height={140}
                  startAngle={-90}
                  endAngle={90}
                  min={-10}
                  max={20}
                  text={`${avgCurrentReturn.toFixed(2)}%`}
                  sx={{
                    '& .MuiGauge-valueArc': {
                      fill: 'hsl(var(--muted-foreground))',
                    },
                    '& .MuiGauge-referenceArc': {
                      fill: 'hsl(var(--muted))',
                    },
                    '& text': {
                      fill: 'hsl(var(--foreground))',
                      fontSize: '1rem',
                      fontWeight: 700,
                    },
                  }}
                />
                <div className="text-sm font-medium text-muted-foreground mt-2">
                  תיק קיים
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentReturnsProducts.length} מוצרים
                </div>
              </div>
            )}

            {/* Arrow with difference */}
            {returnsDifference !== null && (
              <div className="flex flex-col items-center">
                <ArrowRight className="w-8 h-8 text-primary rotate-180" />
                <div className="text-sm font-bold mt-1">
                  {returnsDifference > 0 ? (
                    <span className="text-green-500">
                      +{returnsDifference.toFixed(2)}%
                    </span>
                  ) : returnsDifference < 0 ? (
                    <span className="text-red-500">
                      {returnsDifference.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">ללא שינוי</span>
                  )}
                </div>
              </div>
            )}

            {/* Recommended Portfolio Gauge */}
            {avgRecommendedReturn !== null && (
              <div className="flex flex-col items-center">
                <Gauge
                  value={avgRecommendedReturn}
                  width={140}
                  height={140}
                  startAngle={-90}
                  endAngle={90}
                  min={-10}
                  max={20}
                  text={`${avgRecommendedReturn.toFixed(2)}%`}
                  sx={{
                    '& .MuiGauge-valueArc': {
                      fill: 'hsl(var(--primary))',
                    },
                    '& .MuiGauge-referenceArc': {
                      fill: 'hsl(var(--primary) / 0.2)',
                    },
                    '& text': {
                      fill: 'hsl(var(--foreground))',
                      fontSize: '1rem',
                      fontWeight: 700,
                    },
                  }}
                />
                <div className="text-sm font-medium text-primary mt-2">תיק מוצע</div>
                <div className="text-xs text-muted-foreground">
                  {recommendedReturnsProducts.length} מוצרים
                </div>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => [`${value}%`, 'תשואה']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="returns" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Text */}
          {returnsDifference !== null && (
            <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              {returnsDifference > 0 ? (
                <>
                  התיק המוצע מציג שיפור בתשואה ממוצעת של{' '}
                  <span className="font-bold text-green-500">
                    +{returnsDifference.toFixed(2)}%
                  </span>{' '}
                  לעומת התיק הקיים
                </>
              ) : returnsDifference < 0 ? (
                <>
                  התיק המוצע מציג ירידה בתשואה ממוצעת של{' '}
                  <span className="font-bold text-red-500">
                    {returnsDifference.toFixed(2)}%
                  </span>{' '}
                  לעומת התיק הקיים
                </>
              ) : (
                'התשואה הממוצעת בשני התיקים זהה'
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReturnsComparisonSection;
