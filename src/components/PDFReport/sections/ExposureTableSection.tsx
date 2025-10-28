import { View, Text } from '@react-pdf/renderer';
import { SelectedProduct } from '@/types/products';

interface ExposureTableSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  styles: any;
}

export const ExposureTableSection = ({
  currentProducts,
  recommendedProducts,
  styles
}: ExposureTableSectionProps) => {
  // Only show products that have exposure data AND includeExposureData flag is true
  const currentWithExposure = currentProducts.filter(p => 
    p.includeExposureData && (
      p.exposureStocks !== undefined || 
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.includeExposureData && (
      p.exposureStocks !== undefined || 
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    return null;
  }

  const formatExposure = (value: number | undefined): string => {
    if (value === undefined) return '-';
    return `${value.toFixed(2)}%`;
  };

  // Calculate aggregate averages
  const calculateAverage = (products: SelectedProduct[], field: keyof SelectedProduct): number => {
    const values = products
      .map(p => p[field] as number | undefined)
      .filter((v): v is number => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return 0;
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(average * 10) / 10;
  };

  const currentAvgStocks = calculateAverage(currentWithExposure, 'exposureStocks');
  const currentAvgBonds = calculateAverage(currentWithExposure, 'exposureBonds');
  const currentAvgForeignCurrency = calculateAverage(currentWithExposure, 'exposureForeignCurrency');
  const currentAvgForeignInvestments = calculateAverage(currentWithExposure, 'exposureForeignInvestments');

  const recommendedAvgStocks = calculateAverage(recommendedWithExposure, 'exposureStocks');
  const recommendedAvgBonds = calculateAverage(recommendedWithExposure, 'exposureBonds');
  const recommendedAvgForeignCurrency = calculateAverage(recommendedWithExposure, 'exposureForeignCurrency');
  const recommendedAvgForeignInvestments = calculateAverage(recommendedWithExposure, 'exposureForeignInvestments');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>השוואת חשיפות</Text>
      
      {/* Summary Cards */}
      {currentWithExposure.length > 0 && recommendedWithExposure.length > 0 && (
        <View>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>חשיפות ממוצעות - מצב מוצע</Text>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15, gap: 8 }}>
            {/* Stocks */}
            <View style={{ alignItems: 'center', padding: 10, backgroundColor: '#eff6ff', borderRadius: 8, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3b82f6' }}>{recommendedAvgStocks.toFixed(1)}%</Text>
              <Text style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 }}>חשיפה למניות</Text>
            </View>
            
            {/* Bonds */}
            <View style={{ alignItems: 'center', padding: 10, backgroundColor: '#fef3c7', borderRadius: 8, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f59e0b' }}>{recommendedAvgBonds.toFixed(1)}%</Text>
              <Text style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 }}>חשיפה לאג״ח</Text>
            </View>
            
            {/* Foreign Currency */}
            <View style={{ alignItems: 'center', padding: 10, backgroundColor: '#d1fae5', borderRadius: 8, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>{recommendedAvgForeignCurrency.toFixed(1)}%</Text>
              <Text style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 }}>חשיפה למט״ח</Text>
            </View>
            
            {/* Foreign Investments */}
            <View style={{ alignItems: 'center', padding: 10, backgroundColor: '#ede9fe', borderRadius: 8, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' }}>{recommendedAvgForeignInvestments.toFixed(1)}%</Text>
              <Text style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 }}>חשיפה להשקעות חו״ל</Text>
            </View>
          </View>

          {/* Comparison Table */}
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>השוואה מפורטת</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>סוג חשיפה</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>ממוצע קיים</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>ממוצע מוצע</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>שינוי</Text>
            </View>
            
            {/* Stocks Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>מניות</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{currentAvgStocks}%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{recommendedAvgStocks}%</Text>
              <Text style={[styles.tableCell, { flex: 1, color: recommendedAvgStocks > currentAvgStocks ? '#16a34a' : recommendedAvgStocks < currentAvgStocks ? '#dc2626' : '#666' }]}>
                {recommendedAvgStocks > currentAvgStocks ? '+' : ''}{(recommendedAvgStocks - currentAvgStocks).toFixed(1)}%
              </Text>
            </View>

            {/* Bonds Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>אג"ח</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{currentAvgBonds}%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{recommendedAvgBonds}%</Text>
              <Text style={[styles.tableCell, { flex: 1, color: recommendedAvgBonds > currentAvgBonds ? '#16a34a' : recommendedAvgBonds < currentAvgBonds ? '#dc2626' : '#666' }]}>
                {recommendedAvgBonds > currentAvgBonds ? '+' : ''}{(recommendedAvgBonds - currentAvgBonds).toFixed(1)}%
              </Text>
            </View>

            {/* Foreign Currency Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>מט"ח</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{currentAvgForeignCurrency}%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{recommendedAvgForeignCurrency}%</Text>
              <Text style={[styles.tableCell, { flex: 1, color: recommendedAvgForeignCurrency > currentAvgForeignCurrency ? '#16a34a' : recommendedAvgForeignCurrency < currentAvgForeignCurrency ? '#dc2626' : '#666' }]}>
                {recommendedAvgForeignCurrency > currentAvgForeignCurrency ? '+' : ''}{(recommendedAvgForeignCurrency - currentAvgForeignCurrency).toFixed(1)}%
              </Text>
            </View>

            {/* Foreign Investments Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>השקעות חו"ל</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{currentAvgForeignInvestments}%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{recommendedAvgForeignInvestments}%</Text>
              <Text style={[styles.tableCell, { flex: 1, color: recommendedAvgForeignInvestments > currentAvgForeignInvestments ? '#16a34a' : recommendedAvgForeignInvestments < currentAvgForeignInvestments ? '#dc2626' : '#666' }]}>
                {recommendedAvgForeignInvestments > currentAvgForeignInvestments ? '+' : ''}{(recommendedAvgForeignInvestments - currentAvgForeignInvestments).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
