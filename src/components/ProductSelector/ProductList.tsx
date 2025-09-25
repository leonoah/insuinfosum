import React, { useState } from 'react';
import { Trash2, Edit, Copy, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/insurance';

interface ProductListProps {
  products: SelectedProduct[];
  onEdit: (product: SelectedProduct) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: SelectedProduct) => void;
  onCopyToRecommended?: (product: SelectedProduct) => void;
  title: string;
  type: 'current' | 'recommended';
  selectedProducts: string[];
  onProductSelect: (productId: string, selected: boolean) => void;
  onAddProduct: () => void; // חדש
}

const ProductItem: React.FC<{
  product: SelectedProduct;
  type: 'current' | 'recommended';
  onEdit: (product: SelectedProduct) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: SelectedProduct) => void;
  onCopyToRecommended?: (product: SelectedProduct) => void;
  selectedProducts: string[];
  onProductSelect: (productId: string, selected: boolean) => void;
}> = ({ product, type, onEdit, onDelete, onDuplicate, onCopyToRecommended, selectedProducts, onProductSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass-hover p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) => onProductSelect(product.id, checked as boolean)}
                className="mt-1"
              />
              <span className="text-2xl">
                {PRODUCT_ICONS[product.productName] || '📄'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{product.productName}</div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="text-sm text-muted-foreground">
                {product.subType}
              </div>
              <div className="text-sm text-muted-foreground">
                {product.company}
              </div>
              <div className="text-sm mt-1">
                סכום: ₪{product.amount.toLocaleString()}
              </div>
              
              <CollapsibleContent className="mt-2">
                <div className="text-sm space-y-1 pt-2 border-t border-border/50">
                  <div className="flex gap-4">
                    <span>דמי ניהול: {product.managementFeeOnDeposit}% / {product.managementFeeOnAccumulation}%</span>
                  </div>
                  {product.investmentTrack && (
                    <div>מסלול: {product.investmentTrack}</div>
                  )}
                  {product.riskLevelChange && (
                    <div className="text-primary">
                      שינוי סיכון: {product.riskLevelChange}
                    </div>
                  )}
                  {product.notes && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {product.notes}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </div>
          <div className="flex gap-1">
            {/* החץ שמאלה - בצד שמאל של כפתורי הפעולה */}
            {type === 'current' && onCopyToRecommended && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToRecommended(product)}
                className="h-8 w-8 p-0 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 order-last"
                title="העתק למצב מוצע"
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
            )}
            {/* שאר כפתורי הפעולה */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(product)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(product)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Collapsible>
  );
};

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyToRecommended,
  title,
  type,
  selectedProducts,
  onProductSelect,
  onAddProduct // חדש
}) => {
  const filteredProducts = products.filter(p => p.type === type);

  return (
    <Card className="glass h-full relative">
      {/* כפתור + בפינה העליונה */}
      <Button
        onClick={onAddProduct}
        className="absolute top-4 left-4 z-10 rounded-full border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground w-10 h-10 flex items-center justify-center shadow-lg"
        title={`הוסף ${type === 'current' ? 'מצב קיים' : 'מצב מוצע'}`}
        aria-label={`הוסף ${type === 'current' ? 'מצב קיים' : 'מצב מוצע'}`}
      >
        <span className="text-2xl font-bold">+</span>
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">{title}</span>
          <span className="text-sm text-muted-foreground">
            ({filteredProducts.length} מוצרים)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center">
            <div className="text-4xl mb-2">📋</div>
            <div>אין מוצרים במצב זה</div>
            {/* כפתור + במרכז הוסר */}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              type={type}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onCopyToRecommended={onCopyToRecommended}
              selectedProducts={selectedProducts}
              onProductSelect={onProductSelect}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;