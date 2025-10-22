import { StyleSheet } from '@react-pdf/renderer';

// Hebrew-compatible font registration will be handled in the main component
export const createStyles = (theme: 'light' | 'dark' = 'dark') => {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    // Page styles
    page: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      padding: 30,
      fontFamily: 'Alef',
      direction: 'rtl',
    },
  
    // Header styles
    header: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottom: isDark ? '2px solid #1e293b' : '2px solid #e2e8f0',
    },
    headerTitle: {
      fontSize: 32,
      color: isDark ? '#06b6d4' : '#0891b2',
      textAlign: 'center',
    },
    headerDate: {
      fontSize: 14,
      color: isDark ? '#cbd5e1' : '#475569',
      marginTop: 4,
      textAlign: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain',
    },
    
    // Section styles
    section: {
      marginBottom: 15,
      padding: 12,
      backgroundColor: isDark ? '#1e293b' : '#e0f7fa',
      borderRadius: 8,
      border: isDark ? '1px solid #334155' : '1px solid #b2ebf2',
    },
    sectionTitle: {
      fontSize: 20,
      color: isDark ? '#06b6d4' : '#0891b2',
      marginBottom: 10,
      textAlign: 'right',
    },
    sectionSubtitle: {
      fontSize: 16,
      color: isDark ? '#cbd5e1' : '#475569',
      marginBottom: 6,
      textAlign: 'right',
    },
  
    // Text styles
    text: {
      fontSize: 13,
      color: isDark ? '#f1f5f9' : '#1e293b',
      lineHeight: 1.6,
      textAlign: 'right',
      wordBreak: 'break-word',
    },
    textMuted: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      lineHeight: 1.5,
      textAlign: 'right',
    },
    textBold: {
      color: isDark ? '#f1f5f9' : '#0f172a',
    },
  
    // Info grid styles
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    infoItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      marginBottom: 8,
      width: '48%',
    },
    infoLabel: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginRight: 8,
    },
    infoValue: {
      fontSize: 13,
      color: isDark ? '#f1f5f9' : '#1e293b',
    },
  
    // Bullet points
    bulletList: {
      marginTop: 10,
    },
    bulletItem: {
      flexDirection: 'row-reverse',
      marginBottom: 8,
      textAlign: 'right',
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? '#06b6d4' : '#0891b2',
      marginRight: 8,
      marginTop: 6,
    },
    bulletText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#f1f5f9' : '#1e293b',
      lineHeight: 1.6,
      textAlign: 'right',
      wordBreak: 'break-word',
    },
  
    // Table styles
    table: {
      marginTop: 15,
    },
    tableRow: {
      flexDirection: 'row-reverse',
      borderBottom: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
      paddingVertical: 8,
    },
    tableHeaderRow: {
      backgroundColor: isDark ? '#334155' : '#b2ebf2',
      borderRadius: 4,
      marginBottom: 5,
    },
    tableCell: {
      flex: 1,
      fontSize: 12,
      color: isDark ? '#f1f5f9' : '#1e293b',
      textAlign: 'right',
      paddingHorizontal: 5,
    },
    tableHeaderCell: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#06b6d4' : '#0891b2',
      textAlign: 'right',
      paddingHorizontal: 5,
    },
  
    // Comparison styles
    comparisonSection: {
      marginTop: 15,
    },
    comparisonGrid: {
      flexDirection: 'row-reverse',
      gap: 15,
    },
    comparisonColumn: {
      flex: 1,
    },
    comparisonHeader: {
      fontSize: 14,
      color: isDark ? '#06b6d4' : '#0891b2',
      textAlign: 'center',
      marginBottom: 10,
      paddingVertical: 8,
      backgroundColor: isDark ? '#334155' : '#b2ebf2',
      borderRadius: 4,
    },
    comparisonCard: {
      backgroundColor: isDark ? '#1e293b' : '#e0f7fa',
      padding: 10,
      borderRadius: 6,
      marginBottom: 8,
      border: isDark ? '1px solid #334155' : '1px solid #b2ebf2',
    },
    productName: {
      fontSize: 11,
      color: isDark ? '#f1f5f9' : '#1e293b',
      marginBottom: 4,
    },
    productDetail: {
      fontSize: 9,
      color: isDark ? '#cbd5e1' : '#475569',
      marginBottom: 2,
    },
  
    // Stats box
    statsBox: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#334155' : '#b2ebf2',
      padding: 15,
      borderRadius: 8,
      marginTop: 15,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      color: isDark ? '#10b981' : '#059669',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 9,
      color: isDark ? '#94a3b8' : '#64748b',
    },
  
    // Disclosure box
    disclosureBox: {
      backgroundColor: isDark ? '#334155' : '#b2ebf2',
      padding: 15,
      borderRadius: 8,
      border: isDark ? '1px solid #475569' : '1px solid #80deea',
    },
    disclosureText: {
      fontSize: 9,
      color: isDark ? '#cbd5e1' : '#475569',
      lineHeight: 1.5,
      textAlign: 'right',
      wordBreak: 'break-word',
    },
  
    // Footer styles
    footer: {
      marginTop: 20,
      paddingTop: 15,
      borderTop: isDark ? '2px solid #1e293b' : '2px solid #e2e8f0',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      marginBottom: 3,
    },
    footerBrand: {
      fontSize: 10,
      color: isDark ? '#06b6d4' : '#0891b2',
      marginTop: 4,
      marginBottom: 10,
      textAlign: 'center',
    },
    footerLogo: {
      width: 60,
      height: 60,
      objectFit: 'contain',
    },
    footerInMindsLogo: {
      width: 80,
      height: 30,
      objectFit: 'contain',
      marginTop: 5,
    },
  });
};

// Backward compatibility - export default dark theme
export const styles = createStyles('dark');
