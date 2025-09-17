import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Copy, Mail, MessageCircle, Download, Check, User, Phone, MapPin, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  const sendEmail = async () => {
    if (isSendingEmail) return;
    
    setIsSendingEmail(true);
    try {
      const subject = `סיכום פגישת ביטוח – ${formData.clientName} – ${formatDate(formData.meetingDate)}`;
      const summary = generateSummaryText();

      const { data, error } = await supabase.functions.invoke('send-summary-email', {
        body: {
          to: formData.clientEmail,
          subject,
          summary,
          clientName: formData.clientName,
          meetingDate: formatDate(formData.meetingDate)
        }
      });

      if (error) throw error;

      toast({
        title: "המייל נשלח בהצלחה!",
        description: `סיכום הפגישה נשלח לכתובת ${formData.clientEmail}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "ניסה שוב מאוחר יותר או השתמש בלחצן 'שלח בוואטסאפ'",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    const whatsappLink = `https://wa.me/?text=${text}`;
    window.open(whatsappLink, '_blank');
  };

  const downloadPDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const summaryElement = document.getElementById('summary-content');
      if (!summaryElement) {
        throw new Error('לא נמצא תוכן הסיכום');
      }

      // Create canvas from the summary element
      const canvas = await html2canvas(summaryElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
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

      // Save the PDF
      const fileName = `סיכום_פגישה_${formData.clientName}_${formData.meetingDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "קובץ PDF נוצר בהצלחה!",
        description: "הסיכום הורד למכשיר שלך",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה ביצירת PDF",
        description: "ניסה שוב או השתמש באפשרות 'העתק סיכום'",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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
            disabled={isSendingEmail}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">{isSendingEmail ? 'שולח...' : 'שלח במייל'}</span>
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
            disabled={isGeneratingPDF}
            variant="outline"
            className="border-glass-border bg-glass hover:bg-glass text-foreground rounded-xl h-auto p-4 flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">{isGeneratingPDF ? 'יוצר PDF...' : 'ייצא PDF'}</span>
          </Button>
        </div>

        {/* Summary Preview */}
        <div id="summary-content" className="space-y-8 bg-background p-8 rounded-3xl border border-border shadow-lg">
          {/* Header Section */}
          <div className="text-center space-y-4 pb-6 border-b border-border">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                סיכום פגישת ביטוח
              </h1>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Calendar className="h-4 w-4 ml-2" />
                {formatDate(formData.meetingDate)}
              </Badge>
              {formData.topics.length > 0 && (
                <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                  <FileText className="h-4 w-4 ml-2" />
                  {formData.topics.length} נושאים נדונו
                </Badge>
              )}
            </div>
          </div>

          {/* Client Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">פרטי הלקוח</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">שם הלקוח</div>
                    <div className="text-lg font-semibold text-foreground">{formData.clientName}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">טלפון</div>
                    <div className="text-lg font-semibold text-foreground">{formData.clientPhone}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">אימייל</div>
                  <div className="text-lg font-semibold text-foreground">{formData.clientEmail}</div>
                </div>
              </div>
            </div>
            
            {formData.topics.length > 0 && (
              <div className="p-4 rounded-xl bg-accent/20 border border-border">
                <div className="text-sm text-muted-foreground mb-3">נושאים שנדונו בפגישה</div>
                <div className="flex flex-wrap gap-2">
                  {formData.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agent Recommendations Section */}
          {(formData.currentSituation || formData.risks || formData.recommendations.some(r => r.trim())) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">המלצות הסוכן</h2>
              </div>
              
              <div className="space-y-4">
                {formData.currentSituation && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 border border-blue-200/50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">מצב קיים</h3>
                        <p className="text-blue-800 leading-relaxed">{formData.currentSituation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.risks && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-red-50/50 to-red-100/30 border border-red-200/50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-2">פערים וסיכונים</h3>
                        <p className="text-red-800 leading-relaxed">{formData.risks}</p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.recommendations.filter(r => r.trim()).length > 0 && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-green-50/50 to-green-100/30 border border-green-200/50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-3">המלצות מפורטות</h3>
                        <div className="space-y-3">
                          {formData.recommendations.filter(rec => rec.trim()).map((rec, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-green-800 leading-relaxed">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.estimatedCost && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50/50 to-purple-100/30 border border-purple-200/50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <span className="text-purple-600 font-bold text-lg">₪</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-purple-900 mb-2">הערכת עלות</h3>
                        <p className="text-purple-800 text-lg font-medium">{formData.estimatedCost}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Decisions Section */}
          {formData.decisions && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">החלטות שהתקבלו</h2>
              </div>
              
              <div className="p-6 rounded-xl bg-accent/20 border border-border">
                <p className="text-foreground leading-relaxed">{formData.decisions}</p>
              </div>
            </div>
          )}

          {/* Actions Required Section */}
          {(formData.documents.length > 0 || formData.timeframes || formData.approvals) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">פעולות נדרשות</h2>
              </div>
              
              <div className="space-y-6">
                {formData.documents.length > 0 && (
                  <div className="p-6 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">מסמכים להכנה</h3>
                    </div>
                    <div className="space-y-3">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-foreground">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.timeframes && (
                  <div className="p-6 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">לוח זמנים</h3>
                        <p className="text-muted-foreground leading-relaxed">{formData.timeframes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.approvals && (
                  <div className="p-6 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">אישורים נדרשים</h3>
                        <p className="text-muted-foreground leading-relaxed">{formData.approvals}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agent Signature Section */}
          <div className="text-center space-y-6 pt-8 border-t border-border">
            <div className="flex justify-center">
              <img 
                src={agentLogo} 
                alt="לוגו הסוכן" 
                className="h-20 w-auto opacity-90"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium text-foreground">בברכה,</p>
              <p className="text-primary font-bold text-lg">הסוכן שלכם</p>
              <div className="text-muted-foreground space-y-1 pt-2">
                <p>טלפון: [טלפון הסוכן]</p>
                <p>אימייל: [אימייל הסוכן]</p>
              </div>
            </div>
          </div>
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