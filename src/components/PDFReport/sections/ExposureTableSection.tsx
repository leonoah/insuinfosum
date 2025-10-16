import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SelectedProduct } from '@/types/products';

interface ExposureTableSectionProps {
  currentProducts: SelectedProduct[];
  recommendedProducts: SelectedProduct[];
}

export const ExposureTableSection = ({
  currentProducts,
  recommendedProducts
}: ExposureTableSectionProps) => {
  // Only show products that have exposure data
  const currentWithExposure = currentProducts.filter(p => 
    p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.exposureStocks !== undefined || 
    p.exposureBonds !== undefined ||
    p.exposureForeignCurrency !== undefined ||
    p.exposureForeignInvestments !== undefined
  );

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    return null;
  }

  const formatExposure = (value: number | undefined): string => {
    return value !== undefined ? `${value}%` : '-';
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>טבלת חשיפות - מצב קיים מול מוצע</Text>
      
      {/* Current Products Table */}
      {currentWithExposure.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>מצב קיים</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { flex: 2 }]}>
                <Text>מוצר</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>מניות</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>אג"ח</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>מט"ח</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>חו"ל</Text>
              </View>
            </View>
            {currentWithExposure.map((product, index) => (
              <View key={product.id} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={{ fontWeight: 'bold' }}>{product.category}</Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    {product.company} - {product.subCategory}
                  </Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureStocks)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureBonds)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureForeignCurrency)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureForeignInvestments)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recommended Products Table */}
      {recommendedWithExposure.length > 0 && (
        <View>
          <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>מצב מוצע</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { flex: 2 }]}>
                <Text>מוצר</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>מניות</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>אג"ח</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>מט"ח</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>חו"ל</Text>
              </View>
            </View>
            {recommendedWithExposure.map((product, index) => (
              <View key={product.id} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={{ fontWeight: 'bold' }}>{product.category}</Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    {product.company} - {product.subCategory}
                  </Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureStocks)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureBonds)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureForeignCurrency)}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text>{formatExposure(product.exposureForeignInvestments)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
