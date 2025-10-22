import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceTextInputProps {
  onTextProcessed: (enhancedText: string, transcribedText: string) => void;
  textType: 'currentSituation' | 'meetingContext' | 'decisions';
  buttonText?: string;
  description?: string;
}

const VoiceTextInput: React.FC<VoiceTextInputProps> = ({ 
  onTextProcessed, 
  textType, 
  buttonText = "הקלטה קולית",
  description = "לחץ להקלטה ותמלול אוטומטי"
}) => {
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
        description: "תדבר בבירור...",
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
        description: "מתמלל ומעצב את הטקסט...",
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

      // Process audio with transcription and enhancement
      const { data: result, error } = await supabase.functions.invoke(
        'voice-to-enhanced-text',
        {
          body: { 
            audio: base64Audio,
            textType: textType 
          }
        }
      );

      if (error) {
        throw new Error('שגיאה בעיבוד: ' + error.message);
      }

      const { transcribedText, enhancedText } = result;
      console.log('Transcribed text:', transcribedText);
      console.log('Enhanced text:', enhancedText);

      if (!enhancedText || enhancedText.trim() === '') {
        throw new Error('לא זוהה טקסט בהקלטה');
      }

      toast({
        title: "הקלטה עובדה בהצלחה",
        description: "הטקסט תומלל ועוצב אוטומטית",
      });

      onTextProcessed(enhancedText, transcribedText);

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
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      variant="outline"
      size="sm"
      className={`transition-all duration-300 ${
        isRecording ? 'animate-pulse border-destructive text-destructive' : 'border-primary/50 hover:border-primary'
      }`}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};

export default VoiceTextInput;