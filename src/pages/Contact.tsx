import AppNavigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, Clock, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link
    const subject = encodeURIComponent(formData.subject || "פנייה מ-InMinds");
    const body = encodeURIComponent(
      `שם: ${formData.name}\n` +
      `אימייל: ${formData.email}\n\n` +
      `הודעה:\n${formData.message}`
    );
    
    window.open(`mailto:support@inminds.com?subject=${subject}&body=${body}`);
    
    toast({
      title: "תודה על הפנייה",
      description: "נפתחה אפליקציית המייל שלכם עם ההודעה המוכנה",
    });
    
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "אימייל",
      description: "support@inminds.com",
      action: "שלח מייל",
      link: "mailto:support@inminds.com"
    },
    {
      icon: MessageCircle,
      title: "וואטסאפ",
      description: "050-1234567",
      action: "שלח הודעה",
      link: "https://wa.me/972501234567"
    }
  ];

  const faqs = [
    {
      question: "האם InMinds חינמי?",
      answer: "כן! InMinds הוא כלי חינמי לחלוטין לסוכני ביטוח. אין עלויות נסתרות או מנויים."
    },
    {
      question: "האם הנתונים שלי בטוחים?",
      answer: "בהחלט. כל הנתונים נשמרים במכשיר שלכם בלבד ולעולם לא נשלחים לשרתים חיצוניים."
    },
    {
      question: "איך אני מוחק טיוטות שמורות?",
      answer: "אתם יכולים למחוק טיוטות דרך הגדרות הדפדפן או פשוט לא לשמור טיוטות מלכתחילה."
    },
    {
      question: "אפשר להתאים את תבנית הסיכום?", 
      answer: "כרגע התבנית קבועה, אבל אנחנו עובדים על אפשרויות התאמה אישית לגרסאות עתידיות."
    }
  ];

  return (
    <div className="min-h-screen">
      <AppNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              יצירת קשר
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              יש לכם שאלות, הצעות או צריכים עזרה? אנחנו כאן בשבילכם.
              נשמח לשמוע ולעזור בכל דרך שנוכל.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="glass border-glass-border rounded-2xl glass-hover">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-6">
                    <method.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {method.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {method.description}
                  </p>
                  <Button 
                    asChild
                    className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
                  >
                    <a href={method.link} target="_blank" rel="noopener noreferrer">
                      {method.action}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="glass border-glass-border rounded-2xl mb-16">
            <CardHeader>
              <CardTitle className="text-center">
                שלחו לנו הודעה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">שם מלא</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-2 bg-input rounded-xl"
                      placeholder="השם שלכם"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-2 bg-input rounded-xl"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">נושא</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-2 bg-input rounded-xl"
                    placeholder="על מה אתם רוצים לדבר?"
                  />
                </div>

                <div>
                  <Label htmlFor="message">הודעה</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="mt-2 bg-input rounded-xl min-h-[120px]"
                    placeholder="פרטו את השאלה או הבקשה שלכם..."
                    required
                  />
                </div>

                <div className="text-center">
                  <Button 
                    type="submit"
                    size="lg"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl px-8 py-4 min-w-[200px]"
                  >
                    <Mail className="h-5 w-5 ml-2" />
                    שלח הודעה
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="glass border-glass-border rounded-2xl mb-16">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4 text-center">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">זמן תגובה</h3>
                  <p className="text-sm text-muted-foreground">אנחנו עונים תוך 24 שעות בימי עסקים</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div>
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              שאלות נפוצות
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="glass border-glass-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-3 text-lg">
                      <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;