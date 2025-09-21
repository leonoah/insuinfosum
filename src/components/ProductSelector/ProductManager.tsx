import React, { useState } from 'react';
import { Plus, BarChart3, Upload, GitCompare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectedProduct } from '@/types/insurance';
import ProductSelectionModal from './ProductSelectionModal';
import ProductList from './ProductList';
import ComparisonSection from './ComparisonSection';
import ExcelImportDialog from './ExcelImportDialog';
import CurrentStateView from './CurrentStateView';
import EditableStateView from './EditableStateView';
import ProductComparisonModal from './ProductComparisonModal';

interface ProductManagerProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  onUpdateProducts: (products: SelectedProduct[]) => void;
  onShowRecording?: () => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  currentProducts,
  recommendedProducts,
  onUpdateProducts,
  onShowRecording
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'current' | 'recommended'>('current');
  const [editingProduct, setEditingProduct] = useState<SelectedProduct | null>(null);
  const [currentView, setCurrentView] = useState<'products' | 'current-state' | 'editable-state'>('products');
  const [excelData, setExcelData] = useState<any>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

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

  const handleCopyCurrentToRecommended = (product: SelectedProduct) => {
    const copied: SelectedProduct = {
      ...product,
      id: `${Date.now()}`,
      type: 'recommended',
      notes: product.notes + ' (הועתק ממצב קיים)'
    };
    const updatedProducts = [...allProducts, copied];
    onUpdateProducts(updatedProducts);
  };

  const openModal = (type: 'current' | 'recommended') => {
    setModalType(type);
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleExcelDataImported = (data: any) => {
    setExcelData(data);
  };

  const handleProductsSelected = (products: SelectedProduct[]) => {
    onUpdateProducts([...allProducts, ...products]);
    setCurrentView('current-state');
  };

  const handleProductSelect = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const getSelectedCurrentProduct = () => {
    const currentSelected = selectedProducts.find(id => 
      allProducts.find(p => p.id === id && p.type === 'current')
    );
    return currentSelected ? allProducts.find(p => p.id === currentSelected) : undefined;
  };

  const getSelectedRecommendedProduct = () => {
    const recommendedSelected = selectedProducts.find(id => 
      allProducts.find(p => p.id === id && p.type === 'recommended')
    );
    return recommendedSelected ? allProducts.find(p => p.id === recommendedSelected) : undefined;
  };

  const canShowComparison = () => {
    return getSelectedCurrentProduct() && getSelectedRecommendedProduct();
  };

  const handleCreateNewState = () => {
    setCurrentView('editable-state');
  };

  const handleEditableStateSave = (savings: any[], insurance: any[]) => {
    // Here you would typically save the edited state
    console.log('Saving edited state:', { savings, insurance });
    setCurrentView('current-state');
  };

  const handleBackToCurrentState = () => {
    setCurrentView('current-state');
  };

  const handleBackToProducts = () => {
    setCurrentView('products');
    setExcelData(null);
  };

  const handleCopyProductToRecommended = (excelProduct: any) => {
    const notesParts = [
      excelProduct.planName ? `תוכנית: ${excelProduct.planName}` : '',
      excelProduct.policyNumber ? `פוליסה: ${excelProduct.policyNumber}` : ''
    ].filter(Boolean);

    const product: SelectedProduct = {
      id: `${Date.now()}`,
      company: excelProduct.manufacturer || excelProduct.productType || 'לא צוין',
      productName: excelProduct.productName || excelProduct.product || excelProduct.productType || 'מוצר',
      subType: excelProduct.planName || excelProduct.productType || '',
      amount: excelProduct.accumulation || excelProduct.premium || 0,
      managementFeeOnDeposit: excelProduct.depositFee || 0,
      managementFeeOnAccumulation: excelProduct.accumulationFee || 0,
      investmentTrack: excelProduct.investmentTrack || '',
      riskLevelChange: '',
      notes: notesParts.length ? notesParts.join(' | ') : 'הועתק ממצב קיים',
      type: 'recommended'
    };

    onUpdateProducts([...allProducts, product]);
  };



  if (currentView === 'current-state' && excelData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToProducts}>
            חזור לניהול מוצרים
          </Button>
          <h2 className="text-2xl font-bold">מצב קיים</h2>
        </div>
        <CurrentStateView 
          data={excelData} 
          onCreateNewState={handleCreateNewState}
          onCopyToRecommended={handleCopyProductToRecommended}
        />
      </div>
    );
  }

  if (currentView === 'editable-state' && excelData) {
    return (
      <div className="space-y-6">
        <EditableStateView
          originalSavings={excelData.savings}
          originalInsurance={excelData.insurance}
          onSave={handleEditableStateSave}
          onBack={handleBackToCurrentState}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setShowExcelImport(true)} variant="default" size="sm" className="glass-hover" title="יבוא מצב קיים מאקסל">
          <Upload className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onShowRecording}
          className="border-glass-border bg-red-50 hover:bg-red-100 text-red-700 border-red-200 rounded-xl"
          title="הקלט שיחה עם לקוח"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button onClick={() => openModal('current')} className="glass-hover">
          <Plus className="h-4 w-4 mr-2" />
          הוסף מוצר קיים
        </Button>
        <Button onClick={() => openModal('recommended')} variant="secondary" className="glass-hover">
          <Plus className="h-4 w-4 mr-2" />
          הוסף מוצר מוצע
        </Button>
      </div>

      {/* Comparison Section - Always Visible */}
      <ComparisonSection 
        currentProducts={currentProducts}
        recommendedProducts={recommendedProducts}
      />

      {/* Comparison Button */}
      {canShowComparison() && (
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowComparison(true)}
            className="glass-hover flex items-center gap-2"
            variant="default"
          >
            <GitCompare className="h-4 w-4" />
            השוואה בין מוצרים נבחרים
          </Button>
        </div>
      )}

      {/* Products Lists - RTL Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended on the left */}
        <div className="lg:order-2">
          <ProductList
            products={allProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onDuplicate={handleDuplicateProduct}
            title="מצב מוצע"
            type="recommended"
            selectedProducts={selectedProducts}
            onProductSelect={handleProductSelect}
          />
        </div>
        {/* Current on the right */}
        <div className="lg:order-1">
          <ProductList
            products={allProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onDuplicate={handleDuplicateProduct}
            onCopyToRecommended={handleCopyCurrentToRecommended}
            title="מצב קיים"
            type="current"
            selectedProducts={selectedProducts}
            onProductSelect={handleProductSelect}
          />
        </div>
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
        editingProduct={editingProduct}
      />

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onProductsSelected={(products) => {
          onUpdateProducts([...allProducts, ...products]);
          setShowExcelImport(false);
        }}
      />

      {/* Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        currentProduct={getSelectedCurrentProduct()}
        recommendedProduct={getSelectedRecommendedProduct()}
      />
    </div>
  );
};

export default ProductManager;