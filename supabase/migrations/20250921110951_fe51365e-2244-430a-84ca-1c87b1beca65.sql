-- Fix critical security vulnerability in clients table
-- Remove the overly permissive policy that allows public access to sensitive customer data

-- Drop the existing dangerous policy
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;

-- Create secure RLS policies for the clients table
-- Only authenticated users with admin role can access client data
CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Ensure RLS is enabled on the clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;