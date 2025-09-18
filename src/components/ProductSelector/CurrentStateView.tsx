import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SavingsProduct {
  productType: string;
  manufacturer: string;
  productName: string;
  planName: string;
  accumulation: number;
  depositFee: number;
  accumulationFee: number;
  investmentTrack: string;
  policyNumber: string;
}

interface InsuranceProduct {
  productType: string;
  manufacturer: string;
  product: string;
  premium: number;
  policyNumber: string;
}

interface KPIData {
  savingsProductCount: number;
  totalAccumulation: number;
  avgAccumulationFee: number;
  avgDepositFee: number;
  insurancePolicyCount: number;
  totalMonthlyPremium: number;
}

interface ExcelData {
  savings: SavingsProduct[];
  insurance: InsuranceProduct[];
  kpis: KPIData;
}

interface CurrentStateViewProps {
  data: ExcelData;
  onCreateNewState: () => void;
}

const CurrentStateView: React.FC<CurrentStateViewProps> = ({ data, onCreateNewState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  // Group savings products by type and plan
  const groupSavingsProducts = () => {
    const groups: { [key: string]: SavingsProduct[] } = {};
    
    data.savings.forEach(product => {
      const groupKey = `${product.productType} - ${product.planName || product.productName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(product);
    });

    return Object.entries(groups).map(([groupName, products]) => ({
      groupName,
      products,
      totalAccumulation: products.reduce((sum, p) => sum + p.accumulation, 0),
      avgAccumulationFee: products.reduce((sum, p) => sum + (p.accumulationFee * p.accumulation), 0) / 
                          products.reduce((sum, p) => sum + p.accumulation, 0),
      avgDepositFee: products.reduce((sum, p) => sum + p.depositFee, 0) / products.length
    }));
  };

  // Group insurance products by type and manufacturer
  const groupInsuranceProducts = () => {
    const groups: { [key: string]: InsuranceProduct[] } = {};
    
    data.insurance.forEach(product => {
      const groupKey = `${product.productType} - ${product.manufacturer}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(product);
    });

    return Object.entries(groups).map(([groupName, products]) => ({
      groupName,
      products,
      totalPremium: products.reduce((sum, p) => sum + p.premium, 0)
    }));
  };

  const toggleExpanded = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const savingsGroups = groupSavingsProducts();
  const insuranceGroups = groupInsuranceProducts();

  const filteredSavingsGroups = savingsGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInsuranceGroups = insuranceGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.kpis.savingsProductCount}</div>
                <div className="text-sm text-muted-foreground">מוצרי חיסכון</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.kpis.totalAccumulation)}
                </div>
                <div className="text-sm text-muted-foreground">סך צבירה</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage(data.kpis.avgAccumulationFee)}
                </div>
                <div className="text-sm text-muted-foreground">דמי ניהול ממוצעים</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.kpis.insurancePolicyCount > 0 && (
          <Card className="border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.kpis.totalMonthlyPremium)}
                  </div>
                  <div className="text-sm text-muted-foreground">פרמיה חודשית</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש מוצרים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNewState} className="glass-hover">
          ערוך מצב חדש
        </Button>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="savings">חיסכון - סיכום</TabsTrigger>
          <TabsTrigger value="insurance" disabled={data.kpis.insurancePolicyCount === 0}>
            ביטוח - סיכום
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מוצרי חיסכון - מצב קיים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredSavingsGroups.map((group) => (
                  <Collapsible key={group.groupName}>
                    <CollapsibleTrigger
                      onClick={() => toggleExpanded(group.groupName)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{group.groupName}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.products.length} פוליסות
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(group.totalAccumulation)}</div>
                            <div className="text-xs text-muted-foreground">
                              דמי ניהול: {formatPercentage(group.avgAccumulationFee)}
                            </div>
                          </div>
                          {expandedGroups.includes(group.groupName) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">יצרן</TableHead>
                              <TableHead className="text-right">מס' פוליסה</TableHead>
                              <TableHead className="text-right">צבירה</TableHead>
                              <TableHead className="text-right">דמי ניהול מהפקדה</TableHead>
                              <TableHead className="text-right">דמי ניהול מצבירה</TableHead>
                              <TableHead className="text-right">מסלול השקעה</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.products.map((product, index) => (
                              <TableRow key={index}>
                                <TableCell>{product.manufacturer}</TableCell>
                                <TableCell>{product.policyNumber}</TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(product.accumulation)}
                                </TableCell>
                                <TableCell>{formatPercentage(product.depositFee)}</TableCell>
                                <TableCell>{formatPercentage(product.accumulationFee)}</TableCell>
                                <TableCell>
                                  {product.investmentTrack && (
                                    <Badge variant="outline">{product.investmentTrack}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מוצרי ביטוח - מצב קיים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredInsuranceGroups.map((group) => (
                  <Collapsible key={group.groupName}>
                    <CollapsibleTrigger
                      onClick={() => toggleExpanded(group.groupName)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{group.groupName}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.products.length} פוליסות
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(group.totalPremium)}</div>
                            <div className="text-xs text-muted-foreground">פרמיה חודשית</div>
                          </div>
                          {expandedGroups.includes(group.groupName) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">מוצר</TableHead>
                              <TableHead className="text-right">מס' פוליסה</TableHead>
                              <TableHead className="text-right">פרמיה חודשית</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.products.map((product, index) => (
                              <TableRow key={index}>
                                <TableCell>{product.product}</TableCell>
                                <TableCell>{product.policyNumber}</TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(product.premium)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CurrentStateView;