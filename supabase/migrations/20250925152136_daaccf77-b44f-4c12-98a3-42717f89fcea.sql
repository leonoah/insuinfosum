-- Add a default admin user to user_roles table for testing
INSERT INTO public.user_roles (user_id, role) 
SELECT 
  auth.uid(),
  'admin'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a temporary policy to allow admin operations without strict authentication for development
DROP POLICY IF EXISTS "Temp allow all operations on agent_info" ON public.agent_info;
CREATE POLICY "Temp allow all operations on agent_info" 
ON public.agent_info 
FOR ALL 
USING (true) 
WITH CHECK (true);