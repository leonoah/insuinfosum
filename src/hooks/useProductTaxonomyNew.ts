import { useState, useEffect } from 'react';
import { ProductTaxonomyParser, ProductTaxonomyItem } from '@/utils/productTaxonomyParser';
import { useToast } from '@/hooks/use-toast';

export const useProductTaxonomyNew = () => {
  const [products, setProducts] = useState<ProductTaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await ProductTaxonomyParser.loadProductTaxonomy();
      setProducts(loadedProducts);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת מוצרים';
      setError(errorMessage);
      toast({
        title: 'שגיאה',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductsByType = (productType: string) => {
    return products.filter(p => p.productType === productType);
  };

  const getProductsByCompany = (company: string) => {
    return products.filter(p => p.company === company);
  };

  const getCompanies = () => {
    return Array.from(new Set(products.map(p => p.company))).sort();
  };

  const getProductTypes = () => {
    return Array.from(new Set(products.map(p => p.productType))).sort();
  };

  const findProduct = (trackNumber: string, productType?: string) => {
    return products.find(p => 
      p.trackNumber === trackNumber && 
      (!productType || p.productType === productType)
    );
  };

  return {
    products,
    isLoading,
    error,
    getProductsByType,
    getProductsByCompany,
    getCompanies,
    getProductTypes,
    findProduct,
    reload: loadProducts,
  };
};
