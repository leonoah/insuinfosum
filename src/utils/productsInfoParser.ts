import { supabase } from "@/integrations/supabase/client";

export interface ProductInfo {
  product_number: string;
  track_name: string;
  company: string;
  product_type: string;
  exposure_data: {
    stocks?: number;
    bonds?: number;
    foreign_currency?: number;
    foreign_investments?: number;
    israel?: number;
    illiquid_assets?: number;
  };
}

interface ExposureGroup {
  [assetType: string]: number;
}

export class ProductsInfoParser {
  /**
   * Parse Pensia XML file and extract products
   */
  static async parsePensiaXml(xmlText: string): Promise<ProductInfo[]> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const rows = xmlDoc.getElementsByTagName("ROW");
    
    const productsMap = new Map<string, ProductInfo>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const productNumber = row.getElementsByTagName("ID_MASLUL_RISHUY")[0]?.textContent?.trim();
      const trackName = row.getElementsByTagName("SHM_KRN")[0]?.textContent?.trim();
      const company = row.getElementsByTagName("SHM_HEVRA_MENAHELET")[0]?.textContent?.trim();
      const assetType = row.getElementsByTagName("SHM_SUG_NECHES")[0]?.textContent?.trim();
      const assetPercent = parseFloat(row.getElementsByTagName("ACHUZ_SUG_NECHES")[0]?.textContent?.trim() || "0");

      if (!productNumber || !trackName || !company) continue;

      const key = `${productNumber}_${company}_${trackName}`;
      
      if (!productsMap.has(key)) {
        productsMap.set(key, {
          product_number: productNumber,
          track_name: trackName,
          company: company,
          product_type: "קרן פנסיה",
          exposure_data: {}
        });
      }

