// New product taxonomy structure
export interface ProductTaxonomy {
  category: string;
  subCategory: string;
  company: string;
  exposureStocks: number;
  exposureBonds: number;
  exposureForeignCurrency: number;
  exposureForeignInvestments: number;
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
  // Exposure data (populated from DB)
  exposureStocks?: number;
  exposureBonds?: number;
  exposureForeignCurrency?: number;
  exposureForeignInvestments?: number;
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
