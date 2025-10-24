/**
 * פענוח קוד מסלול השקעה (KOD-MASLUL-HASHKA)
 * המספר מורכב מ-30 ספרות:
 * - ספרות 1-9: מספר ח.פ של הגוף המוסדי
 * - ספרות 10-23: מספר אישור מס הכנסה של הקופה (14 ספרות)
 * - ספרות 24-30: מספר מסלול השקעה (7 ספרות)
 */

export interface MaslulCodeParts {
  hpNumber: string;           // ח.פ גוף מוסדי (9 ספרות)
  taxApprovalNumber: string;  // אישור מס הכנסה (14 ספרות)
  trackNumber: string;        // מספר מסלול (7 ספרות)
}

export class MaslulCodeParser {
  /**
   * מפרק קוד מסלול השקעה לחלקיו
   */
  static parseMaslulCode(code: string): MaslulCodeParts | null {
    // ניקוי רווחים ותווים מיוחדים
    const cleanCode = code.replace(/\s/g, '');
    
    // בדיקה שהקוד הוא בדיוק 30 ספרות
    if (cleanCode.length !== 30 || !/^\d+$/.test(cleanCode)) {
      console.warn(`Invalid maslul code length or format: ${code}`);
      return null;
    }

    return {
      hpNumber: cleanCode.substring(0, 9),
      taxApprovalNumber: cleanCode.substring(9, 23),
      trackNumber: cleanCode.substring(23, 30)
    };
  }

  /**
   * מחזיר את מספר אישור מס הכנסה מקוד מסלול
   */
  static getTaxApprovalNumber(code: string): string | null {
    const parts = this.parseMaslulCode(code);
    return parts?.taxApprovalNumber || null;
  }

  /**
   * בודק אם קוד מסלול תקין
   */
  static isValidMaslulCode(code: string): boolean {
    const cleanCode = code.replace(/\s/g, '');
    return cleanCode.length === 30 && /^\d+$/.test(cleanCode);
  }
}
