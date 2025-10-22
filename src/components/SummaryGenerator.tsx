import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowDown, ArrowUp, ClipboardList, Copy, Download, Edit3, FileText, Folder, Heart, Mail, MessageCircle, NotebookPen, PieChart, ShieldAlert, Sparkles, Star, Target, Trash2, User, Phone, MapPin, Calendar, Layers, Layout, BarChart3, Share } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/integrations/supabase/client";
import agentLogo from "@/assets/agent-logo.png";
import { SelectedProduct } from "@/types/products";
import { ReportDocument } from "@/components/PDFReport/ReportDocument";

const REPORT_SECTION_KEYS = [
  "personalInfo",
  "executiveSummary",
  "conversationInsights",
  "portfolioComparison",
  "returnsComparison",
  "productDetails",
  "exposureComparison",
  "disclosures",
] as const;

type ReportSectionKey = typeof REPORT_SECTION_KEYS[number];

const DEFAULT_SECTION_ORDER: ReportSectionKey[] = [
  "personalInfo",
  "executiveSummary",
  "conversationInsights",
  "portfolioComparison",
  "returnsComparison",
  "productDetails",
  "exposureComparison",
  "disclosures",
];

const REPORT_SECTIONS_DEFAULT: Record<ReportSectionKey, boolean> = {
  personalInfo: true,
  executiveSummary: true,
  conversationInsights: true,
  portfolioComparison: true,
  returnsComparison: true,
  productDetails: true,
  exposureComparison: true,
  disclosures: true,
};

const REPORT_SECTION_LABELS: Record<ReportSectionKey, { title: string; description: string; icon: LucideIcon; }> = {
  personalInfo: {
    title: "מידע אישי",
    description: "פרטי הלקוח, פרטי קשר ומיקום הפגישה",
    icon: User,
  },
  executiveSummary: {
    title: "תקציר מנהלים",
    description: "תמונה מרוכזת של עיקרי ההמלצות והשינויים",
    icon: BarChart3,
  },
  conversationInsights: {
    title: "פרטים נוספים מהשיחה",
    description: "החלטות, הערות וסיכומים חשובים מהפגישה",
    icon: NotebookPen,
  },
  portfolioComparison: {
    title: "השוואת תיקים",
    description: "השוואה בין המצב הקיים להצעה החדשה",
    icon: Layout,
  },
  returnsComparison: {
    title: "השוואת תשואות",
    description: "ניתוח תשואות מוצרים בתיק הנוכחי והמוצע",
    icon: Target,
  },
  productDetails: {
    title: "פירוט מלא - מוצרים",
    description: "מידע מפורט על המוצרים והמסלולים שנדונו",
    icon: Layers,
  },
  exposureComparison: {
    title: "השוואת חשיפות",
    description: "פירוט חשיפות סיכון ונכסים עיקריים",
    icon: PieChart,
  },
  disclosures: {
    title: "גילוי נאות",
    description: "הבהרות מקצועיות והסברים רגולטוריים",
    icon: ShieldAlert,
  },
};

const CUSTOM_TEMPLATE_STORAGE_KEY = "insurNote-custom-report-templates";

const TEMPLATE_ICON_OPTIONS: Array<{ value: string; label: string; icon: LucideIcon; }> = [
  { value: "star", label: "כוכב", icon: Star },
  { value: "heart", label: "לב", icon: Heart },
  { value: "sparkles", label: "ניצוץ", icon: Sparkles },
  { value: "folder", label: "תיק", icon: Folder },
  { value: "clipboard", label: "רשימה", icon: ClipboardList },
  { value: "target", label: "מטרה", icon: Target },
];

const TEMPLATE_ICONS_MAP: Record<string, LucideIcon> = TEMPLATE_ICON_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

const EXPOSURE_FIELDS = [
  { key: "exposureStocks", label: 'חשיפה למניות' },
  { key: "exposureBonds", label: 'חשיפה לאג"ח' },
  { key: "exposureForeignCurrency", label: 'חשיפה למט"ח' },
  { key: "exposureForeignInvestments", label: 'חשיפה להשקעות חו"ל' },
  { key: "exposureIsrael", label: 'חשיפה לישראל' },
  { key: "exposureIlliquidAssets", label: 'נכסים לא סחירים' },
] as const satisfies ReadonlyArray<{ key: keyof SelectedProduct; label: string }>;

type ExposureKey = typeof EXPOSURE_FIELDS[number]["key"];

