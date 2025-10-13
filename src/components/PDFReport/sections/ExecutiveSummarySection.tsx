import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface ExecutiveSummarySectionProps {
  highlightBullets: string[];
  totalCurrentAmount: number;
  totalRecommendedAmount: number;
}

export const ExecutiveSummarySection = ({
  highlightBullets,
  totalCurrentAmount,
  totalRecommendedAmount
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
    </View>
  );
};
