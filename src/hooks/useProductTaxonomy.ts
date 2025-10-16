import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductTaxonomy } from '@/types/products';

export interface ProductHierarchy {
  categories: string[];
  subCategories: Map<string, string[]>;
  companies: Map<string, Map<string, string[]>>;
  exposureData: Map<string, ProductTaxonomy>;
}

export const useProductTaxonomy = () => {
  const [hierarchy, setHierarchy] = useState<ProductHierarchy>({
    categories: [],
    subCategories: new Map(),
    companies: new Map(),
    exposureData: new Map()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductTaxonomy();
  }, []);

  const loadProductTaxonomy = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products_taxonomy')
        .select('*')
        .order('category')
        .order('sub_category')
        .order('company');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        console.warn('No products found in database');
        setHierarchy({
          categories: [],
          subCategories: new Map(),
          companies: new Map(),
          exposureData: new Map()
        });
        setLoading(false);
        return;
      }

      // Build hierarchy
      const categories = new Set<string>();
      const subCategories = new Map<string, Set<string>>();
      const companies = new Map<string, Map<string, Set<string>>>();
      const exposureData = new Map<string, ProductTaxonomy>();

      data.forEach((item: any) => {
        const { category, sub_category, company, exposure_stocks, exposure_bonds, exposure_foreign_currency, exposure_foreign_investments } = item;
        
        categories.add(category);

        if (!subCategories.has(category)) {
          subCategories.set(category, new Set());
        }
        subCategories.get(category)!.add(sub_category);

        if (!companies.has(category)) {
          companies.set(category, new Map());
        }
        if (!companies.get(category)!.has(sub_category)) {
          companies.get(category)!.set(sub_category, new Set());
        }
        companies.get(category)!.get(sub_category)!.add(company);

        // Store exposure data with unique key
        const key = `${category}|${sub_category}|${company}`;
        exposureData.set(key, {
          category,
          subCategory: sub_category,
          company,
          exposureStocks: exposure_stocks || 0,
          exposureBonds: exposure_bonds || 0,
          exposureForeignCurrency: exposure_foreign_currency || 0,
          exposureForeignInvestments: exposure_foreign_investments || 0
        });
      });

      setHierarchy({
        categories: Array.from(categories),
        subCategories: new Map(Array.from(subCategories.entries()).map(([k, v]) => [k, Array.from(v)])),
        companies: new Map(Array.from(companies.entries()).map(([cat, subMap]) => [
          cat,
          new Map(Array.from(subMap.entries()).map(([sub, compSet]) => [sub, Array.from(compSet)]))
        ])),
        exposureData
      });

      setError(null);
    } catch (err) {
      console.error('Error loading product taxonomy:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת המוצרים');
    } finally {
      setLoading(false);
    }
  };

  const getExposureData = (category: string, subCategory: string, company: string): ProductTaxonomy | undefined => {
    const key = `${category}|${subCategory}|${company}`;
    return hierarchy.exposureData.get(key);
  };

  // Get all unique values for matching
  const getAllCategories = (): string[] => {
    return hierarchy.categories;
  };

  const getAllSubCategories = (): string[] => {
    const subCategories = new Set<string>();
    hierarchy.subCategories.forEach(subCatArray => {
      subCatArray.forEach(subCat => subCategories.add(subCat));
    });
    return Array.from(subCategories);
  };

  const getAllCompanies = (): string[] => {
    const companies = new Set<string>();
    hierarchy.companies.forEach(categoryMap => {
      categoryMap.forEach(companyArray => {
        companyArray.forEach(company => companies.add(company));
      });
    });
    return Array.from(companies);
  };

  return {
    hierarchy,
    loading,
    error,
    getExposureData,
    reload: loadProductTaxonomy,
    getAllCategories,
    getAllSubCategories,
    getAllCompanies
  };
};
