/**
 * פרסר טבלה מרכזית למוצרים פיננסיים
 * מפרסר 3 קבצי XML: pensia, gemel, bituah
 * ויוצר טבלה אחידה לבחירת מוצרים
 */

import { DetailedExposureData } from '@/types/pension';

export interface ProductTaxonomyItem {
  productId: string; // מזהה ייחודי
  productType: string; // סוג המוצר (קרן פנסיה, קרן השתלמות, קופת גמל, ביטוח מנהלים)
  company: string; // שם החברה
  trackName: string; // שם המסלול (תת קטגוריה)
  trackNumber: string; // מספר הקרן/מסלול
  exposure?: DetailedExposureData; // חשיפות מפורטות
}

export class ProductTaxonomyParser {
  private static productTaxonomyCache: ProductTaxonomyItem[] | null = null;

  /**
   * טוען את כל קבצי ה-XML ובונה את הטבלה המרכזית
   */
  static async loadProductTaxonomy(): Promise<ProductTaxonomyItem[]> {
    if (this.productTaxonomyCache) {
      return this.productTaxonomyCache;
    }

    try {
      // טעינת קבצי XML
      const [pensiaXml, gemelXml, bituahXml] = await Promise.all([
        import('../data/pensia.xml?raw').then(m => m.default),
        import('../data/gemel.xml?raw').then(m => m.default),
        import('../data/bituah.xml?raw').then(m => m.default),
      ]);

      const products: ProductTaxonomyItem[] = [];

      // פרסור קרנות פנסיה
      products.push(...this.parsePensiaXml(pensiaXml));

      // פרסור קרנות גמל והשתלמות
      products.push(...this.parseGemelXml(gemelXml));

      // פרסור ביטוח מנהלים
      products.push(...this.parseBituahXml(bituahXml));

      this.productTaxonomyCache = products;
      return products;
    } catch (error) {
      console.error('Error loading product taxonomy:', error);
      throw new Error('Failed to load product taxonomy');
    }
  }

