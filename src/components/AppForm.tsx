import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, CheckCircle, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SummaryGenerator from "./SummaryGenerator";

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
    decisions: "",
    documents: [],
    timeframes: "",
    approvals: ""
  });

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

  const generateSummary = () => {
    if (!formData.clientName || !formData.clientPhone || !formData.currentSituation) {
      toast({
        title: "חסרים פרטים",
        description: "יש למלא לפחות שם לקוח, טלפון ומצב קיים",
        variant: "destructive"
      });
      return;
    }
    setShowSummary(true);
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
            יצירת סיכום פגישה
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

        {/* Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass mb-8 p-1 rounded-2xl">
            <TabsTrigger 
              value="client" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4 ml-2" />
              פרטי לקוח
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 ml-2" />
              המלצות
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
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      className="mt-2 bg-input rounded-xl"
                      placeholder="הכניסו שם מלא"
                    />
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

          {/* Recommendations */}
          <TabsContent value="recommendations">
            <Card className="glass border-glass-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  המלצות הסוכן
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
                  <Label htmlFor="decisions">מה הוחלט לבצע *</Label>
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