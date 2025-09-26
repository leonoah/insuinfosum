import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, CheckCircle, Save, Plus, Trash2, BarChart3, Phone, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SummaryGenerator from "./SummaryGenerator";
import ProductManager from "./ProductSelector/ProductManager";
import RecordingModal from "./CallRecording/RecordingModal";
import VoiceTextInput from "./VoiceTextInput";
import { SelectedProduct } from "@/types/insurance";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
}

interface FormData {
  // Client details
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  meetingDate: string;
  meetingLocation: string;
  topics: string[];
  isAnonymous: boolean;
  
  // Agent recommendations
  currentSituation: string;
  risks: string;
  recommendations: string[];
  estimatedCost: string;
  
  // Products
  products: SelectedProduct[];
  
  // Decisions
  decisions: string;
  documents: string[];
  timeframes: string;
  approvals: string;
}

const insuranceTopics = [
  "בריאות", "חיים", "סיעוד", "תאונות אישיות", 
  "אובדן כושר עבודה", "פנסיה", "חיסכון", "רכב", "דירה"
];

const AppForm = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");
  const [showSummary, setShowSummary] = useState(false);
  const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientId: "",
    clientPhone: "",
    clientEmail: "",
    meetingDate: new Date().toISOString().split('T')[0],
    meetingLocation: "",
    topics: [],
    isAnonymous: false,
    currentSituation: "",
    risks: "",
    recommendations: [""],
    estimatedCost: "",
    products: [],
    decisions: "",
    documents: [],
    timeframes: "",
    approvals: ""
  });

  // Required fields: current situation and either client details or anonymous mode
  const isSummaryEligible = Boolean(
    formData.currentSituation.trim() &&
    (formData.isAnonymous || (formData.clientName.trim() && formData.clientPhone.trim()))
  );

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const saveClient = async () => {
    if (!formData.clientName || !formData.clientId || formData.isAnonymous) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .upsert([{
          client_id: formData.clientId,
          client_name: formData.clientName,
          client_phone: formData.clientPhone,
          client_email: formData.clientEmail
        }], {
          onConflict: 'client_id'
        });
      
      if (error) throw error;
      loadClients(); // Reload clients list
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const documentOptions = [
    "העתק תעודת זהות", "אישור הכנסה", "בדיקות רפואיות", 
    "פוליסות קיימות", "מסמכי בנק", "אישור רופא"
  ];

  const calculateProgress = () => {
    if (formData.isAnonymous) {
      const fields = [formData.currentSituation, formData.decisions];
      const filledFields = fields.filter(field => field.trim()).length;
      return (filledFields / fields.length) * 100;
    } else {
      const fields = [
        formData.clientName, formData.clientPhone, formData.clientEmail,
        formData.currentSituation, formData.decisions
      ];
      const filledFields = fields.filter(field => field.trim()).length;
      return (filledFields / fields.length) * 100;
    }
  };

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) 
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleDocumentToggle = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.includes(doc)
        ? prev.documents.filter(d => d !== doc)
        : [...prev.documents, doc]
    }));
  };

  const addRecommendation = () => {
    setFormData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, ""]
    }));
  };

  const updateRecommendation = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((rec, i) => i === index ? value : rec)
    }));
  };

  const removeRecommendation = (index: number) => {
    if (formData.recommendations.length > 1) {
      setFormData(prev => ({
        ...prev,
        recommendations: prev.recommendations.filter((_, i) => i !== index)
      }));
    }
  };

  const saveDraft = () => {
    localStorage.setItem('insurNote-draft', JSON.stringify(formData));
    toast({
      title: "טיוטה נשמרה",
      description: "הנתונים נשמרו במכשיר שלך",
    });
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('insurNote-draft');
    if (draft) {
      setFormData(JSON.parse(draft));
      toast({
        title: "טיוטה נטענה",
        description: "הנתונים השמורים נטענו בהצלחה",
      });
    }
  };

  const generateSummary = async () => {
    if (formData.isAnonymous) {
      if (!formData.currentSituation) {
        toast({
          title: "חסר מידע",
          description: "יש למלא את המצב הקיים לפחות כדי ליצור דוח",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!formData.clientName || !formData.clientPhone || !formData.currentSituation) {
        toast({
          title: "חסרים פרטים",
          description: "יש למלא לפחות שם לקוח, טלפון ומצב קיים",
          variant: "destructive"
        });
        return;
      }
      // Save client before generating summary
      await saveClient();
    }
    
    // Log the report generation
    await logReport();
    
    setShowSummary(true);
  };

  const logReport = async () => {
    try {
      const clientName = formData.isAnonymous ? "דוח אנונימי" : formData.clientName;
      const reportContent = `דוח ייעוץ פיננסי עבור ${clientName}
תאריך: ${formData.meetingDate || new Date().toLocaleDateString('he-IL')}
נושאים: ${formData.topics}
מצב קיים: ${formData.currentSituation}
סיכונים: ${formData.risks}
המלצות: ${formData.recommendations.join(', ')}
עלות משוערת: ${formData.estimatedCost}
החלטות: ${formData.decisions}`;

      const { error } = await supabase
        .from('reports_log')
        .insert({
          client_id: formData.isAnonymous ? "anonymous" : (formData.clientPhone || "unknown"), 
          client_name: clientName,
          report_content: reportContent,
          status: 'generated'
        });

      if (error) {
        console.error('Error logging report:', error);
      }
    } catch (error) {
      console.error('Error in logReport:', error);
    }
  };

  const handleGenerateDecisions = async () => {
    setIsGeneratingDecisions(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-decisions', {
        body: {
          products: {
            current: formData.products.filter(p => p.type === 'current'),
            recommended: formData.products.filter(p => p.type === 'recommended')
          },
          currentDecisions: formData.decisions,
          clientInfo: {
            clientName: formData.isAnonymous ? "דוח אנונימי" : formData.clientName,
            clientPhone: formData.isAnonymous ? "" : formData.clientPhone,
            clientEmail: formData.isAnonymous ? "" : formData.clientEmail,
            meetingDate: formData.meetingDate,
            topics: formData.topics,
            currentSituation: formData.currentSituation,
            risks: formData.risks,
            recommendations: formData.recommendations,
            estimatedCost: formData.estimatedCost
          }
        }
      });

      if (error) {
        console.error('Error generating decisions:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה ביצירת ההחלטות. אנא נסה שוב.",
          variant: "destructive"
        });
        return;
      }

      if (data?.decisions) {
        setFormData(prev => ({
          ...prev,
          decisions: data.decisions
        }));
        toast({
          title: "הצלחה!",
          description: "החלטות סונכרנו בהצלחה! ניתן לערוך את הטקסט לפי הצורך.",
        });
      } else {
        toast({
          title: "שגיאה",
          description: "לא הצלחנו לייצר החלטות. אנא נסה שוב.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת ההחלטות. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDecisions(false);
    }
  };

  // Handle call recording approval
  const handleRecordingApproval = (currentProducts: SelectedProduct[], suggestedProducts: SelectedProduct[]) => {
    const allProducts = [...currentProducts, ...suggestedProducts];

    if (allProducts.length === 0) {
      toast({
        title: "לא זוהו מוצרים",
        description: "הניתוח הסתיים אך לא נמצאו מוצרים להוספה",
      });
      return;
    }

    const createProductKey = (product: SelectedProduct) => (
      `${product.type}|${product.company.trim().toLowerCase()}|${product.productName.trim().toLowerCase()}`
    );

    let addedCount = 0;
    let updatedCount = 0;

    setFormData(prev => {
      const productMap = new Map(prev.products.map(product => [createProductKey(product), product]));
      const processedKeys = new Set<string>();

      allProducts.forEach(product => {
        const key = createProductKey(product);

        if (!processedKeys.has(key)) {
          if (productMap.has(key)) {
            updatedCount++;
          } else {
            addedCount++;
          }
          processedKeys.add(key);
        }

        productMap.set(key, product);
      });

      return {
        ...prev,
        products: Array.from(productMap.values()),
      };
    });

    const descriptionParts = [];
    if (addedCount > 0) {
      descriptionParts.push(`נוספו ${addedCount} מוצרים חדשים`);
    }
    if (updatedCount > 0) {
      descriptionParts.push(`עודכנו ${updatedCount} מוצרים קיימים`);
    }

    toast({
      title: "הנתונים עודכנו בהצלחה",
      description: descriptionParts.length > 0
        ? `${descriptionParts.join(" ו")} מניתוח השיחה`
        : "הנתונים נותרו ללא שינוי",
    });

    // Switch to products tab to show the new products
    setActiveTab("products");
  };

  if (showSummary) {
    return <SummaryGenerator formData={formData} onBack={() => setShowSummary(false)} />;
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            יצירת סיכום פגישה + מוצרים פיננסיים
          </h1>
          <p className="text-muted-foreground text-lg">
            מלאו את הפרטים להכנת סיכום מקצועי
          </p>
          
          {/* Progress */}
          <div className="mt-6 glass p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">התקדmות</span>
              <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Button onClick={saveDraft} variant="outline" className="glass border-glass-border">
            <Save className="h-4 w-4 ml-2" />
            שמירת טיוטה
          </Button>
          <Button onClick={loadDraft} variant="outline" className="glass border-glass-border">
            <FileText className="h-4 w-4 ml-2" />
            טעינת טיוטה
          </Button>
          <Button 
            onClick={() => setShowRecordingModal(true)} 
            variant="outline" 
            className="glass border-glass-border"
          >
            <Phone className="h-4 w-4 ml-2" />
            הקלטת שיחה
          </Button>
          <Button 
            onClick={generateSummary} 
            disabled={!isSummaryEligible}
            className="bg-primary text-primary-foreground font-medium"
          >
            יצירת דוח
          </Button>
        </div>

        {/* Form - RTL Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 glass mb-8 p-1 rounded-2xl">
            <TabsTrigger 
              value="client" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4 ml-2" />
              פרטי לקוח
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4 ml-2" />
              מוצרים
            </TabsTrigger>
            <TabsTrigger 
              value="decisions"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              החלטות
            </TabsTrigger>
          </TabsList>

          {/* Client Details */}
          <TabsContent value="client">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרטי הלקוח
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Anonymous Report Checkbox */}
                <div className="flex items-center space-x-2 mb-6">
                  <Checkbox
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isAnonymous: checked as boolean }))
                    }
                  />
                  <Label htmlFor="anonymous" className="text-lg font-medium">ללא פרטי לקוח (דוח אנונימי)</Label>
                </div>

                {/* Client Details Section */}
                {!formData.isAnonymous && (
                  <div className="space-y-6">
                    <div className="bg-muted/30 rounded-xl p-6 border border-muted">
                      <Label htmlFor="clientName" className="text-lg font-medium">שם הלקוח *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder="הזן שם הלקוח"
                        className="mt-2 bg-background border-border rounded-xl h-12 text-lg"
                      />
                    </div>

                    {/* Client Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="clientId" className="text-base font-medium">תעודת זהות / ח.פ</Label>
                        <Input
                          id="clientId"
                          value={formData.clientId}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                          className="mt-2 bg-input rounded-xl"
                          placeholder="123456789"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="clientPhone" className="text-base font-medium">טלפון *</Label>
                        <Input
                          id="clientPhone"
                          type="tel"
                          value={formData.clientPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                          className="mt-2 bg-input rounded-xl"
                          placeholder="050-1234567"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="clientEmail" className="text-base font-medium">אימייל</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={formData.clientEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                          className="mt-2 bg-input rounded-xl"
                          placeholder="client@email.com"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="meetingDate" className="text-base font-medium">תאריך הפגישה</Label>
                        <Input
                          id="meetingDate"
                          type="date"
                          value={formData.meetingDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
                          className="mt-2 bg-input rounded-xl"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="meetingLocation" className="text-base font-medium">מיקום / אופי הפגישה</Label>
                        <Input
                          id="meetingLocation"
                          value={formData.meetingLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                          className="mt-2 bg-input rounded-xl"
                          placeholder="למשל: פגישה במשרד, זום, טלפונית"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Topics */}
                <div>
                  <Label className="text-base font-medium mb-4 block">נושאי הפגישה</Label>
                  <div className="flex flex-wrap gap-3">
                    {insuranceTopics.map((topic) => (
                      <Badge
                        key={topic}
                        variant={formData.topics.includes(topic) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
                        onClick={() => handleTopicToggle(topic)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Current Situation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Label htmlFor="currentSituation" className="text-base font-medium">מצב קיים *</Label>
                    <VoiceTextInput 
                      onTextProcessed={(enhancedText, transcribedText) => 
                        setFormData(prev => ({ ...prev, currentSituation: enhancedText }))
                      }
                      textType="currentSituation"
                    />
                  </div>
                  <Textarea
                    id="currentSituation"
                    value={formData.currentSituation}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentSituation: e.target.value }))}
                    className="min-h-[120px] bg-input rounded-xl resize-none"
                    placeholder="תאר את המצב הפיננסי הנוכחי של הלקוח..."
                  />
                </div>

                {/* Risks */}
                <div>
                  <Label htmlFor="risks" className="text-base font-medium mb-4 block">סיכונים וחששות</Label>
                  <Textarea
                    id="risks"
                    value={formData.risks}
                    onChange={(e) => setFormData(prev => ({ ...prev, risks: e.target.value }))}
                    className="min-h-[100px] bg-input rounded-xl resize-none"
                    placeholder="תאר סיכונים, חששות או נקודות חשובות שעלו..."
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">המלצות</Label>
                    <Button
                      type="button"
                      onClick={addRecommendation}
                      size="sm"
                      variant="outline"
                      className="glass border-glass-border"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף המלצה
                    </Button>
                  </div>
                  {formData.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <Textarea
                        value={rec}
                        onChange={(e) => updateRecommendation(index, e.target.value)}
                        className="flex-1 min-h-[80px] bg-input rounded-xl resize-none"
                        placeholder={`המלצה ${index + 1}...`}
                      />
                      {formData.recommendations.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeRecommendation(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Estimated Cost */}
                <div>
                  <Label htmlFor="estimatedCost" className="text-base font-medium">עלות משוערת</Label>
                  <Input
                    id="estimatedCost"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    className="mt-2 bg-input rounded-xl"
                    placeholder="למשל: ₪500-800 לחודש"
                  />
                </div>
              </CardContent>
            </Card>
            {/* Next Step Button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setActiveTab("products")}
                disabled={!isSummaryEligible}
                className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-xl"
              >
                שלב הבא: מוצרים
              </Button>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  מוצרים פיננסיים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductManager
                  currentProducts={formData.products.filter(p => p.type === 'current')}
                  recommendedProducts={formData.products.filter(p => p.type === 'recommended')}
                  onUpdateProducts={(products) => setFormData(prev => ({ ...prev, products }))}
                />
              </CardContent>
            </Card>
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => setActiveTab("client")}
                variant="outline"
                className="px-8 py-3 rounded-xl"
              >
                חזרה: פרטי לקוח
              </Button>
              <Button
                onClick={() => setActiveTab("decisions")}
                className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-xl"
              >
                שלב הבא: החלטות
              </Button>
            </div>
          </TabsContent>

          {/* Decisions */}
          <TabsContent value="decisions">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  החלטות וצעדים הבאים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Decisions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Label htmlFor="decisions" className="text-base font-medium">מה הוחלט לבצע</Label>
                    <VoiceTextInput 
                      onTextProcessed={(enhancedText, transcribedText) => 
                        setFormData(prev => ({ ...prev, decisions: enhancedText }))
                      }
                      textType="decisions"
                    />
                    <Button
                      onClick={handleGenerateDecisions}
                      disabled={isGeneratingDecisions}
                      variant="outline"
                      size="sm"
                      className="glass border-glass-border text-xs"
                    >
                      {isGeneratingDecisions ? "מייצר..." : "יצירה אוטומטית"}
                    </Button>
                  </div>
                  <Textarea
                    id="decisions"
                    value={formData.decisions}
                    onChange={(e) => setFormData(prev => ({ ...prev, decisions: e.target.value }))}
                    className="min-h-[120px] bg-input rounded-xl resize-none"
                    placeholder="תאר את ההחלטות שהתקבלו והצעדים הבאים..."
                  />
                </div>

                {/* Required Documents */}
                <div>
                  <Label className="text-base font-medium mb-4 block">מסמכים נדרשים</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {documentOptions.map((doc) => (
                      <div key={doc} className="flex items-center space-x-2">
                        <Checkbox
                          id={doc}
                          checked={formData.documents.includes(doc)}
                          onCheckedChange={() => handleDocumentToggle(doc)}
                        />
                        <Label
                          htmlFor={doc}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {doc}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeframes */}
                <div>
                  <Label htmlFor="timeframes" className="text-base font-medium">לוחות זמנים ומועדים</Label>
                  <Textarea
                    id="timeframes"
                    value={formData.timeframes}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeframes: e.target.value }))}
                    className="mt-2 min-h-[80px] bg-input rounded-xl resize-none"
                    placeholder="מועדי הגשת מסמכים, מועדי תשלום, פגישות המשך..."
                  />
                </div>

                {/* Approvals */}
                <div>
                  <Label htmlFor="approvals" className="text-base font-medium">אישורים ובדיקות</Label>
                  <Textarea
                    id="approvals"
                    value={formData.approvals}
                    onChange={(e) => setFormData(prev => ({ ...prev, approvals: e.target.value }))}
                    className="mt-2 min-h-[80px] bg-input rounded-xl resize-none"
                    placeholder="אישורים רפואיים, בדיקות נדרשות, אישורי הכנסה..."
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => setActiveTab("products")}
                variant="outline"
                className="px-8 py-3 rounded-xl"
              >
                חזרה: מוצרים
              </Button>
              <Button
                onClick={generateSummary}
                disabled={!isSummaryEligible}
                className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-xl"
              >
                יצירת דוח מלא
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <RecordingModal 
          isOpen={showRecordingModal}
          onClose={() => setShowRecordingModal(false)}
          onApprove={handleRecordingApproval}
        />
      )}
    </div>
  );
};

export default AppForm;