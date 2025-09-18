import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, User, Phone, Mail, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AgentData {
  name: string;
  phone: string;
  email: string;
  logo_url: string;
}

export const AgentInfo = () => {
  const [agentData, setAgentData] = useState<AgentData>({
    name: "",
    phone: "",
    email: "",
    logo_url: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAgentInfo();
  }, []);

  const loadAgentInfo = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAgentData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          logo_url: data.logo_url || ""
        });
      }
    } catch (error) {
      console.error('Error loading agent info:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת פרטי הסוכן",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ תמונה בלבד",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "שגיאה",
        description: "גודל הקובץ חייב להיות קטן מ-5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `agent-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pics')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pics')
        .getPublicUrl(fileName);

      setAgentData(prev => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: "הצלחה",
        description: "הלוגו הועלה בהצלחה",
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהעלאת הלוגו",
        variant: "destructive"
      });
    }
  };

  const saveAgentInfo = async () => {
    if (!agentData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס שם הסוכן",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_info')
        .upsert({
          name: agentData.name,
          phone: agentData.phone,
          email: agentData.email,
          logo_url: agentData.logo_url
        });

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "פרטי הסוכן נשמרו בהצלחה",
      });

    } catch (error) {
      console.error('Error saving agent info:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת פרטי הסוכן",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  const handleInputChange = (field: keyof AgentData, value: string) => {
    setAgentData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">טוען פרטי הסוכן...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">לוגו הסוכן</Label>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32 border-4 border-muted">
                  <AvatarImage src={agentData.logo_url} alt="לוגו הסוכן" />
                  <AvatarFallback className="text-2xl">
                    <Image className="w-12 h-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  העלאת לוגו
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  קבצי תמונה בלבד, גודל מקסימלי 5MB
                </p>
              </div>
            </div>

            {/* Agent Details Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">פרטי הסוכן</Label>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    שם הסוכן
                  </Label>
                  <Input
                    id="agent-name"
                    value={agentData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="הכנס שם מלא"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    טלפון
                  </Label>
                  <Input
                    id="agent-phone"
                    value={agentData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="050-1234567"
                    type="tel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    מייל
                  </Label>
                  <Input
                    id="agent-email"
                    value={agentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="agent@example.com"
                    type="email"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6 pt-6 border-t">
            <Button
              onClick={saveAgentInfo}
              disabled={isSaving || !agentData.name.trim()}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "שומר..." : "שמירת פרטים"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {agentData.name && (
        <Card>
          <CardContent className="p-6">
            <Label className="text-base font-medium mb-4 block">תצוגה מקדימה</Label>
            <div className="bg-muted/30 p-6 rounded-lg border-2 border-dashed border-muted">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={agentData.logo_url} alt="לוגו הסוכן" />
                  <AvatarFallback>
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{agentData.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {agentData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {agentData.phone}
                      </div>
                    )}
                    {agentData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {agentData.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};