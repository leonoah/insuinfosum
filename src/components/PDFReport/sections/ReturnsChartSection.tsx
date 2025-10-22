import { View, Text } from '@react-pdf/renderer';
import { SelectedProduct } from '@/types/products';

interface ReturnsChartSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  styles: any;
}

export const ReturnsChartSection = ({
  currentProducts,
  recommendedProducts,
  styles
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

  const DualBarChart = ({
    data,
    title,
    valueLabel
  }: {
    data: Array<{ label: string; current: number; recommended: number }>;
    title: string;
    valueLabel: string;
  }) => {
    if (data.length === 0) {
      return null;
    }

    const maxValue = Math.max(...data.map(d => Math.max(d.current, d.recommended)));
    const safeMax = maxValue === 0 ? 1 : Math.ceil(maxValue / 5) * 5;
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) => Math.round(((safeMax / tickCount) * index) * 10) / 10);

    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>{title}</Text>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 14 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'flex-end', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 16 }}>
              <View style={{ width: 10, height: 10, backgroundColor: '#06b6d4', borderRadius: 2, marginLeft: 6 }} />
              <Text style={{ fontSize: 8, color: '#cbd5f5' }}>מצב מוצע</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, backgroundColor: '#64748b', borderRadius: 2, marginLeft: 6 }} />
              <Text style={{ fontSize: 8, color: '#cbd5f5' }}>מצב קיים</Text>
            </View>
          </View>
          {data.map((item, index) => (
            <View key={index} style={{ marginBottom: index === data.length - 1 ? 0 : 16 }}>
              <Text style={{ fontSize: 11, color: '#e2e8f0', marginBottom: 6, textAlign: 'right' }}>{item.label}</Text>

              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 64, marginLeft: 8 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>מצב קיים</Text>
                </View>
                <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                  {ticks.slice(1, -1).map((tick, tickIndex) => (
                    <View
                      key={tickIndex}
                      style={{
                        position: 'absolute',
                        left: `${(tick / safeMax) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: '#1f2937'
                      }}
                    />
                  ))}
                  <View
                    style={{
                      width: `${safeMax === 0 ? 0 : (item.current / safeMax) * 100}%`,
                      height: 14,
                      backgroundColor: '#64748b',
                      borderRadius: 3
                    }}
                  />
                </View>
                <View style={{ width: 54, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, color: '#f8fafc', textAlign: 'left' }}>{item.current.toFixed(1)}%</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <View style={{ width: 64, marginLeft: 8 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>מצב מוצע</Text>
                </View>
                <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                  {ticks.slice(1, -1).map((tick, tickIndex) => (
                    <View
                      key={tickIndex}
                      style={{
                        position: 'absolute',
                        left: `${(tick / safeMax) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: '#1f2937'
                      }}
                    />
                  ))}
                  <View
                    style={{
                      width: `${safeMax === 0 ? 0 : (item.recommended / safeMax) * 100}%`,
                      height: 14,
                      backgroundColor: '#06b6d4',
                      borderRadius: 3
                    }}
                  />
                </View>
                <View style={{ width: 54, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, color: '#f8fafc', textAlign: 'left' }}>{item.recommended.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              {ticks.map((tick, tickIndex) => (
                <Text key={tickIndex} style={{ fontSize: 8, color: '#94a3b8' }}>
                  {tick.toFixed(tick >= 10 ? 0 : 1)}%
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: 8, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{valueLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Prepare data for charts
  const categoryData = Array.from(
    new Set([...currentCategoryAvgs.map(c => c.category), ...recommendedCategoryAvgs.map(c => c.category)])
  ).map(category => ({
    label: category,
    current: currentCategoryAvgs.find(c => c.category === category)?.average || 0,
    recommended: recommendedCategoryAvgs.find(c => c.category === category)?.average || 0
  })).sort((a, b) => Math.max(b.current, b.recommended) - Math.max(a.current, a.recommended));

  const companyData = Array.from(
    new Set([...currentCompanyAvgs.map(c => c.company), ...recommendedCompanyAvgs.map(c => c.company)])
  ).map(company => ({
    label: company,
    current: currentCompanyAvgs.find(c => c.company === company)?.average || 0,
    recommended: recommendedCompanyAvgs.find(c => c.company === company)?.average || 0
  })).sort((a, b) => Math.max(b.current, b.recommended) - Math.max(a.current, a.recommended));

  const currentExposureProducts = currentProducts.filter(p =>
    p.includeExposureData && (
      p.exposureStocks !== undefined ||
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  const recommendedExposureProducts = recommendedProducts.filter(p =>
    p.includeExposureData && (
      p.exposureStocks !== undefined ||
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  const calculateExposureAverage = (products: SelectedProduct[], field: keyof SelectedProduct) => {
    const values = products
      .map(p => p[field] as number | undefined)
      .filter((value): value is number => value !== undefined && !isNaN(value));

    if (values.length === 0) {
      return 0;
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(average * 10) / 10;
  };

  const exposureData = [
    {
      label: 'מניות',
      current: calculateExposureAverage(currentExposureProducts, 'exposureStocks'),
      recommended: calculateExposureAverage(recommendedExposureProducts, 'exposureStocks')
    },
    {
      label: 'אג"ח',
      current: calculateExposureAverage(currentExposureProducts, 'exposureBonds'),
      recommended: calculateExposureAverage(recommendedExposureProducts, 'exposureBonds')
    },
    {
      label: 'מט"ח',
      current: calculateExposureAverage(currentExposureProducts, 'exposureForeignCurrency'),
      recommended: calculateExposureAverage(recommendedExposureProducts, 'exposureForeignCurrency')
    },
    {
      label: 'השקעות חו"ל',
      current: calculateExposureAverage(currentExposureProducts, 'exposureForeignInvestments'),
      recommended: calculateExposureAverage(recommendedExposureProducts, 'exposureForeignInvestments')
    }
  ]
    .filter(item => item.current !== 0 || item.recommended !== 0)
    .sort((a, b) => Math.max(b.current, b.recommended) - Math.max(a.current, a.recommended));

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
        <DualBarChart data={categoryData} title="תשואות לפי סוג מוצר" valueLabel="תשואה ממוצעת (%)" />
      )}

      {/* Company comparison */}
      {companyData.length > 0 && (
        <DualBarChart data={companyData} title="תשואות לפי חברה" valueLabel="תשואה ממוצעת (%)" />
      )}

      {/* Exposure comparison */}
      {exposureData.length > 0 && (
        <DualBarChart data={exposureData} title="השוואת חשיפות ממוצעת" valueLabel="חשיפה ממוצעת (%)" />
      )}
    </View>
  );
};
