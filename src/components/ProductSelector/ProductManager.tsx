import React, { useState } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectedProduct } from '@/types/insurance';
import ProductSelectionModal from './ProductSelectionModal';
import ProductList from './ProductList';
import ComparisonView from './ComparisonView';

interface ProductManagerProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  onUpdateProducts: (products: SelectedProduct[]) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  currentProducts,
  recommendedProducts,
  onUpdateProducts
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'current' | 'recommended'>('current');
  const [showComparison, setShowComparison] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SelectedProduct | null>(null);

  const allProducts = [...currentProducts, ...recommendedProducts];

  const handleAddProduct = (product: SelectedProduct) => {
    const updatedProducts = [...allProducts, product];
    onUpdateProducts(updatedProducts);
  };

  const handleEditProduct = (product: SelectedProduct) => {
    setEditingProduct(product);
    setModalType(product.type);
    setModalOpen(true);
  };

  const handleUpdateProduct = (updatedProduct: SelectedProduct) => {
    const updatedProducts = allProducts.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    onUpdateProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = allProducts.filter(p => p.id !== productId);
    onUpdateProducts(updatedProducts);
  };

  const handleDuplicateProduct = (product: SelectedProduct) => {
    const duplicated: SelectedProduct = {
      ...product,
      id: `${Date.now()}`,
      notes: product.notes + ' (העתק)'
    };
    const updatedProducts = [...allProducts, duplicated];
    onUpdateProducts(updatedProducts);
  };

  const openModal = (type: 'current' | 'recommended') => {
    setModalType(type);
    setEditingProduct(null);
    setModalOpen(true);
  };

  if (showComparison) {
    return (
      <ComparisonView
        currentProducts={currentProducts}
        recommendedProducts={recommendedProducts}
        onClose={() => setShowComparison(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ניהול מוצרים פיננסיים</h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowComparison(true)}
            disabled={currentProducts.length === 0 && recommendedProducts.length === 0}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            השוואת תיקים
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => openModal('current')} className="glass-hover">
          <Plus className="h-4 w-4 mr-2" />
          הוסף מוצר קיים
        </Button>
        <Button onClick={() => openModal('recommended')} variant="secondary" className="glass-hover">
          <Plus className="h-4 w-4 mr-2" />
          הוסף מוצר מוצע
        </Button>
      </div>

      {/* Products Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductList
          products={allProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onDuplicate={handleDuplicateProduct}
          title="מצב קיים"
          type="current"
        />
        <ProductList
          products={allProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onDuplicate={handleDuplicateProduct}
          title="מצב מוצע"
          type="recommended"
        />
      </div>

      {/* Selection Modal */}
      <ProductSelectionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onAddProduct={editingProduct ? handleUpdateProduct : handleAddProduct}
        productType={modalType}
        existingProducts={allProducts.filter(p => p.type !== modalType)}
      />
    </div>
  );
};

export default ProductManager;