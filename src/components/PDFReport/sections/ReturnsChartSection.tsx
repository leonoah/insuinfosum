import { View, Text, Svg, Rect, Line as SvgLine, G } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SelectedProduct } from '@/types/products';

interface ReturnsChartSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

export const ReturnsChartSection = ({
  currentProducts,
  recommendedProducts
}: ReturnsChartSectionProps) => {
  // Filter products with returns data
  const currentWithReturns = currentProducts.filter(p => p.returns !== undefined && p.returns !== null);
  const recommendedWithReturns = recommendedProducts.filter(p => p.returns !== undefined && p.returns !== null);

  if (currentWithReturns.length === 0 && recommendedWithReturns.length === 0) {
    return null;
  }

  // Calculate averages by category
  const calculateCategoryAverages = (products: SelectedProduct[]) => {
    const categoryMap = new Map<string, { sum: number; count: number }>();
    
    products.forEach(p => {
      if (p.returns !== undefined && p.returns !== null) {
        const existing = categoryMap.get(p.category) || { sum: 0, count: 0 };
        categoryMap.set(p.category, {
          sum: existing.sum + p.returns,
          count: existing.count + 1
        });
      }
    });

    const result: { category: string; average: number }[] = [];
    categoryMap.forEach((value, category) => {
      result.push({
        category,
        average: value.sum / value.count
      });
    });

    return result.sort((a, b) => b.average - a.average);
  };

  // Calculate averages by company
  const calculateCompanyAverages = (products: SelectedProduct[]) => {
    const companyMap = new Map<string, { sum: number; count: number }>();
    
    products.forEach(p => {
      if (p.returns !== undefined && p.returns !== null) {
        const existing = companyMap.get(p.company) || { sum: 0, count: 0 };
        companyMap.set(p.company, {
          sum: existing.sum + p.returns,
          count: existing.count + 1
        });
      }
    });

    const result: { company: string; average: number }[] = [];
    companyMap.forEach((value, company) => {
      result.push({
        company,
        average: value.sum / value.count
      });
    });

    return result.sort((a, b) => b.average - a.average);
  };

  const currentCategoryAvgs = calculateCategoryAverages(currentWithReturns);
  const recommendedCategoryAvgs = calculateCategoryAverages(recommendedWithReturns);
  
  const currentCompanyAvgs = calculateCompanyAverages(currentWithReturns);
  const recommendedCompanyAvgs = calculateCompanyAverages(recommendedWithReturns);

  // Calculate overall averages
  const currentOverallAvg = currentWithReturns.length > 0
    ? currentWithReturns.reduce((sum, p) => sum + (p.returns || 0), 0) / currentWithReturns.length
    : 0;
  const recommendedOverallAvg = recommendedWithReturns.length > 0
    ? recommendedWithReturns.reduce((sum, p) => sum + (p.returns || 0), 0) / recommendedWithReturns.length
    : 0;

  const BarChart = ({ data, title }: { data: Array<{ label: string; current: number; recommended: number }>; title: string }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.current, d.recommended)), 10);
    const chartWidth = 500;
    const chartHeight = 200;
    const barHeight = 20;
    const spacing = 40;
    const leftMargin = 140;

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>{title}</Text>
        <Svg width={chartWidth} height={Math.max(data.length * spacing + 40, 100)} viewBox={`0 0 ${chartWidth} ${data.length * spacing + 40}`}>
          {/* X-axis grid and ticks */}
          {Array.from({ length: 5 }).map((_, i) => {
            const x = leftMargin + (i * (chartWidth - leftMargin - 80) / 4);
            const value = (maxValue * (i / 4));
            return (
              <G key={`grid-${i}`}>
                <SvgLine x1={x} y1={12} x2={x} y2={data.length * spacing + 6} stroke="#475569" strokeWidth={0.5} />
                <text x={x} y={10} fontSize="9" fill="#94a3b8" textAnchor="middle">{value.toFixed(0)}%</text>
              </G>
            );
          })}
          {/* Y-axis labels and bars */}
          {data.map((item, index) => {
            const y = index * spacing + 20;
            const currentBarWidth = (item.current / maxValue) * (chartWidth - leftMargin - 80);
            const recommendedBarWidth = (item.recommended / maxValue) * (chartWidth - leftMargin - 80);

            return (
              <G key={index}>
                {/* Label */}
                <text
                  x={leftMargin - 5}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  fontSize="12"
                  fill="#e2e8f0"
                  fontWeight="600"
                  dominantBaseline="middle"
                >
                  {item.label}
                </text>

                {/* Current bar */}
                <Rect
                  x={leftMargin}
                  y={y - barHeight / 2}
                  width={currentBarWidth}
                  height={barHeight / 2 - 2}
                  fill="#64748b"
                />
                <text
                  x={leftMargin + currentBarWidth + 5}
                  y={y - barHeight / 4}
                  fontSize="12"
                  fill="#ffffff"
                  fontWeight="600"
                  dominantBaseline="middle"
                >
                  {item.current.toFixed(2)}%
                </text>

                {/* Recommended bar */}
                <Rect
                  x={leftMargin}
                  y={y + 2}
                  width={recommendedBarWidth}
                  height={barHeight / 2 - 2}
                  fill="#06b6d4"
                />
                <text
                  x={leftMargin + recommendedBarWidth + 5}
                  y={y + barHeight / 4 + 2}
                  fontSize="12"
                  fill="#ffffff"
                  fontWeight="600"
                  dominantBaseline="middle"
                >
                  {item.recommended.toFixed(2)}%
                </text>
              </G>
            );
          })}

          {/* Legend */}
          <G>
            <Rect x={leftMargin} y={data.length * spacing + 10} width={15} height={8} fill="#64748b" />
            <text x={leftMargin + 20} y={data.length * spacing + 18} fontSize="12" fill="#e2e8f0" fontWeight="600">מצב קיים</text>
            
            <Rect x={leftMargin + 100} y={data.length * spacing + 10} width={15} height={8} fill="#06b6d4" />
            <text x={leftMargin + 120} y={data.length * spacing + 18} fontSize="12" fill="#e2e8f0" fontWeight="600">מצב מוצע</text>
          </G>
        </Svg>
      </View>
    );
  };

  // Prepare data for charts
  const categoryData = Array.from(new Set([...currentCategoryAvgs.map(c => c.category), ...recommendedCategoryAvgs.map(c => c.category)])).map(category => ({
    label: category,
    current: currentCategoryAvgs.find(c => c.category === category)?.average || 0,
    recommended: recommendedCategoryAvgs.find(c => c.category === category)?.average || 0
  }));

  const companyData = Array.from(new Set([...currentCompanyAvgs.map(c => c.company), ...recommendedCompanyAvgs.map(c => c.company)])).map(company => ({
    label: company,
    current: currentCompanyAvgs.find(c => c.company === company)?.average || 0,
    recommended: recommendedCompanyAvgs.find(c => c.company === company)?.average || 0
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>השוואת תשואות</Text>

      {/* Overall Summary */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>סיכום כללי</Text>
        <View style={{ flexDirection: 'row-reverse', gap: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#334155', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>תשואה ממוצעת - מצב קיים</Text>
            <Text style={{ fontSize: 24, color: '#06b6d4' }}>{currentOverallAvg.toFixed(2)}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#334155', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>תשואה ממוצעת - מצב מוצע</Text>
            <Text style={{ fontSize: 24, color: '#06b6d4' }}>{recommendedOverallAvg.toFixed(2)}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#334155', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>שינוי</Text>
            <Text style={{ fontSize: 24, color: recommendedOverallAvg > currentOverallAvg ? '#10b981' : recommendedOverallAvg < currentOverallAvg ? '#ef4444' : '#94a3b8' }}>
              {recommendedOverallAvg > currentOverallAvg ? '+' : ''}{(recommendedOverallAvg - currentOverallAvg).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Category comparison */}
      {categoryData.length > 0 && (
        <BarChart data={categoryData} title="תשואות לפי סוג מוצר" />
      )}

      {/* Company comparison */}
      {companyData.length > 0 && (
        <BarChart data={companyData} title="תשואות לפי חברה" />
      )}
    </View>
  );
};