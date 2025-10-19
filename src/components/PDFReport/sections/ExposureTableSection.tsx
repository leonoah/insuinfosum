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
  // Only show products that have exposure data AND includeExposureData flag is true
  const currentWithExposure = currentProducts.filter(p => 
    p.includeExposureData && (
      p.exposureStocks !== undefined || 
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  const recommendedWithExposure = recommendedProducts.filter(p => 
    p.includeExposureData && (
      p.exposureStocks !== undefined || 
      p.exposureBonds !== undefined ||
      p.exposureForeignCurrency !== undefined ||
      p.exposureForeignInvestments !== undefined
    )
  );

  if (currentWithExposure.length === 0 && recommendedWithExposure.length === 0) {
    return null;
  }

  const formatExposure = (value: number | undefined): string => {
    if (value === undefined) return '-';
    // Convert decimal to percentage (0.05 -> 5%)
    const percentage = value * 100;
    return `${percentage.toFixed(2)}%`;
  };

  // Calculate aggregate averages
  const calculateAverage = (products: SelectedProduct[], field: keyof SelectedProduct): number => {
    const values = products
      .map(p => p[field] as number | undefined)
      .filter((v): v is number => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return 0;
    // Convert decimal to percentage and round to 1 decimal place
    const average = (values.reduce((sum, v) => sum + v, 0) / values.length) * 100;
    return Math.round(average * 10) / 10;
  };

  const currentAvgStocks = calculateAverage(currentWithExposure, 'exposureStocks');
  const currentAvgBonds = calculateAverage(currentWithExposure, 'exposureBonds');
  const currentAvgForeignCurrency = calculateAverage(currentWithExposure, 'exposureForeignCurrency');
  const currentAvgForeignInvestments = calculateAverage(currentWithExposure, 'exposureForeignInvestments');

  const recommendedAvgStocks = calculateAverage(recommendedWithExposure, 'exposureStocks');
  const recommendedAvgBonds = calculateAverage(recommendedWithExposure, 'exposureBonds');
  const recommendedAvgForeignCurrency = calculateAverage(recommendedWithExposure, 'exposureForeignCurrency');
  const recommendedAvgForeignInvestments = calculateAverage(recommendedWithExposure, 'exposureForeignInvestments');

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

      {/* Aggregate Comparison Table */}
      {currentWithExposure.length > 0 && recommendedWithExposure.length > 0 && (
        <View style={{ marginTop: 15 }}>
          <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>השוואת ממוצעים</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { flex: 2 }]}>
                <Text>סוג חשיפה</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>ממוצע קיים</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>ממוצע מוצע</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>שינוי</Text>
              </View>
            </View>
            
            {/* Stocks Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>מניות</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{currentAvgStocks}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{recommendedAvgStocks}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={{ color: recommendedAvgStocks > currentAvgStocks ? '#16a34a' : recommendedAvgStocks < currentAvgStocks ? '#dc2626' : '#666' }}>
                  {recommendedAvgStocks > currentAvgStocks ? '+' : ''}{(recommendedAvgStocks - currentAvgStocks).toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Bonds Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>אג"ח</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{currentAvgBonds}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{recommendedAvgBonds}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={{ color: recommendedAvgBonds > currentAvgBonds ? '#16a34a' : recommendedAvgBonds < currentAvgBonds ? '#dc2626' : '#666' }}>
                  {recommendedAvgBonds > currentAvgBonds ? '+' : ''}{(recommendedAvgBonds - currentAvgBonds).toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Foreign Currency Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>מט"ח</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{currentAvgForeignCurrency}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{recommendedAvgForeignCurrency}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={{ color: recommendedAvgForeignCurrency > currentAvgForeignCurrency ? '#16a34a' : recommendedAvgForeignCurrency < currentAvgForeignCurrency ? '#dc2626' : '#666' }}>
                  {recommendedAvgForeignCurrency > currentAvgForeignCurrency ? '+' : ''}{(recommendedAvgForeignCurrency - currentAvgForeignCurrency).toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Foreign Investments Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>השקעות חו"ל</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{currentAvgForeignInvestments}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{recommendedAvgForeignInvestments}%</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={{ color: recommendedAvgForeignInvestments > currentAvgForeignInvestments ? '#16a34a' : recommendedAvgForeignInvestments < currentAvgForeignInvestments ? '#dc2626' : '#666' }}>
                  {recommendedAvgForeignInvestments > currentAvgForeignInvestments ? '+' : ''}{(recommendedAvgForeignInvestments - currentAvgForeignInvestments).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
