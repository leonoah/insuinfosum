import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { styles } from './styles';
import { ReportHeader } from './sections/ReportHeader';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { ExecutiveSummarySection } from './sections/ExecutiveSummarySection';
import { ComparisonTableSection } from './sections/ComparisonTableSection';
import { AdditionalDetailsSection } from './sections/AdditionalDetailsSection';
import { DisclosuresSection } from './sections/DisclosuresSection';
import { ReportFooter } from './sections/ReportFooter';
import { SelectedProduct } from '@/types/products';
import { ExposureTableSection } from './sections/ExposureTableSection';

// Disable hyphenation entirely to avoid RTL letter reordering
Font.registerHyphenationCallback((word) => [word]);

// Register embedded Hebrew font (local) to avoid network and format issues
Font.register({
  family: 'Alef',
  src: '/fonts/Alef-Regular.ttf',
});

// Register Helvetica alias to Alef so fallback resolves safely
Font.register({
  family: 'Helvetica',
  src: '/fonts/Alef-Regular.ttf',
});

// Map other standard PDF font family names to the same Alef font
const standardFamilies = [
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
];
standardFamilies.forEach((family) =>
  Font.register({
    family,
    src: '/fonts/Alef-Regular.ttf',
  })
);

interface AgentData {
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface FormData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  meetingDate: string;
  meetingLocation?: string;
  isAnonymous: boolean;
  products: SelectedProduct[];
  currentSituation?: string;
  risks?: string;
  decisions?: string;
  documents?: string[];
}

interface ProductStats {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  totalCurrentAmount: number;
  totalRecommendedAmount: number;
  avgCurrentDeposit: number;
  avgRecommendedDeposit: number;
  avgCurrentAccumulation: number;
  avgRecommendedAccumulation: number;
  highlightBullets: string[];
}

interface SelectedSections {
  personalInfo: boolean;
  executiveSummary: boolean;
  detailedBreakdown: boolean;
  additionalNotes: boolean;
  disclosures: boolean;
  nextSteps: boolean;
}

interface ReportDocumentProps {
  formData: FormData;
  agentData: AgentData;
  productStats: ProductStats;
  selectedSections: SelectedSections;
  additionalNotesText: string;
  disclosureText: string;
  nextStepsText: string;
}

export const ReportDocument = ({
  formData,
  agentData,
  productStats,
  selectedSections,
  additionalNotesText,
  disclosureText,
  nextStepsText
}: ReportDocumentProps) => {
  return (
    <Document>
      <Page size={{ width: 595.28, height: 5669.29 }} style={styles.page} wrap={false}>
        {/* Header - always visible */}
        <ReportHeader
          title="דוח סיכום שיחה"
          date={formData.meetingDate}
          agentName={agentData.name}
          logoUrl={agentData.logo_url}
        />

        {/* Personal Info */}
        {selectedSections.personalInfo && (
          <PersonalInfoSection
            clientName={formData.clientName}
            clientId={formData.clientId}
            clientPhone={formData.clientPhone}
            clientEmail={formData.clientEmail}
            meetingDate={formData.meetingDate}
            location={formData.meetingLocation}
            isAnonymous={formData.isAnonymous}
          />
        )}

        {/* Executive Summary */}
        {selectedSections.executiveSummary && (
          <ExecutiveSummarySection
            highlightBullets={productStats.highlightBullets}
            totalCurrentAmount={productStats.totalCurrentAmount}
            totalRecommendedAmount={productStats.totalRecommendedAmount}
          />
        )}

        {/* Comparison Table */}
        {selectedSections.detailedBreakdown && (
          <ComparisonTableSection
            currentProducts={productStats.currentProducts}
            recommendedProducts={productStats.recommendedProducts}
            stats={{
              totalCurrentAmount: productStats.totalCurrentAmount,
              totalRecommendedAmount: productStats.totalRecommendedAmount,
              avgCurrentDeposit: productStats.avgCurrentDeposit,
              avgRecommendedDeposit: productStats.avgRecommendedDeposit,
              avgCurrentAccumulation: productStats.avgCurrentAccumulation,
              avgRecommendedAccumulation: productStats.avgRecommendedAccumulation,
            }}
          />
        )}

        {/* Exposure Table */}
        {selectedSections.detailedBreakdown && (
          <ExposureTableSection
            currentProducts={productStats.currentProducts}
            recommendedProducts={productStats.recommendedProducts}
          />
        )}

        {/* Additional Details */}
        {selectedSections.additionalNotes && (
          <AdditionalDetailsSection
            currentSituation={formData.currentSituation}
            risks={formData.risks}
            decisions={formData.decisions}
            additionalNotes={additionalNotesText}
            documents={formData.documents}
          />
        )}

        {/* Next Steps */}
        {selectedSections.nextSteps && nextStepsText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>משימות והמשך טיפול</Text>
            <Text style={styles.text}>{nextStepsText}</Text>
          </View>
        )}

        {/* Disclosures */}
        {selectedSections.disclosures && (
          <DisclosuresSection text={disclosureText} />
        )}

        {/* Footer - always visible */}
        <ReportFooter
          agentName={agentData.name}
          agentPhone={agentData.phone}
          agentEmail={agentData.email}
          logoUrl={agentData.logo_url}
        />
      </Page>
    </Document>
  );
};
