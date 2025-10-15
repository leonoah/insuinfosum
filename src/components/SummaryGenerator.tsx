import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, Shield, Layers, Layout, BarChart3, Sparkles, SlidersHorizontal, FileSpreadsheet, NotebookPen, ShieldAlert, Flag, PieChart, Loader2, FileText, Edit3, Settings, Expand, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/integrations/supabase/client";
import agentLogo from "@/assets/agent-logo.png";
import { SelectedProduct } from "@/types/insurance";
import { ReportDocument } from "@/components/PDFReport/ReportDocument";

const REPORT_SECTION_KEYS = [
  "personalInfo",
  "executiveSummary", 
  "detailedBreakdown",
  "additionalNotes",
  "disclosures",
  "nextSteps",
] as const;

type ReportSectionKey = typeof REPORT_SECTION_KEYS[number];

const REPORT_SECTIONS_DEFAULT: Record<ReportSectionKey, boolean> = {
  personalInfo: true,
  executiveSummary: true,
  detailedBreakdown: true,
  additionalNotes: true,
  disclosures: true,
  nextSteps: true,
};

const REPORT_SECTION_LABELS: Record<ReportSectionKey, { title: string; description: string; icon: any; }> = {
  personalInfo: {
    title: "פרטים אישיים",
    description: "שם הלקוח, פרטי קשר, מיקום ותאריך הפגישה",
    icon: User,
  },
  executiveSummary: {
    title: "תקציר מנהלים",
    description: "תמונה מרוכזת של השינויים המרכזיים בתיק",
    icon: BarChart3,
  },
  detailedBreakdown: {
    title: "פירוט שינויים",
    description: "טבלאות, גרפים והשוואות בין התיק הקיים למוצע",
    icon: PieChart,
  },
  additionalNotes: {
    title: "הרחבות והערות", 
    description: "מצב קיים, סיכונים ותובנות חשובות מהפגישה",
    icon: NotebookPen,
  },
  disclosures: {
    title: "גילוי נאות",
    description: "הבהרות מקצועיות והסברים רגולטוריים",
    icon: ShieldAlert,
  },
  nextSteps: {
    title: "סיכום ומשימות",
    description: "החלטות, משימות להמשך ולוחות זמנים",
    icon: Flag,
  },
};

const REPORT_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  sections: Record<ReportSectionKey, boolean>;
}> = [
  {
    id: "full",
    name: "דוח מלא",
    description: "כולל את כל פרקי הסיכום, הגרפים וההרחבות.",
    sections: { ...REPORT_SECTIONS_DEFAULT },
  },
  {
    id: "executive", 
    name: "תקציר מנהלים",
    description: "ממוקד בשינויים המרכזיים והמלצות על המוצרים.",
    sections: {
      personalInfo: true,
      executiveSummary: true,
      detailedBreakdown: true,
      additionalNotes: false,
      disclosures: true,
      nextSteps: true,
    },
  },
  {
    id: "actions",
    name: "פוקוס משימות",
    description: "מדגיש הערות, גילוי נאות ומשימות המשך ללקוח.",
    sections: {
      personalInfo: true,
      executiveSummary: true,
      detailedBreakdown: false,
      additionalNotes: true,
      disclosures: true,
      nextSteps: true,
    },
  },
];

interface AgentData {
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface FormData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  meetingDate: string;
  meetingLocation?: string;
  topics: string[];
  isAnonymous: boolean;
  currentSituation: string;
  risks: string;
  recommendations: string[];
  estimatedCost: string;
  products: SelectedProduct[];
  decisions: string;
  documents: string[];
  timeframes: string;
  approvals: string;
}

interface SummaryGeneratorProps {
  formData: FormData;
  onBack: () => void;
}

