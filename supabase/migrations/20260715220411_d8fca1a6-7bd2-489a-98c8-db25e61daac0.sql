
INSERT INTO public.user_roles (user_id, role)
VALUES ('c827a1dd-bb0d-425c-b2aa-3dfa607bb6fe', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id = '987dcbb4-9e1f-4686-a2ed-8c106b7bddc4' AND role = 'admin';