      const product = productsMap.get(key)!;
      this.updateExposureData(product.exposure_data, assetType, assetPercent);
    }

    return Array.from(productsMap.values());
  }

  /**
   * Parse Gemel XML file and extract products
   */
  static async parseGemelXml(xmlText: string): Promise<ProductInfo[]> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const rows = xmlDoc.getElementsByTagName("Row");
    
    const productsMap = new Map<string, ProductInfo>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const productNumber = row.getElementsByTagName("ID_GUF")[0]?.textContent?.trim(); // שים לב - ID_GUF ולא ID_KUPA
      const trackName = row.getElementsByTagName("SHM_KUPA")[0]?.textContent?.trim();
      const company = row.getElementsByTagName("SHM_TAAGID_SHOLET")[0]?.textContent?.trim();
      
      // Try to get SUG_KUPA - might not be in every row
      let productType = "קופת גמל"; // default
      const sugKupaElement = row.getElementsByTagName("SUG_KUPA")[0];
      if (sugKupaElement) {
        const sugKupaValue = sugKupaElement.textContent?.trim();
        if (sugKupaValue) {
          productType = this.identifyGemelType(sugKupaValue);
        }
      }

      const assetType = row.getElementsByTagName("SHM_SUG_NECHES")[0]?.textContent?.trim();
      const assetPercent = parseFloat(row.getElementsByTagName("ACHUZ_SUG_NECHES")[0]?.textContent?.trim() || "0");

      if (!productNumber || !trackName || !company) continue;

      const key = `${productNumber}_${company}_${trackName}`;
      
      if (!productsMap.has(key)) {
        productsMap.set(key, {
          product_number: productNumber,
          track_name: trackName,
          company: company,
          product_type: productType,
          exposure_data: {}
        });
      }

      const product = productsMap.get(key)!;
      this.updateExposureData(product.exposure_data, assetType, assetPercent);
    }

    return Array.from(productsMap.values());
  }

  /**
   * Parse Bituah XML file and extract products
   */
  static async parseBituahXml(xmlText: string): Promise<ProductInfo[]> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const rows = xmlDoc.getElementsByTagName("ROW");
    
    const productsMap = new Map<string, ProductInfo>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const productNumber = row.getElementsByTagName("ID_GUF")[0]?.textContent?.trim();
      const trackName = row.getElementsByTagName("SHEM_GUF")[0]?.textContent?.trim();
      const company = row.getElementsByTagName("SHEM_HEVRA")[0]?.textContent?.trim();
      const assetType = row.getElementsByTagName("SHM_SUG_NECHES")[0]?.textContent?.trim();
      const assetPercent = parseFloat(row.getElementsByTagName("ACHUZ_SUG_NECHES")[0]?.textContent?.trim() || "0");

      if (!productNumber || !trackName || !company) continue;

      const key = `${productNumber}_${company}_${trackName}`;
      
      if (!productsMap.has(key)) {
        productsMap.set(key, {
          product_number: productNumber,
          track_name: trackName,
          company: company,
          product_type: "ביטוח מנהלים",
          exposure_data: {}
        });
      }

      const product = productsMap.get(key)!;
      this.updateExposureData(product.exposure_data, assetType, assetPercent);
    }

    return Array.from(productsMap.values());
  }

  /**
   * Identify Gemel product type from SUG_KUPA value
   */
  private static identifyGemelType(sugKupa: string): string {
    const lowerSugKupa = sugKupa.toLowerCase();
    
    if (lowerSugKupa.includes('השתלמות')) {
      return 'קרן השתלמות';
    } else if (lowerSugKupa.includes('גמל')) {
      return 'קופת גמל';
    }
    
    return 'קופת גמל'; // default
  }

  /**
   * Update exposure data based on asset type
   */
  private static updateExposureData(
    exposureData: ProductInfo['exposure_data'],
    assetType: string | null | undefined,
    percentage: number
  ): void {
    if (!assetType || percentage === 0) return;

    const lowerAssetType = assetType.toLowerCase();

    // חשיפה מנייתית
    if (lowerAssetType.includes('מניות') || lowerAssetType.includes('מנייתי')) {
      exposureData.stocks = (exposureData.stocks || 0) + percentage;
    }

    // חשיפה לאגח
    if (lowerAssetType.includes('אג"ח') || lowerAssetType.includes('אגח')) {
      exposureData.bonds = (exposureData.bonds || 0) + percentage;
    }

    // חשיפה למטח
    if (lowerAssetType.includes('מט"ח') || lowerAssetType.includes('מטח')) {
      exposureData.foreign_currency = (exposureData.foreign_currency || 0) + percentage;
    }

    // חשיפה לחול
    if (lowerAssetType.includes('חו"ל') || lowerAssetType.includes('חול')) {
      exposureData.foreign_investments = (exposureData.foreign_investments || 0) + percentage;
    }

    // חשיפה לישראל
    if (lowerAssetType.includes('בארץ') || lowerAssetType.includes('ישראל')) {
      exposureData.israel = (exposureData.israel || 0) + percentage;
    }

    // חשיפה לנכסים לא סחירים
    if (lowerAssetType.includes('לא סחיר')) {
      exposureData.illiquid_assets = (exposureData.illiquid_assets || 0) + percentage;
    }
  }

  /**
   * Load all product information from XML files
   */
  static async loadAllProducts(): Promise<ProductInfo[]> {
    try {
      const [pensiaRes, gemelRes, bituahRes] = await Promise.all([
        fetch('/src/data/pensia.xml'),
        fetch('/src/data/gemel.xml'),
        fetch('/src/data/bituah.xml')
      ]);

      const [pensiaText, gemelText, bituahText] = await Promise.all([
        pensiaRes.text(),
        gemelRes.text(),
        bituahRes.text()
      ]);

      const [pensiaProducts, gemelProducts, bituahProducts] = await Promise.all([
        this.parsePensiaXml(pensiaText),
        this.parseGemelXml(gemelText),
        this.parseBituahXml(bituahText)
      ]);

      return [...pensiaProducts, ...gemelProducts, ...bituahProducts];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  /**
   * Find product by product number
   */
  static async findProduct(productNumber: string): Promise<ProductInfo | null> {
    try {
      const { data, error } = await supabase
        .from('products_information')
        .select('*')
        .eq('product_number', productNumber)
        .single();

      if (error) {
        console.error('Error finding product:', error);
        return null;
      }

      if (!data) return null;

      return {
        product_number: data.product_number,
        track_name: data.track_name,
        company: data.company,
        product_type: data.product_type,
        exposure_data: (data.exposure_data || {}) as ProductInfo['exposure_data']
      };
    } catch (error) {
      console.error('Error in findProduct:', error);
      return null;
    }
  }

  /**
   * Get all companies for a specific product type
   */
  static async getCompaniesByType(productType: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products_information')
        .select('company')
        .eq('product_type', productType)
        .order('company');

      if (error) throw error;

      const companies = Array.from(new Set(data.map(d => d.company)));
      return companies;
    } catch (error) {
      console.error('Error getting companies:', error);
      return [];
    }
  }

  /**
   * Get all tracks for a specific company and product type
   */
  static async getTracksByCompanyAndType(company: string, productType: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products_information')
        .select('track_name')
        .eq('company', company)
        .eq('product_type', productType)
        .order('track_name');

      if (error) throw error;

      const tracks = Array.from(new Set(data.map(d => d.track_name)));
      return tracks;
    } catch (error) {
      console.error('Error getting tracks:', error);
      return [];
    }
  }

  /**
   * Populate database with products from XML files
   */
  static async populateDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Load all products from XML
      const products = await this.loadAllProducts();
      
      if (products.length === 0) {
        return { success: false, count: 0, error: 'No products found in XML files' };
      }

      // Clear existing data
      await supabase.from('products_information').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new data in batches
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase
          .from('products_information')
          .insert(batch);

        if (error) {
          console.error('Error inserting batch:', error);
          continue;
        }

        inserted += batch.length;
      }

      return { success: true, count: inserted };
    } catch (error) {
      console.error('Error populating database:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
