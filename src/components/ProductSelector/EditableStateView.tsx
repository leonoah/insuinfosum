import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import { INVESTMENT_TRACKS } from '@/types/insurance';

interface EditableSavingsProduct {
  id: string;
  productType: string;
  manufacturer: string;
  productName: string;
  planName: string;
  accumulation: number;
  depositFee: number;
  accumulationFee: number;
  investmentTrack: string;
  policyNumber: string;
  isModified?: boolean;
}

interface EditableInsuranceProduct {
  id: string;
  productType: string;
  manufacturer: string;
  product: string;
  premium: number;
  policyNumber: string;
  isModified?: boolean;
}

interface EditableStateViewProps {
  originalSavings: any[];
  originalInsurance: any[];
  onSave: (savings: EditableSavingsProduct[], insurance: EditableInsuranceProduct[]) => void;
  onBack: () => void;
}

const EditableStateView: React.FC<EditableStateViewProps> = ({
  originalSavings,
  originalInsurance,
  onSave,
  onBack
}) => {
  const [editableSavings, setEditableSavings] = useState<EditableSavingsProduct[]>([]);
  const [editableInsurance, setEditableInsurance] = useState<EditableInsuranceProduct[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Convert original data to editable format
    const savings = originalSavings.map((product, index) => ({
      id: `savings-${index}`,
      ...product,
      isModified: false
    }));

    const insurance = originalInsurance.map((product, index) => ({
      id: `insurance-${index}`,
      ...product,
      isModified: false
    }));

    setEditableSavings(savings);
    setEditableInsurance(insurance);
  }, [originalSavings, originalInsurance]);

  const updateSavingsProduct = (id: string, field: string, value: any) => {
    setEditableSavings(prev => prev.map(product => 
      product.id === id 
        ? { ...product, [field]: value, isModified: true }
        : product
    ));
    setHasChanges(true);
  };

  const updateInsuranceProduct = (id: string, field: string, value: any) => {
    setEditableInsurance(prev => prev.map(product => 
      product.id === id 
        ? { ...product, [field]: value, isModified: true }
        : product
    ));
    setHasChanges(true);
  };

  const duplicateSavingsProduct = (id: string) => {
    const productToDuplicate = editableSavings.find(p => p.id === id);
    if (productToDuplicate) {
      const newProduct = {
        ...productToDuplicate,
        id: `savings-${Date.now()}`,
        planName: productToDuplicate.planName + ' (העתק)',
        isModified: true
      };
      setEditableSavings(prev => [...prev, newProduct]);
      setHasChanges(true);
    }
  };

  const duplicateInsuranceProduct = (id: string) => {
    const productToDuplicate = editableInsurance.find(p => p.id === id);
    if (productToDuplicate) {
      const newProduct = {
        ...productToDuplicate,
        id: `insurance-${Date.now()}`,
        product: productToDuplicate.product + ' (העתק)',
        isModified: true
      };
      setEditableInsurance(prev => [...prev, newProduct]);
      setHasChanges(true);
    }
  };

  const removeSavingsProduct = (id: string) => {
    setEditableSavings(prev => prev.filter(product => product.id !== id));
    setHasChanges(true);
  };

  const removeInsuranceProduct = (id: string) => {
    setEditableInsurance(prev => prev.filter(product => product.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editableSavings, editableInsurance);
    setHasChanges(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const calculateKPIs = () => {
    const totalAccumulation = editableSavings.reduce((sum, product) => sum + product.accumulation, 0);
    const totalPremium = editableInsurance.reduce((sum, product) => sum + product.premium, 0);
    
    const weightedAccumulationFee = editableSavings.reduce((sum, product) => {
      return sum + (product.accumulationFee * product.accumulation);
    }, 0) / (totalAccumulation || 1);

    return {
      savingsCount: editableSavings.length,
      totalAccumulation,
      avgAccumulationFee: weightedAccumulationFee,
      insuranceCount: editableInsurance.length,
      totalPremium
    };
  };

  const kpis = calculateKPIs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזור למצב קיים
          </Button>
          <h2 className="text-2xl font-bold">מצב חדש - עריכה</h2>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="glass-hover"
        >
          <Save className="h-4 w-4 mr-2" />
          שמור שינויים
        </Button>
      </div>

      {/* Updated KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold">{kpis.savingsCount}</div>
              <div className="text-xs text-muted-foreground">מוצרי חיסכון</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(kpis.totalAccumulation)}
              </div>
              <div className="text-xs text-muted-foreground">סך צבירה</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {kpis.avgAccumulationFee.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">דמי ניהול ממוצעים</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold">{kpis.insuranceCount}</div>
              <div className="text-xs text-muted-foreground">פוליסות ביטוח</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(kpis.totalPremium)}
              </div>
              <div className="text-xs text-muted-foreground">פרמיה חודשית</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable Tables */}
      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="savings">חיסכון - מצב חדש (עריכה)</TabsTrigger>
          <TabsTrigger value="insurance">ביטוח - מצב חדש (עריכה)</TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מוצרי חיסכון - עריכה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">סוג מוצר</TableHead>
                      <TableHead className="text-right">יצרן</TableHead>
                      <TableHead className="text-right">שם תוכנית</TableHead>
                      <TableHead className="text-right">צבירה</TableHead>
                      <TableHead className="text-right">דמי ניהול מהפקדה</TableHead>
                      <TableHead className="text-right">דמי ניהול מצבירה</TableHead>
                      <TableHead className="text-right">מסלול השקעה</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableSavings.map((product) => (
                      <TableRow key={product.id} className={product.isModified ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.productType}
                            {product.isModified && <Badge variant="secondary">שונה</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{product.manufacturer}</TableCell>
                        <TableCell>
                          <Input
                            value={product.planName}
                            onChange={(e) => updateSavingsProduct(product.id, 'planName', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.accumulation}
                            onChange={(e) => updateSavingsProduct(product.id, 'accumulation', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.depositFee}
                            onChange={(e) => updateSavingsProduct(product.id, 'depositFee', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.accumulationFee}
                            onChange={(e) => updateSavingsProduct(product.id, 'accumulationFee', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={product.investmentTrack}
                            onValueChange={(value) => updateSavingsProduct(product.id, 'investmentTrack', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INVESTMENT_TRACKS.map(track => (
                                <SelectItem key={track} value={track}>{track}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateSavingsProduct(product.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeSavingsProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מוצרי ביטוח - עריכה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">סוג מוצר</TableHead>
                      <TableHead className="text-right">יצרן</TableHead>
                      <TableHead className="text-right">מוצר</TableHead>
                      <TableHead className="text-right">פרמיה חודשית</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableInsurance.map((product) => (
                      <TableRow key={product.id} className={product.isModified ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.productType}
                            {product.isModified && <Badge variant="secondary">שונה</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{product.manufacturer}</TableCell>
                        <TableCell>
                          <Input
                            value={product.product}
                            onChange={(e) => updateInsuranceProduct(product.id, 'product', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.premium}
                            onChange={(e) => updateInsuranceProduct(product.id, 'premium', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateInsuranceProduct(product.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeInsuranceProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditableStateView;