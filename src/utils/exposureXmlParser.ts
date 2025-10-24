/**
 * מנתח קבצי XML של חשיפות מהמסלקה הפנסיונית
 * תומך בשלושה סוגי קבצים: גמל, פנסיה, וביטוח
 */

export interface DetailedExposureData {
  // חשיפות בסיסיות
  exposureStocks: number;        // מניות
  exposureBonds: number;         // אגח (ממוצע של 3 סוגים)
  exposureForeign: number;       // חו"ל
  exposureForeignCurrency: number; // מט"ח
  exposureIsrael: number;        // ישראל
  
  // פירוט אגח
  govBondsMarketable: number;    // אג"ח ממשלתיות סחירות (4701)
  corpBondsMarketable: number;   // אג"ח קונצרני סחיר (4703)
  corpBondsNonMarketable: number; // אג"ח קונצרניות לא סחירות (4704)
  
  // נכסים נוספים
  deposits: number;              // פיקדונות (4706)
  loans: number;                 // הלוואות (4707)
  cash: number;                  // מזומנים ושווי מזומנים (4708)
  mutualFunds: number;           // קרנות נאמנות (4709)
  otherAssets: number;           // נכסים אחרים (4710)
  
  // סיווגים נוספים
  marketableAssets: number;      // נכסים סחירים ונזילים (4721)
  nonMarketableAssets: number;   // נכסים לא סחירים (4722)
  
  // מידע כללי
  productType: 'pension' | 'gemel' | 'insurance';
  identifier: string;            // ID_MASLUL_RISHUY / ID_KUPA / ID_GUF
  reportDate: string;            // תאריך הדוח
}

interface XmlExposureRow {
  id: string;
  typeId: string;
  typeName: string;
  amount: number;
  percentage: number;
}

export class ExposureXmlParser {
  private static gemelXmlContent: string | null = null;
  private static pensiaXmlContent: string | null = null;
  private static hevrotXmlContent: string | null = null;

  /**
   * טוען את קבצי ה-XML לזיכרון
   */
  static async loadXmlFiles(): Promise<void> {
    try {
      const [gemelResponse, pensiaResponse, hevrotResponse] = await Promise.all([
        fetch('/src/data/gemel.xml'),
        fetch('/src/data/pensia.xml'),
        fetch('/src/data/hevrot.xml')
      ]);

      this.gemelXmlContent = await gemelResponse.text();
      this.pensiaXmlContent = await pensiaResponse.text();
      this.hevrotXmlContent = await hevrotResponse.text();
    } catch (error) {
      console.error('Error loading XML files:', error);
      throw error;
    }
  }

  /**
   * מחפש חשיפות למוצר גמל/השתלמות
   */
  static findGemelExposure(idKupa: string): DetailedExposureData | null {
    if (!this.gemelXmlContent) {
      console.error('Gemel XML not loaded');
      return null;
    }

    return this.parseGemelXml(this.gemelXmlContent, idKupa);
  }

  /**
   * מחפש חשיפות למוצר פנסיה
   */
  static findPensiaExposure(idMaslulRishuy: string): DetailedExposureData | null {
    if (!this.pensiaXmlContent) {
      console.error('Pensia XML not loaded');
      return null;
    }

    return this.pensiaParsiaXml(this.pensiaXmlContent, idMaslulRishuy);
  }

  /**
   * מחפש חשיפות למוצר ביטוח
   */
  static findInsuranceExposure(idGuf: string): DetailedExposureData | null {
    if (!this.hevrotXmlContent) {
      console.error('Hevrot XML not loaded');
      return null;
    }

    return this.parseHevrotXml(this.hevrotXmlContent, idGuf);
  }

  /**
   * מנתח XML של גמל
   */
  private static parseGemelXml(xmlContent: string, idKupa: string): DetailedExposureData | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const rows = xmlDoc.getElementsByTagName('Row');
    const exposureData: Partial<DetailedExposureData> = {
      productType: 'gemel',
      identifier: idKupa
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const kupaId = row.querySelector('ID_KUPA')?.textContent;
      
      if (kupaId === idKupa) {
        const typeId = row.querySelector('ID_SUG_NECHES')?.textContent;
        const percentage = parseFloat(row.querySelector('ACHUZ_SUG_NECHES')?.textContent || '0');
        
        this.mapExposureType(typeId, percentage, exposureData);
        
        // שמירת תאריך דוח
        if (!exposureData.reportDate) {
          exposureData.reportDate = row.querySelector('TKF_DIVUACH')?.textContent || '';
        }
      }
    }

