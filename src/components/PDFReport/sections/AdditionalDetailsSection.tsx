import { View, Text } from '@react-pdf/renderer';

interface AdditionalDetailsSectionProps {
  meetingContext?: string;
  currentSituation?: string;
  decisions?: string;
  additionalNotes?: string;
  documents?: string[];
  timeframes?: string;
  nextSteps?: string;
  styles: any;
}

export const AdditionalDetailsSection = ({
  meetingContext,
  currentSituation,
  decisions,
  additionalNotes,
  documents,
  timeframes,
  nextSteps,
  styles
}: AdditionalDetailsSectionProps) => {
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const hasContent = meetingContext || currentSituation || decisions || additionalNotes || timeframes || nextSteps || (documents && documents.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פרטים נוספים מהשיחה</Text>
      
      {meetingContext && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>רקע ועיקרי הפגישה</Text>
          <Text style={styles.text}>{stripHtml(meetingContext)}</Text>
        </View>
      )}

      {currentSituation && (
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionSubtitle}>מצב קיים</Text>
          <Text style={styles.text}>{stripHtml(currentSituation)}</Text>
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
