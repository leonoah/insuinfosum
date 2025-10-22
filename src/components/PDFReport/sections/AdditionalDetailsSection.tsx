import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface AdditionalDetailsSectionProps {
  currentSituation?: string;
  risks?: string;
  decisions?: string;
  additionalNotes?: string;
  documents?: string[];
  timeframes?: string;
  nextSteps?: string;
}

export const AdditionalDetailsSection = ({
  currentSituation,
  risks,
  decisions,
  additionalNotes,
  documents,
  timeframes,
  nextSteps
}: AdditionalDetailsSectionProps) => {
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const hasContent = currentSituation || risks || decisions || additionalNotes || timeframes || nextSteps || (documents && documents.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פרטים נוספים מהשיחה</Text>
      
      {currentSituation && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>מצב קיים</Text>
          <Text style={styles.text}>{stripHtml(currentSituation)}</Text>
        </View>
      )}

      {risks && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>פערים וסיכונים</Text>
          <Text style={styles.text}>{stripHtml(risks)}</Text>
        </View>
      )}

      {decisions && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>החלטות</Text>
          <Text style={styles.text}>{stripHtml(decisions)}</Text>
        </View>
      )}

      {timeframes && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>לוחות זמנים</Text>
          <Text style={styles.text}>{stripHtml(timeframes)}</Text>
        </View>
      )}

      {nextSteps && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>משימות להמשך</Text>
          <Text style={styles.text}>{stripHtml(nextSteps)}</Text>
        </View>
      )}

      {additionalNotes && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>הערות נוספות</Text>
          <Text style={styles.text}>{additionalNotes}</Text>
        </View>
      )}

      {documents && documents.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>מסמכים שהוצגו</Text>
          <View style={styles.bulletList}>
            {documents.map((doc, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>{doc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