interface AgentData {
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface CustomReportTemplate {
  id: string;
  name: string;
  icon: string;
  sections: Record<ReportSectionKey, boolean>;
  sectionOrder: ReportSectionKey[];
  customSectionTitle?: string;
  customSectionContent?: string;
}

interface TemplateFormState {
  id?: string;
  name: string;
  icon: string;
  sections: Record<ReportSectionKey, boolean>;
  sectionOrder: ReportSectionKey[];
  customSectionTitle: string;
  customSectionContent: string;
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
  includeDecisionsInReport: boolean;
  includeProductsTable: boolean;
  includeExposureReport: boolean;
}

interface SummaryGeneratorProps {
  formData: FormData;
  onBack: () => void;
}

const SummaryGenerator = ({ formData, onBack }: SummaryGeneratorProps) => {
  const { toast } = useToast();
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Record<ReportSectionKey, boolean>>(() => {
    const defaultSections = { ...REPORT_SECTIONS_DEFAULT };
    if (formData.isAnonymous) {
      defaultSections.personalInfo = false;
    }
    return defaultSections;
  });
  const [selectedSectionOrder, setSelectedSectionOrder] = useState<ReportSectionKey[]>([...DEFAULT_SECTION_ORDER]);
  const [selectedReportId, setSelectedReportId] = useState<string>("default");
  const [customTemplates, setCustomTemplates] = useState<CustomReportTemplate[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const stored = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as CustomReportTemplate[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter(template => template && typeof template.id === "string" && typeof template.name === "string")
        .map(template => ({
          ...template,
          sections: {
            ...REPORT_SECTION_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<ReportSectionKey, boolean>),
            ...template.sections,
          },
          sectionOrder: template.sectionOrder && template.sectionOrder.length > 0
            ? template.sectionOrder.filter((key): key is ReportSectionKey => REPORT_SECTION_KEYS.includes(key))
            : [...DEFAULT_SECTION_ORDER],
        }));
    } catch (error) {
      console.error("Failed to load custom report templates", error);
      return [];
    }
  });
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [templateFormState, setTemplateFormState] = useState<TemplateFormState | null>(null);
  const [customSectionTitle, setCustomSectionTitle] = useState("");
  const [customSectionContent, setCustomSectionContent] = useState("");
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

  useEffect(() => {
    loadAgentInfo();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    if (formData.isAnonymous) {
      setSelectedSections(prev => ({ ...prev, personalInfo: false }));
    }
  }, [formData.isAnonymous]);

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
      }

      if (riskShiftCount > 0) {
        highlightBullets.push(`בוצעו ${riskShiftCount} התאמות ברמות הסיכון של התיק.`);
      }
    }

    const formatProductLabel = (product: SelectedProduct) => {
      const company = product.company ? ` (${product.company})` : '';
      return `${product.category}${company}`;
    };

    const currentReturnsProducts = currentProducts.filter(product => typeof product.returns === 'number');
    const recommendedReturnsProducts = recommendedProducts.filter(product => typeof product.returns === 'number');

    const avgCurrentReturn = currentReturnsProducts.length > 0
      ? currentReturnsProducts.reduce((sum, product) => sum + (product.returns || 0), 0) / currentReturnsProducts.length
      : null;
    const avgRecommendedReturn = recommendedReturnsProducts.length > 0
      ? recommendedReturnsProducts.reduce((sum, product) => sum + (product.returns || 0), 0) / recommendedReturnsProducts.length
      : null;

    const returnsComparison = {
      current: currentReturnsProducts.map(product => ({
        id: product.id,
        label: formatProductLabel(product),
        track: product.subCategory,
        returns: product.returns ?? null,
      })),
      recommended: recommendedReturnsProducts.map(product => ({
        id: product.id,
        label: formatProductLabel(product),
        track: product.subCategory,
        returns: product.returns ?? null,
      })),
    };

    const buildExposureSummary = (products: SelectedProduct[]) => {
      const summary = {} as Record<ExposureKey, { total: number; count: number }>;
      EXPOSURE_FIELDS.forEach(({ key }) => {
        summary[key] = { total: 0, count: 0 };
      });

      products.forEach(product => {
        EXPOSURE_FIELDS.forEach(({ key }) => {
          const value = product[key];
          if (typeof value === 'number') {
            summary[key].total += value;
            summary[key].count += 1;
          }
        });
      });

      return EXPOSURE_FIELDS.reduce((acc, { key }) => {
        const entry = summary[key];
        acc[key] = entry.count > 0 ? entry.total / entry.count : null;
        return acc;
      }, {} as Record<ExposureKey, number | null>);
    };

    const exposureSummary = {
      current: buildExposureSummary(currentProducts),
      recommended: buildExposureSummary(recommendedProducts),
    };

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
      avgCurrentReturn,
      avgRecommendedReturn,
      returnsComparison,
      exposureSummary,
    };
  }, [formData.products]);

  const selectedSectionTitles = useMemo(
    () => selectedSectionOrder.filter(key => selectedSections[key]).map(key => REPORT_SECTION_LABELS[key].title),
    [selectedSectionOrder, selectedSections]
  );

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

  const resetReportToDefault = () => {
    const defaults = { ...REPORT_SECTIONS_DEFAULT };
    if (formData.isAnonymous) {
      defaults.personalInfo = false;
    }
    setSelectedSections(defaults);
    setSelectedSectionOrder([...DEFAULT_SECTION_ORDER]);
    setSelectedReportId("default");
    setCustomSectionTitle("");
    setCustomSectionContent("");
  };

  const applyTemplateToState = (template: CustomReportTemplate) => {
    const emptyState = REPORT_SECTION_KEYS.reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<ReportSectionKey, boolean>
    );

    const sections = { ...emptyState, ...template.sections };
    if (formData.isAnonymous) {
      sections.personalInfo = false;
    }

    const templateOrder = template.sectionOrder && template.sectionOrder.length > 0
      ? template.sectionOrder.filter((key): key is ReportSectionKey => REPORT_SECTION_KEYS.includes(key))
      : [...DEFAULT_SECTION_ORDER];

    const uniqueOrder = Array.from(new Set(templateOrder));

    setSelectedSections(sections);
    setSelectedSectionOrder(uniqueOrder.length > 0 ? uniqueOrder : [...DEFAULT_SECTION_ORDER]);
    setSelectedReportId(template.id);
    setCustomSectionTitle(template.customSectionTitle || "");
    setCustomSectionContent(template.customSectionContent || "");
  };

  const handleReportTypeSelect = (reportId: string) => {
    if (reportId === "default") {
      resetReportToDefault();
      return;
    }

    const template = customTemplates.find(item => item.id === reportId);
    if (template) {
      applyTemplateToState(template);
    }
  };

  const openTemplateCreation = () => {
    setTemplateFormState({
      name: "",
      icon: TEMPLATE_ICON_OPTIONS[0]?.value ?? "star",
      sections: { ...selectedSections },
      sectionOrder: [...selectedSectionOrder],
      customSectionTitle,
      customSectionContent,
    });
  };

  const openTemplateEditing = (template: CustomReportTemplate) => {
    setTemplateFormState({
      id: template.id,
      name: template.name,
      icon: (template.icon || TEMPLATE_ICON_OPTIONS[0]?.value) ?? "star",
      sections: { ...template.sections },
      sectionOrder: template.sectionOrder && template.sectionOrder.length > 0
        ? template.sectionOrder.filter((key): key is ReportSectionKey => REPORT_SECTION_KEYS.includes(key))
        : [...DEFAULT_SECTION_ORDER],
      customSectionTitle: template.customSectionTitle || "",
      customSectionContent: template.customSectionContent || "",
    });
  };

  const closeTemplateForm = () => {
    setTemplateFormState(null);
  };

  const updateTemplateFormSection = (sectionKey: ReportSectionKey, checked: boolean) => {
    setTemplateFormState(prev => {
      if (!prev) return prev;
      const sections = { ...prev.sections, [sectionKey]: checked };
      let sectionOrder = prev.sectionOrder.filter(key => key !== sectionKey);
      if (checked) {
        sectionOrder = [...sectionOrder, sectionKey];
      }
      return {
        ...prev,
        sections,
        sectionOrder,
      };
    });
  };

  const moveTemplateSection = (sectionKey: ReportSectionKey, direction: "up" | "down") => {
    setTemplateFormState(prev => {
      if (!prev) return prev;
      const order = prev.sectionOrder.filter(key => prev.sections[key]);
      const index = order.indexOf(sectionKey);
      if (index === -1) {
        return prev;
      }
      const newIndex = direction === "up" ? Math.max(0, index - 1) : Math.min(order.length - 1, index + 1);
      if (newIndex === index) {
        return prev;
      }
      const updatedOrder = [...order];
      updatedOrder.splice(index, 1);
      updatedOrder.splice(newIndex, 0, sectionKey);
      return {
        ...prev,
        sectionOrder: updatedOrder,
      };
    });
  };

  const saveTemplateForm = () => {
    if (!templateFormState) return;

    const trimmedName = templateFormState.name.trim();
    if (!trimmedName) {
      toast({
        title: "שם תבנית חסר",
        description: "יש להזין שם עבור הדוח המותאם.",
        variant: "destructive",
      });
      return;
    }

    const activeSections = REPORT_SECTION_KEYS.filter(key => templateFormState.sections[key]);
    if (activeSections.length === 0) {
      toast({
        title: "לא נבחרו חלקים",
        description: "בחר לפחות חלק אחד שיופיע בדוח.",
        variant: "destructive",
      });
      return;
    }

    const normalizedOrder = Array.from(
      new Set(
        (templateFormState.sectionOrder.length > 0 ? templateFormState.sectionOrder : activeSections)
          .filter((key): key is ReportSectionKey => templateFormState.sections[key])
      )
    );

    const templateToSave: CustomReportTemplate = {
      id: templateFormState.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
      name: trimmedName,
      icon: templateFormState.icon,
      sections: REPORT_SECTION_KEYS.reduce((acc, key) => {
        acc[key] = !!templateFormState.sections[key];
        return acc;
      }, {} as Record<ReportSectionKey, boolean>),
      sectionOrder: normalizedOrder.length > 0 ? normalizedOrder : activeSections,
      customSectionTitle: templateFormState.customSectionTitle.trim() || undefined,
      customSectionContent: templateFormState.customSectionContent.trim() || undefined,
    };

    setCustomTemplates(prev => {
      const index = prev.findIndex(item => item.id === templateToSave.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = templateToSave;
        return updated;
      }
      return [...prev, templateToSave];
    });

    applyTemplateToState(templateToSave);
    setTemplateFormState(null);
    setShowManageTemplates(false);
    toast({
      title: "דוח מותאם נשמר",
      description: `הדוח "${trimmedName}" נשמר בהצלחה.`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    setCustomTemplates(prev => prev.filter(template => template.id !== templateId));
    if (selectedReportId === templateId) {
      resetReportToDefault();
    }
    toast({
      title: "דוח הוסר",
      description: "התבנית הוסרה מהרשימה.",
    });
  };

  const generateReactPDF = async (): Promise<Blob> => {
    // עדכון includeExposureData עבור כל המוצרים בהתאם להחלטה הכללית
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
        sectionOrder={selectedSectionOrder}
        additionalNotesText={additionalNotesText}
        disclosureText={disclosureText}
        nextStepsText={nextStepsText}
        customSectionTitle={customSectionTitle}
        customSectionContent={customSectionContent}
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
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


  const sectionComponents: Record<ReportSectionKey, ReactNode> = {
    personalInfo: selectedSections.personalInfo ? (
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
    ) : null,
    executiveSummary: selectedSections.executiveSummary ? (
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
    ) : null,
    conversationInsights: selectedSections.conversationInsights ? (
      <ReportSection sectionKey="conversationInsights" isEditable>
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

          {formData.includeDecisionsInReport !== false && formData.decisions && (
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

          {formData.includeDecisionsInReport !== false && formData.timeframes && (
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
    ) : null,
    portfolioComparison: selectedSections.portfolioComparison ? (
      <ReportSection sectionKey="portfolioComparison">
        <ComparisonSection
          currentProducts={productStats.currentProducts}
          recommendedProducts={productStats.recommendedProducts}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">שווי תיק קיים</p>
            <p className="text-lg font-semibold text-white">₪{productStats.totalCurrentAmount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">שווי תיק מוצע</p>
            <p className="text-lg font-semibold text-white">₪{productStats.totalRecommendedAmount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">פער כספי</p>
            <p className={cn(
              "text-lg font-semibold",
              productStats.amountDifference >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {productStats.amountDifference >= 0 ? '+' : ''}₪{productStats.amountDifference.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">שינוי במספר המוצרים</p>
            <p className={cn(
              "text-lg font-semibold",
              productStats.productCountDifference >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {productStats.productCountDifference >= 0 ? '+' : ''}{productStats.productCountDifference}
            </p>
          </div>
        </div>
      </ReportSection>
    ) : null,
    returnsComparison: selectedSections.returnsComparison ? (
      <ReportSection sectionKey="returnsComparison">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <h4 className="font-semibold text-white mb-2">תיק קיים</h4>
            <p className="text-sm text-gray-300 mb-3">
              תשואה ממוצעת: {typeof productStats.avgCurrentReturn === 'number' ? `${productStats.avgCurrentReturn.toFixed(2)}%` : 'אין נתוני תשואה'}
            </p>
            <div className="space-y-2">
              {productStats.returnsComparison.current.length > 0 ? (
                productStats.returnsComparison.current.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-gray-300 bg-gray-800/60 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium text-white">{item.label}</div>
                      {item.track && <div className="text-xs text-gray-400">מסלול: {item.track}</div>}
                    </div>
                    <div className="text-cyan-300 font-semibold">{typeof item.returns === 'number' ? `${item.returns.toFixed(2)}%` : '—'}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">אין נתוני תשואה להצגה.</div>
              )}
            </div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <h4 className="font-semibold text-white mb-2">תיק מוצע</h4>
            <p className="text-sm text-gray-300 mb-3">
              תשואה ממוצעת: {typeof productStats.avgRecommendedReturn === 'number' ? `${productStats.avgRecommendedReturn.toFixed(2)}%` : 'אין נתוני תשואה'}
            </p>
            <div className="space-y-2">
              {productStats.returnsComparison.recommended.length > 0 ? (
                productStats.returnsComparison.recommended.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-gray-300 bg-gray-800/60 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium text-white">{item.label}</div>
                      {item.track && <div className="text-xs text-gray-400">מסלול: {item.track}</div>}
                    </div>
                    <div className="text-cyan-300 font-semibold">{typeof item.returns === 'number' ? `${item.returns.toFixed(2)}%` : '—'}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">אין נתוני תשואה להצגה.</div>
              )}
            </div>
          </div>
        </div>
      </ReportSection>
    ) : null,
    productDetails: selectedSections.productDetails ? (
      <ReportSection sectionKey="productDetails">
        {productStats.recommendedProducts.length > 0 ? (
          <div className="space-y-3">
            {productStats.recommendedProducts.map((product, index) => (
              <div key={index} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="space-y-2">
                  <div className="font-medium text-cyan-400">
                    {product.category}{product.company ? ` (${product.company})` : ''}
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>מסלול: {product.subCategory}</div>
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
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">לא נבחרו מוצרים להצגה.</div>
        )}
      </ReportSection>
    ) : null,
    exposureComparison: selectedSections.exposureComparison ? (
      <ReportSection sectionKey="exposureComparison">
        {(() => {
          const hasExposureData = EXPOSURE_FIELDS.some(({ key }) =>
            typeof productStats.exposureSummary.current[key] === 'number' || typeof productStats.exposureSummary.recommended[key] === 'number'
          );
          if (!hasExposureData) {
            return <div className="text-sm text-gray-400">אין נתוני חשיפה זמינים למוצרים שנבחרו.</div>;
          }
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="text-gray-400">
                    <th className="px-4 py-2 font-medium text-white">קטגוריית חשיפה</th>
                    <th className="px-4 py-2 font-medium">תיק קיים</th>
                    <th className="px-4 py-2 font-medium">תיק מוצע</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPOSURE_FIELDS.map(({ key, label }) => (
                    <tr key={key} className="border-t border-gray-800">
                      <td className="px-4 py-2 text-gray-200">{label}</td>
                      <td className="px-4 py-2 text-gray-300">
                        {typeof productStats.exposureSummary.current[key] === 'number'
                          ? `${productStats.exposureSummary.current[key]?.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {typeof productStats.exposureSummary.recommended[key] === 'number'
                          ? `${productStats.exposureSummary.recommended[key]?.toFixed(1)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </ReportSection>
    ) : null,
    disclosures: selectedSections.disclosures ? (
      <ReportSection sectionKey="disclosures" isEditable>
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-sm text-gray-300">
            {disclosureText}
          </div>
        </div>
      </ReportSection>
    ) : null,
  };

  const FinalReportContent = () => (
    <div id="final-report-content" className="max-w-4xl mx-auto p-4 sm:p-8 bg-black text-white">
      {/* Header */}
      <div className="text-center mb-8 border-b border-gray-700 pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          {agentData.logo_url ? (
            <img src={agentData.logo_url} alt="לוגו הסוכן" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          ) : (
            <img src={agentLogo} alt="לוגו הסוכן" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              דוח סיכום ביטוח
            </h1>
            <p className="text-base sm:text-lg text-gray-300">{agentData.name}</p>
          </div>
        </div>
        <div className="text-base sm:text-lg text-cyan-400 font-medium">
          {formData.clientName} • {formatDate(formData.meetingDate)}
        </div>
      </div>

      {selectedSectionOrder.map((sectionKey) => (
        <Fragment key={sectionKey}>{sectionComponents[sectionKey]}</Fragment>
      ))}

      {customSectionContent && (
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 mb-6">
          <h3 className="text-xl font-bold text-white mb-3">{customSectionTitle || 'הערה מותאמת אישית'}</h3>
          <div className="text-sm text-gray-300 whitespace-pre-wrap">{customSectionContent}</div>
        </div>
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
          {disclosureText}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplateFormState(null);
                setShowManageTemplates(true);
              }}
            >
              ניהול דוחות
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              key="default-report"
              variant="ghost"
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                selectedReportId === "default"
                  ? "bg-cyan-500 text-white border-cyan-400 shadow"
                  : "bg-cyan-500/10 text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/20"
              )}
              onClick={() => handleReportTypeSelect("default")}
            >
              <Star className="w-4 h-4 ml-2" />
              דוח מלא
            </Button>
            {customTemplates.map((template) => {
              const IconComponent = TEMPLATE_ICONS_MAP[template.icon] || FileText;
              return (
                <Button
                  key={template.id}
                  variant="ghost"
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    selectedReportId === template.id
                      ? "bg-cyan-500 text-white border-cyan-400 shadow"
                      : "bg-cyan-500/10 text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/20"
                  )}
                  onClick={() => handleReportTypeSelect(template.id)}
                >
                  <IconComponent className="w-4 h-4 ml-2" />
                  {template.name}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {selectedSectionTitles.length} מתוך {REPORT_SECTION_KEYS.length} חלקים ייכללו בדוח • {selectedSectionTitles.join(" • ") || "לא נבחרו חלקים"}
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">כותרת לחלק מותאם (אופציונלי)</Label>
              <Input
                value={customSectionTitle}
                onChange={(e) => setCustomSectionTitle(e.target.value)}
                placeholder="לדוגמה: דגשים אישיים"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">תוכן חופשי שייכנס תמיד לדוח</Label>
              <Textarea
                value={customSectionContent}
                onChange={(e) => setCustomSectionContent(e.target.value)}
                placeholder='הקלד כאן טקסט שתרצה שיופיע בכל דו"ח עבור סוג זה.'
                rows={4}
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">הערות נוספות (אופציונלי)</Label>
              <Textarea
                placeholder="הכנס הערות נוספות לדוח..."
                value={additionalNotesText}
                onChange={(e) => setAdditionalNotesText(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">משימות להמשך (אופציונלי)</Label>
              <Textarea
                placeholder="משימות ופעולות המשך..."
                value={nextStepsText}
                onChange={(e) => setNextStepsText(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={downloadReport} className="bg-primary hover:bg-primary-hover">
              <FileText className="w-4 h-4 ml-2" />
              יצירת דוח
            </Button>
          </div>
        </div>

        <Dialog
          open={showManageTemplates}
          onOpenChange={(open) => {
            setShowManageTemplates(open);
            if (!open) {
              setTemplateFormState(null);
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
            {templateFormState ? (
              <>
                <DialogHeader>
                  <DialogTitle>{templateFormState.id ? 'עריכת דוח מותאם' : 'דוח מותאם חדש'}</DialogTitle>
                  <DialogDescription>
                    בחר שם, אייקון והחלקים שיופיעו בדוח המותאם.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>שם הדוח</Label>
                    <Input
                      value={templateFormState.name}
                      onChange={(e) => setTemplateFormState(prev => prev ? { ...prev, name: e.target.value } : prev)}
                      placeholder="לדוגמה: דוח קצר למשקיע"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>אייקון</Label>
                    <Select
                      value={templateFormState.icon}
                      onValueChange={(value) => setTemplateFormState(prev => prev ? { ...prev, icon: value } : prev)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר אייקון" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_ICON_OPTIONS.map(option => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>חלקים בדוח</Label>
                    <div className="space-y-2">
                      {REPORT_SECTION_KEYS.map((sectionKey) => {
                        const section = REPORT_SECTION_LABELS[sectionKey];
                        const IconComponent = section.icon;
                        return (
                          <div
                            key={sectionKey}
                            className={cn(
                              'flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4',
                              templateFormState.sections[sectionKey]
                                ? 'border-cyan-500/40 bg-cyan-500/10'
                                : 'border-gray-800 bg-gray-900/50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-cyan-300" />
                              </div>
                              <div>
                                <div className="font-semibold text-white">{section.title}</div>
                                <div className="text-sm text-gray-400">{section.description}</div>
                              </div>
                            </div>
                            <Checkbox
                              checked={templateFormState.sections[sectionKey]}
                              onCheckedChange={(checked) => updateTemplateFormSection(sectionKey, checked === true)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-white">סדר הופעה</h4>
                      <div className="space-y-2">
                        {templateFormState.sectionOrder.filter(key => templateFormState.sections[key]).map((key) => {
                          const section = REPORT_SECTION_LABELS[key];
                          return (
                            <div key={key} className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 text-sm text-gray-200">
                                <span>{section.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveTemplateSection(key, 'up')}>
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveTemplateSection(key, 'down')}>
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {templateFormState.sectionOrder.filter(key => templateFormState.sections[key]).length === 0 && (
                          <div className="text-sm text-gray-400">בחר לפחות חלק אחד כדי לקבוע סדר.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>קטע טקסט קבוע (אופציונלי)</Label>
                    <Input
                      value={templateFormState.customSectionTitle}
                      onChange={(e) => setTemplateFormState(prev => prev ? { ...prev, customSectionTitle: e.target.value } : prev)}
                      placeholder="כותרת החלק"
                    />
                    <Textarea
                      value={templateFormState.customSectionContent}
                      onChange={(e) => setTemplateFormState(prev => prev ? { ...prev, customSectionContent: e.target.value } : prev)}
                      placeholder='טקסט שיופיע בכל דו"ח שנוצר מתבנית זו'
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={closeTemplateForm} className="flex-1">
                    ביטול
                  </Button>
                  <Button onClick={saveTemplateForm} className="flex-1 bg-primary hover:bg-primary-hover">
                    שמירה
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>ניהול דוחות מותאמים</DialogTitle>
                  <DialogDescription>
                    צור, ערוך או מחק דוחות מותאמים כדי לבחור אותם במהירות בשלב ההתאמה.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {customTemplates.length > 0 ? (
                    customTemplates.map((template) => {
                      const IconComponent = TEMPLATE_ICONS_MAP[template.icon] || FileText;
                      return (
                        <div
                          key={template.id}
                          className="border border-gray-800 rounded-xl p-4 bg-gray-900/50 flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-cyan-300" />
                              </div>
                              <div>
                                <div className="font-semibold text-white">{template.name}</div>
                                <div className="text-xs text-gray-400">
                                  {REPORT_SECTION_KEYS.filter(key => template.sections[key]).map(key => REPORT_SECTION_LABELS[key].title).join(' • ')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <Button size="sm" variant="outline" onClick={() => { applyTemplateToState(template); setShowManageTemplates(false); }}>
                                בחר
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => openTemplateEditing(template)}>
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteTemplate(template.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                          {template.customSectionTitle && (
                            <div className="text-xs text-gray-400">
                              קטע טקסט קבוע: {template.customSectionTitle}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-400 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                      עדיין לא נוצרו דוחות מותאמים. לחץ על "דוח מותאם חדש" כדי להתחיל.
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button variant="outline" onClick={openTemplateCreation} className="flex-1">
                    דוח מותאם חדש
                  </Button>
                  <Button variant="ghost" onClick={() => setShowManageTemplates(false)} className="flex-1">
                    סגירה
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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
          <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto">
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
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => sendReportByEmail()}
                  title="שלח במייל"
                  className="flex-1 sm:flex-none"
                >
                  <Mail className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שלח במייל</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendReportByWhatsApp()}
                  title="שלח בוואטסאפ"
                  className="flex-1 sm:flex-none"
                >
                  <MessageCircle className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שלח בוואטסאפ</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={shareReport}
                  title="שתף"
                  className="flex-1 sm:flex-none"
                >
                  <Share className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">שתף</span>
                </Button>
                <Button 
                  onClick={downloadReport} 
                  title="הורד PDF"
                  className="flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">הורד PDF</span>
                </Button>
              </div>
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