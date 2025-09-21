import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceProductInputProps {
  onProductAnalyzed: (productData: any) => void;
}

const VoiceProductInput: React.FC<VoiceProductInputProps> = ({ onProductAnalyzed }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "מתחיל הקלטה",
        description: "תאמר את פרטי המוצר...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "שגיאה בהקלטה",
        description: "לא ניתן להתחיל הקלטה. בדוק הרשאות מיקרופון.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      toast({
        title: "מעבד הקלטה",
        description: "מתמלל ומנתח את המידע...",
      });
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // Step 1: Transcribe audio to text
      const { data: transcriptionResult, error: transcriptionError } = await supabase.functions.invoke(
        'voice-to-text',
        {
          body: { audio: base64Audio }
        }
      );

      if (transcriptionError) {
        throw new Error('שגיאה בתמלול: ' + transcriptionError.message);
      }

      const transcribedText = transcriptionResult.text;
      console.log('Transcribed text:', transcribedText);

      if (!transcribedText || transcribedText.trim() === '') {
        throw new Error('לא זוהה טקסט בהקלטה');
      }

      // Step 2: Analyze the transcribed text to extract product data
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        'analyze-product-speech',
        {
          body: { text: transcribedText }
        }
      );

      if (analysisError) {
        throw new Error('שגיאה בניתוח: ' + analysisError.message);
      }

      const productData = analysisResult.productData;
      console.log('Analyzed product data:', productData);

      toast({
        title: "הקלטה עובדה בהצלחה",
        description: `זוהה: ${productData.productName} של ${productData.company}`,
      });

      onProductAnalyzed({
        ...productData,
        transcribedText: transcribedText
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "שגיאה בעיבוד",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 glass rounded-lg">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">הוספת מוצר בהקלטה</h3>
        <p className="text-sm text-muted-foreground">
          לחץ על כפתור ההקלטה ותאמר את פרטי המוצר
        </p>
        <p className="text-xs text-muted-foreground">
          דוגמה: "קופת גמל של מגדל, סכום של 200,000 שקל, דמי ניהול 2%"
        </p>
      </div>

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className={`w-24 h-24 rounded-full transition-all duration-300 ${
          isRecording ? 'animate-pulse' : ''
        }`}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>

      <p className="text-sm text-center">
        {isProcessing 
          ? 'מעבד הקלטה...'
          : isRecording 
            ? 'מקליט... לחץ שוב לעצירה'
            : 'לחץ להתחלת הקלטה'
        }
      </p>
    </div>
  );
};

export default VoiceProductInput;