import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../styles';
import inMindsLogo from '@/assets/inminds-logo-final-transparent.png';

interface ReportFooterProps {
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  logoUrl?: string | null;
}

export const ReportFooter = ({ agentName, agentPhone, agentEmail, logoUrl }: ReportFooterProps) => {
  return (
    <View style={styles.footer}>
      <View style={{ alignItems: 'center', width: '100%' }}>
        {agentName && agentName.trim() && (
          <Text style={styles.footerText}>סוכן: {agentName}</Text>
        )}
        {agentPhone && agentPhone.trim() && (
          <Text style={styles.footerText}>טלפון: {agentPhone}</Text>
        )}
        {agentEmail && agentEmail.trim() && (
          <Text style={styles.footerText}>דוא"ל: {agentEmail}</Text>
        )}
        {logoUrl && logoUrl.trim() && (
          <Image 
            src={logoUrl} 
            style={{ ...styles.footerLogo, marginTop: 10, marginBottom: 10 }}
          />
        )}
        <Text style={{ ...styles.footerText, fontSize: 8, marginTop: 8, color: '#94a3b8' }}>
          מדיניות פרטיות: כל המידע מעובד באופן מקומי במכשיר שלך בלבד. אנו לא שומרים או מעבירים מידע אישי לשרתים חיצוניים.
        </Text>
        <Text style={styles.footerBrand}>דוח זה נוצר בעזרת מערכת InMinds</Text>
        <Image 
          src={inMindsLogo} 
          style={styles.footerInMindsLogo}
        />
      </View>
    </View>
  );
};
