
-- Grant admin role to specified user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('987dcbb4-9e1f-4686-a2ed-8c106b7bddc4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
