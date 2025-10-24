export interface PensionProduct {
  id: string;
  company: string;
  productType: 'קרן השתלמות' | 'קופת גמל' | 'חברת ביטוח' | 'קרן פנסיה חדשה' | 'ביטוח משכנתא';
  policyNumber: string;
  status: 'פעיל' | 'לא פעיל';
  currentBalance: number;
  managementFeeFromDeposit: number;
  managementFeeFromBalance: number;
  annualReturn: number;
  lastDeposit?: {
    employee: number;
    employer: number;
    date?: string;
  };
  eligibleForWithdrawal?: string | boolean;
  projectedBalanceAtRetirement: number;
  projectedMonthlyPension?: number;
  insuranceCoverage?: {
    deathBenefit: number;
    disabilityBenefit: number;
  };
  planOpenDate?: string;
  notes?: string;
  maslulCode?: string; // קוד מסלול השקעה - 30 ספרות
  detailedExposure?: DetailedExposureData; // חשיפות מפורטות מקובץ XML
}

export interface DetailedExposureData {
  // חשיפות בסיסיות
  exposureStocks: number;        // מניות
  exposureBonds: number;         // אגח (ממוצע)
  exposureForeign: number;       // חו"ל
  exposureForeignCurrency?: number; // מט"ח
  exposureIsrael: number;        // ישראל
  
  // פירוט אגח
  govBondsMarketable: number;    // אג"ח ממשלתיות סחירות
  corpBondsMarketable: number;   // אג"ח קונצרני סחיר
  corpBondsNonMarketable: number; // אג"ח קונצרניות לא סחירות
  
  // נכסים נוספים
  deposits?: number;              // פיקדונות
  loans?: number;                 // הלוואות
  cash?: number;                  // מזומנים
  mutualFunds?: number;           // קרנות נאמנות
  otherAssets?: number;           // נכסים אחרים
  
  // סיווגים
  marketableAssets?: number;      // נכסים סחירים
  nonMarketableAssets?: number;   // נכסים לא סחירים
  
  // מידע
  productType?: 'pension' | 'gemel' | 'insurance';
  identifier?: string;
  reportDate?: string;
}

export interface PensionSummary {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  reportDate: string;
  products: PensionProduct[];
  totalByType: {
    'קרנות השתלמות': number;
    'קופות גמל': number;
    'חברות ביטוח': number;
    'קרנות פנסיה חדשות': number;
  };
}

export interface PensionFileData {
  fileName: string;
  parsedDate: string;
  summary: PensionSummary;
}