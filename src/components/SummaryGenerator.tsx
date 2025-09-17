import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import agentLogo from "@/assets/agent-logo.png";

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
        <div className="space-y-6">
          {/* Header Section */}
          <Card className="glass border-glass-border rounded-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">
                  סיכום פגישת ביטוח
                </CardTitle>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-glass-border bg-glass text-foreground">
                  <Calendar className="h-3 w-3 ml-1" />
                  {formatDate(formData.meetingDate)}
                </Badge>
                {formData.topics.length > 0 && (
                  <Badge variant="outline" className="border-glass-border bg-glass text-foreground">
                    <FileText className="h-3 w-3 ml-1" />
                    {formData.topics.length} נושאים
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Client Details Section */}
          <Card className="glass border-glass-border rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                פרטי הלקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">שם הלקוח</div>
                    <div className="font-medium">{formData.clientName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">טלפון</div>
                    <div className="font-medium">{formData.clientPhone}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">אימייל</div>
                  <div className="font-medium">{formData.clientEmail}</div>
                </div>
              </div>
              {formData.topics.length > 0 && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">נושאים שנדונו</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.topics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Recommendations Section */}
          {(formData.currentSituation || formData.risks || formData.recommendations.some(r => r.trim())) && (
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  המלצות הסוכן
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.currentSituation && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">מצב קיים</div>
                        <div className="text-blue-800 dark:text-blue-200 text-sm">{formData.currentSituation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.risks && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900 dark:text-red-100 mb-1">פערים וסיכונים</div>
                        <div className="text-red-800 dark:text-red-200 text-sm">{formData.risks}</div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.recommendations.filter(r => r.trim()).length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="w-full">
                        <div className="font-medium text-green-900 dark:text-green-100 mb-2">המלצות</div>
                        <div className="space-y-2">
                          {formData.recommendations.filter(rec => rec.trim()).map((rec, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2" />
                              <div className="text-green-800 dark:text-green-200 text-sm">{rec}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.estimatedCost && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">₪</span>
                      </div>
                      <div>
                        <div className="font-medium text-purple-900 dark:text-purple-100">הערכת עלות</div>
                        <div className="text-purple-800 dark:text-purple-200 text-sm">{formData.estimatedCost}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Decisions Section */}
          {formData.decisions && (
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  החלטות שהתקבלו
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm leading-relaxed">{formData.decisions}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions Required Section */}
          {(formData.documents.length > 0 || formData.timeframes || formData.approvals) && (
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  פעולות נדרשות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.documents.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">מסמכים להכנה</span>
                    </div>
                    <div className="space-y-2">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/20 rounded text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.timeframes && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm mb-1">לוח זמנים</div>
                        <div className="text-sm text-muted-foreground">{formData.timeframes}</div>
                      </div>
                    </div>
                  </>
                )}

                {formData.approvals && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm mb-1">אישורים נדרשים</div>
                        <div className="text-sm text-muted-foreground">{formData.approvals}</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent Signature Section */}
          <Card className="glass border-glass-border rounded-2xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={agentLogo} 
                    alt="לוגו הסוכן" 
                    className="h-16 w-auto"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium">בברכה,</p>
                  <p className="text-primary font-semibold">הסוכן שלכם</p>
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p>טלפון: [טלפון הסוכן]</p>
                    <p>אימייל: [אימייל הסוכן]</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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