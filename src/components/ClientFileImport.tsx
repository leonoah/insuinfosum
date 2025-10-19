import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { PensionParser } from "@/utils/pensionParser";

interface ClientFileImportProps {
  onClientDataLoaded: (clientName: string, clientId: string, clientPhone?: string, clientEmail?: string) => void;
}

export function ClientFileImport({ onClientDataLoaded }: ClientFileImportProps) {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const pensionData = await PensionParser.parsePensionFile(file);
      
      if (!pensionData) {
        toast.error("לא ניתן לקרוא את הקובץ");
        return;
      }

      if (pensionData.summary?.clientName && pensionData.summary?.clientId) {
        onClientDataLoaded(
          pensionData.summary.clientName, 
          pensionData.summary.clientId,
          pensionData.summary.clientPhone,
          pensionData.summary.clientEmail
        );
        toast.success("פרטי הלקוח נטענו בהצלחה");
      } else {
        toast.error("לא נמצאו פרטי לקוח בקובץ");
      }
    } catch (error) {
      console.error("Error loading client data:", error);
      toast.error("שגיאה בטעינת הקובץ");
    }

    // Reset input
    event.target.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        id="client-file-upload"
        accept=".xml,.zip,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => document.getElementById("client-file-upload")?.click()}
      >
        <Upload className="h-4 w-4 ml-2" />
        טען מקובץ מסלקה
      </Button>
    </div>
  );
}