    if (!exposureData.reportDate) return null;
    
    // חישוב אגח כממוצע
    this.calculateBondsAverage(exposureData);
    
    return exposureData as DetailedExposureData;
  }

  /**
   * מנתח XML של פנסיה
   */
  private static pensiaParsiaXml(xmlContent: string, idMaslulRishuy: string): DetailedExposureData | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const rows = xmlDoc.getElementsByTagName('ROW');
    const exposureData: Partial<DetailedExposureData> = {
      productType: 'pension',
      identifier: idMaslulRishuy
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const maslulId = row.querySelector('ID_MASLUL_RISHUY')?.textContent;
      
      if (maslulId === idMaslulRishuy) {
        const typeId = row.querySelector('ID_SUG_NECHES')?.textContent;
        const percentage = parseFloat(row.querySelector('ACHUZ_SUG_NECHES')?.textContent || '0');
        
        this.mapExposureType(typeId, percentage, exposureData);
        
        if (!exposureData.reportDate) {
          exposureData.reportDate = row.querySelector('TKF_DIVUACH')?.textContent || '';
        }
      }
    }

    if (!exposureData.reportDate) return null;
    
    this.calculateBondsAverage(exposureData);
    
    return exposureData as DetailedExposureData;
  }

  /**
   * מנתח XML של חברות ביטוח
   */
  private static parseHevrotXml(xmlContent: string, idGuf: string): DetailedExposureData | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const rows = xmlDoc.getElementsByTagName('ROW');
    const exposureData: Partial<DetailedExposureData> = {
      productType: 'insurance',
      identifier: idGuf
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const gufId = row.querySelector('ID_GUF')?.textContent;
      
      if (gufId === idGuf) {
        const typeId = row.querySelector('ID_SUG_NECHES')?.textContent;
        const percentage = parseFloat(row.querySelector('ACHUZ_SUG_NECHES')?.textContent || '0');
        
        this.mapExposureType(typeId, percentage, exposureData);
        
        if (!exposureData.reportDate) {
          exposureData.reportDate = row.querySelector('TKF_DIVUACH')?.textContent || '';
        }
      }
    }

    if (!exposureData.reportDate) return null;
    
    this.calculateBondsAverage(exposureData);
    
    return exposureData as DetailedExposureData;
  }

  /**
   * ממפה קוד סוג נכס לשדה בחשיפה
   */
  private static mapExposureType(typeId: string | null, percentage: number, data: Partial<DetailedExposureData>): void {
    if (!typeId) return;

    switch (typeId) {
      case '4701': // אג"ח ממשלתיות סחירות
        data.govBondsMarketable = percentage;
        break;
      case '4703': // אג"ח קונצרני סחיר
        data.corpBondsMarketable = percentage;
        break;
      case '4704': // אג"ח קונצרניות לא סחירות
        data.corpBondsNonMarketable = percentage;
        break;
      case '4705': // מניות
        data.exposureStocks = percentage;
        break;
      case '4706': // פיקדונות
        data.deposits = percentage;
        break;
      case '4707': // הלוואות
        data.loans = percentage;
        break;
      case '4708': // מזומנים
        data.cash = percentage;
        break;
      case '4709': // קרנות נאמנות
        data.mutualFunds = percentage;
        break;
      case '4710': // נכסים אחרים
        data.otherAssets = percentage;
        break;
      case '4721': // נכסים סחירים
        data.marketableAssets = percentage;
        break;
      case '4722': // נכסים לא סחירים
        data.nonMarketableAssets = percentage;
        break;
      case '4731': // נכסים בארץ
        data.exposureIsrael = percentage;
        break;
      case '4732': // נכסים בחו"ל
        data.exposureForeign = percentage;
        break;
    }
  }

  /**
   * מחשב ממוצע אגח משלושת הסוגים
   */
  private static calculateBondsAverage(data: Partial<DetailedExposureData>): void {
    const gov = data.govBondsMarketable || 0;
    const corpMarket = data.corpBondsMarketable || 0;
    const corpNonMarket = data.corpBondsNonMarketable || 0;
    
    data.exposureBonds = (gov + corpMarket + corpNonMarket) / 3;
  }
}
