import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface DisclosuresSectionProps {
  text: string;
}

export const DisclosuresSection = ({ text }: DisclosuresSectionProps) => {
  if (!text) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>גילוי נאות</Text>
      <View style={styles.disclosureBox}>
        <Text style={styles.disclosureText}>{text}</Text>
      </View>
    </View>
  );
};
