import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit3, Trash2, Bot, Save, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import insuranceData from "@/data/insurers_products_il.json";
import type { InsuranceCompany } from "@/types/insurance";

export const InsuranceManagement = () => {
  const [companies, setCompanies] = useState<InsuranceCompany[]>(insuranceData);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const filteredCompanies = companies.filter(company =>
    company.שם_חברה.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.קטגוריה.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס הנחיה ליצירת מידע",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insurance-info', {
        body: { prompt: aiPrompt }
      });

      if (error) throw error;

      if (data?.company) {
        setCompanies(prev => [...prev, data.company]);
        setAiPrompt("");
        toast({
          title: "הצלחה",
          description: "מידע חדש נוצר בהצלחה",
        });
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת מידע עם AI",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };

  const saveCompany = (company: InsuranceCompany) => {
    if (editingCompany) {
      setCompanies(prev =>
        prev.map(c => c.שם_חברה === editingCompany.שם_חברה ? company : c)
      );
    } else {
      setCompanies(prev => [...prev, company]);
    }
    setEditingCompany(null);
    toast({
      title: "הצלחה",
      description: "החברה נשמרה בהצלחה",
    });
  };

  const deleteCompany = (companyName: string) => {
    setCompanies(prev => prev.filter(c => c.שם_חברה !== companyName));
    toast({
      title: "הצלחה",
      description: "החברה נמחקה בהצלחה",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and AI Generate */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש חברות ביטוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              יצירה עם AI
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת מידע חברת ביטוח עם AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">הנחיה ליצירת מידע</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="לדוגמה: צור מידע על חברת ביטוח חדשה בשם 'פניקס' עם מוצרי פנסיה וביטוח חיים..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={generateWithAI}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? "יוצר..." : "צור מידע"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            חברות ביטוח ({filteredCompanies.length})
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                הוספת חברה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CompanyEditor
                company={null}
                onSave={saveCompany}
                onCancel={() => setEditingCompany(null)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {filteredCompanies.map((company, index) => (
            <AccordionItem key={index} value={company.שם_חברה}>
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-right">{company.שם_חברה}</h4>
                      <Badge variant="outline">{company.קטגוריה}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {company.מוצרים.length} מוצרים
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {company.הערות && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {company.הערות}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Edit3 className="h-4 w-4 mr-1" />
                              עריכה
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <CompanyEditor
                              company={company}
                              onSave={saveCompany}
                              onCancel={() => setEditingCompany(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCompany(company.שם_חברה)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          מחיקה
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <h5 className="font-medium text-sm">מוצרים:</h5>
                      {company.מוצרים.map((product, productIndex) => (
                        <div key={productIndex} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium">{product.שם}</h6>
                            <Badge variant="outline">
                              {product.תתי_סוגים.length} תתי-סוגים
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.תתי_סוגים.map((subType, subIndex) => (
                              <Badge key={subIndex} variant="secondary" className="text-xs">
                                {subType}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

// Company Editor Component
const CompanyEditor = ({ 
  company, 
  onSave, 
  onCancel 
}: { 
  company: InsuranceCompany | null;
  onSave: (company: InsuranceCompany) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<InsuranceCompany>(
    company || {
      שם_חברה: "",
      קטגוריה: "חברת ביטוח",
      מוצרים: [],
      הערות: ""
    }
  );

  const handleSave = () => {
    if (!formData.שם_חברה.trim()) return;
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {company ? "עריכת חברת ביטוח" : "הוספת חברת ביטוח חדשה"}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="company-name">שם החברה</Label>
          <Input
            id="company-name"
            value={formData.שם_חברה}
            onChange={(e) => setFormData(prev => ({ ...prev, שם_חברה: e.target.value }))}
            placeholder="הכנס שם חברת ביטוח"
          />
        </div>
        
        <div>
          <Label htmlFor="category">קטגוריה</Label>
          <Input
            id="category"
            value={formData.קטגוריה}
            onChange={(e) => setFormData(prev => ({ ...prev, קטגוריה: e.target.value }))}
            placeholder="חברת ביטוח"
          />
        </div>
        
        <div>
          <Label htmlFor="notes">הערות</Label>
          <Textarea
            id="notes"
            value={formData.הערות || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, הערות: e.target.value }))}
            placeholder="הערות נוספות על החברה"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            שמירה
          </Button>
        </div>
      </div>
    </div>
  );
};