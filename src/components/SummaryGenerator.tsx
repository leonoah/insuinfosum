import { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, Shield, Layers, Layout, BarChart3, Sparkles, SlidersHorizontal, FileSpreadsheet, NotebookPen, ShieldAlert, Flag, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import agentLogo from "@/assets/agent-logo.png";
import BlocksSidebar from "./blocks/BlocksSidebar";
import BlockRenderer from "./blocks/BlockRenderer";
import { BlockTemplate, DocumentBlock } from "@/types/blocks";
import { blockTemplates, documentTemplates } from "@/data/blockTemplates";
import { SelectedProduct } from "@/types/insurance";

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

const REPORT_SECTION_LABELS: Record<ReportSectionKey, { title: string; description: string; }> = {
  personalInfo: {
    title: "פרטים אישיים",
    description: "שם הלקוח, פרטי קשר, מיקום ותאריך הפגישה",
  },
  executiveSummary: {
    title: "תקציר מנהלים",
    description: "תמונה מרוכזת של השינויים המרכזיים בתיק",
  },
  detailedBreakdown: {
    title: "פירוט שינויים",
    description: "טבלאות, גרפים והשוואות בין התיק הקיים למוצע",
  },
  additionalNotes: {
    title: "הרחבות והערות",
    description: "מצב קיים, סיכונים ותובנות חשובות מהפגישה",
  },
  disclosures: {
    title: "גילוי נאות",
    description: "הבהרות מקצועיות והסברים רגולטוריים",
  },
  nextSteps: {
    title: "סיכום ומשימות",
    description: "החלטות, משימות להמשך ולוחות זמנים",
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
  const [viewMode, setViewMode] = useState<'classic' | 'blocks'>('classic');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showSectionsDialog, setShowSectionsDialog] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Record<ReportSectionKey, boolean>>({ ...REPORT_SECTIONS_DEFAULT });
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<AgentData>({
    name: "הסוכן שלכם",
    phone: null,
    email: null,
    logo_url: null
  });

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
        .limit(1)
        .single();

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

  const stripHtml = (value: string) => {
    if (!value) return "";
    return value
      .replace(/<br\s*\/?>(?=\s)/gi, '\n')
      .replace(/<br\s*\/?>(?!\s)/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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

    const depositScale = Math.max(avgCurrentDeposit, avgRecommendedDeposit, 0.1);
    const accumulationScale = Math.max(avgCurrentAccumulation, avgRecommendedAccumulation, 0.1);

    const depositCurrentBar = depositScale ? Math.round((avgCurrentDeposit / depositScale) * 100) : 0;
    const depositRecommendedBar = depositScale ? Math.round((avgRecommendedDeposit / depositScale) * 100) : 0;
    const accumulationCurrentBar = accumulationScale ? Math.round((avgCurrentAccumulation / accumulationScale) * 100) : 0;
    const accumulationRecommendedBar = accumulationScale ? Math.round((avgRecommendedAccumulation / accumulationScale) * 100) : 0;

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
      depositCurrentBar,
      depositRecommendedBar,
      accumulationCurrentBar,
      accumulationRecommendedBar,
      riskShiftCount,
      highlightBullets,
    };
  }, [formData.products]);

  const sanitizedDecisions = useMemo(() => {
    return stripHtml(formData.decisions || "");
  }, [formData.decisions]);

  const decisionsList = useMemo(() => {
    return sanitizedDecisions
      ? sanitizedDecisions.split('\n').map(item => item.trim()).filter(Boolean)
      : [];
  }, [sanitizedDecisions]);

  const validRecommendations = useMemo(() => {
    return formData.recommendations.filter(rec => rec && rec.trim());
  }, [formData.recommendations]);

  const generateSummaryText = (config?: Record<ReportSectionKey, boolean>) => {
    const appliedConfig = config ?? (isExpandedMode ? selectedSections : REPORT_SECTIONS_DEFAULT);
    const lines: string[] = [];
    const locationDisplay = formData.meetingLocation?.trim() ? formData.meetingLocation.trim() : 'לא צויין (ניתן לעדכן)';

    lines.push(`נושא: דוח בחינת מוצרים – ${formData.clientName} – ${formatDate(formData.meetingDate)}`);
    lines.push('');
    lines.push(`שלום ${formData.clientName},`);
    lines.push('');
    lines.push('להלן הדוח המסכם את שלב בחינת המוצרים וההמלצות שסיכמנו בפגישה:');
    lines.push('');

    if (appliedConfig.personalInfo) {
      lines.push('שלב 1 – פרטים אישיים והקשר הפגישה:');
      lines.push(`• שם הלקוח: ${formData.clientName}`);
      lines.push(`• טלפון: ${formData.clientPhone}`);
      lines.push(`• אימייל: ${formData.clientEmail || 'לא צויין'}`);
      lines.push(`• תאריך השיחה: ${formatDate(formData.meetingDate)}`);
      lines.push(`• מיקום/אופי הפגישה: ${locationDisplay}`);
      if (formData.topics.length > 0) {
        lines.push(`• נושאים מרכזיים: ${formData.topics.join(', ')}`);
      }
      lines.push('');
    }

    if (appliedConfig.executiveSummary) {
      lines.push('שלב 2 – תקציר מנהלים של בחירת המוצרים:');
      productStats.highlightBullets.forEach(highlight => {
        lines.push(`• ${highlight}`);
      });
      lines.push('');
    }

    if (appliedConfig.detailedBreakdown) {
      lines.push('שלב 3 – פירוט מלא של השינויים:');
      lines.push(`• סך צבירה במצב קיים: ₪${productStats.totalCurrentAmount.toLocaleString()}`);
      lines.push(`• סך צבירה במצב מוצע: ₪${productStats.totalRecommendedAmount.toLocaleString()}`);
      const diffSign = productStats.amountDifference >= 0 ? '+' : '-';
      lines.push(`• שינוי מצטבר: ${diffSign}₪${Math.abs(productStats.amountDifference).toLocaleString()}`);
      lines.push(`• כמות מוצרים: ${productStats.currentProducts.length} קיימים לעומת ${productStats.recommendedProducts.length} מוצעים`);
      lines.push(`• דמי ניהול מהפקדה: ${productStats.avgCurrentDeposit.toFixed(2)}% ➜ ${productStats.avgRecommendedDeposit.toFixed(2)}%`);
      lines.push(`• דמי ניהול מצבירה: ${productStats.avgCurrentAccumulation.toFixed(2)}% ➜ ${productStats.avgRecommendedAccumulation.toFixed(2)}%`);
      if (productStats.riskShiftCount > 0) {
        lines.push(`• התאמות רמת סיכון: ${productStats.riskShiftCount}`);
      }

      if (productStats.recommendedProducts.length > 0) {
        lines.push('• מוצרים מוצעים לשינוי:');
        productStats.recommendedProducts.forEach((product, index) => {
          lines.push(`  ${index + 1}. ${product.productName} (${product.company})`);
          lines.push(`     - מסלול: ${product.subType}`);
          lines.push(`     - סכום צבירה: ₪${product.amount.toLocaleString()}`);
          lines.push(`     - דמי ניהול: ${product.managementFeeOnDeposit}% מהפקדה | ${product.managementFeeOnAccumulation}% מצבירה`);
          if (product.investmentTrack) {
            lines.push(`     - מסלול השקעה: ${product.investmentTrack}`);
          }
          if (product.riskLevelChange && product.riskLevelChange !== 'no-change') {
            lines.push(`     - שינוי רמת סיכון: ${product.riskLevelChange}`);
          }
          if (product.notes) {
            lines.push(`     - הערות נוספות: ${product.notes}`);
          }
        });
      }

      if (productStats.currentProducts.length > 0) {
        lines.push('• מוצרים קיימים שנבדקו:');
        productStats.currentProducts.forEach((product, index) => {
          lines.push(`  ${index + 1}. ${product.productName} (${product.company}) – ₪${product.amount.toLocaleString()}`);
        });
      }

      lines.push('');
    }

    if (appliedConfig.additionalNotes) {
      lines.push('שלב 4 – הרחבות, הערות ותובנות:');
      if (formData.currentSituation) {
        lines.push(`• מצב קיים בקצרה: ${formData.currentSituation}`);
      }
      if (formData.risks) {
        lines.push(`• פערים או סיכונים שזוהו: ${formData.risks}`);
      }
      if (validRecommendations.length > 0) {
        lines.push('• המלצות המשך:');
        validRecommendations.forEach(rec => lines.push(`  - ${rec}`));
      }
      if (formData.estimatedCost) {
        lines.push(`• הערכת עלות משוערת: ${formData.estimatedCost}`);
      }
      lines.push('');
    }

    if (appliedConfig.disclosures) {
      lines.push('שלב 5 – גילוי נאות:');
      lines.push('• ההמלצות מבוססות על הנתונים שסופקו ועל מידע עדכני מהגופים המוסדיים.');
      lines.push('• ייתכנו שינויים במדיניות ההשקעה או בדמי הניהול מצד החברות לאחר מועד הפגישה.');
      lines.push('• יש לוודא שהמידע במסמך תואם את הצרכים האישיים והעדפות הסיכון של הלקוח.');
      lines.push('');
    }

    if (appliedConfig.nextSteps) {
      lines.push('שלב 6 – סיכום ומשימות להמשך:');
      if (decisionsList.length > 0) {
        lines.push('• החלטות שהתקבלו:');
        decisionsList.forEach(item => lines.push(`  - ${item}`));
      }
      if (formData.documents.length > 0) {
        lines.push('• מסמכים/אישורים לאיסוף:');
        formData.documents.forEach(doc => lines.push(`  - ${doc}`));
      }
      if (formData.timeframes) {
        lines.push(`• לוחות זמנים לביצוע: ${formData.timeframes}`);
      }
      if (formData.approvals) {
        lines.push(`• אישורים נדרשים: ${formData.approvals}`);
      }
      lines.push('');
    }

    lines.push('בברכה,');
    lines.push(agentData.name);
    if (agentData.phone) {
      lines.push(`טלפון: ${agentData.phone}`);
    }
    if (agentData.email) {
      lines.push(`אימייל: ${agentData.email}`);
    }

    return lines.join('\n');
  };

  const handleSectionToggle = (key: ReportSectionKey, checked: boolean | "indeterminate") => {
    const value = checked === true;
    setSelectedSections(prev => ({ ...prev, [key]: value }));
    setSelectedTemplateId('custom');
  };

  const applyTemplate = (templateId: string) => {
    if (templateId === 'custom') {
      setSelectedTemplateId('custom');
      setIsExpandedMode(true);
      return;
    }

    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setSelectedSections({ ...REPORT_SECTIONS_DEFAULT, ...template.sections });
    setSelectedTemplateId(templateId);
    setIsExpandedMode(true);
  };

  const resetSectionsToDefault = () => {
    setSelectedSections({ ...REPORT_SECTIONS_DEFAULT });
    setIsExpandedMode(false);
    setSelectedTemplateId(null);
    localStorage.removeItem('insurNote-report-template');

    toast({
      title: "הגדרות אופסו",
      description: "הדוח חזר לתצוגת ברירת המחדל.",
    });
  };

  const handleSaveTemplate = () => {
    try {
      localStorage.setItem('insurNote-report-template', JSON.stringify({
        sections: selectedSections,
        isExpanded: isExpandedMode,
        templateId: selectedTemplateId,
      }));

      toast({
        title: "התבנית נשמרה",
        description: "הגדרות הדוח המורחב ישמרו לשימוש הבא.",
      });
      setShowSectionsDialog(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לשמור את התבנית.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
      
      toast({
        title: "הועתק ללוח",
        description: "הטקסט הועתק בהצלחה",
      });
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק ללוח",
        variant: "destructive"
      });
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`סיכום פגישת ביטוח – ${formData.clientName} – ${formatDate(formData.meetingDate)}`);
    const body = encodeURIComponent(generateSummaryText());
    const mailtoLink = `mailto:${formData.clientEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    const whatsappLink = `https://wa.me/?text=${text}`;
    window.open(whatsappLink, '_blank');
  };

  const downloadPDF = async () => {
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.width = '900px';
      container.style.padding = '40px';
      container.style.background = 'transparent';
      container.style.zIndex = '-1';
      container.setAttribute('dir', 'rtl');

      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        <div className="w-[820px] max-w-[820px] rounded-[32px] bg-white text-right text-slate-900 shadow-2xl" dir="rtl">
          <div className="rounded-t-[32px] bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-10 text-white">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium text-white/80">דוח בחירת מוצרים</p>
                  <h1 className="text-3xl font-bold">{formData.clientName || 'ללא שם'}</h1>
                  <p className="text-sm text-white/90">
                    {formatDate(formData.meetingDate)} {locationDisplay ? `| ${locationDisplay}` : ''}
                  </p>
                </div>
                {agentData?.logo_url ? (
                  <img
                    src={agentData.logo_url}
                    alt="לוגו הסוכן"
                    className="h-16 w-16 rounded-full border border-white/40 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/20 text-2xl font-semibold">
                    {(agentData?.name || 'הסוכן שלכם').charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/80">
                <span>סוכן מלווה: {agentData?.name || 'הסוכן שלכם'}</span>
                {agentData?.phone && <span>טלפון: {agentData.phone}</span>}
                {agentData?.email && <span>אימייל: {agentData.email}</span>}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-10">
            {renderReportSections('modal')}
          </div>

          <div className="rounded-b-[32px] bg-slate-900 p-8 text-slate-100">
            <h2 className="text-xl font-semibold">סיכום ותודה</h2>
            <p className="mt-2 text-sm text-slate-300">
              נשמח להמשיך וללוות אותך בכל שאלה או בקשה נוספת.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <span>הוכן על ידי {agentData?.name || 'הסוכן שלכם'}</span>
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      );

      await new Promise(resolve => setTimeout(resolve, 300));

      const captureElement = (container.firstElementChild as HTMLElement) ?? container;
      const canvas = await html2canvas(captureElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      root.unmount();
      document.body.removeChild(container);

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;
      let heightLeft = imgHeight - pageHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`דוח_${formData.clientName}_${formData.meetingDate}.pdf`);

      toast({
        title: "PDF נוצר בהצלחה",
        description: "הדוח הופק בהתאם לעיצוב החדש",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את קובץ ה-PDF",
        variant: "destructive"
      });
    }
  };

  // Block management functions
  const generateBlockId = () => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addBlock = (template: BlockTemplate, variant?: string) => {
    const selectedVariant = (variant && ['short', 'full', 'technical'].includes(variant)) 
      ? variant as 'short' | 'full' | 'technical'
      : template.defaultVariant;
      
    const newBlock: DocumentBlock = {
      id: generateBlockId(),
      type: template.type,
      title: template.title,
      content: template.variants[selectedVariant] || template.variants[template.defaultVariant],
      variant: selectedVariant,
      position: blocks.length,
      editable: true
    };

    setBlocks(prev => [...prev, newBlock]);
    
    toast({
      title: "בלוק נוסף",
      description: `${template.title} נוסף למסמך`,
    });
  };

  const loadTemplate = (templateKey: string) => {
    const template = documentTemplates[templateKey as keyof typeof documentTemplates];
    if (!template) return;

    const newBlocks: DocumentBlock[] = template.blocks.map((blockId, index) => {
      const blockTemplate = blockTemplates.find(t => t.id === blockId);
      if (!blockTemplate) return null;

      return {
        id: generateBlockId(),
        type: blockTemplate.type,
        title: blockTemplate.title,
        content: blockTemplate.variants[blockTemplate.defaultVariant],
        variant: blockTemplate.defaultVariant,
        position: index,
        editable: true
      };
    }).filter(Boolean) as DocumentBlock[];

    setBlocks(newBlocks);
    setViewMode('blocks');
    
    toast({
      title: "טמפלט נטען",
      description: `${template.name} נטען בהצלחה`,
    });
  };

  const editBlock = (blockId: string, content: any) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    toast({
      title: "בלוק נמחק",
      description: "הבלוק הוסר מהמסמך",
    });
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const index = prev.findIndex(block => block.id === blockId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      
      return newBlocks.map((block, i) => ({ ...block, position: i }));
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle drop from sidebar
    if (typeof active.id === 'string' && active.id.startsWith('sidebar-')) {
      try {
        const data = active.data.current;
        if (data?.template && data?.variant) {
          addBlock(data.template, data.variant);
        }
      } catch (error) {
        console.error('Error handling drag from sidebar:', error);
      }
      setActiveId(null);
      return;
    }

    // Handle reordering
    if (active.id !== over.id) {
      setBlocks((blocks) => {
        const oldIndex = blocks.findIndex(block => block.id === active.id);
        const newIndex = blocks.findIndex(block => block.id === over.id);
        
        return arrayMove(blocks, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  // Sortable Block Component
  const SortableBlock = ({ block }: { block: DocumentBlock }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: block.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <BlockRenderer
          block={block}
          onEdit={editBlock}
          onDelete={deleteBlock}
          onMove={moveBlock}
          isDragging={isDragging}
        />
      </div>
    );
  };

  const effectiveSections = isExpandedMode ? selectedSections : REPORT_SECTIONS_DEFAULT;
  const summaryText = generateSummaryText(effectiveSections);
  const templateValue = selectedTemplateId ?? (isExpandedMode ? 'custom' : 'full');
  const locationDisplay = formData.meetingLocation?.trim() ? formData.meetingLocation.trim() : 'לא צויין';
  const amountDifference = productStats.amountDifference;
  const depositDelta = productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit;
  const accumulationDelta = productStats.avgRecommendedAccumulation - productStats.avgCurrentAccumulation;


  const renderReportSections = (mode: 'inline' | 'modal' = 'inline') => (

                <div className={mode === 'modal' ? 'space-y-8 text-right' : 'space-y-6'}>
                  {effectiveSections.personalInfo && (
                    <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/60 p-6 shadow-inner">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-blue-900">
                          <User className="h-5 w-5" />
                          <h3 className="text-xl font-bold">שלב 1: פרטים אישיים</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full border-blue-200 bg-white/80 text-blue-700">
                            {formatDate(formData.meetingDate)}
                          </Badge>
                          <Badge variant="secondary" className="rounded-full border-blue-200 bg-blue-600/10 text-blue-700">
                            {isExpandedMode ? 'מצב מורחב פעיל' : 'תצוגה מלאה'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid gap-4 text-right md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-blue-500">שם הלקוח</span>
                            <User className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-lg font-semibold text-blue-900">{formData.clientName || 'לא צויין'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-blue-500">טלפון</span>
                            <Phone className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-lg font-semibold text-blue-900">{formData.clientPhone || 'לא צויין'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-blue-500">אימייל</span>
                            <Mail className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-lg font-semibold text-blue-900">{formData.clientEmail || 'לא צויין'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-blue-500">מיקום הפגישה</span>
                            <MapPin className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-lg font-semibold text-blue-900">{locationDisplay}</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-blue-500">סוכן מלווה</span>
                            <Shield className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-lg font-semibold text-blue-900">{agentData?.name || 'הסוכן שלכם'}</p>
                          {agentData?.phone && (
                            <p className="text-sm text-blue-700">{agentData.phone}</p>
                          )}
                        </div>
                      </div>
                      {formData.topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {formData.topics.map((topic) => (
                            <Badge key={topic} className="rounded-full border-blue-200 bg-blue-600/10 px-4 py-1 text-blue-800">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {effectiveSections.executiveSummary && (
                    <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-100/50 p-6 shadow-inner">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-900">
                          <Sparkles className="h-5 w-5" />
                          <h3 className="text-xl font-bold">שלב 2: תקציר מנהלים – בחירת המוצרים</h3>
                        </div>
                        <Badge variant="outline" className="rounded-full border-amber-200 bg-white/80 text-amber-700">
                          שינויים מרכזיים
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-amber-600">סה״כ צבירה</p>
                          <p className="mt-2 text-lg font-bold text-amber-900">
                            ₪{productStats.totalCurrentAmount.toLocaleString()} → ₪{productStats.totalRecommendedAmount.toLocaleString()}
                          </p>
                          <p className={`text-sm font-semibold ${amountDifference > 0 ? 'text-green-600' : amountDifference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {amountDifference === 0 ? 'ללא שינוי' : `${amountDifference > 0 ? '+' : '-'}₪${Math.abs(amountDifference).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-amber-600">מספר מוצרים</p>
                          <p className="mt-2 text-lg font-bold text-amber-900">
                            {productStats.currentProducts.length} → {productStats.recommendedProducts.length}
                          </p>
                          <p className={`text-sm font-semibold ${productStats.productCountDifference > 0 ? 'text-green-600' : productStats.productCountDifference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {productStats.productCountDifference === 0 ? 'ללא שינוי' : `${productStats.productCountDifference > 0 ? '+' : ''}${productStats.productCountDifference}`}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-amber-600">דמי ניהול ממוצעים</p>
                          <p className="mt-2 text-lg font-bold text-amber-900">
                            {productStats.avgCurrentDeposit.toFixed(2)}% → {productStats.avgRecommendedDeposit.toFixed(2)}%
                          </p>
                          <p className={`text-sm font-semibold ${depositDelta < 0 ? 'text-green-600' : depositDelta > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {depositDelta === 0 ? 'ללא שינוי בדמי ניהול' : depositDelta < 0 ? `הפחתה של ${Math.abs(depositDelta).toFixed(2)}%` : `עלייה של ${depositDelta.toFixed(2)}%`}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-6 space-y-2 text-right">
                        {productStats.highlightBullets.map((highlight, index) => (
                          <li key={index} className="flex items-start justify-end gap-2 text-sm text-amber-900">
                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {effectiveSections.detailedBreakdown && (
                    <section className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-100/60 p-6 shadow-inner">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-green-900">
                          <FileSpreadsheet className="h-5 w-5" />
                          <h3 className="text-xl font-bold">שלב 3: פירוט מלא של השינוי</h3>
                        </div>
                        <Badge variant="outline" className="rounded-full border-green-200 bg-white/80 text-green-700">
                          השוואת תיק קיים מול מוצע
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-green-600">צבירה כוללת</p>
                          <p className="mt-2 text-lg font-bold text-green-900">
                            ₪{productStats.totalCurrentAmount.toLocaleString()} → ₪{productStats.totalRecommendedAmount.toLocaleString()}
                          </p>
                          <p className={`text-sm font-semibold ${amountDifference > 0 ? 'text-green-600' : amountDifference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {amountDifference === 0 ? 'ללא שינוי' : `${amountDifference > 0 ? '+' : '-'}₪${Math.abs(amountDifference).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-green-600">התאמות ברמת הסיכון</p>
                          <p className="mt-2 text-lg font-bold text-green-900">{productStats.riskShiftCount}</p>
                          <p className="text-sm text-muted-foreground">מספר המוצרים שעברו התאמת סיכון</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <p className="text-sm font-medium text-green-600">דמי ניהול מצבירה</p>
                          <p className="mt-2 text-lg font-bold text-green-900">
                            {productStats.avgCurrentAccumulation.toFixed(2)}% → {productStats.avgRecommendedAccumulation.toFixed(2)}%
                          </p>
                          <p className={`text-sm font-semibold ${accumulationDelta < 0 ? 'text-green-600' : accumulationDelta > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {accumulationDelta === 0 ? 'ללא שינוי' : accumulationDelta < 0 ? `חיסכון של ${Math.abs(accumulationDelta).toFixed(2)}%` : `תוספת של ${accumulationDelta.toFixed(2)}%`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl bg-white/80 p-5 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="text-right">
                              <h4 className="text-lg font-semibold text-green-900">דמי ניהול מהפקדה</h4>
                              <p className="text-sm text-muted-foreground">ממוצע משוקלל</p>
                            </div>
                            <PieChart className="h-6 w-6 text-green-500" />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 flex items-center justify-between text-sm font-medium text-green-700">
                                <span>מצב קיים</span>
                                <span>{productStats.avgCurrentDeposit.toFixed(2)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-green-100">
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${productStats.depositCurrentBar || 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex items-center justify-between text-sm font-medium text-green-700">
                                <span>מצב מוצע</span>
                                <span>{productStats.avgRecommendedDeposit.toFixed(2)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-green-100">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${productStats.depositRecommendedBar || 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-5 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="text-right">
                              <h4 className="text-lg font-semibold text-green-900">דמי ניהול מצבירה</h4>
                              <p className="text-sm text-muted-foreground">ממוצע משוקלל</p>
                            </div>
                            <BarChart3 className="h-6 w-6 text-green-500" />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 flex items-center justify-between text-sm font-medium text-green-700">
                                <span>מצב קיים</span>
                                <span>{productStats.avgCurrentAccumulation.toFixed(2)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-green-100">
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${productStats.accumulationCurrentBar || 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex items-center justify-between text-sm font-medium text-green-700">
                                <span>מצב מוצע</span>
                                <span>{productStats.avgRecommendedAccumulation.toFixed(2)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-green-100">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${productStats.accumulationRecommendedBar || 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 overflow-x-auto rounded-2xl border border-green-200 bg-white/80 shadow-sm">
                        <table className="w-full border-collapse text-right">
                          <thead>
                            <tr className="bg-green-500/90 text-white">
                              <th className="p-4 text-right font-semibold">מדד להשוואה</th>
                              <th className="p-4 text-center font-semibold">מצב קיים</th>
                              <th className="p-4 text-center font-semibold">מצב מוצע</th>
                              <th className="p-4 text-center font-semibold">שינוי</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm text-foreground">
                            <tr className="border-b border-green-100">
                              <td className="p-4 font-semibold text-green-900">סכום צבירה</td>
                              <td className="p-4 text-center font-bold text-green-800">₪{productStats.totalCurrentAmount.toLocaleString()}</td>
                              <td className="p-4 text-center font-bold text-green-800">₪{productStats.totalRecommendedAmount.toLocaleString()}</td>
                              <td className={`p-4 text-center font-bold ${amountDifference > 0 ? 'text-green-600' : amountDifference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {amountDifference === 0 ? '0' : `${amountDifference > 0 ? '+' : '-'}₪${Math.abs(amountDifference).toLocaleString()}`}
                              </td>
                            </tr>
                            <tr className="border-b border-green-100">
                              <td className="p-4 font-semibold text-green-900">מספר מוצרים</td>
                              <td className="p-4 text-center font-bold text-green-800">{productStats.currentProducts.length}</td>
                              <td className="p-4 text-center font-bold text-green-800">{productStats.recommendedProducts.length}</td>
                              <td className={`p-4 text-center font-bold ${productStats.productCountDifference > 0 ? 'text-green-600' : productStats.productCountDifference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {productStats.productCountDifference === 0 ? '0' : `${productStats.productCountDifference > 0 ? '+' : ''}${productStats.productCountDifference}`}
                              </td>
                            </tr>
                            <tr className="border-b border-green-100">
                              <td className="p-4 font-semibold text-green-900">דמי ניהול מהפקדה</td>
                              <td className="p-4 text-center text-green-800">{productStats.avgCurrentDeposit.toFixed(2)}%</td>
                              <td className="p-4 text-center text-green-800">{productStats.avgRecommendedDeposit.toFixed(2)}%</td>
                              <td className={`p-4 text-center font-bold ${depositDelta < 0 ? 'text-green-600' : depositDelta > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {depositDelta === 0 ? '0%' : `${depositDelta > 0 ? '+' : ''}${depositDelta.toFixed(2)}%`}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-4 font-semibold text-green-900">דמי ניהול מצבירה</td>
                              <td className="p-4 text-center text-green-800">{productStats.avgCurrentAccumulation.toFixed(2)}%</td>
                              <td className="p-4 text-center text-green-800">{productStats.avgRecommendedAccumulation.toFixed(2)}%</td>
                              <td className={`p-4 text-center font-bold ${accumulationDelta < 0 ? 'text-green-600' : accumulationDelta > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {accumulationDelta === 0 ? '0%' : `${accumulationDelta > 0 ? '+' : ''}${accumulationDelta.toFixed(2)}%`}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {productStats.recommendedProducts.length > 0 && (
                        <div className="mt-6">
                          <h4 className="mb-3 text-lg font-semibold text-green-900">מוצרים מומלצים</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {productStats.recommendedProducts.map((product) => (
                              <div key={product.id} className="rounded-2xl border border-green-200 bg-gradient-to-br from-white via-green-50 to-green-100/60 p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                  <p className="text-lg font-bold text-green-900">{product.productName}</p>
                                  <Badge variant="outline" className="rounded-full border-green-300 bg-white/70 text-green-700">
                                    {product.company}
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm text-green-900">
                                  <p>מסלול: <span className="font-semibold">{product.subType}</span></p>
                                  <p>צבירה: <span className="font-semibold">₪{product.amount.toLocaleString()}</span></p>
                                  <p>דמי ניהול: <span className="font-semibold">{product.managementFeeOnDeposit}% מהפקדה | {product.managementFeeOnAccumulation}% מצבירה</span></p>
                                  {product.investmentTrack && <p>מסלול השקעה: <span className="font-semibold">{product.investmentTrack}</span></p>}
                                  {product.riskLevelChange && product.riskLevelChange !== 'no-change' && (
                                    <p>שינוי רמת סיכון: <span className="font-semibold">{product.riskLevelChange}</span></p>
                                  )}
                                </div>
                                {product.notes && (
                                  <p className="mt-3 rounded-xl bg-green-600/10 p-3 text-sm text-green-800">{product.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {productStats.currentProducts.length > 0 && (
                        <div className="mt-6">
                          <h4 className="mb-3 text-lg font-semibold text-green-900">מוצרים קיימים שנבדקו</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {productStats.currentProducts.map((product) => (
                              <div key={product.id} className="rounded-2xl border border-green-100 bg-white/70 p-4 text-right shadow-sm">
                                <p className="text-base font-semibold text-green-900">{product.productName}</p>
                                <p className="text-sm text-muted-foreground">{product.company}</p>
                                <p className="mt-2 text-sm text-green-800">₪{product.amount.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {effectiveSections.additionalNotes && (
                    <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100/60 p-6 shadow-inner">
                      <div className="mb-4 flex items-center gap-2 text-purple-900">
                        <NotebookPen className="h-5 w-5" />
                        <h3 className="text-xl font-bold">שלב 4: הרחבות והערות</h3>
                      </div>
                      <div className="space-y-4 text-right">
                        {formData.currentSituation ? (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-purple-900">מצב קיים</h4>
                            <p className="text-sm leading-relaxed text-purple-800">{formData.currentSituation}</p>
                          </div>
                        ) : null}
                        {formData.risks ? (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-purple-900">פערים וסיכונים</h4>
                            <p className="text-sm leading-relaxed text-purple-800">{formData.risks}</p>
                          </div>
                        ) : null}
                        {validRecommendations.length > 0 && (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-purple-900">המלצות להמשך</h4>
                            <ul className="space-y-2 text-sm text-purple-800">
                              {validRecommendations.map((rec, index) => (
                                <li key={index} className="flex items-start justify-end gap-2">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {formData.estimatedCost && (
                          <div className="rounded-2xl border border-purple-200 bg-purple-600/10 p-4 text-purple-900 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold">הערכת עלות</h4>
                            <p className="text-sm">{formData.estimatedCost}</p>
                          </div>
                        )}
                        {!formData.currentSituation && !formData.risks && validRecommendations.length === 0 && !formData.estimatedCost && (
                          <p className="text-sm text-muted-foreground">לא הוזנו הרחבות נוספות לדוח זה.</p>
                        )}
                      </div>
                    </section>
                  )}

                  {effectiveSections.disclosures && (
                    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-6 shadow-inner">
                      <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <ShieldAlert className="h-5 w-5" />
                        <h3 className="text-xl font-bold">שלב 5: גילוי נאות</h3>
                      </div>
                      <ul className="space-y-2 text-right text-sm text-slate-700">
                        <li className="flex items-start justify-end gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                          <span>הנתונים מבוססים על המידע שנמסר לנו ועל עדכונים אחרונים מהחברות המוסדיות.</span>
                        </li>
                        <li className="flex items-start justify-end gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                          <span>דמי ניהול, מסלולים ומדיניות השקעה עשויים להשתנות לאחר מועד הכנת הדוח.</span>
                        </li>
                        <li className="flex items-start justify-end gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                          <span>מומלץ לוודא שההמלצות תואמות את צרכי הלקוח, רמת הסיכון הרצויה והגדרת היעדים האישיים.</span>
                        </li>
                      </ul>
                    </section>
                  )}

                  {effectiveSections.nextSteps && (
                    <section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-100/60 p-6 shadow-inner">
                      <div className="mb-4 flex items-center gap-2 text-orange-900">
                        <Flag className="h-5 w-5" />
                        <h3 className="text-xl font-bold">שלב 6: סיכום ומשימות להמשך</h3>
                      </div>
                      <div className="space-y-4 text-right">
                        {formData.decisions && (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-orange-900">החלטות שהתקבלו</h4>
                            <div className="ai-content text-right text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: formData.decisions }} />
                          </div>
                        )}
                        {formData.documents.length > 0 && (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-orange-900">מסמכים ואישורים</h4>
                            <ul className="space-y-2 text-sm text-orange-900">
                              {formData.documents.map((doc, index) => (
                                <li key={index} className="flex items-start justify-end gap-2">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {formData.timeframes && (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-orange-900">לוחות זמנים</h4>
                            <p className="text-sm text-orange-900">{formData.timeframes}</p>
                          </div>
                        )}
                        {formData.approvals && (
                          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                            <h4 className="mb-2 text-lg font-semibold text-orange-900">אישורים נדרשים</h4>
                            <p className="text-sm text-orange-900">{formData.approvals}</p>
                          </div>
                        )}
                        {!formData.decisions && formData.documents.length === 0 && !formData.timeframes && !formData.approvals && (
                          <p className="text-sm text-muted-foreground">לא הוגדרו משימות להמשך בשלב זה.</p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
  );


  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Dialog open={showSectionsDialog} onOpenChange={setShowSectionsDialog}>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader className="text-right">
              <DialogTitle className="text-2xl font-semibold">התאמת דוח מורחב</DialogTitle>
              <DialogDescription>
                בחרו את הפרקים שיופיעו בדוח הסופי, השתמשו בתבניות מוכנות ושמרו את ההגדרות לפעם הבאה.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-right">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">מצב דוח מורחב</p>
                  <p className="text-sm text-muted-foreground">
                    הפעלה תאפשר לבחור אילו פרקים יוצגו בדוח ולהתאים אותו ללקוח הבא בקלות.
                  </p>
                </div>
                <Switch checked={isExpandedMode} onCheckedChange={(checked) => setIsExpandedMode(!!checked)} />
              </div>

              <div>
                <h4 className="mb-3 text-lg font-semibold text-foreground">תבניות מהירות</h4>
                <RadioGroup value={templateValue} onValueChange={applyTemplate} className="space-y-3">
                  {REPORT_TEMPLATES.map((template) => (
                    <Label
                      key={template.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${templateValue === template.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/40'}`}
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <RadioGroupItem value={template.id} className="ml-4" />
                    </Label>
                  ))}
                  <Label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${templateValue === 'custom' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/40'}`}
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-foreground">בחירה ידנית</p>
                      <p className="text-sm text-muted-foreground">בנו דוח מותאם אישית באמצעות סימון הפרקים הרצויים.</p>
                    </div>
                    <RadioGroupItem value="custom" className="ml-4" />
                  </Label>
                </RadioGroup>
              </div>

              <Separator className="my-2" />

              <div className="grid gap-3">
                {REPORT_SECTION_KEYS.map((key) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${selectedSections[key] ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20'}`}
                  >
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-foreground">{REPORT_SECTION_LABELS[key].title}</p>
                      <p className="text-sm text-muted-foreground">{REPORT_SECTION_LABELS[key].description}</p>
                    </div>
                    <Checkbox
                      checked={selectedSections[key]}
                      onCheckedChange={(checked) => handleSectionToggle(key, checked)}
                      disabled={!isExpandedMode}
                      className="ml-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={resetSectionsToDefault}
                className="rounded-xl"
              >
                איפוס לברירת מחדל
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowSectionsDialog(false)}
                  className="rounded-xl"
                >
                  ביטול
                </Button>
                <Button onClick={handleSaveTemplate} className="rounded-xl">
                  שמור והחל הגדרות
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור לטופס
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              סיכום פגישה מוכן
            </h1>
            <p className="text-muted-foreground">
              הסיכום נוצר בהצלחה - עכשיו אפשר לשלוח או להעתיק
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={viewMode === 'classic' ? 'default' : 'outline'}
            onClick={() => setViewMode('classic')}
            className="rounded-xl"
          >
            <FileText className="h-4 w-4 ml-2" />
            תצוגה קלאסית
          </Button>
          <Button
            variant={viewMode === 'blocks' ? 'default' : 'outline'}
            onClick={() => setViewMode('blocks')}
            className="rounded-xl"
          >
            <Layers className="h-4 w-4 ml-2" />
            עורך בלוקים
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Button
            onClick={() => copyToClipboard(summaryText, 'summary')}
            className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            {copiedItems.has('summary') ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-sm">
              {copiedItems.has('summary') ? 'הועתק!' : 'העתק סיכום'}
            </span>
          </Button>

          <Button
            onClick={() => setShowSectionsDialog(true)}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="text-sm">התאם דוח מורחב</span>
          </Button>

          <Button
            onClick={() => setShowFinalReport(true)}
            className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2 shadow-glow"
          >
            <Layout className="h-5 w-5" />
            <span className="text-sm">תצוגת דוח סופי</span>
          </Button>

          <Button 
            onClick={sendEmail}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">שלח במייל</span>
          </Button>

          <Button 
            onClick={sendWhatsApp}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">שלח בוואטסאפ</span>
          </Button>

          <Button 
            onClick={downloadPDF}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">ייצא קובץ</span>
          </Button>
        </div>

        {/* Content Area */}
        {viewMode === 'blocks' ? (
          <div className="flex gap-6">
            {/* Main Content Area with Drag & Drop */}
            <div className="flex-1">
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div 
                  className="min-h-96 p-6 border-2 border-dashed border-glass-border rounded-2xl bg-glass/20"
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (data.template && data.variant) {
                        addBlock(data.template, data.variant);
                      }
                    } catch (error) {
                      console.error('Error handling drop:', error);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {blocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">גרור בלוקים לכאן להתחלת עבודה</p>
                      <p className="text-sm">או בחר טמפלט מהסרגל הצדדי</p>
                    </div>
                  ) : (
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {blocks.map((block) => (
                          <SortableBlock key={block.id} block={block} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
                
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-80">
                      <BlockRenderer
                        block={blocks.find(b => b.id === activeId)!}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onMove={() => {}}
                        isDragging
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
            
            {/* Blocks Sidebar */}
            <BlocksSidebar onAddBlock={addBlock} onLoadTemplate={loadTemplate} />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">סיכום פגישת ביטוח</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {renderReportSections('inline')}
</CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <Button 
            onClick={onBack}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
          >
            צור סיכום נוסף
          </Button>
        </div>
      </div>

      {/* Final Report Modal */}
      {showFinalReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-glass-border bg-glass/50">
              <h2 className="text-2xl font-bold text-foreground">דוח סיכום פגישה - תצוגה סופית</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFinalReport(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <div className="space-y-8 text-right">
                <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">דוח סיכום פגישה</h1>
                      <p className="mt-2 text-sm text-muted-foreground">{formData.clientName} • {formatDate(formData.meetingDate)} • {locationDisplay}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/30 bg-white/80 text-primary">
                      בחירת מוצרים והמלצות
                    </Badge>
                  </div>
                  {formData.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {formData.topics.map((topic) => (
                        <Badge key={topic} className="rounded-full border-primary/20 bg-primary/10 px-4 py-1 text-primary">{topic}</Badge>
                      ))}
                    </div>
                  )}
                </section>

                {renderReportSections('modal')}

                <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 text-center shadow-inner">
                  <p className="text-lg font-semibold text-foreground">בברכה, {agentData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {agentData.phone ? `טלפון: ${agentData.phone}` : 'טלפון: ________'}
                    {agentData.email ? ` | אימייל: ${agentData.email}` : ' | אימייל: ________'}
                  </p>
                </section>
              </div>
            </div>
            {/* Modal Actions */}
            <div className="p-6 border-t border-glass-border bg-glass/30 flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => copyToClipboard(summaryText, 'final-report')}
                className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
              >
                <Copy className="h-4 w-4 ml-2" />
                העתק דוח
              </Button>
              <Button
                onClick={sendEmail}
                variant="outline"
                className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
              >
                <Mail className="h-4 w-4 ml-2" />
                שלח במייל
              </Button>
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl"
              >
                <Download className="h-4 w-4 ml-2" />
                ייצא PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryGenerator;