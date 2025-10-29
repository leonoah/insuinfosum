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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, FileText, CheckCircle, Save, Plus, Trash2, BarChart3, Search, Phone, Sparkles, Loader2, CalendarIcon, FolderOpen, Upload, Share2, Mail, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/PDFReport/ReportDocument";
import agentLogo from "@/assets/agent-logo.png";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
}

interface SavedForm {
  id: string;
  client_name: string;
  client_id: string;
  form_data: any; // JSON from database
  created_at: string;
  updated_at: string;
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
  meetingContext: string;
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
  includeProductsTable: boolean;
  includeExposureReport: boolean;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [agentData, setAgentData] = useState({
    name: "הסוכן שלכם",
    phone: null as string | null,
    email: null as string | null,
    logo_url: null as string | null
  });
  const [hasSkippedProducts, setHasSkippedProducts] = useState(false);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    meetingContext: "",
    recommendations: [""],
    estimatedCost: "",
    products: [],
    decisions: "",
    documents: [],
    timeframes: "",
    approvals: "",
    includeDecisionsInReport: true,
    includeProductsTable: true,
    includeExposureReport: true
  });

  const [autoFillDetailLevel, setAutoFillDetailLevel] = useState<"summary" | "detailed">("summary");

  const detailLevelLabels: Record<"summary" | "detailed", string> = {
    summary: "פירוט קצר",
    detailed: "פירוט מורחב",
  };

  // Required fields: meeting context, current situation, and client details only if not anonymous
  const isSummaryEligible = Boolean(
    formData.meetingContext?.trim() &&
    formData.currentSituation?.trim() &&
    (formData.isAnonymous || (formData.clientName?.trim() && formData.clientPhone?.trim()))
  );

  // Load clients and saved forms on component mount
  useEffect(() => {
    loadClients();
    loadSavedForms();
    loadAgentInfo();
  }, []);

  const loadAgentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_info')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading agent info:', error);
        return;
      }

      if (data) {
        setAgentData({
          name: data.name || "הסוכן שלכם",
          phone: data.phone,
          email: data.email,
          logo_url: data.logo_url
        });
      }
    } catch (error) {
      console.error('Error loading agent info:', error);
    }
  };

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

  const loadSavedForms = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_forms')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setSavedForms(data || []);
    } catch (error) {
      console.error('Error loading saved forms:', error);
    }
  };

  const deleteForm = async (formId: string, formName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`האם למחוק את הטופס של ${formName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_forms')
        .delete()
        .eq('id', formId);
      
      if (error) throw error;
      
      await loadSavedForms();
      
      toast({
        title: "הטופס נמחק",
        description: `הטופס של ${formName} נמחק בהצלחה`,
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את הטופס",
        variant: "destructive"
      });
    }
  };

  const saveFormToDatabase = async () => {
    if (!formData.clientName || !formData.clientId) {
      toast({
        title: "חסרים פרטים",
        description: "נא למלא שם לקוח ותעודת זהות לפני השמירה",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Saving form with products:', formData.products.map(p => ({ 
        company: p.company,
        category: p.category,
        returns: p.returns 
      })));
      
      const { error } = await supabase
        .from('saved_forms')
        .upsert([{
          client_id: formData.clientId,
          client_name: formData.clientName,
          form_data: formData as any
        }], {
          onConflict: 'client_id,client_name'
        });
      
      if (error) throw error;
      
      await loadSavedForms();
      
      toast({
        title: "הטופס נשמר בהצלחה",
        description: `הנתונים של ${formData.clientName} נשמרו`,
      });
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את הטופס. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadFormFromDatabase = (savedForm: SavedForm) => {
    console.log('Loading form with products:', savedForm.form_data.products?.map((p: any) => ({ 
      company: p.company,
      category: p.category,
      returns: p.returns 
    })));
    
    // Ensure meetingContext exists in loaded data
    const loadedData = {
      ...savedForm.form_data,
      meetingContext: savedForm.form_data.meetingContext || ""
    };
    
    setFormData(loadedData as FormData);
    setShowLoadDialog(false);
    
    toast({
      title: "הטופס נטען",
      description: `נתוני ${savedForm.client_name} נטענו בהצלחה`,
    });
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
      const parsedData = JSON.parse(draft);
      // Ensure meetingContext exists in loaded draft
      const loadedData = {
        ...parsedData,
        meetingContext: parsedData.meetingContext || ""
      };
      setFormData(loadedData);
      toast({
        title: "טיוטה נטענה",
        description: "הנתונים השמורים נטענו בהצלחה",
      });
    }
  };

  const generateReactPDF = async (): Promise<Blob> => {
    const currentProducts = formData.products.filter(p => p.type === 'current');
    const recommendedProducts = formData.products.filter(p => p.type === 'recommended');

    const totalCurrentAmount = currentProducts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRecommendedAmount = recommendedProducts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const amountDifference = totalRecommendedAmount - totalCurrentAmount;
    const productCountDifference = recommendedProducts.length - currentProducts.length;

    const avgCurrentDeposit = currentProducts.length > 0
      ? currentProducts.reduce((sum, p) => sum + (p.managementFeeOnDeposit || 0), 0) / currentProducts.length
      : 0;
    const avgRecommendedDeposit = recommendedProducts.length > 0
      ? recommendedProducts.reduce((sum, p) => sum + (p.managementFeeOnDeposit || 0), 0) / recommendedProducts.length
      : 0;
    const avgCurrentAccumulation = currentProducts.length > 0
      ? currentProducts.reduce((sum, p) => sum + (p.managementFeeOnAccumulation || 0), 0) / currentProducts.length
      : 0;
    const avgRecommendedAccumulation = recommendedProducts.length > 0
      ? recommendedProducts.reduce((sum, p) => sum + (p.managementFeeOnAccumulation || 0), 0) / recommendedProducts.length
      : 0;

    const riskShiftCount = recommendedProducts.filter(p => p.riskLevelChange && p.riskLevelChange !== 'no-change' && p.riskLevelChange.trim() !== '').length;

    const highlightBullets: string[] = [];

    if (recommendedProducts.length === 0 && currentProducts.length === 0) {
      highlightBullets.push('לא הוזנו נתוני מוצרים להשוואה בשלב זה.');
    } else {
      if (recommendedProducts.length > 0 && currentProducts.length === 0) {
        highlightBullets.push(`נבנה תיק מוצע חדש הכולל ${recommendedProducts.length} מוצרים מותאמים.`);
      }

      if (amountDifference > 0) {
        highlightBullets.push(`הגדלת היקף החיסכון המצטבר ב-₪${amountDifference.toLocaleString()}.`);
      } else if (amountDifference < 0) {
        highlightBullets.push(`הפחתת היקף החיסכון המצטבר ב-₪${Math.abs(amountDifference).toLocaleString()} לטובת איזון או נזילות.`);
      }

      if (productCountDifference > 0) {
        highlightBullets.push(`נוספו ${productCountDifference} מוצרים חדשים לפיזור ולהעמקת הכיסוי.`);
      } else if (productCountDifference < 0) {
        highlightBullets.push(`צומצמו ${Math.abs(productCountDifference)} מוצרים לצורך ייעול וחיסכון בדמי ניהול.`);
      }

      const depositDelta = avgRecommendedDeposit - avgCurrentDeposit;
      if (depositDelta < 0) {
        highlightBullets.push(`שיפור דמי הניהול הממוצעים מהפקדה ב-${Math.abs(depositDelta).toFixed(2)}%.`);
      } else if (depositDelta > 0) {
        highlightBullets.push(`דמי הניהול הממוצעים מהפקדה עלו ב-${depositDelta.toFixed(2)}% עבור פתרון מקצועי יותר.`);
      }

      const accumulationDelta = avgRecommendedAccumulation - avgCurrentAccumulation;
      if (accumulationDelta < 0) {
        highlightBullets.push(`הפחתת דמי הניהול מהצבירה ב-${Math.abs(accumulationDelta).toFixed(2)}%.`);
      }

      if (riskShiftCount > 0) {
        highlightBullets.push(`בוצעו ${riskShiftCount} התאמות ברמות הסיכון של התיק.`);
      }
    }

    const productStats = {
      currentProducts,
      recommendedProducts,
      totalCurrentAmount,
      totalRecommendedAmount,
      amountDifference,
      productCountDifference,
      avgCurrentDeposit,
      avgRecommendedDeposit,
      avgCurrentAccumulation,
      avgRecommendedAccumulation,
      riskShiftCount,
      highlightBullets,
    };

    // Default sections
    const selectedSections = {
      personalInfo: !formData.isAnonymous,
      executiveSummary: true,
      conversationInsights: true,
      portfolioComparison: true,
      returnsComparison: true,
      productDetails: true,
      exposureComparison: formData.includeExposureReport !== false,
      disclosures: true,
    };

    const updatedFormData = {
      ...formData,
      products: formData.products.map(product => ({
        ...product,
        includeExposureData: formData.includeExposureReport !== false
      }))
    };

    const blob = await pdf(
      <ReportDocument 
        formData={updatedFormData}
        agentData={agentData}
        productStats={productStats}
        selectedSections={selectedSections}
        additionalNotesText=""
        disclosureText="הסיכונים הכרוכים בהשקעה כוללים אובדן חלק או כל ההון המושקע. תשואות עבר אינן מבטיחות תשואות עתידיות. יש להתייעץ עם יועץ השקעות מוסמך לפני קבלת החלטה."
        nextStepsText=""
      />
    ).toBlob();
    
    return blob;
  };

  const sendReportByEmail = async () => {
    try {
      toast({
        title: "מייצר דוח...",
        description: "אנא המתן",
      });

      const blob = await generateReactPDF();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
      
      const pdfBase64 = await base64Promise;
      
      const response = await supabase.functions.invoke('send-report-email', {
        body: {
          to: formData.clientEmail || 'client@example.com',
          subject: `דוח סיכום פגישת ביטוח - ${formData.clientName}`,
          clientName: formData.clientName,
          meetingDate: formData.meetingDate,
          pdfBase64: pdfBase64,
          agentData: agentData,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "האימייל נשלח בהצלחה",
        description: `הדוח נשלח למייל ${formData.clientEmail}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "שגיאה בשליחת מייל",
        description: "לא הצלחנו לשלוח את הדוח. אנא נסה שוב.",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    try {
      toast({
        title: "מייצר דוח...",
        description: "אנא המתן",
      });

      const blob = await generateReactPDF();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `דוח-סיכום-${formData.clientName || 'לקוח'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "הדוח הורד בהצלחה",
        description: "הקובץ נשמר במכשיר שלך",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "שגיאה בהורדה",
        description: "לא הצלחנו להוריד את הדוח. אנא נסה שוב.",
        variant: "destructive",
      });
    }
  };

  const sharePDF = async () => {
    try {
      toast({
        title: "מייצר דוח...",
        description: "אנא המתן",
      });

      const blob = await generateReactPDF();
      const file = new File([blob], `דוח-סיכום-${formData.clientName || 'לקוח'}.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'סיכום פגישה',
          files: [file]
        });
      } else {
        toast({
          title: "שיתוף לא זמין",
          description: "דפדפן זה אינו תומך בשיתוף קבצים. הדוח יורד במקום.",
        });
        await downloadPDF();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing PDF:', error);
        toast({
          title: "שגיאה בשיתוף",
          description: "לא הצלחנו לשתף את הדוח. אנא נסה שוב.",
          variant: "destructive",
        });
      }
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
רקע ועיקרי הפגישה: ${formData.meetingContext}
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
      // סינון מוצרים: רק מוצרים פעילים (סטטוס "פעיל" או ללא סטטוס)
      const filterActiveProducts = (products: any[]) => 
        products.filter(p => !p.status || p.status === 'פעיל');

      const currentProducts = filterActiveProducts(formData.products.filter(p => p.type === 'current'));
      const recommendedProducts = filterActiveProducts(formData.products.filter(p => p.type === 'recommended'));
      
      // הצגת הודעה על מספר המוצרים שנשלחו
      const totalActiveProducts = currentProducts.length + recommendedProducts.length;
      const totalInactiveProducts = formData.products.filter(p => p.status === 'לא פעיל').length;
      
      if (totalInactiveProducts > 0) {
        toast({
          title: "מידע",
          description: `נשלחים ${totalActiveProducts} מוצרים פעילים למילוי אוטומטי. ${totalInactiveProducts} מוצרים לא פעילים לא נכללו.`,
        });
      }

      const { data, error } = await supabase.functions.invoke('generate-decisions', {
        body: {
          products: {
            current: currentProducts,
            recommended: recommendedProducts
          },
          currentDecisions: {
            currentSituation: formData.currentSituation,
            meetingContext: formData.meetingContext,
            decisions: formData.decisions
          },
          clientInfo: {
            clientName: formData.clientName,
            clientPhone: formData.clientPhone,
            clientEmail: formData.clientEmail,
            meetingDate: formData.meetingDate,
            topics: formData.topics
          },
          autoFillMode: true,
          detailLevel: autoFillDetailLevel
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

      if (data?.currentSituation || data?.meetingContext || data?.decisions) {
        setFormData(prev => ({
          ...prev,
          currentSituation: data.currentSituation || prev.currentSituation,
          meetingContext: data.meetingContext || prev.meetingContext,
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

          {/* Save and Load Buttons */}
          <div className="mt-4 flex gap-3 justify-center">
            <Button
              onClick={saveFormToDatabase}
              disabled={isSaving || !formData.clientName || !formData.clientId}
              variant="outline"
              className="rounded-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור טופס
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowLoadDialog(true)}
              variant="outline"
              className="rounded-xl"
            >
              <FolderOpen className="h-4 w-4 ml-2" />
              טען טופס שמור
            </Button>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal mt-2 bg-input rounded-xl h-11",
                            !formData.meetingDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {formData.meetingDate ? (
                            format(new Date(formData.meetingDate), "PPP", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.meetingDate ? new Date(formData.meetingDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({ 
                                ...prev, 
                                meetingDate: date.toISOString().split('T')[0]
                              }));
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          locale={he}
                        />
                      </PopoverContent>
                    </Popover>
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
                <div className="mb-6 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-xl justify-between sm:justify-center w-full sm:w-auto"
                        >
                          רמת פירוט: {detailLevelLabels[autoFillDetailLevel]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onSelect={() => setAutoFillDetailLevel("summary")}
                        >
                          פירוט קצר
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setAutoFillDetailLevel("detailed")}
                        >
                          פירוט מורחב
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  </div>
                   <p className="text-xs text-muted-foreground text-center">
                    ימלא אוטומטי את השדות על בסיס המוצרים שנבחרו (רק מוצרים פעילים) ובהתאם לרמת הפירוט שנבחרה
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="meetingContext">רקע ועיקרי הפגישה *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!formData.meetingContext.trim()) {
                            toast({ title: "אין טקסט לשיפור", description: "נא להזין טקסט תחילה", variant: "destructive" });
                            return;
                          }
                          try {
                            setIsGenerating(true);
                            const { data, error } = await supabase.functions.invoke('enhance-text-with-ai', {
                              body: { 
                                text: formData.meetingContext,
                                fieldType: 'meetingContext',
                                context: {
                                  currentProducts: formData.products.filter(p => p.type === 'current'),
                                  recommendedProducts: formData.products.filter(p => p.type === 'recommended')
                                }
                              }
                            });
                            if (error) throw error;
                            setFormData(prev => ({ ...prev, meetingContext: data.enhancedText }));
                            toast({ title: "הטקסט שופר בהצלחה", description: "הטקסט עודכן עם שיפורים מ-AI" });
                          } catch (error) {
                            console.error('Error enhancing text:', error);
                            toast({ title: "שגיאה בשיפור הטקסט", variant: "destructive" });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating || !formData.meetingContext.trim()}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isGenerating ? 'משפר...' : 'שפר עם AI'}
                      </Button>
                      <VoiceTextInput
                        onTextProcessed={(enhancedText, transcribedText) => {
                          setFormData(prev => ({ ...prev, meetingContext: enhancedText }));
                        }}
                        textType="meetingContext"
                        buttonText="הקלטה קולית"
                      />
                    </div>
                  </div>
                  <Textarea
                    id="meetingContext"
                    value={formData.meetingContext}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingContext: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[150px]"
                    placeholder="תיאור כללי של הפגישה - מה שהוסכם, המטרות והנקודות העיקריות שדובר עליהן..."
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="currentSituation">מצב קיים בקצרה *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!formData.currentSituation.trim()) {
                            toast({ title: "אין טקסט לשיפור", description: "נא להזין טקסט תחילה", variant: "destructive" });
                            return;
                          }
                          try {
                            setIsGenerating(true);
                            const { data, error } = await supabase.functions.invoke('enhance-text-with-ai', {
                              body: { 
                                text: formData.currentSituation,
                                fieldType: 'currentSituation',
                                context: {
                                  currentProducts: formData.products.filter(p => p.type === 'current'),
                                  recommendedProducts: formData.products.filter(p => p.type === 'recommended')
                                }
                              }
                            });
                            if (error) throw error;
                            setFormData(prev => ({ ...prev, currentSituation: data.enhancedText }));
                            toast({ title: "הטקסט שופר בהצלחה", description: "הטקסט עודכן עם שיפורים מ-AI" });
                          } catch (error) {
                            console.error('Error enhancing text:', error);
                            toast({ title: "שגיאה בשיפור הטקסט", variant: "destructive" });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating || !formData.currentSituation.trim()}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isGenerating ? 'משפר...' : 'שפר עם AI'}
                      </Button>
                      <VoiceTextInput
                        onTextProcessed={(enhancedText, transcribedText) => {
                          setFormData(prev => ({ ...prev, currentSituation: enhancedText }));
                        }}
                        textType="currentSituation"
                        buttonText="הקלטה קולית"
                      />
                    </div>
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
                    <Label htmlFor="decisions">מה הוחלט לבצע *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!formData.decisions.trim()) {
                            toast({ title: "אין טקסט לשיפור", description: "נא להזין טקסט תחילה", variant: "destructive" });
                            return;
                          }
                          try {
                            setIsGenerating(true);
                            const { data, error } = await supabase.functions.invoke('enhance-text-with-ai', {
                              body: { 
                                text: formData.decisions,
                                fieldType: 'decisions',
                                context: {
                                  currentProducts: formData.products.filter(p => p.type === 'current'),
                                  recommendedProducts: formData.products.filter(p => p.type === 'recommended')
                                }
                              }
                            });
                            if (error) throw error;
                            setFormData(prev => ({ ...prev, decisions: data.enhancedText }));
                            toast({ title: "הטקסט שופר בהצלחה", description: "הטקסט עודכן עם שיפורים מ-AI" });
                          } catch (error) {
                            console.error('Error enhancing text:', error);
                            toast({ title: "שגיאה בשיפור הטקסט", variant: "destructive" });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating || !formData.decisions.trim()}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isGenerating ? 'משפר...' : 'שפר עם AI'}
                      </Button>
                      <VoiceTextInput
                        onTextProcessed={(enhancedText, transcribedText) => {
                          setFormData(prev => ({ ...prev, decisions: enhancedText }));
                        }}
                        textType="decisions"
                        buttonText="הקלטה קולית"
                      />
                    </div>
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

                {/* Action Buttons */}
                <div className="pt-6 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl flex items-center justify-center gap-2 hover:bg-accent"
                      onClick={sharePDF}
                    >
                      <Share2 className="h-4 w-4" />
                      שתף דוח PDF
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="rounded-xl flex items-center justify-center gap-2 hover:bg-accent"
                      onClick={sendReportByEmail}
                    >
                      <Mail className="h-4 w-4" />
                      שלח דוח במייל
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="rounded-xl flex items-center justify-center gap-2 hover:bg-accent"
                      onClick={downloadPDF}
                    >
                      <Download className="h-4 w-4" />
                      הורד דוח PDF
                    </Button>
                  </div>
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

      {/* Load Form Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden bg-background">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  טען טופס שמור
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoadDialog(false)}
                  className="rounded-full"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              {savedForms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>אין טפסים שמורים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedForms.map((form) => (
                    <Card
                      key={form.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => loadFormFromDatabase(form)}
                          >
                            <h3 className="font-medium">{form.client_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ת"ז: {form.client_id}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              עודכן: {new Date(form.updated_at).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => loadFormFromDatabase(form)}
                            >
                              טען
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => deleteForm(form.id, form.client_name, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showSummary && (
        <SummaryGenerator formData={formData} onBack={() => setShowSummary(false)} />
      )}
    </div>
  );
};

export default AppForm;