import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ProductTaxonomy } from '@/types/products';

interface ProductHierarchy {
  categories: string[];
  companies: string[];
  subCategories: Map<string, Set<string>>;
  products: ProductTaxonomy[];
  productsByNumber: Map<string, ProductTaxonomy>;
  productsByCompanyAndTrack: Map<string, ProductTaxonomy[]>;
}

export const useProductTaxonomyFromExcel = () => {
  const [hierarchy, setHierarchy] = useState<ProductHierarchy>({
    categories: [],
    companies: [],
    subCategories: new Map(),
    products: [],
    productsByNumber: new Map(),
    productsByCompanyAndTrack: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProductTaxonomy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/src/data/products_taxonomy.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        throw new Error('הקובץ ריק או לא תקין');
      }

      const headers = data[0];
      const products: ProductTaxonomy[] = [];
      const categoriesSet = new Set<string>();
      const companiesSet = new Set<string>();
      const subCategoriesMap = new Map<string, Set<string>>();
      const productsByNumber = new Map<string, ProductTaxonomy>();
      const productsByCompanyAndTrack = new Map<string, ProductTaxonomy[]>();

      // Parse data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const product: ProductTaxonomy = {
          company: String(row[0] || '').trim(),
          category: String(row[1] || '').trim(),
          oldTrackName: String(row[2] || '').trim(),
          newTrackName: String(row[3] || '').trim(),
          productNumber: String(row[4] || '').trim(),
          policyChange: String(row[5] || '').trim(),
          trackMerger: String(row[6] || '').trim(),
          exposureForeignCurrency: parseFloat(String(row[7] || '0').replace('%', '')) || 0,
          exposureForeignInvestments: parseFloat(String(row[8] || '0').replace('%', '')) || 0,
          exposureIsrael: parseFloat(String(row[9] || '0').replace('%', '')) || 0,
          exposureStocks: parseFloat(String(row[10] || '0').replace('%', '')) || 0,
          exposureBonds: parseFloat(String(row[11] || '0').replace('%', '')) || 0,
          exposureIlliquidAssets: parseFloat(String(row[12] || '0').replace('%', '')) || 0,
          assetComposition: String(row[13] || '').trim(),
        };

        if (!product.company || !product.category) continue;

        products.push(product);
        categoriesSet.add(product.category);
        companiesSet.add(product.company);

        // Track subcategories (new track names)
        if (product.newTrackName) {
          if (!subCategoriesMap.has(product.category)) {
            subCategoriesMap.set(product.category, new Set());
          }
          subCategoriesMap.get(product.category)!.add(product.newTrackName);
        }

        // Index by product number
        if (product.productNumber) {
          productsByNumber.set(product.productNumber, product);
        }

        // Index by company and track name
        const trackKey = `${product.company}:${product.newTrackName || product.oldTrackName}`;
        if (!productsByCompanyAndTrack.has(trackKey)) {
          productsByCompanyAndTrack.set(trackKey, []);
        }
        productsByCompanyAndTrack.get(trackKey)!.push(product);
      }

      setHierarchy({
        categories: Array.from(categoriesSet).sort(),
        companies: Array.from(companiesSet).sort(),
        subCategories: subCategoriesMap,
        products,
        productsByNumber,
        productsByCompanyAndTrack,
      });

      console.log('✅ טעינת טקסונומיית מוצרים מאקסל הושלמה:', {
        categories: categoriesSet.size,
        companies: companiesSet.size,
        products: products.length,
      });

      setError(null);
    } catch (err) {
      console.error('❌ שגיאה בטעינת טקסונומיית מוצרים:', err);
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductTaxonomy();
  }, []);

  const getExposureData = (
    company: string,
    category: string,
    trackName: string,
    productNumber?: string
  ): ProductTaxonomy | undefined => {
    // First try to find by product number (highest priority)
    if (productNumber) {
      const byNumber = hierarchy.productsByNumber.get(productNumber);
      if (byNumber) {
        console.log(`✅ מצאנו מוצר לפי מספר מוצר: ${productNumber}`);
        return byNumber;
      }
    }

    // Try to find by company and track name
    const trackKey = `${company}:${trackName}`;
    const byTrack = hierarchy.productsByCompanyAndTrack.get(trackKey);
    if (byTrack && byTrack.length > 0) {
      console.log(`✅ מצאנו מוצר לפי חברה ומסלול: ${trackKey}`);
      return byTrack[0]; // Return first match
    }

    // Fallback: search manually
    const found = hierarchy.products.find(
      (p) =>
        p.company === company &&
        p.category === category &&
        (p.newTrackName === trackName || p.oldTrackName === trackName)
    );

    return found;
  };

  const getAllCategories = (): string[] => hierarchy.categories;
  const getAllCompanies = (): string[] => hierarchy.companies;
  const getAllSubCategories = (): string[] => {
    const allSubs = new Set<string>();
    hierarchy.subCategories.forEach((subs) => {
      subs.forEach((sub) => allSubs.add(sub));
    });
    return Array.from(allSubs).sort();
  };

  return {
    hierarchy,
    loading,
    error,
    getExposureData,
    getAllCategories,
    getAllCompanies,
    getAllSubCategories,
    reloadTaxonomy: loadProductTaxonomy,
  };
};
