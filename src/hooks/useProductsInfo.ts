import { useState, useEffect } from 'react';
import { ProductInfo, ProductsInfoParser } from '@/utils/productsInfoParser';
import { supabase } from '@/integrations/supabase/client';

export const useProductsInfo = () => {
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from database first
      const { data, error: dbError } = await supabase
        .from('products_information')
        .select('*');

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        // If no data in DB, populate it
        console.log('No products in DB, populating...');
        const result = await ProductsInfoParser.populateDatabase();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to populate database');
        }

        // Reload from DB
        const { data: newData, error: reloadError } = await supabase
          .from('products_information')
          .select('*');

        if (reloadError) throw reloadError;
        
        const formattedData = (newData || []).map(d => ({
          product_number: d.product_number,
          track_name: d.track_name,
          company: d.company,
          product_type: d.product_type,
          exposure_data: (d.exposure_data || {}) as ProductInfo['exposure_data']
        }));

        setProducts(formattedData);
      } else {
        const formattedData = data.map(d => ({
          product_number: d.product_number,
          track_name: d.track_name,
          company: d.company,
          product_type: d.product_type,
          exposure_data: (d.exposure_data || {}) as ProductInfo['exposure_data']
        }));

        setProducts(formattedData);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductTypes = (): string[] => {
    const types = Array.from(new Set(products.map(p => p.product_type)));
    return types.sort();
  };

  const getCompaniesByType = (productType: string): string[] => {
    const companies = Array.from(
      new Set(
        products
          .filter(p => p.product_type === productType)
          .map(p => p.company)
      )
    );
    return companies.sort();
  };

  const getTracksByCompanyAndType = (company: string, productType: string): string[] => {
    const tracks = Array.from(
      new Set(
        products
          .filter(p => p.company === company && p.product_type === productType)
          .map(p => p.track_name)
      )
    );
    return tracks.sort();
  };

  const findProduct = (productNumber: string): ProductInfo | undefined => {
    return products.find(p => p.product_number === productNumber);
  };

  const findProductByDetails = (
    productType: string,
    company: string,
    trackName: string
  ): ProductInfo | undefined => {
    return products.find(
      p => 
        p.product_type === productType && 
        p.company === company && 
        p.track_name === trackName
    );
  };

  return {
    products,
    isLoading,
    error,
    getProductTypes,
    getCompaniesByType,
    getTracksByCompanyAndType,
    findProduct,
    findProductByDetails,
    reload: loadProducts
  };
};
