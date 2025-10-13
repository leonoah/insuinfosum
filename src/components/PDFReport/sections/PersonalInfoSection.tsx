import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface PersonalInfoSectionProps {
  clientName: string;
  clientId?: string;
  clientPhone?: string;
  clientEmail?: string;
  meetingDate: string;
  location?: string;
  isAnonymous: boolean;
}

export const PersonalInfoSection = ({
  clientName,
  clientId,
  clientPhone,
  clientEmail,
  meetingDate,
  location,
  isAnonymous
}: PersonalInfoSectionProps) => {
  if (isAnonymous) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>מידע אישי</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>שם הלקוח:</Text>
          <Text style={styles.infoValue}>{clientName}</Text>
        </View>
        {clientId && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>תעודת זהות:</Text>
            <Text style={styles.infoValue}>{clientId}</Text>
          </View>
        )}
        {clientPhone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>טלפון:</Text>
            <Text style={styles.infoValue}>{clientPhone}</Text>
          </View>
        )}
        {clientEmail && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>דוא"ל:</Text>
            <Text style={styles.infoValue}>{clientEmail}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>תאריך פגישה:</Text>
          <Text style={styles.infoValue}>{formatDate(meetingDate)}</Text>
        </View>
        {location && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>מיקום:</Text>
            <Text style={styles.infoValue}>{location}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
