
-- Fix user_roles: admins of a restaurant can manage roles for their restaurant
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Restaurant admins can manage staff roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Restaurant admins can view their restaurant roles"
ON public.user_roles FOR SELECT TO authenticated
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant admins can insert staff roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
  AND role NOT IN ('super_admin', 'restaurant_admin')
  AND restaurant_id = get_user_restaurant_id(auth.uid())
);

CREATE POLICY "Restaurant admins can update staff roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
  AND role NOT IN ('super_admin', 'restaurant_admin')
  AND restaurant_id = get_user_restaurant_id(auth.uid())
);

CREATE POLICY "Restaurant admins can delete staff roles"
ON public.user_roles FOR DELETE TO authenticated
USING (
  (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
  AND role NOT IN ('super_admin', 'restaurant_admin')
  AND restaurant_id = get_user_restaurant_id(auth.uid())
);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Fix staff_profiles RLS
DROP POLICY IF EXISTS "Restaurant admins can manage their staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Super admins can manage all staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff_profiles;

CREATE POLICY "Staff can view own profile"
ON public.staff_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Restaurant admins can manage their staff"
ON public.staff_profiles FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'restaurant_admin') AND restaurant_id = get_user_restaurant_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin')
);

-- Ensure restaurants table has proper SELECT for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view restaurants" ON public.restaurants;
CREATE POLICY "Authenticated users can view restaurants"
ON public.restaurants FOR SELECT TO authenticated
USING (true);
