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
import { User, FileText, CheckCircle, Save, Plus, Trash2, BarChart3, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SummaryGenerator from "./SummaryGenerator";
import ProductManager from "./ProductSelector/ProductManager";
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
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientId: "",
    clientPhone: "",
    clientEmail: "",
    meetingDate: new Date().toISOString().split('T')[0],
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

        {/* Action buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <Button 
            variant="outline" 
            onClick={saveDraft}
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            <Save className="h-4 w-4 ml-2" />
            שמור טיוטה
          </Button>
          <Button 
            variant="outline" 
            onClick={loadDraft}
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            טען טיוטה
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="clientName">שם הלקוח *</Label>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientSearchOpen}
                          className="w-full justify-between mt-2 bg-input border-border rounded-xl h-10"
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
                  
                  <div>
                    <Label htmlFor="clientId">תעודת זהות / ח.פ</Label>
                    <Input
                      id="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                      className="mt-2 bg-input rounded-xl"
                      placeholder="123456789"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clientPhone">טלפון *</Label>
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
                    <Label htmlFor="clientEmail">אימייל *</Label>
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
                    <Label htmlFor="meetingDate">תאריך הפגישה</Label>
                    <Input
                      id="meetingDate"
                      type="date"
                      value={formData.meetingDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
                      className="mt-2 bg-input rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label>נושאים / מוצרים שנדונו</Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {insuranceTopics.map((topic) => (
                      <Badge
                        key={topic}
                        variant={formData.topics.includes(topic) ? "default" : "outline"}
                        className={`cursor-pointer rounded-full px-4 py-2 transition-all ${
                          formData.topics.includes(topic) 
                            ? "bg-primary text-primary-foreground" 
                            : "border-glass-border bg-glass hover:bg-glass text-foreground"
                        }`}
                        onClick={() => handleTopicToggle(topic)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <div className="flex items-center justify-between mb-3">
                    <Label>המלצות מוצרים / שינויים</Label>
                    <Button
                      type="button" 
                      variant="outline"
                      size="sm"
                      onClick={addRecommendation}
                      className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-lg"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.recommendations.map((rec, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={rec}
                          onChange={(e) => updateRecommendation(index, e.target.value)}
                          className="bg-input rounded-xl"
                          placeholder={`המלצה ${index + 1}`}
                        />
                        {formData.recommendations.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeRecommendation(index)}
                            className="border-glass-border bg-glass hover:bg-destructive rounded-xl shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedCost">הערכת עלות חודשית משוערת</Label>
                  <Input
                    id="estimatedCost"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    className="mt-2 bg-input rounded-xl"
                    placeholder="₪ 500-800 לחודש"
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
              </CardContent>
            </Card>
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
              <CardContent>
                <ProductManager
                  currentProducts={formData.products.filter(p => p.type === 'current')}
                  recommendedProducts={formData.products.filter(p => p.type === 'recommended')}
                  onUpdateProducts={(products) => setFormData(prev => ({ ...prev, products }))}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={generateSummary}
            size="lg"
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-8 py-4 rounded-2xl shadow-glow text-lg min-w-[200px] glass-hover"
          >
            <FileText className="h-5 w-5 ml-2" />
            ייצר סיכום
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppForm;