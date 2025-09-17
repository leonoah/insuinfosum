export interface InsuranceCompany {
  שם_חברה: string;
  קטגוריה: string;
  מוצרים: InsuranceProduct[];
  הערות?: string;
}

export interface InsuranceProduct {
  שם: string;
  תתי_סוגים: string[];
}

export interface SelectedProduct {
  id: string;
  company: string;
  productName: string;
  subType: string;
  amount: number;
  managementFeeOnDeposit: number;
  managementFeeOnAccumulation: number;
  investmentTrack: string;
  riskLevelChange?: 'ירידה' | 'העלאה' | 'פיזור מחדש' | '';
  notes: string;
  type: 'current' | 'recommended';
}

export interface ProductSelectionStep {
  current: 1 | 2 | 3;
  selectedProduct?: string;
  selectedCompany?: string;
}

// Product icons mapping
export const PRODUCT_ICONS: Record<string, string> = {
  'פנסיה': '🏦',
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
];