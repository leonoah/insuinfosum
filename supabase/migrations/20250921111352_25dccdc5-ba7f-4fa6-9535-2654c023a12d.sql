-- Fix critical security vulnerability in agent_info table
-- Remove the dangerous policy that allows public access to sensitive agent contact information

-- Drop the existing dangerous policy that allows all operations without authentication
DROP POLICY IF EXISTS "Allow all operations on agent_info" ON public.agent_info;

-- Create secure RLS policies for the agent_info table
-- Only authenticated users with admin role can access agent information
CREATE POLICY "Admins can view agent info" 
ON public.agent_info 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert agent info" 
ON public.agent_info 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update agent info" 
ON public.agent_info 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete agent info" 
ON public.agent_info 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Ensure RLS is enabled on the agent_info table
ALTER TABLE public.agent_info ENABLE ROW LEVEL SECURITY;