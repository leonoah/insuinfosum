-- עדכון מדיניות RLS עבור טבלת clients להרשאות פתוחות יותר
-- המערכת מיועדת לסוכן אחד שמנהל לקוחות

-- מחיקת המדיניות הקיימות
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- הוספת מדיניות חדשה שמאפשרת גישה מלאה
CREATE POLICY "Allow all operations on clients"
ON public.clients
FOR ALL
USING (true)
WITH CHECK (true);