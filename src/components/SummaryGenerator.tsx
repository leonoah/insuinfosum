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
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, Shield, Layers, Layout, BarChart3, Sparkles, SlidersHorizontal, FileSpreadsheet, NotebookPen, ShieldAlert, Flag, PieChart, Loader2, FileText, Edit3, Settings, Expand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import agentLogo from "@/assets/agent-logo.png";
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
  const [selectedSections, setSelectedSections] = useState<Record<ReportSectionKey, boolean>>({ ...REPORT_SECTIONS_DEFAULT });
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

  const generateFinalReport = async () => {
    setShowFinalReport(true);
    const config = isExpandedMode ? selectedSections : REPORT_SECTIONS_DEFAULT;
    
    // Generate the report content with improved styling
    const reportElement = document.getElementById('final-report-content');
    if (reportElement) {
      try {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        // Convert canvas to image for PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`סיכום-ביטוח-${formData.clientName}-${formatDate(formData.meetingDate)}.pdf`);
        
        toast({
          title: "הדוח נוצר בהצלחה",
          description: "קובץ PDF הורד למחשב שלך",
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "שגיאה ביצירת הדוח",
          description: "אנא נסה שנית",
          variant: "destructive",
        });
      }
    }
  };

  const ComparisonSection = ({ currentProducts, recommendedProducts }: {
    currentProducts: SelectedProduct[];
    recommendedProducts: SelectedProduct[];
  }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        השוואת תיקים - מצב קיים מול מוצע
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">הפרש הצבירה</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              ₪{Math.abs(productStats.amountDifference).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {productStats.amountDifference >= 0 ? 'עלייה' : 'ירידה'}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">מצב מוצע</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ₪{productStats.totalRecommendedAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{recommendedProducts.length} מוצרים</div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">מצב קיים</div>
            <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
              ₪{productStats.totalCurrentAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{currentProducts.length} מוצרים</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">קטגוריה</th>
              <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">מצב קיים</th>
              <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">מצב מוצע</th>
              <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">שינוי</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">סה"כ צבירה</td>
              <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                ₪{productStats.totalCurrentAmount.toLocaleString()}
              </td>
              <td className="text-center py-4 px-4 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700">
                ₪{productStats.totalRecommendedAmount.toLocaleString()}
              </td>
              <td className="text-center py-4 px-4 border-b border-gray-100 dark:border-gray-700">
                <span className={`font-semibold ${productStats.amountDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {productStats.amountDifference >= 0 ? '+' : ''}₪{productStats.amountDifference.toLocaleString()}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">מספר מוצרים</td>
              <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{currentProducts.length}</td>
              <td className="text-center py-4 px-4 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700">{recommendedProducts.length}</td>
              <td className="text-center py-4 px-4 border-b border-gray-100 dark:border-gray-700">
                <span className={`font-semibold ${productStats.productCountDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {productStats.productCountDifference >= 0 ? '+' : ''}{productStats.productCountDifference}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">ממוצע דמי ניהול (הפקדה)</td>
              <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{productStats.avgCurrentDeposit.toFixed(2)}%</td>
              <td className="text-center py-4 px-4 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700">{productStats.avgRecommendedDeposit.toFixed(2)}%</td>
              <td className="text-center py-4 px-4 border-b border-gray-100 dark:border-gray-700">
                <span className={`font-semibold ${(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit) <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit) >= 0 ? '+' : ''}{(productStats.avgRecommendedDeposit - productStats.avgCurrentDeposit).toFixed(2)}%
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">ממוצע דמי ניהול (צבירה)</td>
              <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-300">{productStats.avgCurrentAccumulation.toFixed(2)}%</td>
              <td className="text-center py-4 px-4 text-blue-600 dark:text-blue-400">{productStats.avgRecommendedAccumulation.toFixed(2)}%</td>
              <td className="text-center py-4 px-4">
                <span className={`font-semibold ${(productStats.avgRecommendedAccumulation - productStats.avgCurrentAccumulation) <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
      <div className="glass p-6 rounded-2xl border border-glass-border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
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
    <div id="final-report-content" className="max-w-4xl mx-auto p-8 bg-background text-foreground">
      {/* Header */}
      <div className="text-center mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          {agentData.logo_url ? (
            <img src={agentData.logo_url} alt="לוגו הסוכן" className="w-20 h-20 object-contain rounded-lg" />
          ) : (
            <img src={agentLogo} alt="לוגו הסוכן" className="w-20 h-20 object-contain rounded-lg" />
          )}
          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              דוח סיכום ביטוח
            </h1>
            <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{agentData.name}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-lg">
          <div className="text-lg text-gray-900 dark:text-white font-medium">
            {formData.clientName} • {formatDate(formData.meetingDate)}
          </div>
        </div>
      </div>

      {/* Personal Info Section */}
      {selectedSections.personalInfo && (
        <ReportSection sectionKey="personalInfo">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium">שם הלקוח:</span>
                <span>{formData.clientName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-medium">טלפון:</span>
                <span>{formData.clientPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-medium">אימייל:</span>
                <span>{formData.clientEmail || 'לא צויין'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">תאריך הפגישה:</span>
                <span>{formatDate(formData.meetingDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">מיקום הפגישה:</span>
                <span>{formData.meetingLocation || 'לא צויין'}</span>
              </div>
              {formData.topics.length > 0 && (
                <div className="flex items-start gap-3">
                  <Layers className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <span className="font-medium">נושאים מרכזיים:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
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
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 rounded-xl border border-primary/30">
              <h4 className="font-semibold text-primary mb-3">עיקרי השינויים:</h4>
              <ul className="space-y-2">
                {productStats.highlightBullets.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-sm">{highlight}</span>
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
              <h4 className="font-semibold text-foreground mb-4">מוצרים מוצעים לשינוי:</h4>
              <div className="space-y-3">
                {productStats.recommendedProducts.map((product, index) => (
                  <div key={index} className="glass p-4 rounded-xl border border-glass-border">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="font-medium text-primary">
                          {product.productName} ({product.company})
                        </div>
                        <div className="text-sm text-muted-foreground">
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
                          <div className="text-sm bg-muted/30 p-2 rounded">
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
                <h4 className="font-semibold text-foreground mb-2">המצב הנוכחי:</h4>
                <div className="bg-muted/30 p-4 rounded-xl text-sm">
                  {formData.currentSituation}
                </div>
              </div>
            )}
            
            {formData.risks && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">סיכונים וחשיפות:</h4>
                <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl text-sm">
                  {formData.risks}
                </div>
              </div>
            )}

            {additionalNotesText && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">הערות נוספות:</h4>
                <div className="bg-muted/30 p-4 rounded-xl text-sm">
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
          <div className="bg-muted/30 p-4 rounded-xl">
            <div className="text-sm text-muted-foreground">
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
                <h4 className="font-semibold text-foreground mb-2">החלטות שהתקבלו:</h4>
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

            {nextStepsText && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">משימות להמשך:</h4>
                <div className="bg-muted/30 p-4 rounded-xl text-sm">
                  {nextStepsText}
                </div>
              </div>
            )}
          </div>
        </ReportSection>
      )}

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-glass-border">
        <div className="text-sm text-muted-foreground mb-2">
          נוצר על ידי {agentData.name}
        </div>
        {agentData.phone && (
          <div className="text-sm text-muted-foreground">
            טלפון: {agentData.phone}
          </div>
        )}
        {agentData.email && (
          <div className="text-sm text-muted-foreground">
            אימייל: {agentData.email}
          </div>
        )}
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
              <Button onClick={generateFinalReport} className="bg-primary hover:bg-primary-hover">
                <FileText className="w-4 h-4 ml-2" />
                יצירת דוח
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
                  onClick={() => {
                    const reportText = `דוח סיכום פגישת ביטוח\n\nלקוח: ${formData.clientName}\nתאריך: ${formatDate(formData.meetingDate)}\n\nתקציר מנהלים:\n${productStats.highlightBullets.join('\n')}\n\nהחלטות שהתקבלו:\n${formData.decisions}\n\nמשימות להמשך:\n${nextStepsText}`;
                    const mailtoUrl = `mailto:${formData.clientEmail}?subject=דוח סיכום פגישת ביטוח - ${formData.clientName}&body=${encodeURIComponent(reportText)}`;
                    window.open(mailtoUrl, '_blank');
                  }}
                >
                  <Mail className="w-4 h-4 ml-2" />
                  שלח במייל
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const reportText = `דוח סיכום פגישת ביטוח\n\nלקוח: ${formData.clientName}\nתאריך: ${formatDate(formData.meetingDate)}\n\nתקציר מנהלים:\n${productStats.highlightBullets.join('\n')}\n\nהחלטות שהתקבלו:\n${formData.decisions}\n\nמשימות להמשך:\n${nextStepsText}`;
                    const whatsappUrl = `https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(reportText)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  שלח בוואטסאפ
                </Button>
                <Button onClick={generateFinalReport}>
                  <Download className="w-4 h-4 ml-2" />
                  הורד PDF
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
                return (
                  <div key={sectionKey} className="flex items-start space-x-3 space-x-reverse">
                    <Checkbox
                      id={sectionKey}
                      checked={selectedSections[sectionKey]}
                      onCheckedChange={(checked) => 
                        handleSectionToggle(sectionKey, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={sectionKey} className="font-medium">
                        {section.title}
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
      </div>
    </div>
  );
};

export default SummaryGenerator;