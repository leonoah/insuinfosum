import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { Fragment } from 'react';
import type { ReactElement } from 'react';
import { createStyles } from './styles';
import { ReportHeader } from './sections/ReportHeader';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { ExecutiveSummarySection } from './sections/ExecutiveSummarySection';
import { ComparisonTableSection } from './sections/ComparisonTableSection';
import { AdditionalDetailsSection } from './sections/AdditionalDetailsSection';
import { DisclosuresSection } from './sections/DisclosuresSection';
import { ReportFooter } from './sections/ReportFooter';
import { SelectedProduct } from '@/types/products';
import { ExposureTableSection } from './sections/ExposureTableSection';
import { ReturnsChartSection } from './sections/ReturnsChartSection';
import ProductDetailsSection from './sections/ProductDetailsSection';
import { formatCurrency } from '@/utils/numberFormat';

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
  meetingContext?: string;
  decisions?: string;
  documents?: string[];
  includeProductsTable?: boolean;
  includeExposureReport?: boolean;
  timeframes?: string;
  includeDecisionsInReport?: boolean;
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
  conversationInsights: boolean;
  portfolioComparison: boolean;
  returnsComparison: boolean;
  productDetails: boolean;
  exposureComparison: boolean;
  disclosures: boolean;
}

type ReportSectionKey = keyof SelectedSections;

const DEFAULT_SECTION_ORDER: ReportSectionKey[] = [
  'personalInfo',
  'executiveSummary',
  'conversationInsights',
  'portfolioComparison',
  'returnsComparison',
  'productDetails',
  'exposureComparison',
  'disclosures',
];

interface ReportDocumentProps {
  formData: FormData;
  agentData: AgentData;
  productStats: ProductStats;
  selectedSections: SelectedSections;
  additionalNotesText: string;
  disclosureText: string;
  nextStepsText: string;
  customSectionTitle?: string;
  customSectionContent?: string;
  sectionOrder?: ReportSectionKey[];
  theme?: 'light' | 'dark';
}

export const ReportDocument = ({
  formData,
  agentData,
  productStats,
  selectedSections,
  additionalNotesText,
  disclosureText,
  nextStepsText,
  customSectionTitle,
  customSectionContent,
  sectionOrder,
  theme = 'dark'
}: ReportDocumentProps) => {
  const styles = createStyles(theme);
  
  const orderedSectionKeys =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : DEFAULT_SECTION_ORDER;

  const sectionComponents: Record<ReportSectionKey, ReactElement | null> = {
    personalInfo: selectedSections.personalInfo ? (
      <PersonalInfoSection
        clientName={formData.clientName}
        clientId={formData.clientId}
        clientPhone={formData.clientPhone}
        clientEmail={formData.clientEmail}
        meetingDate={formData.meetingDate}
        location={formData.meetingLocation}
        isAnonymous={formData.isAnonymous}
        styles={styles}
      />
    ) : null,
    executiveSummary: selectedSections.executiveSummary ? (
      <ExecutiveSummarySection
        highlightBullets={productStats.highlightBullets}
        totalCurrentAmount={productStats.totalCurrentAmount}
        totalRecommendedAmount={productStats.totalRecommendedAmount}
        currentProducts={productStats.currentProducts}
        recommendedProducts={productStats.recommendedProducts}
        includeProductsTable={false}
        meetingContext={formData.meetingContext}
        styles={styles}
      />
    ) : null,
    conversationInsights: selectedSections.conversationInsights ? (
      <AdditionalDetailsSection
        currentSituation={formData.currentSituation}
        decisions={
          formData.includeDecisionsInReport === false
            ? undefined
            : formData.decisions
        }
        additionalNotes={additionalNotesText}
        documents={formData.documents}
        timeframes={
          formData.includeDecisionsInReport === false
            ? undefined
            : formData.timeframes
        }
        nextSteps={nextStepsText}
        styles={styles}
      />
    ) : null,
    portfolioComparison: selectedSections.portfolioComparison ? (
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
        styles={styles}
      />
    ) : null,
    returnsComparison: selectedSections.returnsComparison ? (
      <ReturnsChartSection
        currentProducts={productStats.currentProducts}
        recommendedProducts={productStats.recommendedProducts}
        styles={styles}
      />
    ) : null,
    productDetails:
      selectedSections.productDetails && formData.includeProductsTable !== false ? (
        <ProductDetailsSection
          currentProducts={productStats.currentProducts}
          recommendedProducts={productStats.recommendedProducts}
          styles={styles}
        />
      ) : null,
    exposureComparison:
      selectedSections.exposureComparison && formData.includeExposureReport !== false ? (
        <ExposureTableSection
          currentProducts={productStats.currentProducts}
          recommendedProducts={productStats.recommendedProducts}
          styles={styles}
        />
      ) : null,
    disclosures: selectedSections.disclosures ? (
      <DisclosuresSection text={disclosureText} styles={styles} />
    ) : null,
  };

  return (
    <Document>
      <Page size={{ width: 595.28, height: 5669.29 }} style={styles.page} wrap={false}>
        {/* Header - always visible */}
        <ReportHeader
          title="דוח סיכום שיחה"
          date={formData.meetingDate}
          agentName={agentData.name}
          logoUrl={agentData.logo_url}
          styles={styles}
        />

        {orderedSectionKeys.map((key) => {
          const section = sectionComponents[key];
          if (!section) return null;
          return <Fragment key={key}>{section}</Fragment>;
        })}

        {/* Custom Text Section */}
        {customSectionContent && customSectionContent.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{customSectionTitle || 'הערה מותאמת אישית'}</Text>
            <Text style={styles.text}>{customSectionContent}</Text>
          </View>
        )}

        {/* Footer - always visible */}
        <ReportFooter
          agentName={agentData.name}
          agentPhone={agentData.phone}
          agentEmail={agentData.email}
          logoUrl={agentData.logo_url}
          styles={styles}
        />
      </Page>
    </Document>
  );
};
