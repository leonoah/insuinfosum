import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SelectedProduct } from '@/types/products';

interface ExecutiveSummarySectionProps {
  highlightBullets: string[];
  totalCurrentAmount: number;
  totalRecommendedAmount: number;
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  includeProductsTable?: boolean;
}

export const ExecutiveSummarySection = ({
  highlightBullets,
  totalCurrentAmount,
  totalRecommendedAmount,
  currentProducts,
  recommendedProducts,
  includeProductsTable = true
}: ExecutiveSummarySectionProps) => {
  const difference = totalRecommendedAmount - totalCurrentAmount;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>תקציר מנהלים</Text>
      <Text style={styles.text}>
        במסגרת השיחה הובהר המצב הקיים, הוצג המצב המוצע ונבחנו השינויים המומלצים. להלן תקציר השינויים העיקריים:
      </Text>
      
      <View style={styles.bulletList}>
        {highlightBullets.map((bullet, index) => (
          <View key={index} style={styles.bulletItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsBox}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₪{totalCurrentAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>סה"כ צבירה נוכחית</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: difference >= 0 ? '#10b981' : '#ef4444' }]}>
            {difference >= 0 ? '+' : ''}₪{difference.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>שינוי מוצע</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₪{totalRecommendedAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>סה"כ צבירה מוצעת</Text>
        </View>
      </View>

      {/* Detailed Products Table - Current */}
      {includeProductsTable && currentProducts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 10 }]}>מוצרים קיימים - פירוט מלא</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, { width: '16%' }]}>חברה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>קטגוריה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>מסלול</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>סכום צבירה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>דמי ניהול הפקדה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>דמי ניהול צבירה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>הערות</Text>
            </View>
            {currentProducts.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '16%' }]}>{product.company}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.category}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.investmentTrack}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.amount ? `₪${product.amount.toLocaleString()}` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.managementFeeOnDeposit ? `${product.managementFeeOnDeposit}%` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.managementFeeOnAccumulation ? `${product.managementFeeOnAccumulation}%` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.notes || '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Detailed Products Table - Recommended */}
      {includeProductsTable && recommendedProducts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 10 }]}>מוצרים מוצעים - פירוט מלא</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, { width: '16%' }]}>חברה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>קטגוריה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>מסלול</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>סכום צבירה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>דמי ניהול הפקדה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>דמי ניהול צבירה</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>הערות</Text>
            </View>
            {recommendedProducts.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '16%' }]}>{product.company}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.category}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.investmentTrack}</Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.amount ? `₪${product.amount.toLocaleString()}` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.managementFeeOnDeposit ? `${product.managementFeeOnDeposit}%` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>
                  {product.managementFeeOnAccumulation ? `${product.managementFeeOnAccumulation}%` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '14%' }]}>{product.notes || '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
