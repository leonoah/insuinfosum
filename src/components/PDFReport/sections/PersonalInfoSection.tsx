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
          <Text style={styles.infoValue}>שם הלקוח: {clientName || 'לא צוין'}</Text>
        </View>
        {clientId && clientId.trim() && (
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>תעודת זהות: {clientId}</Text>
          </View>
        )}
        {clientPhone && clientPhone.trim() && (
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>טלפון: {clientPhone}</Text>
          </View>
        )}
        {clientEmail && clientEmail.trim() && (
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>דוא"ל: {clientEmail}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>תאריך פגישה: {formatDate(meetingDate)}</Text>
        </View>
        {location && location.trim() && (
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>מיקום: {location}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
