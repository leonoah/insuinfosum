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
import { User, FileText, CheckCircle, Save, Plus, Trash2, BarChart3, Search, Phone, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SummaryGenerator from "./SummaryGenerator";
import ProductManager from "./ProductSelector/ProductManager";
import RecordingModal from "./CallRecording/RecordingModal";
import VoiceTextInput from "./VoiceTextInput";
import { ClientFileImport } from "./ClientFileImport";
import { SelectedProduct } from "@/types/products";
// Update AppForm to log reports when generated
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  includeDecisionsInReport: boolean;
}

const insuranceTopics = [
  "בריאות", "חיים", "סיעוד", "תאונות אישיות", 
  "אובדן כושר עבודה", "פנסיה", "חיסכון", "רכב", "דירה"
];

const AppForm = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");
  const [showSummary, setShowSummary] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [hasSkippedProducts, setHasSkippedProducts] = useState(false);
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
    approvals: "",
    includeDecisionsInReport: true
  });

  // Required fields: current situation, and client details only if not anonymous
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
    if (!formData.clientName || !formData.clientId) return;
    
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

  const selectClient = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.client_name,
      clientId: client.client_id,
      clientPhone: client.client_phone || "",
      clientEmail: client.client_email || ""
    }));
    setClientSearchValue(client.client_name);
    setClientSearchOpen(false);
    
    toast({
      title: "לקוח נטען",
      description: `פרטי ${client.client_name} נטענו בהצלחה`,
    });
  };

  const documentOptions = [
    "העתק תעודת זהות", "אישור הכנסה", "בדיקות רפואיות", 
    "פוליסות קיימות", "מסמכי בנק", "אישור רופא"
  ];

  const calculateProgress = () => {
    const fields = [
      formData.clientName, formData.clientPhone, formData.clientEmail,
      formData.currentSituation, formData.decisions
    ];
    const filledFields = fields.filter(field => field.trim()).length;
    return (filledFields / fields.length) * 100;
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
    if (!formData.currentSituation) {
      toast({
        title: "חסרים פרטים",
        description: "יש למלא לפחות מצב קיים",
        variant: "destructive"
      });
      return;
    }

    if (!formData.isAnonymous && (!formData.clientName || !formData.clientPhone)) {
      toast({
        title: "חסרים פרטים",
        description: "יש למלא שם לקוח וטלפון או לבחור דוח אנונימי",
        variant: "destructive"
      });
      return;
    }
    
    // Save client before generating summary (only if not anonymous)
    if (!formData.isAnonymous) {
      await saveClient();
    }
    
    // Log the report generation
    await logReport();
    
    setShowSummary(true);
  };

  const logReport = async () => {
    try {
      const reportContent = `דוח ייעוץ פיננסי עבור ${formData.clientName}
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
          client_id: formData.clientPhone, // Using phone as ID for now
          client_name: formData.clientName,
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

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-decisions', {
        body: {
          products: {
            current: formData.products.filter(p => p.type === 'current'),
            recommended: formData.products.filter(p => p.type === 'recommended')
          },
          currentDecisions: {
            currentSituation: formData.currentSituation,
            risks: formData.risks,
            decisions: formData.decisions
          },
          clientInfo: {
            clientName: formData.clientName,
            clientPhone: formData.clientPhone,
            clientEmail: formData.clientEmail,
            meetingDate: formData.meetingDate,
            topics: formData.topics
          },
          autoFillMode: true
        }
      });

      if (error) {
        console.error('Error auto-filling:', error);
        toast({
          title: "שגיאה",
          description: `שגיאה במילוי האוטומטי: ${error.message || 'אנא נסה שוב'}`,
          variant: "destructive"
        });
        return;
      }

      // Check if response indicates failure
      if (data?.success === false) {
        console.error('Auto-fill failed:', data);
        toast({
          title: "שגיאה",
          description: data.error || "לא הצלחנו לבצע מילוי אוטומטי. אנא נסה שוב.",
          variant: "destructive"
        });
        return;
      }

      if (data?.currentSituation || data?.risks || data?.decisions) {
        setFormData(prev => ({
          ...prev,
          currentSituation: data.currentSituation || prev.currentSituation,
          risks: data.risks || prev.risks,
          decisions: data.decisions || prev.decisions
        }));
        toast({
          title: "הצלחה!",
          description: "השדות מולאו אוטומטית! ניתן לערוך את הטקסט לפי הצורך.",
        });
      } else {
        console.warn('No data returned from auto-fill:', data);
        toast({
          title: "שגיאה",
          description: "לא הצלחנו לבצע מילוי אוטומטי. אנא נסה שוב.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in handleAutoFill:', error);
      toast({
        title: "שגיאה",
        description: `שגיאה במילוי האוטומטי: ${error instanceof Error ? error.message : 'אנא נסה שוב'}`,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
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
      `${product.type}|${product.company.trim().toLowerCase()}|${product.category.trim().toLowerCase()}`
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
              <span className="text-sm text-muted-foreground">התקדמות</span>
              <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
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
                {/* Anonymous Report Option */}
                <div className="bg-muted/20 rounded-xl p-4 border border-muted">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Checkbox
                      id="isAnonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          isAnonymous: checked as boolean,
                          // Clear client data when switching to anonymous
                          ...(checked && {
                            clientName: "",
                            clientId: "",
                            clientPhone: "",
                            clientEmail: ""
                          })
                        }))
                      }
                      className="rounded-md"
                    />
                    <Label 
                      htmlFor="isAnonymous" 
                      className="text-base font-medium cursor-pointer"
                    >
                      ללא פרטי לקוח (דוח אנונימי)
                    </Label>
                  </div>
                  {formData.isAnonymous && (
                    <p className="text-sm text-muted-foreground mt-2 mr-6">
                      הדוח ייווצר ללא פרטי הלקוח ויהיה אנונימי לחלוטין
                    </p>
                  )}
                </div>

                {!formData.isAnonymous && (
                  <>
                     {/* Client Name Section */}
                     <div className="bg-muted/30 rounded-xl p-6 border border-muted">
                       <div className="flex items-center justify-between mb-2">
                         <div>
                           <Label htmlFor="clientName" className="text-lg font-medium">שם הלקוח *</Label>
                           <p className="text-sm text-muted-foreground mt-1">הכנס את שם הלקוח או טען מקובץ מסלקה</p>
                         </div>
                          <ClientFileImport 
                            onClientDataLoaded={(clientName, clientId, clientPhone, clientEmail) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                clientName, 
                                clientId,
                                clientPhone: clientPhone !== undefined ? clientPhone : prev.clientPhone,
                                clientEmail: clientEmail !== undefined ? clientEmail : prev.clientEmail
                              }));
                            }}
                          />
                       </div>
                       <Input
                         id="clientName"
                         type="text"
                         value={formData.clientName}
                         onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                         placeholder="שם הלקוח"
                         className="bg-background border-border rounded-xl h-12 text-lg mt-2"
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
                   </>
                 )}

              </CardContent>
            </Card>
            {/* Next Step Button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setActiveTab("products")}
                disabled={!(formData.isAnonymous || (formData.clientName.trim() && formData.clientPhone.trim()))}
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
                  ניהול מוצרים פיננסיים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasSkippedProducts && formData.products.length === 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-orange-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">דילגת על שלב המוצרים</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      אם תרצה להוסיף מוצרים לדוח, תוכל לעשות זאת כאן ולאחר מכן לחזור לשלב ההחלטות
                    </p>
                  </div>
                )}
                
                <ProductManager
                  currentProducts={formData.products.filter(p => p.type === 'current')}
                  recommendedProducts={formData.products.filter(p => p.type === 'recommended')}
                  onUpdateProducts={(products) => {
                    setFormData(prev => ({ ...prev, products }));
                    // Reset skip flag when products are added
                    if (products.length > 0) {
                      setHasSkippedProducts(false);
                    }
                  }}
                  onShowRecording={() => setShowRecordingModal(true)}
                />
              </CardContent>
            </Card>
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab("client")}
                className="rounded-xl"
              >
                חזור לפרטי לקוח
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasSkippedProducts(true);
                    setActiveTab("decisions");
                    toast({
                      title: "דילגת על מוצרים",
                      description: "תוכל להוסיף מוצרים מאוחר יותר בעת הצורך",
                    });
                  }}
                  className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  דלג על מוצרים
                </Button>
                <Button
                  onClick={() => {
                    setHasSkippedProducts(false);
                    setActiveTab("decisions");
                  }}
                  disabled={formData.products.filter(p => p.type === 'current' || p.type === 'recommended').length === 0 && !hasSkippedProducts}
                  className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-xl"
                >
                  שלב הבא: החלטות
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Decisions */}
          <TabsContent value="decisions">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  סיכום החלטות שהתקבלו
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Fill Button */}
                <div className="mb-6">
                  <Button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={isAutoFilling || (!formData.products?.length && !hasSkippedProducts)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-3 font-medium"
                  >
                    {isAutoFilling ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        מבצע מילוי אוטומטי...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 ml-2" />
                        מילוי אוטומטי
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    ימלא אוטומטי את 3 השדות על בסיס המוצרים שנבחרו
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="currentSituation">מצב קיים בקצרה *</Label>
                    <VoiceTextInput
                      onTextProcessed={(enhancedText, transcribedText) => {
                        setFormData(prev => ({ ...prev, currentSituation: enhancedText }));
                      }}
                      textType="currentSituation"
                      buttonText="הקלטה קולית"
                    />
                  </div>
                  <Textarea
                    id="currentSituation"
                    value={formData.currentSituation}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentSituation: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[100px]"
                    placeholder="תארו את המצב הביטוחי הנוכחי של הלקוח..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="risks">פערים / סיכונים שהודגשו</Label>
                    <VoiceTextInput
                      onTextProcessed={(enhancedText, transcribedText) => {
                        setFormData(prev => ({ ...prev, risks: enhancedText }));
                      }}
                      textType="risks"
                      buttonText="הקלטה קולית"
                    />
                  </div>
                  <Textarea
                    id="risks"
                    value={formData.risks}
                    onChange={(e) => setFormData(prev => ({ ...prev, risks: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[100px]"
                    placeholder="רשמו פערים וסיכונים שזוהו..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="decisions">מה הוחלט לבצע *</Label>
                    <VoiceTextInput
                      onTextProcessed={(enhancedText, transcribedText) => {
                        setFormData(prev => ({ ...prev, decisions: enhancedText }));
                      }}
                      textType="decisions"
                      buttonText="הקלטה קולית"
                    />
                  </div>
                  <Textarea
                    id="decisions"
                    value={formData.decisions}
                    onChange={(e) => setFormData(prev => ({ ...prev, decisions: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[100px]"
                    placeholder="פרטו את ההחלטות שהתקבלו בפגישה..."
                  />
                </div>

                <div>
                  <Label>מסמכים / פעולות להשלמה</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {documentOptions.map((doc) => (
                      <div key={doc} className="flex items-center space-x-2 space-x-reverse">
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

                <div>
                  <Label htmlFor="timeframes">טווחי זמנים</Label>
                  <Input
                    id="timeframes"
                    value={formData.timeframes}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeframes: e.target.value }))}
                    className="mt-2 bg-input rounded-xl"
                    placeholder="תוך שבועיים, חודש..."
                  />
                </div>

                <div>
                  <Label htmlFor="approvals">אישורים / חתימות נדרשות</Label>
                  <Input
                    id="approvals"
                    value={formData.approvals}
                    onChange={(e) => setFormData(prev => ({ ...prev, approvals: e.target.value }))}
                    className="mt-2 bg-input rounded-xl"
                    placeholder="חתימת בן/בת זוג, אישור רופא..."
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="includeDecisionsInReport"
                      checked={formData.includeDecisionsInReport}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, includeDecisionsInReport: checked === true }))
                      }
                    />
                    <Label 
                      htmlFor="includeDecisionsInReport" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      כלול החלטות זו בדוח המסכם
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 mr-6">
                    בחר אם להציג את פרטי ההחלטות, המסמכים וטווחי הזמן בדוח ה-PDF הסופי
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Back Button */}
            <div className="flex justify-start mt-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab("products")}
                className="rounded-xl"
              >
                חזור למוצרים
              </Button>
            </div>
          </TabsContent>

        </Tabs>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={generateSummary}
            size="lg"
            disabled={!isSummaryEligible}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-8 py-4 rounded-2xl shadow-glow text-lg min-w-[200px] glass-hover"
          >
            <FileText className="h-5 w-5 ml-2" />
            ייצר סיכום
          </Button>
          {!isSummaryEligible && (
            <p className="mt-2 text-sm text-muted-foreground">
              נדרש למלא: שם לקוח, טלפון ומצב קיים לפני יצירת הסיכום
            </p>
          )}
        </div>
      </div>

      {/* Recording Modal */}
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onApprove={handleRecordingApproval}
        initialClientId={formData.clientId}
        initialClientName={formData.clientName}
      />

      {showSummary && (
        <SummaryGenerator formData={formData} onBack={() => setShowSummary(false)} />
      )}
    </div>
  );
};

export default AppForm;