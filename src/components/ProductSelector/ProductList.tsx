import React from 'react';
import { Trash2, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedProduct, PRODUCT_ICONS } from '@/types/insurance';

interface ProductListProps {
  products: SelectedProduct[];
  onEdit: (product: SelectedProduct) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: SelectedProduct) => void;
  title: string;
  type: 'current' | 'recommended';
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onDuplicate,
  title,
  type
}) => {
  const filteredProducts = products.filter(p => p.type === type);

  return (
    <Card className="glass h-full">
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
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <div>אין מוצרים במצב זה</div>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="glass-hover p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {PRODUCT_ICONS[product.productName] || '📄'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{product.productName}</div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {product.company} - {product.subType}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>סכום: ₪{product.amount.toLocaleString()}</div>
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
                  </div>
                </div>
                <div className="flex gap-1">
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
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;