  /**
   * פרסור קובץ פנסיה
   */
  private static parsePensiaXml(xmlContent: string): ProductTaxonomyItem[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('ROW');

    // מיפוי לפי ID_MASLUL_RISHUY (מספר קרן)
    const productMap = new Map<string, ProductTaxonomyItem>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const trackNumber = row.getElementsByTagName('ID_MASLUL_RISHUY')[0]?.textContent || '';
      const company = row.getElementsByTagName('SHM_HEVRA_MENAHELET')[0]?.textContent || '';
      const trackName = row.getElementsByTagName('SHM_KRN')[0]?.textContent || '';
      const assetTypeId = row.getElementsByTagName('ID_SUG_NECHES')[0]?.textContent || '';
      const assetTypeName = row.getElementsByTagName('SHM_SUG_NECHES')[0]?.textContent || '';
      const percentage = parseFloat(row.getElementsByTagName('ACHUZ_SUG_NECHES')[0]?.textContent || '0');

      if (!trackNumber || !company || !trackName) continue;

      const key = `pension_${trackNumber}`;
      
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: key,
          productType: 'קרן פנסיה',
          company,
          trackName,
          trackNumber,
          exposure: this.createEmptyExposure(),
        });
      }

      const product = productMap.get(key)!;
      this.updateExposureFromAssetType(product.exposure!, assetTypeId, assetTypeName, percentage);
    }

    return Array.from(productMap.values());
  }

  /**
   * פרסור קובץ גמל/השתלמות
   */
  private static parseGemelXml(xmlContent: string): ProductTaxonomyItem[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('Row');

    const productMap = new Map<string, ProductTaxonomyItem>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const trackNumber = row.getElementsByTagName('ID_KUPA')[0]?.textContent || '';
      const company = row.getElementsByTagName('SHM_TAAGID_SHOLET')[0]?.textContent || '';
      const trackName = row.getElementsByTagName('SHM_KUPA')[0]?.textContent || '';
      const assetTypeId = row.getElementsByTagName('ID_SUG_NECHES')[0]?.textContent || '';
      const assetTypeName = row.getElementsByTagName('SHM_SUG_NECHES')[0]?.textContent || '';
      const percentage = parseFloat(row.getElementsByTagName('ACHUZ_SUG_NECHES')[0]?.textContent || '0');

      if (!trackNumber || !company || !trackName) continue;

      // נסה לזהות אם זו קרן השתלמות או קופת גמל מתוך השם
      const productType = this.identifyGemelType(trackName);
      const key = `gemel_${trackNumber}`;
      
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: key,
          productType,
          company,
          trackName,
          trackNumber,
          exposure: this.createEmptyExposure(),
        });
      }

      const product = productMap.get(key)!;
      this.updateExposureFromAssetType(product.exposure!, assetTypeId, assetTypeName, percentage);
    }

    return Array.from(productMap.values());
  }

  /**
   * פרסור קובץ ביטוח
   */
  private static parseBituahXml(xmlContent: string): ProductTaxonomyItem[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('ROW');

    const productMap = new Map<string, ProductTaxonomyItem>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const trackNumber = row.getElementsByTagName('ID_GUF')[0]?.textContent || '';
      const company = row.getElementsByTagName('SHEM_HEVRA')[0]?.textContent || '';
      const trackName = row.getElementsByTagName('SHEM_GUF')[0]?.textContent || '';
      const assetTypeId = row.getElementsByTagName('ID_SUG_NECHES')[0]?.textContent || '';
      const assetTypeName = row.getElementsByTagName('SHM_SUG_NECHES')[0]?.textContent || '';
      const percentage = parseFloat(row.getElementsByTagName('ACHUZ_SUG_NECHES')[0]?.textContent || '0');

      if (!trackNumber || !company || !trackName) continue;

      const key = `insurance_${trackNumber}`;
      
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: key,
          productType: 'ביטוח מנהלים',
          company,
          trackName,
          trackNumber,
          exposure: this.createEmptyExposure(),
        });
      }

      const product = productMap.get(key)!;
      this.updateExposureFromAssetType(product.exposure!, assetTypeId, assetTypeName, percentage);
    }

    return Array.from(productMap.values());
  }

  /**
   * זיהוי סוג קופת גמל/קרן השתלמות לפי שם
   */
  private static identifyGemelType(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('השתלמות') || lowerName.includes('hishtalmut')) {
      return 'קרן השתלמות';
    }
    return 'קופת גמל';
  }

  /**
   * יצירת אובייקט חשיפות ריק
   */
  private static createEmptyExposure(): DetailedExposureData {
    return {
      exposureStocks: 0,
      exposureBonds: 0,
      exposureForeign: 0,
      exposureForeignCurrency: 0,
      exposureIsrael: 0,
      govBondsMarketable: 0,
      corpBondsMarketable: 0,
      corpBondsNonMarketable: 0,
      deposits: 0,
      loans: 0,
      cash: 0,
      mutualFunds: 0,
      otherAssets: 0,
      marketableAssets: 0,
      nonMarketableAssets: 0,
    };
  }

  /**
   * עדכון חשיפות לפי סוג נכס
   */
  private static updateExposureFromAssetType(
    exposure: DetailedExposureData,
    assetTypeId: string,
    assetTypeName: string,
    percentage: number
  ): void {
    switch (assetTypeId) {
      case '4701': // אג"ח ממשלתיות סחירות
        exposure.govBondsMarketable = percentage;
        break;
      case '4703': // אג"ח קונצרני סחיר
        exposure.corpBondsMarketable = percentage;
        break;
      case '4704': // אג"ח קונצרניות לא סחירות
        exposure.corpBondsNonMarketable = percentage;
        break;
      case '4705': // מניות
        exposure.exposureStocks = percentage;
        break;
      case '4706': // פיקדונות
        exposure.deposits = percentage;
        break;
      case '4707': // הלוואות
        exposure.loans = percentage;
        break;
      case '4708': // מזומנים
        exposure.cash = percentage;
        break;
      case '4709': // קרנות נאמנות
        exposure.mutualFunds = percentage;
        break;
      case '4711': // נכסים אחרים
        exposure.otherAssets = percentage;
        break;
      case '4721': // נכסים סחירים
        exposure.marketableAssets = percentage;
        break;
      case '4722': // נכסים לא סחירים
        exposure.nonMarketableAssets = percentage;
        break;
      case '4731': // נכסים בארץ
        exposure.exposureIsrael = percentage;
        break;
      case '4732': // נכסים בחו"ל ומט"ח
        exposure.exposureForeign = percentage;
        exposure.exposureForeignCurrency = percentage;
        break;
    }

    // חישוב ממוצע אגח
    if (exposure.govBondsMarketable > 0 || exposure.corpBondsMarketable > 0 || exposure.corpBondsNonMarketable > 0) {
      const count = (exposure.govBondsMarketable > 0 ? 1 : 0) + 
                    (exposure.corpBondsMarketable > 0 ? 1 : 0) + 
                    (exposure.corpBondsNonMarketable > 0 ? 1 : 0);
      exposure.exposureBonds = 
        (exposure.govBondsMarketable + exposure.corpBondsMarketable + exposure.corpBondsNonMarketable) / 
        (count || 1);
    }
  }

  /**
   * חיפוש מוצר לפי מספר קרן וסוג מוצר
   */
  static async findProduct(trackNumber: string, productType?: string): Promise<ProductTaxonomyItem | undefined> {
    const products = await this.loadProductTaxonomy();
    return products.find(p => 
      p.trackNumber === trackNumber && 
      (!productType || p.productType === productType)
    );
  }

  /**
   * קבלת כל החברות
   */
  static async getCompanies(): Promise<string[]> {
    const products = await this.loadProductTaxonomy();
    return Array.from(new Set(products.map(p => p.company))).sort();
  }

  /**
   * קבלת מוצרים לפי חברה
   */
  static async getProductsByCompany(company: string): Promise<ProductTaxonomyItem[]> {
    const products = await this.loadProductTaxonomy();
    return products.filter(p => p.company === company);
  }

  /**
   * קבלת מוצרים לפי סוג
   */
  static async getProductsByType(productType: string): Promise<ProductTaxonomyItem[]> {
    const products = await this.loadProductTaxonomy();
    return products.filter(p => p.productType === productType);
  }
}
