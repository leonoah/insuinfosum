-- Add leon.noah@gmail.com as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('e08fad27-f7f5-4e2b-8ba2-238b8dfbbc97', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;