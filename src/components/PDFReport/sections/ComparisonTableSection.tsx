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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>השוואת מצב קיים מול מצב מוצע</Text>
      
      <View style={styles.comparisonGrid}>
        {/* Current Products Column */}
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonHeader}>מצב קיים</Text>
          {currentProducts.length === 0 ? (
            <Text style={styles.textMuted}>לא הוזנו מוצרים קיימים</Text>
          ) : (
            currentProducts.map((product, index) => (
              <View key={index} style={styles.comparisonCard}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.productDetail}>חברה: {product.company}</Text>
                <Text style={styles.productDetail}>סכום: ₪{product.amount.toLocaleString()}</Text>
                <Text style={styles.productDetail}>
                  דמי ניהול הפקדה: {product.managementFeeOnDeposit}%
                </Text>
                <Text style={styles.productDetail}>
                  דמי ניהול צבירה: {product.managementFeeOnAccumulation}%
                </Text>
                {product.investmentTrack && (
                  <Text style={styles.productDetail}>מסלול: {product.investmentTrack}</Text>
                )}
              </View>
            ))
          )}
          
          <View style={{ marginTop: 10, padding: 10, backgroundColor: '#334155', borderRadius: 4 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              סה"כ: ₪{stats.totalCurrentAmount.toLocaleString()}
            </Text>
            <Text style={styles.textMuted}>
              ממוצע דמי ניהול הפקדה: {stats.avgCurrentDeposit.toFixed(2)}%
            </Text>
            <Text style={styles.textMuted}>
              ממוצע דמי ניהול צבירה: {stats.avgCurrentAccumulation.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Recommended Products Column */}
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonHeader}>מצב מוצע</Text>
          {recommendedProducts.length === 0 ? (
            <Text style={styles.textMuted}>לא הוזנו מוצרים מומלצים</Text>
          ) : (
            recommendedProducts.map((product, index) => (
              <View key={index} style={styles.comparisonCard}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.productDetail}>חברה: {product.company}</Text>
                <Text style={styles.productDetail}>סכום: ₪{product.amount.toLocaleString()}</Text>
                <Text style={styles.productDetail}>
                  דמי ניהול הפקדה: {product.managementFeeOnDeposit}%
                </Text>
                <Text style={styles.productDetail}>
                  דמי ניהול צבירה: {product.managementFeeOnAccumulation}%
                </Text>
                {product.investmentTrack && (
                  <Text style={styles.productDetail}>מסלול: {product.investmentTrack}</Text>
                )}
                {product.riskLevelChange && product.riskLevelChange !== 'no-change' && product.riskLevelChange.trim() !== '' && (
                  <Text style={[styles.productDetail, { color: '#8b5cf6' }]}>
                    שינוי סיכון: {product.riskLevelChange}
                  </Text>
                )}
              </View>
            ))
          )}
          
          <View style={{ marginTop: 10, padding: 10, backgroundColor: '#334155', borderRadius: 4 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              סה"כ: ₪{stats.totalRecommendedAmount.toLocaleString()}
            </Text>
            <Text style={styles.textMuted}>
              ממוצע דמי ניהול הפקדה: {stats.avgRecommendedDeposit.toFixed(2)}%
            </Text>
            <Text style={styles.textMuted}>
              ממוצע דמי ניהול צבירה: {stats.avgRecommendedAccumulation.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
