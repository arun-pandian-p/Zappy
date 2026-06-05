-- ============================================================
-- ZAPPY - STEP 02: SEED SUPER ADMIN USER
-- Run this AFTER 00_MASTER_MIGRATION.sql
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your new Supabase project dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User" (Invite method or Create)
-- 4. Create a user with:
--      Email:    arunpandi47777@gmail.com   (or your email)
--      Email:    zappyscan@gmail.com   (or your email)
--      Password: (set your password)
-- 5. Run this SQL
-- ============================================================

-- STEP A: Seeding using the provided User UUID b73b4c46-a8d5-463e-bb40-f074cf238203
DO $$
DECLARE
  v_user_id UUID := 'b73b4c46-a8d5-463e-bb40-f074cf238203';
  v_email TEXT := 'zappyscan@gmail.com';
BEGIN
  -- Assign super_admin role (no restaurant_id for super_admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, restaurant_id, role) DO NOTHING;

  -- Create super admin profile
  INSERT INTO public.super_admin_profile (user_id, display_name)
  VALUES (v_user_id, 'Super Admin')
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the action
  INSERT INTO public.system_logs (actor_id, actor_email, action, entity_type, entity_id, details)
  VALUES (v_user_id, v_email, 'bootstrap_super_admin', 'user', v_user_id::text,
    '{"note": "Initial super admin seeded using user provided UUID"}'::jsonb);

  RAISE NOTICE 'Super admin role assigned to user: % (UUID: %)', v_email, v_user_id;
END $$;


-- ============================================================
-- ALTERNATIVE: If you want to use the OLD project's admin user
-- id directly, you can also do it like this (pure SQL approach):
-- ============================================================

-- SELECT id, email FROM auth.users WHERE email = 'arunpandi47777@gmail.com';
-- (Use the returned UUID above)


-- ============================================================
-- VERIFY: After running, check the result
-- ============================================================
-- SELECT ur.user_id, ur.role, ur.restaurant_id, ur.created_at
-- FROM public.user_roles ur
-- WHERE ur.role = 'super_admin';
