import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  meetingDate: string;
  topics: string[];
  currentSituation: string;
  risks: string;
  recommendations: string[];
  estimatedCost: string;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateSummaryText = () => {
    const summaryParts = [];

    // Header
    summaryParts.push(`נושא: סיכום פגישת ביטוח – ${formData.clientName} – ${formatDate(formData.meetingDate)}`);
    summaryParts.push('');
    summaryParts.push(`שלום ${formData.clientName},`);
    summaryParts.push('');
    summaryParts.push('להלן סיכום הפגישה שלנו:');
    summaryParts.push('');

    // Client details
    summaryParts.push('פרטי הלקוח:');
    summaryParts.push(`• שם: ${formData.clientName}`);
    summaryParts.push(`• טלפון: ${formData.clientPhone}`);
    summaryParts.push(`• אימייל: ${formData.clientEmail}`);
    if (formData.topics.length > 0) {
      summaryParts.push(`• נושאים שנדונו: ${formData.topics.join(', ')}`);
    }
    summaryParts.push('');

    // Agent recommendations
    if (formData.currentSituation || formData.risks || formData.recommendations.some(r => r.trim())) {
      summaryParts.push('המלצות הסוכן:');
      
      if (formData.currentSituation) {
        summaryParts.push(`• מצב קיים: ${formData.currentSituation}`);
      }
      
      if (formData.risks) {
        summaryParts.push(`• פערים/סיכונים: ${formData.risks}`);
      }
      
      const validRecommendations = formData.recommendations.filter(r => r.trim());
      if (validRecommendations.length > 0) {
        summaryParts.push('• המלצות:');
        validRecommendations.forEach(rec => {
          summaryParts.push(`  - ${rec}`);
        });
      }
      
      if (formData.estimatedCost) {
        summaryParts.push(`• הערכת עלות: ${formData.estimatedCost}`);
      }
      
      summaryParts.push('');
    }

    // Decisions
    if (formData.decisions) {
      summaryParts.push('החלטות שהתקבלו:');
      summaryParts.push(`${formData.decisions}`);
      summaryParts.push('');
    }

    // Documents and actions
    if (formData.documents.length > 0 || formData.timeframes || formData.approvals) {
      summaryParts.push('פעולות נדרשות:');
      
      if (formData.documents.length > 0) {
        summaryParts.push('• מסמכים להכנה:');
        formData.documents.forEach(doc => {
          summaryParts.push(`  - ${doc}`);
        });
      }
      
      if (formData.timeframes) {
        summaryParts.push(`• לוח זמנים: ${formData.timeframes}`);
      }
      
      if (formData.approvals) {
        summaryParts.push(`• אישורים נדרשים: ${formData.approvals}`);
      }
      
      summaryParts.push('');
    }

    // Footer
    summaryParts.push('בברכה,');
    summaryParts.push('הסוכן שלכם');
    summaryParts.push('טלפון: [טלפון הסוכן]');
    summaryParts.push('אימייל: [אימייל הסוכן]');

    return summaryParts.join('\n');
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

  const downloadPDF = () => {
    // For now, this will create a simple text file
    // In a real application, you'd use a PDF library like jsPDF
    const text = generateSummaryText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `סיכום_פגישה_${formData.clientName}_${formData.meetingDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "הקובץ הורד",
      description: "הסיכום נשמר במכשיר שלך",
    });
  };

  const summaryText = generateSummaryText();

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Summary Preview */}
        <Card className="glass border-glass-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              סיכום פגישת ביטוח – {formData.clientName}
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-glass-border bg-glass text-foreground">
                {formatDate(formData.meetingDate)}
              </Badge>
              {formData.topics.length > 0 && (
                <Badge variant="outline" className="border-glass-border bg-glass text-foreground">
                  {formData.topics.length} נושאים
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 rounded-xl p-6">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {summaryText}
              </pre>
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default SummaryGenerator;