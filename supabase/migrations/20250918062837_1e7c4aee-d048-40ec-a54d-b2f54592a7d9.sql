-- Create agent_info table for storing agent details
CREATE TABLE public.agent_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_info ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_info
CREATE POLICY "Allow all operations on agent_info" 
ON public.agent_info 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create reports_log table for tracking generated reports
CREATE TABLE public.reports_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  report_content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports_log ENABLE ROW LEVEL SECURITY;

-- Create policies for reports_log
CREATE POLICY "Allow all operations on reports_log" 
ON public.reports_log 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create updated_at trigger for agent_info
CREATE TRIGGER update_agent_info_updated_at
BEFORE UPDATE ON public.agent_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_reports_log_client_id ON public.reports_log(client_id);
CREATE INDEX idx_reports_log_generated_at ON public.reports_log(generated_at DESC);
CREATE INDEX idx_reports_log_status ON public.reports_log(status);