const SummaryGenerator = ({ formData, onBack }: SummaryGeneratorProps) => {
  const { toast } = useToast();
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showSectionsDialog, setShowSectionsDialog] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Record<ReportSectionKey, boolean>>(() => {
    // Disable personalInfo if anonymous
    const defaultSections = { ...REPORT_SECTIONS_DEFAULT };
    if (formData.isAnonymous) {
      defaultSections.personalInfo = false;
    }
    return defaultSections;
  });
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [aiRiskNotes, setAiRiskNotes] = useState<string>("");
  const [isGeneratingRisks, setIsGeneratingRisks] = useState(false);
  const [additionalNotesText, setAdditionalNotesText] = useState("");
  const [disclosureText, setDisclosureText] = useState("הסיכונים הכרוכים בהשקעה כוללים אובדן חלק או כל ההון המושקע. תשואות עבר אינן מבטיחות תשואות עתידיות. יש להתייעץ עם יועץ השקעות מוסמך לפני קבלת החלטה.");
  const [nextStepsText, setNextStepsText] = useState("");
  const [agentData, setAgentData] = useState<AgentData>({
    name: "הסוכן שלכם",
    phone: null,
    email: null,
    logo_url: null
  });
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  
  // Edit mode states for AI-processed texts
  const [editingCurrentSituation, setEditingCurrentSituation] = useState(false);
  const [editingRisks, setEditingRisks] = useState(false);
  const [editingDecisions, setEditingDecisions] = useState(false);
  const [tempCurrentSituation, setTempCurrentSituation] = useState("");
  const [tempRisks, setTempRisks] = useState("");
  const [tempDecisions, setTempDecisions] = useState("");
  const [isQuickSending, setIsQuickSending] = useState(false);

  useEffect(() => {
    loadAgentInfo();
  }, []);

  useEffect(() => {
    try {
      const savedTemplate = localStorage.getItem('insurNote-report-template');
      if (!savedTemplate) return;

      const parsed = JSON.parse(savedTemplate) as {
        sections?: Record<string, boolean>;
        isExpanded?: boolean;
        templateId?: string | null;
      };

      if (parsed.sections) {
        setSelectedSections(prev => ({ ...prev, ...parsed.sections }));
      }
      if (typeof parsed.isExpanded === 'boolean') {
        setIsExpandedMode(parsed.isExpanded);
      }
      if (parsed.templateId) {
        setSelectedTemplateId(parsed.templateId);
      }
    } catch (error) {
      console.error('Error loading saved report template:', error);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Normalize AI HTML output (removes markdown fences and unsafe tags)
  const normalizeAIHtml = (raw: string) => {
    if (!raw) return '';
    let s = raw.trim();
    // Remove triple backticks (```html ... ```)
    s = s.replace(/^```\s*html\s*/i, '').replace(/```\s*$/i, '').trim();
    // Basic sanitization: drop script/style tags
    s = s.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
         .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '');
    // Ensure RTL wrapper for consistent layout
    if (!/dir=\"rtl\"/.test(s)) {
      s = `<div dir="rtl">${s}</div>`;
    }
    return s;
  };

  const productStats = useMemo(() => {
    const currentProducts = (formData.products || []).filter(p => p.type === 'current');
    const recommendedProducts = (formData.products || []).filter(p => p.type === 'recommended');

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
      } else if (accumulationDelta > 0) {
        highlightBullets.push(`דמי הניהול מהצבירה עלו ב-${accumulationDelta.toFixed(2)}% לטובת מסלול בעל פוטנציאל תשואה גבוה יותר.`);
      }

      if (riskShiftCount > 0) {
        highlightBullets.push(`בוצעו ${riskShiftCount} התאמות ברמות הסיכון של התיק.`);
      }
    }

    if (highlightBullets.length === 0) {
      highlightBullets.push('לא זוהו שינויים מהותיים בין התיק הקיים למוצע בשלב זה.');
    }

    return {
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
  }, [formData.products]);

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemName));
      toast({
        title: "הועתק ללוח",
        description: `${itemName} הועתק בהצלחה`,
      });
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemName);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "שגיאה בהעתקה",
        description: "לא ניתן להעתיק את הטקסט",
        variant: "destructive",
      });
    }
  };

  const handleSectionToggle = (sectionKey: ReportSectionKey, checked: boolean) => {
    setSelectedSections(prev => ({ ...prev, [sectionKey]: checked }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedSections(template.sections);
      setSelectedTemplateId(templateId);
    }
  };

  const saveReportTemplate = () => {
    const template = {
      sections: selectedSections,
      isExpanded: isExpandedMode,
      templateId: selectedTemplateId,
    };
    localStorage.setItem('insurNote-report-template', JSON.stringify(template));
    toast({
      title: "תבנית נשמרה",
      description: "הגדרות הדוח נשמרו בהצלחה",
    });
  };

  const generateReactPDF = async (): Promise<Blob> => {
    const blob = await pdf(
      <ReportDocument 
        formData={formData}
        agentData={agentData}
        productStats={productStats}
        selectedSections={selectedSections}
        additionalNotesText={additionalNotesText}
        disclosureText={disclosureText}
        nextStepsText={nextStepsText}
      />
    ).toBlob();
    
    return blob;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string): boolean => {
    // Israeli phone number validation - supports formats like 050-1234567, 0501234567, +972501234567
    const phoneRegex = /^(\+972|0)?[5-9]\d{8}$/;
    const cleanPhone = phone.replace(/[-\s]/g, '');
    return phoneRegex.test(cleanPhone);
  };

  const sendReportByEmail = async (emailAddress?: string) => {
    const targetEmail = emailAddress || formData.clientEmail;
    
    if (!targetEmail || !validateEmail(targetEmail)) {
      setEmailInput(formData.clientEmail || "");
      setShowEmailDialog(true);
      return;
    }

    try {
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
          to: targetEmail,
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
        description: `הדוח נשלח למייל ${targetEmail} עם קובץ PDF מצורף`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    }
  };

  const quickSendReport = async (method: 'email' | 'whatsapp' | 'download' | 'share') => {
    if (isQuickSending) return;
    
    setIsQuickSending(true);
    
    try {
      if (method === 'email') {
        await sendReportByEmail();
      } else if (method === 'whatsapp') {
        await sendReportByWhatsApp();
      } else if (method === 'download') {
        await downloadReport();
      } else if (method === 'share') {
        await shareReport();
      }
    } catch (error) {
      console.error('Quick send error:', error);
    } finally {
      setIsQuickSending(false);
    }
  };

  const sendReportByWhatsApp = async (phoneNumber?: string) => {
    const targetPhone = phoneNumber || formData.clientPhone;
    
    if (!targetPhone || !validatePhone(targetPhone)) {
      setShowPhoneDialog(true);
      return;
    }

    try {
      const pdfBlob = await generateReactPDF();

      // Upload PDF to storage
      const fileName = `reports/סיכום-ביטוח-${formData.clientName}-${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('whatsapp-reports')
        .getPublicUrl(fileName);

      const reportText = `דוח סיכום פגישת ביטוח

לקוח: ${formData.clientName}
תאריך: ${formatDate(formData.meetingDate)}

📄 הדוח המלא זמין להורדה בקישור:
${urlData.publicUrl}

${agentData.name}`;

      // Normalize phone to international format for WhatsApp (E.164 for IL)
      const normalizedDigits = (() => {
        let d = targetPhone.replace(/\D/g, '');
        if (d.startsWith('972')) return d;
        if (d.startsWith('0')) return '972' + d.slice(1);
        return d;
      })();

      const whatsappUrl = `https://wa.me/${normalizedDigits}?text=${encodeURIComponent(reportText)}`;

      // Pre-open to avoid popup blockers, then navigate once ready
      const waWindow = window.open('', '_blank');
      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        // Fallback: open in the same tab if popup was blocked
        window.location.href = whatsappUrl;
      }

      toast({
        title: "הקישור נוצר בהצלחה",
        description: "וואטסאפ נפתח עם הקישור לדוח",
      });
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast({
        title: "שגיאה ביצירת הקישור",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    }
  };

  const shareReport = async () => {
    try {
      const pdfBlob = await generateReactPDF();

      // Upload PDF to storage
      const fileName = `reports/שיתוף-דוח-${formData.clientName}-${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('whatsapp-reports')
        .getPublicUrl(fileName);

      const reportText = `דוח סיכום פגישת ביטוח

לקוח: ${formData.clientName}
תאריך: ${formatDate(formData.meetingDate)}

📄 הדוח המלא זמין להורדה בקישור:
${urlData.publicUrl}

${agentData.name}`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

      window.open(whatsappUrl, '_blank');
        
      toast({
        title: "שיתוף בוואטסאפ",
        description: "וואטסאפ נפתח עם קישור לדוח",
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      toast({
        title: "שגיאה בשיתוף",
        description: "לא ניתן לשתף את הדוח",
        variant: "destructive",
      });
    }
  };


  const downloadReport = async () => {
    try {
      const blob = await generateReactPDF();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `דוח_סיכום_${formData.clientName || 'אנונימי'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "הדוח הורד בהצלחה",
        description: "הקובץ נשמר במחשב שלך",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "שגיאה בהורדת הדוח",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    }
  };

  const startEditingField = (field: 'currentSituation' | 'risks' | 'decisions') => {
    if (field === 'currentSituation') {
      setTempCurrentSituation(formData.currentSituation || '');
      setEditingCurrentSituation(true);
    } else if (field === 'risks') {
      setTempRisks(formData.risks || '');
      setEditingRisks(true);
    } else if (field === 'decisions') {
      setTempDecisions(formData.decisions || '');
      setEditingDecisions(true);
    }
  };

  const saveEditedField = (field: 'currentSituation' | 'risks' | 'decisions') => {
    if (field === 'currentSituation') {
      formData.currentSituation = tempCurrentSituation;
      setEditingCurrentSituation(false);
    } else if (field === 'risks') {
      formData.risks = tempRisks;
      setEditingRisks(false);
    } else if (field === 'decisions') {
      formData.decisions = tempDecisions;
      setEditingDecisions(false);
    }
    
    toast({
      title: "השינוי נשמר",
      description: "הטקסט עודכן בהצלחה",
    });
  };

  const cancelEditingField = (field: 'currentSituation' | 'risks' | 'decisions') => {
    if (field === 'currentSituation') {
      setEditingCurrentSituation(false);
    } else if (field === 'risks') {
      setEditingRisks(false);
    } else if (field === 'decisions') {
      setEditingDecisions(false);
    }
  };

  const ComparisonSection = ({ currentProducts, recommendedProducts }: {
    currentProducts: SelectedProduct[];
    recommendedProducts: SelectedProduct[];
  }) => (
    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
      <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-3">
        <BarChart3 className="w-5 h-5" />
        השוואת תיקים - מצב קיים מול מוצע
      </h4>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-green-500/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-sm text-gray-300">הפרש</div>
            <div className="text-xl font-bold text-green-400">
              ₪{Math.abs(productStats.amountDifference).toLocaleString()}+
            </div>
            <div className="text-xs text-gray-300">מוצרים</div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl border border-blue-500/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-sm text-gray-300">מצב מוצע</div>
            <div className="text-xl font-bold text-blue-400">
              ₪{productStats.totalRecommendedAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-300">{recommendedProducts.length} מוצרים</div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-500/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gray-500/20 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-sm text-gray-300">מצב קיים</div>
            <div className="text-xl font-bold text-gray-400">
              ₪{productStats.totalCurrentAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-300">{currentProducts.length} מוצרים</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-right py-3 px-4 font-medium text-gray-300">קטגוריה</th>
              <th className="text-center py-3 px-4 font-medium text-gray-300">מצב קיים</th>
              <th className="text-center py-3 px-4 font-medium text-gray-300">מצב מוצע</th>
              <th className="text-center py-3 px-4 font-medium text-gray-300">שינוי</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-700/50">
              <td className="py-3 px-4 font-medium">סה"כ צבירה</td>
              <td className="text-center py-3 px-4 text-gray-400">
                ₪{productStats.totalCurrentAmount.toLocaleString()}
              </td>
              <td className="text-center py-3 px-4 text-blue-400">
                ₪{productStats.totalRecommendedAmount.toLocaleString()}
              </td>
              <td className="text-center py-3 px-4">
                <span className={productStats.amountDifference >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {productStats.amountDifference >= 0 ? '+' : ''}₪{productStats.amountDifference.toLocaleString()}
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-700/50">
              <td className="py-3 px-4 font-medium">מספר מוצרים</td>
              <td className="text-center py-3 px-4 text-gray-400">{currentProducts.length}</td>
              <td className="text-center py-3 px-4 text-blue-400">{recommendedProducts.length}</td>
              <td className="text-center py-3 px-4">
                <span className={productStats.productCountDifference >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {productStats.productCountDifference >= 0 ? '+' : ''}{productStats.productCountDifference}
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-700/50">
              <td className="py-3 px-4 font-medium">ממוצע דמי ניהול (הפקדה)</td>
              <td className="text-center py-3 px-4 text-gray-400">{productStats.avgCurrentDeposit.toFixed(2)}%</td>
              <td className="text-center py-3 px-4 text-blue-400">{productStats.avgRecommendedDeposit.toFixed(2)}%</td>
              <td className="text-center py-3 px-4">
                <span className={(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit) <= 0 ? 'text-green-400' : 'text-red-400'}>
                  {(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit) >= 0 ? '+' : ''}{(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit).toFixed(2)}%
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium">ממוצע דמי ניהול (צבירה)</td>
              <td className="text-center py-3 px-4 text-gray-400">{productStats.avgCurrentAccumulation.toFixed(2)}%</td>
              <td className="text-center py-3 px-4 text-blue-400">{productStats.avgRecommendedAccumulation.toFixed(2)}%</td>
              <td className="text-center py-3 px-4">
                <span className={(productStats.avgRecommendedAccumulation - productStats.avgCurrentAccumulation) <= 0 ? 'text-green-400' : 'text-red-400'}>
                  {(productStats.avgRecommendedAccumulation - productStats.avgCurrentAccumulation) >= 0 ? '+' : ''}{(productStats.avgRecommendedAccumulation - productStats.avgCurrentAccumulation).toFixed(2)}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportSection = ({ sectionKey, children, isEditable = false }: {
    sectionKey: ReportSectionKey;
    children: React.ReactNode;
    isEditable?: boolean;
  }) => {
    const section = REPORT_SECTION_LABELS[sectionKey];
    const IconComponent = section.icon;

    return (
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{section.title}</h3>
              <p className="text-sm text-gray-300">{section.description}</p>
            </div>
          </div>
          {isEditable && (
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {children}
      </div>
    );
  };

  const FinalReportContent = () => (
    <div id="final-report-content" className="max-w-4xl mx-auto p-8 bg-black text-white">
      {/* Header */}
      <div className="text-center mb-8 border-b border-gray-700 pb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          {agentData.logo_url ? (
            <img src={agentData.logo_url} alt="לוגו הסוכן" className="w-24 h-24 object-contain" />
          ) : (
            <img src={agentLogo} alt="לוגו הסוכן" className="w-24 h-24 object-contain" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">
              דוח סיכום ביטוח
            </h1>
            <p className="text-lg text-gray-300">{agentData.name}</p>
          </div>
        </div>
        <div className="text-lg text-cyan-400 font-medium">
          {formData.clientName} • {formatDate(formData.meetingDate)}
        </div>
      </div>

      {/* Personal Info Section */}
      {selectedSections.personalInfo && (
        <ReportSection sectionKey="personalInfo">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white">שם הלקוח:</span>
                <span className="text-gray-300">{formData.clientName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white">טלפון:</span>
                <span className="text-gray-300">{formData.clientPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white">אימייל:</span>
                <span className="text-gray-300">{formData.clientEmail || 'לא צויין'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white">תאריך הפגישה:</span>
                <span className="text-gray-300">{formatDate(formData.meetingDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white">מיקום הפגישה:</span>
                <span className="text-gray-300">{formData.meetingLocation || 'לא צויין'}</span>
              </div>
              {formData.topics.length > 0 && (
                <div className="flex items-start gap-3">
                  <Layers className="w-4 h-4 text-cyan-400 mt-1" />
                  <div>
                    <span className="font-medium text-white">נושאים מרכזיים:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-white">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ReportSection>
      )}

      {/* Executive Summary Section */}
      {selectedSections.executiveSummary && (
        <ReportSection sectionKey="executiveSummary">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 p-4 rounded-xl border border-cyan-500/30">
              <h4 className="font-semibold text-cyan-400 mb-3">עיקרי השינויים:</h4>
              <ul className="space-y-2">
                {productStats.highlightBullets.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ReportSection>
      )}

      {/* Detailed Breakdown Section */}
      {selectedSections.detailedBreakdown && (
        <ReportSection sectionKey="detailedBreakdown">
          <ComparisonSection 
            currentProducts={productStats.currentProducts}
            recommendedProducts={productStats.recommendedProducts}
          />
          
          {productStats.recommendedProducts.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-white mb-4">מוצרים מוצעים לשינוי:</h4>
              <div className="space-y-3">
                {productStats.recommendedProducts.map((product, index) => (
                  <div key={index} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="font-medium text-cyan-400">
                          {product.productName} ({product.company})
                        </div>
                        <div className="text-sm text-gray-300">
                          <div>מסלול: {product.subType}</div>
                          <div>סכום צבירה: ₪{product.amount.toLocaleString()}</div>
                          <div>
                            דמי ניהול: {product.managementFeeOnDeposit}% מהפקדה | {product.managementFeeOnAccumulation}% מצבירה
                          </div>
                          {product.investmentTrack && (
                            <div>מסלול השקעה: {product.investmentTrack}</div>
                          )}
                          {product.riskLevelChange && product.riskLevelChange !== 'no-change' && (
                            <div className="text-orange-400">שינוי רמת סיכון: {product.riskLevelChange}</div>
                          )}
                        </div>
                        {product.notes && (
                          <div className="text-sm bg-gray-800/50 p-2 rounded text-gray-300">
                            הערות: {product.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSection>
      )}

      {/* Additional Notes Section */}
      {selectedSections.additionalNotes && (
        <ReportSection sectionKey="additionalNotes" isEditable>
          <div className="space-y-4">
            {formData.currentSituation && (
              <div>
                <h4 className="font-semibold text-white mb-2">המצב הנוכחי:</h4>
                <div className="bg-gray-800/50 p-4 rounded-xl text-sm text-gray-300">
                  {formData.currentSituation}
                </div>
              </div>
            )}
            
            {formData.risks && (
              <div>
                <h4 className="font-semibold text-white mb-2">סיכונים וחשיפות:</h4>
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-gray-300">
                  {formData.risks}
                </div>
              </div>
            )}

            {additionalNotesText && (
              <div>
                <h4 className="font-semibold text-white mb-2">הערות נוספות:</h4>
                <div className="bg-gray-800/50 p-4 rounded-xl text-sm text-gray-300">
                  {additionalNotesText}
                </div>
              </div>
            )}
          </div>
        </ReportSection>
      )}

      {/* Disclosures Section */}
      {selectedSections.disclosures && (
        <ReportSection sectionKey="disclosures" isEditable>
          <div className="bg-gray-800/50 p-4 rounded-xl">
            <div className="text-sm text-gray-300">
              {disclosureText}
            </div>
          </div>
        </ReportSection>
      )}

      {/* Next Steps Section */}
      {selectedSections.nextSteps && (
        <ReportSection sectionKey="nextSteps" isEditable>
          <div className="space-y-4">
            {formData.decisions && (
              <div>
                <h4 className="font-semibold text-white mb-2">החלטות שהתקבלו:</h4>
                <div className="bg-cyan-500/10 p-4 rounded-xl text-sm overflow-x-auto text-gray-300">
                  {(formData.decisions.includes('<') || formData.decisions.includes('```')) ? (
                    <div
                      className="ai-content"
                      dangerouslySetInnerHTML={{ __html: normalizeAIHtml(formData.decisions) }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{formData.decisions}</div>
                  )}
                </div>
              </div>
            )}

            {formData.timeframes && (
              <div>
                <h4 className="font-semibold text-white mb-2">לוחות זמנים:</h4>
                <div className="bg-gray-800/50 p-4 rounded-xl text-sm text-gray-300">
                  {formData.timeframes}
                </div>
              </div>
            )}

            {nextStepsText && (
              <div>
                <h4 className="font-semibold text-white mb-2">משימות להמשך:</h4>
                <div className="bg-gray-800/50 p-4 rounded-xl text-sm text-gray-300">
                  {nextStepsText}
                </div>
              </div>
            )}
          </div>
        </ReportSection>
      )}

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-gray-700">
        <div className="text-sm text-gray-300 mb-2">
          נוצר על ידי {agentData.name}
        </div>
        {agentData.phone && (
          <div className="text-sm text-gray-300">
            טלפון: {agentData.phone}
          </div>
        )}
        {agentData.email && (
          <div className="text-sm text-gray-300">
            אימייל: {agentData.email}
          </div>
        )}
        <div className="mt-4 text-xs text-gray-400">
          דוח זה נוצר בעזרת InMinds
        </div>
        <div className="mt-2 text-xs text-gray-400 leading-relaxed">
          הצהרת אחריות: המידע בדוח זה הינו בגדר המלצה כללית בלבד ואינו מהווה ייעוץ פיננסי/ביטוחי אישי. קבלת החלטות תיעשה באחריות הלקוח לאחר בחינת צרכיו ומצבו. הסוכן והחברה לא יישאו באחריות לנזקים שייגרמו משימוש במידע זה.
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass p-6 rounded-2xl border border-glass-border mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                דוח סיכום פגישת ביטוח
              </h1>
              <p className="text-muted-foreground">
                {formData.clientName} • {formatDate(formData.meetingDate)}
              </p>
            </div>
            <Button onClick={onBack} variant="outline">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה
            </Button>
          </div>
        </div>

        {/* Report Customization */}
        <div className="glass p-6 rounded-2xl border border-glass-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">התאמת הדוח</h2>
            <div className="flex gap-2">
              <Button
                variant={isExpandedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExpandedMode(!isExpandedMode)}
              >
                <SlidersHorizontal className="w-4 h-4 ml-2" />
                דוח מורחב
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSectionsDialog(true)}
              >
                <Settings className="w-4 h-4 ml-2" />
                הגדרות
              </Button>
            </div>
          </div>

          {isExpandedMode && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {REPORT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-glass-border bg-muted/20 hover:bg-muted/30'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <h3 className="font-medium text-foreground mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {Object.values(selectedSections).filter(Boolean).length} מתוך {REPORT_SECTION_KEYS.length} חלקים נבחרו
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveReportTemplate}>
                שמירת תבנית
              </Button>
              <Button onClick={downloadReport} className="bg-primary hover:bg-primary-hover">
                <FileText className="w-4 h-4 ml-2" />
                יצירת דוח
              </Button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-glass-border">
            <div className="text-sm text-muted-foreground mb-3">פעולות מהירות:</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={isQuickSending}
                onClick={() => quickSendReport('email')}
                title="שלח במייל"
              >
                {isQuickSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 sm:ml-2" />}
                <span className="hidden sm:inline">שלח במייל</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isQuickSending}
                onClick={() => quickSendReport('whatsapp')}
                title="שלח בוואטסאפ"
              >
                {isQuickSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <MessageCircle className="w-4 h-4 sm:ml-2" />}
                <span className="hidden sm:inline">שלח בוואטסאפ</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isQuickSending}
                onClick={() => quickSendReport('share')}
                title="שתף"
              >
                {isQuickSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Share className="w-4 h-4 sm:ml-2" />}
                <span className="hidden sm:inline">שתף</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isQuickSending}
                onClick={() => quickSendReport('download')}
                title="הורד PDF"
              >
                {isQuickSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 sm:ml-2" />}
                <span className="hidden sm:inline">הורד PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {!showFinalReport && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-glass-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">תצוגה מקדימה</h2>
              <div className="bg-muted/20 p-4 rounded-xl">
                <ComparisonSection 
                  currentProducts={productStats.currentProducts}
                  recommendedProducts={productStats.recommendedProducts}
                />
                {/* החלטות, לוחות זמנים, מסמכים, אישורים */}
                <div className="mt-8 space-y-4">
                  {formData.currentSituation && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">מצב קיים בקצרה:</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingField('currentSituation')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      {editingCurrentSituation ? (
                        <div className="space-y-2">
                          <Textarea
                            value={tempCurrentSituation}
                            onChange={(e) => setTempCurrentSituation(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="ערוך את המצב הקיים..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditedField('currentSituation')}>
                              שמור
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEditingField('currentSituation')}>
                              ביטול
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/30 p-4 rounded-xl text-sm">
                          {formData.currentSituation}
                        </div>
                      )}
                    </div>
                  )}
                  {formData.risks && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">פערים / סיכונים שהודגשו:</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingField('risks')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      {editingRisks ? (
                        <div className="space-y-2">
                          <Textarea
                            value={tempRisks}
                            onChange={(e) => setTempRisks(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="ערוך את הסיכונים והפערים..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditedField('risks')}>
                              שמור
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEditingField('risks')}>
                              ביטול
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl text-sm">
                          {formData.risks}
                        </div>
                      )}
                    </div>
                  )}
                  {formData.decisions && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">החלטות שהתקבלו:</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingField('decisions')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      {editingDecisions ? (
                        <div className="space-y-2">
                          <Textarea
                            value={tempDecisions}
                            onChange={(e) => setTempDecisions(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="ערוך את ההחלטות שהתקבלו..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditedField('decisions')}>
                              שמור
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEditingField('decisions')}>
                              ביטול
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-primary/10 p-4 rounded-xl text-sm overflow-x-auto">
                          {(formData.decisions.includes('<') || formData.decisions.includes('```')) ? (
                            <div
                              className="ai-content"
                              dangerouslySetInnerHTML={{ __html: normalizeAIHtml(formData.decisions) }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">{formData.decisions}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {formData.timeframes && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">לוחות זמנים:</h4>
                      <div className="bg-muted/30 p-4 rounded-xl text-sm">
                        {formData.timeframes}
                      </div>
                    </div>
                  )}
                  {formData.documents && formData.documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">מסמכים/פעולות להשלמה:</h4>
                      <ul className="list-disc pr-6 text-sm">
                        {formData.documents.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {formData.approvals && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">אישורים/חתימות נדרשות:</h4>
                      <div className="bg-muted/30 p-4 rounded-xl text-sm">
                        {formData.approvals}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Report Dialog */}
        <Dialog open={showFinalReport} onOpenChange={setShowFinalReport}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>דוח סיכום פגישת ביטוח</DialogTitle>
              <DialogDescription>
                דוח מלא ועיצוב מקצועי להורדה
              </DialogDescription>
            </DialogHeader>
            <FinalReportContent />
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowFinalReport(false)}>
                סגור
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => sendReportByEmail()}
                  title="שלח במייל"
                >
                  <Mail className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שלח במייל</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendReportByWhatsApp()}
                  title="שלח בוואטסאפ"
                >
                  <MessageCircle className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שלח בוואטסאפ</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={shareReport}
                  title="שתף"
                >
                  <Share className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שתף</span>
                </Button>
                <Button onClick={downloadReport} title="הורד PDF">
                  <Download className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">הורד PDF</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sections Configuration Dialog */}
        <Dialog open={showSectionsDialog} onOpenChange={setShowSectionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>התאמת חלקי הדוח</DialogTitle>
              <DialogDescription>
                בחר אילו חלקים להכליל בדוח הסופי
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {REPORT_SECTION_KEYS.map((sectionKey) => {
                const section = REPORT_SECTION_LABELS[sectionKey];
                const isPersonalInfoDisabled = sectionKey === 'personalInfo' && formData.isAnonymous;
                return (
                  <div key={sectionKey} className="flex items-start space-x-3 space-x-reverse">
                    <Checkbox
                      id={sectionKey}
                      checked={selectedSections[sectionKey]}
                      disabled={isPersonalInfoDisabled}
                      onCheckedChange={(checked) => 
                        handleSectionToggle(sectionKey, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={sectionKey} className={`font-medium ${isPersonalInfoDisabled ? 'text-muted-foreground' : ''}`}>
                        {section.title}
                        {isPersonalInfoDisabled && <span className="text-xs text-muted-foreground mr-2">(מבוטל - דוח אנונימי)</span>}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">הערות נוספות (אופציונלי):</Label>
              <Textarea
                placeholder="הכנס הערות נוספות לדוח..."
                value={additionalNotesText}
                onChange={(e) => setAdditionalNotesText(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">משימות להמשך (אופציונלי):</Label>
              <Textarea
                placeholder="משימות ופעולות המשך..."
                value={nextStepsText}
                onChange={(e) => setNextStepsText(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionsDialog(false)}>
                ביטול
              </Button>
              <Button onClick={() => setShowSectionsDialog(false)}>
                שמור הגדרות
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Input Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הכנס כתובת מייל</DialogTitle>
              <DialogDescription>
                אנא הכנס כתובת מייל תקינה לשליחת הדוח
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Label htmlFor="email-input">כתובת מייל:</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="example@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="text-left"
                dir="ltr"
              />
              {emailInput && !validateEmail(emailInput) && (
                <p className="text-sm text-red-500">כתובת המייל אינה תקינה</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                ביטול
              </Button>
              <Button 
                onClick={() => {
                  if (validateEmail(emailInput)) {
                    setShowEmailDialog(false);
                    sendReportByEmail(emailInput.trim());
                  }
                }}
                disabled={!emailInput || !validateEmail(emailInput)}
              >
                שלח דוח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phone Input Dialog */}
        <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הכנס מספר טלפון</DialogTitle>
              <DialogDescription>
                אנא הכנס מספר טלפון תקין לשליחת הדוח בוואטסאפ
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Label htmlFor="phone-input">מספר טלפון:</Label>
              <Input
                id="phone-input"
                type="tel"
                placeholder="050-1234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="text-left"
                dir="ltr"
              />
              {phoneInput && !validatePhone(phoneInput) && (
                <p className="text-sm text-red-500">מספר הטלפון אינו תקין</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
                ביטול
              </Button>
              <Button 
                onClick={() => {
                  if (validatePhone(phoneInput)) {
                    setShowPhoneDialog(false);
                    sendReportByWhatsApp(phoneInput.trim());
                  }
                }}
                disabled={!phoneInput || !validatePhone(phoneInput)}
              >
                שלח דוח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SummaryGenerator;