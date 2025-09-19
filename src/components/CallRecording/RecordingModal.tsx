import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, CheckCircle, Loader2, MessageCircle, User, Upload, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SelectedProduct } from "@/types/insurance";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (currentProducts: SelectedProduct[], suggestedProducts: SelectedProduct[]) => void;
  initialClientId?: string;
  initialClientName?: string;
}

interface ExtractedData {
  currentProducts: SelectedProduct[];
  suggestedProducts: SelectedProduct[];
  customerStatus: string;
  summary: string;
  highlightedTranscript?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  speaker: 'agent' | 'client';
  speakerName: string;
  timestamp: string;
  confidence?: number;
}

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
}
 
interface RealtimeTranscriptionResponse {
  text?: string;
  confidence?: number;
  speaker?: string;
  timestamp?: string;
}

const RecordingModal = ({ isOpen, onClose, onApprove, initialClientId, initialClientName }: RecordingModalProps) => {
 
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [agentName, setAgentName] = useState<string>("סוכן ביטוח");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkCounterRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);

      // Send chunk to real-time transcription function for live updates
      const { data: transcriptionData, error } = await supabase.functions.invoke<RealtimeTranscriptionResponse>('realtime-transcription', {
        body: { audioChunk: base64Audio, isLive: true }
      });

      if (error) {
        console.error('Transcription error:', error);
        return;
      }

      const trimmedText = transcriptionData?.text?.trim();
      if (trimmedText) {
        const transcribedText = trimmedText;

        const speakerHintRaw = transcriptionData?.speaker?.toLowerCase();
        const speakerHint: 'agent' | 'client' | null = speakerHintRaw
          ? ['agent', 'סוכן', 'סוכנת'].includes(speakerHintRaw)
            ? 'agent'
            : ['client', 'לקוח', 'לקוחה'].includes(speakerHintRaw)
              ? 'client'
              : null
          : null;

        const chunkTimestamp = transcriptionData?.timestamp
          ? new Date(transcriptionData.timestamp).toISOString()
          : new Date().toISOString();

        const chunkConfidence = typeof transcriptionData?.confidence === 'number'
          ? transcriptionData.confidence
          : undefined;

        // Enhanced speaker detection with scoring
        const agentKeywords = [
          'שלום', 'איך אפשר לעזור', 'אני רוצה להמליץ', 'נראה לי', 'מה דעתך',
          'אני חושב', 'לפי הניסיון שלי', 'אני מציע', 'בואו נבדוק', 'אני יכול להציע',
          'המלצה שלי', 'לפי הניסיון', 'אני ממליץ', 'כדאי לכם', 'התוכנית הכי טובה',
          'עבור אותך', 'בשבילך', 'זה מתאים לך', 'אני אבדוק', 'נסתכל על זה',
          'תעשה כך', 'הכי חשוב', 'שים לב', 'חשוב להבין', 'המטרה שלנו',
          'נבדוק יחד', 'אסביר לך', 'כמו סוכן', 'הניסיון שלי', 'אני כאן בשביל'
        ];
        
        const clientKeywords = [
          'אני מעוניין', 'כמה זה עולה', 'מה זה אומר', 'לא הבנתי', 
          'אני רוצה', 'איך זה עובד', 'תוכל להסביר', 'אני צריך',
          'מה זה כולל', 'כמה אני אשלם', 'זה יקר', 'זה זול', 'יש לי כסף',
          'אני מתלבט', 'לא בטוח', 'צריך לחשוב', 'אשמח לשמוע', 'מה אתה חושב',
          'תמיד רציתי', 'חשבתי על זה', 'שמעתי על זה', 'מה הדעה שלך',
          'איך תעצור לי', 'אני מפחד', 'זה נשמע מעניין', 'רוצה לשמוע עוד'
        ];

        // Split into shorter sentences to show multiple chat bubbles
        const sentences = transcribedText
          .split(/(?<=[.!?…])\s+|\n+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        setChatMessages(prev => {
          const updated = [...prev];
          let lastSpeaker = updated[updated.length - 1]?.speaker;

          sentences.forEach((sentence) => {
            const sLower = sentence.toLowerCase();
            let aScore2 = 0; let cScore2 = 0;
            agentKeywords.forEach(k => { if (sLower.includes(k)) aScore2++; });
            clientKeywords.forEach(k => { if (sLower.includes(k)) cScore2++; });
            let sp: 'agent' | 'client';
            if (speakerHint) {
              sp = speakerHint;
            } else if (aScore2 > cScore2) sp = 'agent';
            else if (cScore2 > aScore2) sp = 'client';
            else sp = lastSpeaker === 'agent' ? 'client' : 'agent';

            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.text === sentence) {
              updated[updated.length - 1] = {
                ...lastMessage,
                speaker: sp,
                speakerName: sp === 'agent' ? agentName : (selectedClient?.client_name || 'לקוח'),
                timestamp: chunkTimestamp,
                confidence: chunkConfidence ?? lastMessage.confidence
              };
              lastSpeaker = sp;
              return;
            }

            const msg: ChatMessage = {
              id: `${Date.now()}-${Math.random()}`,
              text: sentence,
              speaker: sp,
              speakerName: sp === 'agent' ? agentName : (selectedClient?.client_name || 'לקוח'),
              timestamp: chunkTimestamp,
              confidence: chunkConfidence ?? 0.8
            };
            updated.push(msg);
            lastSpeaker = sp;
          });
          console.log('Added', sentences.length, 'messages. Total now:', updated.length);
          return updated;
        });

        // Keep the full raw transcript as well
        setTranscribedText(prev => {
          if (!prev) return transcribedText;
          return prev.includes(transcribedText) ? prev : `${prev} ${transcribedText}`;
        });
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }, [agentName, selectedClient]);

  useEffect(() => {
    if (isOpen) {
      loadAgentAndClients();
    }
  }, [isOpen]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Realtime updates for clients list while modal is open
  useEffect(() => {
    if (!isOpen) return;
    console.log('Subscribing to clients realtime...');
    const channel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (payload) => {
        const newClient = (payload as any).new as Client;
        console.log('Realtime INSERT client:', newClient);
        setClients((prev) => {
          const exists = prev.some(c => c.id === newClient.id);
          const updated = exists ? prev.map(c => c.id === newClient.id ? newClient : c) : [...prev, newClient];
          return updated.sort((a,b)=>a.client_name.localeCompare(b.client_name, 'he'));
        });
        setSelectedClient((curr) => curr ?? newClient);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload) => {
        const updatedClient = (payload as any).new as Client;
        console.log('Realtime UPDATE client:', updatedClient);
        setClients((prev) => prev.map(c => c.id === updatedClient.id ? updatedClient : c)
          .sort((a,b)=>a.client_name.localeCompare(b.client_name, 'he')));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (payload) => {
        const oldId = (payload as any)?.old?.id as string;
        console.log('Realtime DELETE client id:', oldId);
        setClients((prev) => prev.filter(c => c.id !== oldId));
      })
      .subscribe();

    return () => {
      console.log('Unsubscribing clients realtime');
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  const loadAgentAndClients = async () => {
    try {
      console.log('Loading agent and clients...');
      
      // Load agent info
      const { data: agentData, error: agentError } = await supabase
        .from('agent_info')
        .select('name')
        .single();
      
      console.log('Agent data:', agentData, 'Agent error:', agentError);
      
      if (agentData?.name) {
        setAgentName(agentData.name);
        console.log('Agent name set:', agentData.name);
      }

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('client_name');
      
      console.log('Clients data:', clientsData, 'Clients error:', clientsError);
      
      if (clientsData && clientsData.length > 0) {
        setClients(clientsData);
        if (!selectedClient) {
          let defaultClient: Client | undefined;
          if (initialClientId) {
            defaultClient = clientsData.find(c => c.client_id === initialClientId || c.id === initialClientId);
          }
          if (!defaultClient && initialClientName) {
            const targetName = initialClientName.trim();
            defaultClient = clientsData.find(c => c.client_name.trim() === targetName);
          }
          setSelectedClient(defaultClient || clientsData[0]);
        }
        console.log('Clients set:', clientsData.length, 'clients loaded');
      } else {
        console.log('No clients found or empty array');
      }
    } catch (error) {
      console.error('Error loading agent and clients:', error);
    }
  };

  const startRecording = async () => {
    if (!selectedClient) {
      toast({
        title: "שגיאה",
        description: "אנא בחר לקוח מהרשימה",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      chunkCounterRef.current = 0;
      setChatMessages([]);
      setTranscribedText("");
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
          
          // Process chunk for real-time transcription every 2 seconds
          chunkCounterRef.current++;
          if (chunkCounterRef.current % 2 === 0 && event.data.size > 1000) {
            console.log('Processing chunk for transcription, current messages:', chatMessages.length);
            // Create a blob from the last few chunks for better audio quality
            const recentChunks = audioChunksRef.current.slice(-3);
            const combinedBlob = new Blob(recentChunks, { type: 'audio/webm' });
            await processAudioChunk(combinedBlob);
          }
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: "הקלטה החלה",
        description: "השיחה מוקלטת ומתומללת בזמן אמת",
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
    setIsAnalyzing(true);
    
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Create complete audio blob from all chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size === 0) {
          setIsAnalyzing(false);
          toast({
            title: "שגיאה",
            description: "לא נוצר קובץ אודיו תקין",
            variant: "destructive"
          });
          return;
        }

        console.log(`Processing audio blob of size: ${audioBlob.size} bytes`);
        
        // Convert to base64 for transmission
        const base64Audio = await blobToBase64(audioBlob);
        
        // Send to voice-to-text function for full transcription
        const { data: transcriptionData, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) {
          console.error('Transcription error:', error);
          throw error;
        }

        const fullTranscript = transcriptionData?.text || '';
        setTranscribedText(fullTranscript);
        
        if (!fullTranscript || fullTranscript.trim().length === 0) {
          setIsAnalyzing(false);
          toast({
            title: "אין תמלל",
            description: "לא זוהה דיבור בהקלטה",
            variant: "destructive"
          });
          return;
        }
        
        // Extract policy information from full transcript
        const { data: extractionData, error: extractionError } = await supabase.functions.invoke('analyze-call-transcript', {
          body: { 
            transcript: fullTranscript,
            agentName: agentName
          }
        });
        
        if (extractionError) throw extractionError;
        
        setExtractedData(extractionData);
        setIsAnalyzing(false);
        
        toast({
          title: "ניתוח הושלם בהצלחה",
          description: "נתוני הביטוח חולצו מהשיחה",
        });
        
      } catch (error) {
        console.error('Error processing recording:', error);
        setIsAnalyzing(false);
        toast({
          title: "שגיאה",
          description: "לא ניתן לעבד את ההקלטה",
          variant: "destructive"
        });
      }
    };
    
    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ אודיו בלבד",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setChatMessages([]);
    setTranscribedText("");
    setExtractedData(null);

    try {
      // Convert file to base64
      const base64Audio = await blobToBase64(file);
      
      // Send to voice-to-text function for full transcription
      const { data: transcriptionData, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const fullTranscript = transcriptionData.text;
      setTranscribedText(fullTranscript);

      // Extract policy information from transcript
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('analyze-call-transcript', {
        body: { 
          transcript: fullTranscript,
          agentName: agentName
        }
      });

      if (extractionError) throw extractionError;

      setExtractedData(extractionData);
      setIsAnalyzing(false);

      toast({
        title: "העלאה הושלמה בהצלחה",
        description: "נתוני הביטוח חולצו מקובץ האודיו",
      });

    } catch (error) {
      console.error('Error processing uploaded file:', error);
      setIsAnalyzing(false);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעבד את קובץ האודיו",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetModal = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setIsAnalyzing(false);
    setTranscribedText("");
    setExtractedData(null);
    setChatMessages([]);
    setSelectedClient(null);
    audioChunksRef.current = [];
    chunkCounterRef.current = 0;
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
    resetModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">הקלטת שיחה עם לקוח</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Selection */}
          {!isRecording && !isAnalyzing && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <Label className="text-base font-medium">בחירת לקוח</Label>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={loadAgentAndClients}>רענן</Button>
                  </div>
                  <Select value={selectedClient?.id || ""} onValueChange={(value) => {
                    const client = clients.find(c => c.id === value);
                    setSelectedClient(client || null);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר לקוח מהרשימה" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover text-popover-foreground border border-border shadow-lg">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name} ({client.client_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClient && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p><strong>לקוח:</strong> {selectedClient.client_name}</p>
                      <p><strong>ת״ז:</strong> {selectedClient.client_id}</p>
                      <p><strong>סוכן:</strong> {agentName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording Status */}
          {isRecording && (
            <Card className="border-red-500 bg-red-50 animate-pulse">
              <CardContent className="flex items-center justify-center py-4">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">מקליט שיחה עם {selectedClient?.client_name}...</span>
                  <Mic className="w-6 h-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Analyzing Status */}
          {isAnalyzing && (
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="flex items-center justify-center py-4">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-blue-700 font-semibold">מנתח את השיחה ומחלץ נתונים...</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Recording Controls */}
          <div className="flex justify-center gap-4 flex-wrap">
            {!isRecording && !isAnalyzing && (
              <>
                <Button 
                  onClick={startRecording}
                  disabled={!selectedClient}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg disabled:opacity-50"
                >
                  <Mic className="w-6 h-6 ml-2" />
                  התחל הקלטת שיחה
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="px-8 py-3 text-lg"
                >
                  <Upload className="w-6 h-6 ml-2" />
                  העלה קובץ אודיו
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}
            
            {isRecording && (
              <Button 
                onClick={stopRecording}
                variant="destructive"
                className="px-8 py-3 text-lg"
              >
                <Square className="w-6 h-6 ml-2" />
                עצור והתחל ניתוח
              </Button>
            )}
          </div>

          {/* Real-time Chat Window */}
          {(isRecording || chatMessages.length > 0) && (
            <Card className="bg-background border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">שיחה בזמן אמת</h3>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <span className="text-sm">מתמלל...</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto bg-muted/30 p-4 rounded-lg">
                  {chatMessages.length === 0 && isRecording && (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>מתחיל להאזין לשיחה...</span>
                      </div>
                    </div>
                  )}
                  
                  {!isRecording && chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      לא נמצאו הודעות
                    </div>
                  )}
                  
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.speaker === 'agent' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                          message.speaker === 'agent'
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-gray-100 text-gray-900 mr-auto'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-semibold">{message.speakerName}</span>
                          {message.confidence && message.confidence < 0.7 && (
                            <span className="text-xs opacity-70">(איכות נמוכה)</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Full Transcript - only show if not real-time or after completion */}
          {transcribedText && !isRecording && chatMessages.length === 0 && (
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