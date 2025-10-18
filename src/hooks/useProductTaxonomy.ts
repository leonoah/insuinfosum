/**
 * Main hook for product taxonomy - loads from Supabase database
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductTaxonomy } from '@/types/products';

interface ProductHierarchy {
  categories: string[];
  companies: string[];
  subCategories: Map<string, Set<string>>;
  products: ProductTaxonomy[];
  productsByNumber: Map<string, ProductTaxonomy>;
  productsByCompanyAndTrack: Map<string, ProductTaxonomy[]>;
}

export const useProductTaxonomy = () => {
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
      
      // Load data from Supabase database
      const { data, error: fetchError } = await supabase
        .from('products_taxonomy')
        .select('*')
        .order('company', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        throw new Error('לא נמצאו נתונים בטבלת המוצרים');
      }

      const products: ProductTaxonomy[] = [];
      const categoriesSet = new Set<string>();
      const companiesSet = new Set<string>();
      const subCategoriesMap = new Map<string, Set<string>>();
      const productsByNumber = new Map<string, ProductTaxonomy>();
      const productsByCompanyAndTrack = new Map<string, ProductTaxonomy[]>();

      // Parse database rows
      data.forEach((row) => {
        const product: ProductTaxonomy = {
          company: row.company || '',
          category: row.category || '',
          oldTrackName: row.sub_category || '',
          newTrackName: row.sub_category || '',
          productNumber: '',
          policyChange: '',
          trackMerger: '',
          exposureForeignCurrency: row.exposure_foreign_currency || 0,
          exposureForeignInvestments: row.exposure_foreign_investments || 0,
          exposureIsrael: 0,
          exposureStocks: row.exposure_stocks || 0,
          exposureBonds: row.exposure_bonds || 0,
          exposureIlliquidAssets: 0,
          assetComposition: '',
        };

        if (!product.company || !product.category) return;

        products.push(product);
        categoriesSet.add(product.category);
        companiesSet.add(product.company);

        // Track subcategories
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

        // Index by company and track name (both new and old)
        if (product.newTrackName) {
          const trackKey = `${product.company}:${product.newTrackName}`;
          if (!productsByCompanyAndTrack.has(trackKey)) {
            productsByCompanyAndTrack.set(trackKey, []);
          }
          productsByCompanyAndTrack.get(trackKey)!.push(product);
        }
        if (product.oldTrackName && product.oldTrackName !== product.newTrackName) {
          const trackKey = `${product.company}:${product.oldTrackName}`;
          if (!productsByCompanyAndTrack.has(trackKey)) {
            productsByCompanyAndTrack.set(trackKey, []);
          }
          productsByCompanyAndTrack.get(trackKey)!.push(product);
        }
      });

      setHierarchy({
        categories: Array.from(categoriesSet).sort(),
        companies: Array.from(companiesSet).sort(),
        subCategories: subCategoriesMap,
        products,
        productsByNumber,
        productsByCompanyAndTrack,
      });

      console.log('✅ טעינת טקסונומיית מוצרים מ-database הושלמה:', {
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

    if (found) {
      console.log(`✅ מצאנו מוצר בחיפוש ידני: ${company} - ${trackName}`);
    } else {
      console.log(`⚠️ לא נמצא מוצר עבור: ${company} - ${category} - ${trackName}`);
    }

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

  /**
   * Get filtered companies for a specific category
   */
  const getCompaniesForCategory = (category: string): string[] => {
    const companies = new Set<string>();
    
    hierarchy.products.forEach(product => {
      if (product.category === category) {
        companies.add(product.company);
      }
    });
    
    return Array.from(companies).sort((a, b) => a.localeCompare(b, 'he'));
  };

  /**
   * Get filtered subcategories for a specific category and company
   */
  const getSubCategoriesForCategoryAndCompany = (category: string, company: string): string[] => {
    const subCats = new Set<string>();
    
    hierarchy.products.forEach(product => {
      if (product.category === category && product.company === company) {
        if (product.newTrackName) {
          subCats.add(product.newTrackName);
        }
      }
    });
    
    return Array.from(subCats).sort((a, b) => a.localeCompare(b, 'he'));
  };

  return {
    hierarchy,
    loading,
    error,
    getExposureData,
    getAllCategories,
    getAllCompanies,
    getAllSubCategories,
    getCompaniesForCategory,
    getSubCategoriesForCategoryAndCompany,
    reload: loadProductTaxonomy,
  };
};
