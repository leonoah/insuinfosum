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
import { User, FileText, CheckCircle, Save, Plus, Trash2, BarChart3, Search, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SummaryGenerator from "./SummaryGenerator";
import ProductManager from "./ProductSelector/ProductManager";
import RecordingModal from "./CallRecording/RecordingModal";
import { SelectedProduct } from "@/types/insurance";
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
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientId: "",
    clientPhone: "",
    clientEmail: "",
    meetingDate: new Date().toISOString().split('T')[0],
    meetingLocation: "",
    topics: [],
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

  // Required fields: name, phone, current situation
  const isSummaryEligible = Boolean(
    formData.clientName.trim() &&
    formData.clientPhone.trim() &&
    formData.currentSituation.trim()
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
            clientName: formData.clientName,
            clientPhone: formData.clientPhone,
            clientEmail: formData.clientEmail,
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
                {/* Client Search Section */}
                <div className="bg-muted/30 rounded-xl p-6 border border-muted">
                  <Label htmlFor="clientName" className="text-lg font-medium">שם הלקוח *</Label>
                  <p className="text-sm text-muted-foreground mb-4">חפש לקוח קיים או הוסף לקוח חדש</p>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between bg-background border-border rounded-xl h-12 text-lg"
                      >
                        {clientSearchValue || formData.clientName || "בחרו לקוח קיים או הקלידו שם חדש"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="חפשו לקוח או הקלידו שם חדש..."
                            value={clientSearchValue}
                            onValueChange={(value) => {
                              setClientSearchValue(value);
                              setFormData(prev => ({ ...prev, clientName: value }));
                            }}
                          />
                          <CommandEmpty>
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                לא נמצא לקוח עם השם "{clientSearchValue}"
                              </p>
                              <p className="text-xs text-muted-foreground">
                                המשיכו למלא את הפרטים ליצירת לקוח חדש
                              </p>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {clients
                              .filter(client => 
                                client.client_name.toLowerCase().includes(clientSearchValue.toLowerCase())
                              )
                              .map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.client_name}
                                  onSelect={() => selectClient(client)}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{client.client_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ת.ز: {client.client_id} | טל: {client.client_phone}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

              </CardContent>
            </Card>
            {/* Next Step Button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setActiveTab("products")}
                disabled={!(formData.clientName.trim() && formData.clientPhone.trim())}
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
                
                <ProductManager
                  currentProducts={formData.products.filter(p => p.type === 'current')}
                  recommendedProducts={formData.products.filter(p => p.type === 'recommended')}
                  onUpdateProducts={(products) => setFormData(prev => ({ ...prev, products }))}
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
              <Button
                onClick={() => setActiveTab("decisions")}
                disabled={formData.products.filter(p => p.type === 'current' || p.type === 'recommended').length === 0}
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
                  סיכום החלטות שהתקבלו
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="currentSituation">מצב קיים בקצרה *</Label>
                  <Textarea
                    id="currentSituation"
                    value={formData.currentSituation}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentSituation: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[100px]"
                    placeholder="תארו את המצב הביטוחי הנוכחי של הלקוח..."
                  />
                </div>

                <div>
                  <Label htmlFor="risks">פערים / סיכונים שהודגשו</Label>
                  <Textarea
                    id="risks"
                    value={formData.risks}
                    onChange={(e) => setFormData(prev => ({ ...prev, risks: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[100px]"
                    placeholder="רשמו פערים וסיכונים שזוהו..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="decisions">מה הוחלט לבצע *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDecisions}
                      disabled={isGeneratingDecisions || (!formData.products?.length)}
                      className="text-xs border-glass-border bg-glass hover:bg-glass text-foreground rounded-lg"
                    >
                      {isGeneratingDecisions ? 'מייצר החלטות...' : '🤖 סנכרן החלטות עם AI'}
                    </Button>
                  </div>
                  
                  {formData.decisions && formData.decisions.includes('<div') ? (
                    <div className="space-y-2">
                      <div className="p-4 bg-background/50 rounded-xl border min-h-[100px]">
                        <div 
                          className="ai-content"
                          dangerouslySetInnerHTML={{ __html: formData.decisions }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, decisions: '' }))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        עריכה ידנית
                      </Button>
                    </div>
                  ) : (
                    <Textarea
                      id="decisions"
                      value={formData.decisions}
                      onChange={(e) => setFormData(prev => ({ ...prev, decisions: e.target.value }))}
                      className="mt-2 bg-input rounded-xl min-h-[100px]"
                      placeholder="פרטו את ההחלטות שהתקבלו בפגישה..."
                    />
                  )}
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