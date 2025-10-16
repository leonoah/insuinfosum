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
].filter(track => track && track.trim() !== '');