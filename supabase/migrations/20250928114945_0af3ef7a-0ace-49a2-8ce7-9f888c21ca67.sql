-- Create a public bucket for WhatsApp reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('whatsapp-reports', 'whatsapp-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create RLS policies for the WhatsApp reports bucket
CREATE POLICY "WhatsApp reports are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'whatsapp-reports');

CREATE POLICY "Users can upload WhatsApp reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'whatsapp-reports');