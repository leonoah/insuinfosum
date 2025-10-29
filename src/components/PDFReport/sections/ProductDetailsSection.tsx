import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SelectedProduct } from '@/types/products';
import { formatCurrency } from '@/utils/numberFormat';

interface ProductDetailsSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
  styles: any;
}

const createProductStyles = (isDark: boolean) => StyleSheet.create({
  categoryHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#e0e0e0',
    color: isDark ? '#06b6d4' : '#0891b2',
  },
  productCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: isDark ? '#1e293b' : '#f9fafb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: isDark ? '#06b6d4' : '#3b82f6',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: isDark ? '#f1f5f9' : '#1f2937',
  },
  productAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  label: {
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  value: {
    color: isDark ? '#cbd5e1' : '#374151',
  },
  notes: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#e5e7eb',
    fontSize: 8,
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    padding: 8,
    backgroundColor: isDark ? '#334155' : '#eff6ff',
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: isDark ? '#94a3b8' : '#6b7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: isDark ? '#f1f5f9' : '#1f2937',
  },
});

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({
  currentProducts,
  recommendedProducts,
  styles,
}) => {
  // Extract isDark from styles theme (check background color)
  const isDark = styles.page.backgroundColor === '#0f172a';
  const productStyles = createProductStyles(isDark);

  // Group products by category
  const groupByCategory = (products: SelectedProduct[]) => {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, SelectedProduct[]>);
  };

  // Calculate average returns
  const calculateAvgReturns = (products: SelectedProduct[]) => {
    const productsWithReturns = products.filter(p => p.returns !== undefined && p.returns !== null);
    if (productsWithReturns.length === 0) return 0;
    const sum = productsWithReturns.reduce((acc, p) => acc + (p.returns || 0), 0);
    return sum / productsWithReturns.length;
  };

  const currentAvgReturns = calculateAvgReturns(currentProducts);
  const recommendedAvgReturns = calculateAvgReturns(recommendedProducts);
  const returnsDiff = recommendedAvgReturns - currentAvgReturns;

  // Render returns comparison chart
  const renderReturnsComparison = () => {
    if (currentProducts.length === 0 || recommendedProducts.length === 0) return null;

    const maxReturns = Math.max(currentAvgReturns, recommendedAvgReturns, 5);
    const barHeight = 120;
    const barWidth = 60;
    const chartWidth = 200;

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.sectionSubtitle, { marginBottom: 10, fontSize: 12 }]}>
          השוואת תשואות ממוצעות
        </Text>
        
        <View style={[productStyles.summaryCard, { flexDirection: 'column', padding: 12 }]}>
          {/* Bar Chart */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: barHeight + 40, marginBottom: 10 }}>
            {/* Current Products Bar */}
            <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#1f2937', marginBottom: 5 }}>
                {currentAvgReturns.toFixed(2)}%
              </Text>
              <View style={{
                width: barWidth,
                height: (currentAvgReturns / maxReturns) * barHeight,
                backgroundColor: '#f59e0b',
                borderRadius: 4,
              }} />
              <Text style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#6b7280', marginTop: 5 }}>
                מצב נוכחי
              </Text>
            </View>

            {/* Recommended Products Bar */}
            <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#1f2937', marginBottom: 5 }}>
                {recommendedAvgReturns.toFixed(2)}%
              </Text>
              <View style={{
                width: barWidth,
                height: (recommendedAvgReturns / maxReturns) * barHeight,
                backgroundColor: '#10b981',
                borderRadius: 4,
              }} />
              <Text style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#6b7280', marginTop: 5 }}>
                מצב מומלץ
              </Text>
            </View>
          </View>

          {/* Difference Indicator */}
          <View style={{ alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#475569' : '#e5e7eb' }}>
            <Text style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#6b7280', marginBottom: 3 }}>
              שינוי בתשואה
            </Text>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: 'bold', 
              color: returnsDiff >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {returnsDiff >= 0 ? '+' : ''}{returnsDiff.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProductsList = (products: SelectedProduct[], title: string) => {
    if (products.length === 0) return null;

    const groupedProducts = groupByCategory(products);
    const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
    const avgFeeDeposit = products.reduce((sum, p) => sum + p.managementFeeOnDeposit, 0) / products.length;
    const avgFeeAccumulation = products.reduce((sum, p) => sum + p.managementFeeOnAccumulation, 0) / products.length;

    return (
      <View>
        <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>{title}</Text>
        
        {/* Summary Cards */}
        <View style={productStyles.summaryCard}>
          <View style={productStyles.summaryItem}>
            <Text style={productStyles.summaryLabel}>סה"כ מוצרים</Text>
            <Text style={productStyles.summaryValue}>{products.length}</Text>
          </View>
          <View style={productStyles.summaryItem}>
            <Text style={productStyles.summaryLabel}>סה"כ צבירה</Text>
            <Text style={productStyles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={productStyles.summaryItem}>
            <Text style={productStyles.summaryLabel}>ממוצע דמי נהל הפקדה</Text>
            <Text style={productStyles.summaryValue}>{avgFeeDeposit.toFixed(2)}%</Text>
          </View>
          <View style={productStyles.summaryItem}>
            <Text style={productStyles.summaryLabel}>ממוצע דמי נהל צבירה</Text>
            <Text style={productStyles.summaryValue}>{avgFeeAccumulation.toFixed(2)}%</Text>
          </View>
        </View>

        {/* Products by Category */}
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <View key={category}>
            <Text style={productStyles.categoryHeader}>
              {category} ({categoryProducts.length} מוצרים)
            </Text>
            {categoryProducts.map((product, index) => (
              <View key={index} style={productStyles.productCard}>
                <View style={productStyles.productHeader}>
                  <Text style={productStyles.productTitle}>
                    {product.company} - {product.subCategory}
                  </Text>
                  <Text style={productStyles.productAmount}>
                    {formatCurrency(product.amount)}
                  </Text>
                </View>
                
                {product.investmentTrack && (
                  <View style={productStyles.productRow}>
                    <Text style={productStyles.label}>מסלול השקעה:</Text>
                    <Text style={productStyles.value}>{product.investmentTrack}</Text>
                  </View>
                )}
                
                <View style={productStyles.productRow}>
                  <Text style={productStyles.label}>דמי ניהול הפקדה:</Text>
                  <Text style={productStyles.value}>{product.managementFeeOnDeposit}%</Text>
                </View>
                
                <View style={productStyles.productRow}>
                  <Text style={productStyles.label}>דמי ניהול צבירה:</Text>
                  <Text style={productStyles.value}>{product.managementFeeOnAccumulation}%</Text>
                </View>
                
                {product.returns !== undefined && (
                  <View style={productStyles.productRow}>
                    <Text style={productStyles.label}>תשואה:</Text>
                    <Text style={[productStyles.value, { color: '#10b981' }]}>
                      {product.returns}%
                    </Text>
                  </View>
                )}
                
                {(product.exposureStocks !== undefined || product.exposureBonds !== undefined) && (
                  <View style={productStyles.productRow}>
                    <Text style={productStyles.label}>חשיפות:</Text>
                    <Text style={productStyles.value}>
                      {[
                        product.exposureStocks !== undefined ? `מניות ${product.exposureStocks}%` : '',
                        product.exposureBonds !== undefined ? `אג"ח ${product.exposureBonds}%` : ''
                      ].filter(Boolean).join(' | ')}
                    </Text>
                  </View>
                )}
                
                {product.notes && (
                  <Text style={productStyles.notes}>
                    {product.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פירוט מלא - מוצרים</Text>
      
      {renderReturnsComparison()}
      
      {renderProductsList(currentProducts, 'מוצרים קיימים')}
      
      {currentProducts.length > 0 && recommendedProducts.length > 0 && (
        <View style={{ height: 20 }} />
      )}
      
      {renderProductsList(recommendedProducts, 'מוצרים מוצעים')}
    </View>
  );
};

export default ProductDetailsSection;
