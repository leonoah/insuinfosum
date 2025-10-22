import { View, Text, Image } from '@react-pdf/renderer';

interface ReportHeaderProps {
  title: string;
  date: string;
  agentName: string;
  logoUrl?: string | null;
  styles: any;
}

export const ReportHeader = ({ title, date, agentName, logoUrl, styles }: ReportHeaderProps) => {
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
      <View style={{ alignItems: 'center', width: '100%' }}>
        <Text style={styles.headerTitle}>{title || 'דוח סיכום שיחה'}</Text>
        <Text style={styles.headerDate}>תאריך: {formatDate(date)}</Text>
        {agentName && agentName.trim() && (
          <Text style={styles.headerDate}>סוכן: {agentName}</Text>
        )}
        {logoUrl && logoUrl.trim() && (
          <Image 
            src={logoUrl} 
            style={{ ...styles.logo, marginTop: 15 }}
          />
        )}
      </View>
    </View>
  );
};
