import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SelectedProduct } from "@/types/insurance";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (currentProducts: SelectedProduct[], suggestedProducts: SelectedProduct[]) => void;
}

interface ExtractedData {
  currentProducts: SelectedProduct[];
  suggestedProducts: SelectedProduct[];
  customerStatus: string;
  summary: string;
  highlightedTranscript?: string;
}

const RecordingModal = ({ isOpen, onClose, onApprove }: RecordingModalProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: "הקלטה החלה",
        description: "השיחה מוקלטת כעת",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להתחיל הקלטה",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(audioBlob);
        
        // Convert audio to text
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (transcriptionError) throw transcriptionError;
        
        setTranscribedText(transcriptionData.text);
        
        // Extract policy information from text
        const { data: extractionData, error: extractionError } = await supabase.functions.invoke('analyze-call-transcript', {
          body: { 
            transcript: transcriptionData.text,
            agentName: "סוכן ביטוח"
          }
        });
        
        if (extractionError) throw extractionError;
        
        setExtractedData(extractionData);
        setIsProcessing(false);
        
        toast({
          title: "ההקלטה עובדה בהצלחה",
          description: "נתוני הביטוח חולצו מהשיחה",
        });
        
      } catch (error) {
        console.error('Error processing recording:', error);
        setIsProcessing(false);
        toast({
          title: "שגיאה",
          description: "לא ניתן לעבד את ההקלטה",
          variant: "destructive"
        });
      }
    };
    
    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    const stream = mediaRecorderRef.current.stream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleApprove = () => {
    if (extractedData) {
      onApprove(extractedData.currentProducts, extractedData.suggestedProducts);
      onClose();
      resetModal();
    }
  };

  const resetModal = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setTranscribedText("");
    setExtractedData(null);
    audioChunksRef.current = [];
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    onClose();
    resetModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">הקלטת שיחה עם לקוח</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recording Animation */}
          {isRecording && (
            <Card className="border-red-500 bg-red-50 animate-pulse">
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold text-lg">מקליט שיחה...</span>
                  <Mic className="w-6 h-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Processing Animation */}
          {isProcessing && (
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-blue-700 font-semibold text-lg">מעבד הקלטה ומחלץ נתונים...</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording && !isProcessing && (
              <Button 
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg"
              >
                <Mic className="w-6 h-6 ml-2" />
                התחל הקלטה
              </Button>
            )}
            
            {isRecording && (
              <Button 
                onClick={stopRecording}
                variant="destructive"
                className="px-8 py-3 text-lg"
              >
                <Square className="w-6 h-6 ml-2" />
                עצור הקלטה
              </Button>
            )}
          </div>
          
          {/* Transcribed Text */}
          {transcribedText && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-foreground">תמליל השיחה:</h3>
                {extractedData?.highlightedTranscript ? (
                  <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto text-right">
                    <div 
                      className="whitespace-pre-wrap text-foreground transcript-highlights"
                      dangerouslySetInnerHTML={{ __html: extractedData.highlightedTranscript }}
                    />
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto text-right">
                    <p className="whitespace-pre-wrap text-foreground">{transcribedText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Extracted Data */}
          {extractedData && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">מצב הלקוח הנוכחי:</h3>
                  <p className="text-muted-foreground">{extractedData.customerStatus}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">סיכום השיחה:</h3>
                  <p className="text-muted-foreground">{extractedData.summary}</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">מוצרי ביטוח נוכחיים:</h3>
                    <div className="space-y-2">
                      {extractedData.currentProducts.map((product, index) => (
                        <div key={index} className="bg-accent/30 border border-border p-3 rounded-lg">
                          <p className="font-medium text-foreground">{product.company} - {product.productName}</p>
                          <p className="text-sm text-muted-foreground">{product.subType}</p>
                          <p className="text-sm text-foreground">סכום: ₪{product.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">מוצרים מומלצים:</h3>
                    <div className="space-y-2">
                      {extractedData.suggestedProducts.map((product, index) => (
                        <div key={index} className="bg-primary/20 border border-primary/30 p-3 rounded-lg">
                          <p className="font-medium text-foreground">{product.company} - {product.productName}</p>
                          <p className="text-sm text-muted-foreground">{product.subType}</p>
                          <p className="text-sm text-foreground">סכום: ₪{product.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  <CheckCircle className="w-6 h-6 ml-2" />
                  אשר ויצר מוצרים
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;