import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../styles';

interface ReportFooterProps {
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  logoUrl?: string | null;
}

export const ReportFooter = ({ agentName, agentPhone, agentEmail, logoUrl }: ReportFooterProps) => {
  return (
    <View style={styles.footer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.footerText}>סוכן: {agentName}</Text>
        {agentPhone && <Text style={styles.footerText}>טלפון: {agentPhone}</Text>}
        {agentEmail && <Text style={styles.footerText}>דוא"ל: {agentEmail}</Text>}
        <Text style={styles.footerBrand}>דוח זה נוצר בעזרת מערכת InMinds</Text>
      </View>
      {logoUrl && (
        <Image 
          src={logoUrl} 
          style={styles.footerLogo}
        />
      )}
    </View>
  );
};
