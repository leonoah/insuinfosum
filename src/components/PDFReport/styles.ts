import { StyleSheet } from '@react-pdf/renderer';

// Hebrew-compatible font registration will be handled in the main component
export const styles = StyleSheet.create({
  // Page styles
  page: {
    backgroundColor: '#0f172a',
    padding: 40,
    fontFamily: 'NotoSansHebrew',
    direction: 'rtl',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #1e293b',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#06b6d4',
    textAlign: 'right',
  },
  headerDate: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 5,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  
  // Section styles
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    border: '1px solid #334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
    textAlign: 'right',
  },
  
  // Text styles
  text: {
    fontSize: 11,
    color: '#f1f5f9',
    lineHeight: 1.6,
    textAlign: 'right',
  },
  textMuted: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 1.5,
    textAlign: 'right',
  },
  textBold: {
    fontWeight: 'bold',
    color: '#f1f5f9',
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
    fontSize: 10,
    color: '#94a3b8',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 11,
    color: '#f1f5f9',
    fontWeight: 'bold',
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
    backgroundColor: '#06b6d4',
    marginRight: 8,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: '#f1f5f9',
    lineHeight: 1.6,
    textAlign: 'right',
  },
  
  // Table styles
  table: {
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #334155',
    paddingVertical: 8,
  },
  tableHeaderRow: {
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#f1f5f9',
    textAlign: 'right',
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#06b6d4',
    textAlign: 'right',
    paddingHorizontal: 5,
  },
  
  // Comparison styles
  comparisonSection: {
    marginTop: 15,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#06b6d4',
    textAlign: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  comparisonCard: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    border: '1px solid #334155',
  },
  productName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  productDetail: {
    fontSize: 9,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  
  // Stats box
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#94a3b8',
  },
  
  // Disclosure box
  disclosureBox: {
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 8,
    border: '1px solid #475569',
  },
  disclosureText: {
    fontSize: 9,
    color: '#cbd5e1',
    lineHeight: 1.5,
    textAlign: 'right',
  },
  
  // Footer styles
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '2px solid #1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
  },
  footerBrand: {
    fontSize: 9,
    color: '#06b6d4',
    marginTop: 5,
  },
  footerLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
});
