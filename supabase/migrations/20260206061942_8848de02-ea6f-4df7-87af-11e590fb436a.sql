-- 1) Extend roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'manager';
  END IF;
END $$;

-- 2) Staff profiles (metadata only; roles remain in public.user_roles)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT staff_profiles_restaurant_email_key UNIQUE (restaurant_id, email)
);

CREATE INDEX IF NOT EXISTS staff_profiles_restaurant_id_idx ON public.staff_profiles (restaurant_id);
CREATE INDEX IF NOT EXISTS staff_profiles_email_idx ON public.staff_profiles (email);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Allow employees to see their own record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'staff_profiles'
      AND policyname = 'Staff can view own profile'
  ) THEN
    CREATE POLICY "Staff can view own profile"
    ON public.staff_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Tenant admins: manage staff inside their restaurant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'staff_profiles'
      AND policyname = 'Restaurant admins can manage staff profiles'
  ) THEN
    CREATE POLICY "Restaurant admins can manage staff profiles"
    ON public.staff_profiles
    FOR ALL
    TO authenticated
    USING (
      restaurant_id = public.get_user_restaurant_id(auth.uid())
      AND public.has_role(auth.uid(), 'restaurant_admin')
    )
    WITH CHECK (
      restaurant_id = public.get_user_restaurant_id(auth.uid())
      AND public.has_role(auth.uid(), 'restaurant_admin')
    );
  END IF;
END $$;

-- Super admin: manage all staff profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'staff_profiles'
      AND policyname = 'Super admins can manage all staff profiles'
  ) THEN
    CREATE POLICY "Super admins can manage all staff profiles"
    ON public.staff_profiles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_staff_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_staff_profiles_updated_at
    BEFORE UPDATE ON public.staff_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
