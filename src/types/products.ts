// New product taxonomy structure based on DB2.xlsx
export interface ProductTaxonomy {
  company: string; // מנהל
  category: string; // סוג המוצר
  oldTrackName: string; // שם המסלול הקודם
  newTrackName: string; // שם המסלול החדש
  productNumber: string; // מספר הקופה המזהה
  policyChange: string; // שינוי במדיניות המסלול
  trackMerger: string; // מיזוג המסלול
  exposureForeignCurrency: number; // חשיפה למטח
  exposureForeignInvestments: number; // חשיפה לחול
  exposureIsrael: number; // חשיפה לישראל
  exposureStocks: number; // חשיפה מנייתית
  exposureBonds: number; // חשיפה לאגח
  exposureIlliquidAssets: number; // חשיפה לנכסים לא סחירים
  assetComposition: string; // הרכב נכסים
}

export interface SelectedProduct {
  id: string;
  category: string;
  subCategory: string;
  company: string;
  amount: number;
  managementFeeOnDeposit: number;
  managementFeeOnAccumulation: number;
  investmentTrack: string;
  riskLevelChange?: 'ירידה' | 'העלאה' | 'פיזור מחדש' | 'no-change' | '';
  notes: string;
  type: 'current' | 'recommended';
  productNumber?: string; // מספר מוצר לזיהוי במאגר
  // Exposure data (populated from DB)
  exposureStocks?: number;
  exposureBonds?: number;
  exposureForeignCurrency?: number;
  exposureForeignInvestments?: number;
  exposureIsrael?: number;
  exposureIlliquidAssets?: number;
  assetComposition?: string;
}

export interface ProductSelectionStep {
  current: 1 | 2 | 3;
  selectedCategory?: string;
  selectedSubCategory?: string;
  selectedCompany?: string;
}

// Product categories
export const PRODUCT_CATEGORIES = [
  'קרן פנסיה',
  'קרן השתלמות',
  'קופת גמל',
  'ביטוח מנהלים'
];

// Product icons mapping
export const PRODUCT_ICONS: Record<string, string> = {
  'קרן פנסיה': '🏦',
  'ביטוח מנהלים': '💼',
  'קופת גמל': '📊',
  'קופת גמל להשקעה': '📈',
  'קרן השתלמות': '🎓',
  'ביטוח חיים': '❤️',
  'בריאות': '🏥',
  'סיעוד': '🤝',
  'אובדן כושר עבודה': '💪',
  'רכב': '🚗',
  'דירה/תכולה': '🏠',
  'נסיעות לחו"ל': '✈️',
  'פוליסת חיסכון/השקעה': '💰'
};

export const INVESTMENT_TRACKS = [
  'כללי',
  'מניות',
  'אג"ח',
  'סולידי',
  'מניות חו"ל',
  'הלכתי/שרעי',
  'סקטוריאלי/אלטרנטיבי'
].filter(track => track && track.trim() !== '');
