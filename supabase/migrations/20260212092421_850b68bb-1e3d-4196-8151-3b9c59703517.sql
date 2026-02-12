
-- Enable realtime for staff_profiles and user_roles
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
