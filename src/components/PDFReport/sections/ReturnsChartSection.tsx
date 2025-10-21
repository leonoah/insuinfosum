import { View, Text } from '@react-pdf/renderer';
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

  const SimpleBarChart = ({ data, title }: { data: Array<{ label: string; current: number; recommended: number }>; title: string }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.current, d.recommended)), 10);

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>{title}</Text>
        
        {data.map((item, index) => (
          <View key={index} style={{ marginBottom: 15 }}>
            {/* Label */}
            <Text style={{ fontSize: 10, color: '#e2e8f0', marginBottom: 4, textAlign: 'right' }}>
              {item.label}
            </Text>
            
            {/* Current bar */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 3 }}>
              <View style={{ width: 60, marginLeft: 5 }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>מצב קיים:</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#334155', height: 12, borderRadius: 2, position: 'relative' }}>
                <View 
                  style={{ 
                    width: `${(item.current / maxValue) * 100}%`,
                    height: 12,
                    backgroundColor: '#64748b',
                    borderRadius: 2
                  }}
                />
              </View>
              <View style={{ width: 50, marginRight: 5 }}>
                <Text style={{ fontSize: 10, color: '#ffffff', textAlign: 'left' }}>
                  {item.current.toFixed(1)}%
                </Text>
              </View>
            </View>
            
            {/* Recommended bar */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <View style={{ width: 60, marginLeft: 5 }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>מצב מוצע:</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#334155', height: 12, borderRadius: 2, position: 'relative' }}>
                <View 
                  style={{ 
                    width: `${(item.recommended / maxValue) * 100}%`,
                    height: 12,
                    backgroundColor: '#06b6d4',
                    borderRadius: 2
                  }}
                />
              </View>
              <View style={{ width: 50, marginRight: 5 }}>
                <Text style={{ fontSize: 10, color: '#ffffff', textAlign: 'left' }}>
                  {item.recommended.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
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
        <SimpleBarChart data={categoryData} title="תשואות לפי סוג מוצר" />
      )}

      {/* Company comparison */}
      {companyData.length > 0 && (
        <SimpleBarChart data={companyData} title="תשואות לפי חברה" />
      )}
    </View>
  );
};
