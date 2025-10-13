import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../styles';

interface ReportHeaderProps {
  title: string;
  date: string;
  agentName: string;
  logoUrl?: string | null;
}

export const ReportHeader = ({ title, date, agentName, logoUrl }: ReportHeaderProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerDate}>תאריך: {formatDate(date)}</Text>
        <Text style={styles.headerDate}>סוכן: {agentName}</Text>
      </View>
      {logoUrl && (
        <Image 
          src={logoUrl} 
          style={styles.logo}
        />
      )}
    </View>
  );
};
