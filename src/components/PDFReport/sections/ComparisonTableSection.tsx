import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SelectedProduct } from '@/types/insurance';

interface ComparisonTableSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  stats: {
    totalCurrentAmount: number;
    totalRecommendedAmount: number;
    avgCurrentDeposit: number;
    avgRecommendedDeposit: number;
    avgCurrentAccumulation: number;
    avgRecommendedAccumulation: number;
  };
}

export const ComparisonTableSection = ({
  currentProducts,
  recommendedProducts,
  stats
}: ComparisonTableSectionProps) => {
  const difference = stats.totalRecommendedAmount - stats.totalCurrentAmount;
  const productsDiff = recommendedProducts.length - currentProducts.length;
  const depositFeeDiff = stats.avgRecommendedDeposit - stats.avgCurrentDeposit;
  const accumulationFeeDiff = stats.avgRecommendedAccumulation - stats.avgCurrentAccumulation;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>השוואת תיקים - מצב קיים מול מוצע</Text>
      
      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
        {/* Current State Card */}
        <View style={{ flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 8, border: '1px solid #334155' }}>
          <View style={{ width: 40, height: 40, backgroundColor: '#334155', borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>📊</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>מצב קיים</Text>
          <Text style={{ fontSize: 18, color: '#06b6d4', marginBottom: 3 }}>₪{stats.totalCurrentAmount.toLocaleString()}</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>{currentProducts.length} מוצרים</Text>
        </View>

        {/* Recommended State Card */}
        <View style={{ flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 8, border: '1px solid #334155' }}>
          <View style={{ width: 40, height: 40, backgroundColor: '#334155', borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🎁</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>מצב מוצע</Text>
          <Text style={{ fontSize: 18, color: '#06b6d4', marginBottom: 3 }}>₪{stats.totalRecommendedAmount.toLocaleString()}</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>{recommendedProducts.length} מוצרים</Text>
        </View>

        {/* Difference Card */}
        <View style={{ flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 8, border: '1px solid #334155' }}>
          <View style={{ width: 40, height: 40, backgroundColor: '#334155', borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>💰</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>הפרש</Text>
          <Text style={{ fontSize: 18, color: difference >= 0 ? '#10b981' : '#ef4444', marginBottom: 3 }}>
            {difference >= 0 ? '+' : ''}₪{Math.abs(difference).toLocaleString()}
          </Text>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>מוצרים</Text>
        </View>
      </View>

      {/* Comparison Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>קטגוריה</Text>
          <Text style={styles.tableHeaderCell}>מצב קיים</Text>
          <Text style={styles.tableHeaderCell}>מצב מוצע</Text>
          <Text style={styles.tableHeaderCell}>שינוי</Text>
        </View>

        {/* Total Accumulation Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>סה"כ צבירה</Text>
          <Text style={styles.tableCell}>₪{stats.totalCurrentAmount.toLocaleString()}</Text>
          <Text style={styles.tableCell}>₪{stats.totalRecommendedAmount.toLocaleString()}</Text>
          <Text style={[styles.tableCell, { color: difference >= 0 ? '#10b981' : '#ef4444' }]}>
            {difference >= 0 ? '+' : ''}₪{Math.abs(difference).toLocaleString()}
          </Text>
        </View>

        {/* Number of Products Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>מספר מוצרים</Text>
          <Text style={styles.tableCell}>{currentProducts.length}</Text>
          <Text style={styles.tableCell}>{recommendedProducts.length}</Text>
          <Text style={[styles.tableCell, { color: productsDiff >= 0 ? '#10b981' : '#ef4444' }]}>
            {productsDiff >= 0 ? '+' : ''}{productsDiff}
          </Text>
        </View>

        {/* Average Deposit Fee Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>ממוצע דמי ניהול (הפקדה)</Text>
          <Text style={styles.tableCell}>{stats.avgCurrentDeposit.toFixed(2)}%</Text>
          <Text style={styles.tableCell}>{stats.avgRecommendedDeposit.toFixed(2)}%</Text>
          <Text style={[styles.tableCell, { color: depositFeeDiff <= 0 ? '#10b981' : '#ef4444' }]}>
            {depositFeeDiff >= 0 ? '+' : ''}{depositFeeDiff.toFixed(2)}%
          </Text>
        </View>

        {/* Average Accumulation Fee Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>ממוצע דמי ניהול (צבירה)</Text>
          <Text style={styles.tableCell}>{stats.avgCurrentAccumulation.toFixed(2)}%</Text>
          <Text style={styles.tableCell}>{stats.avgRecommendedAccumulation.toFixed(2)}%</Text>
          <Text style={[styles.tableCell, { color: accumulationFeeDiff <= 0 ? '#10b981' : '#ef4444' }]}>
            {accumulationFeeDiff >= 0 ? '+' : ''}{accumulationFeeDiff.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
};
