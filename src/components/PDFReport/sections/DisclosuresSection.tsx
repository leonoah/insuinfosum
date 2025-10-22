import { View, Text } from '@react-pdf/renderer';

interface DisclosuresSectionProps {
  text: string;
  styles: any;
}

export const DisclosuresSection = ({ text, styles }: DisclosuresSectionProps) => {
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
