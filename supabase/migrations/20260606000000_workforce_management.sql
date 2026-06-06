-- =======================================================================================
-- WORKFORCE & SHIFT MANAGEMENT MODULE
-- =======================================================================================

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to Supabase Auth user
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF', 'SUPERVISOR', 'OWNER')),
    phone TEXT,
    status TEXT DEFAULT 'OFF_DUTY' CHECK (status IN ('ACTIVE', 'ON_BREAK', 'OFF_DUTY', 'TERMINATED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, username)
);

-- 2. Create employee_shifts table
CREATE TABLE IF NOT EXISTS public.employee_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL, -- e.g., 'Morning Shift', 'Night Shift'
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    expected_hours NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create employee_attendance (Shift Logs)
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.employee_shifts(id) ON DELETE SET NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    total_worked_minutes INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create employee_breaks
CREATE TABLE IF NOT EXISTS public.employee_breaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID NOT NULL REFERENCES public.employee_attendance(id) ON DELETE CASCADE,
    break_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    break_end TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create employee_assignments (Waiter Table Assignment)
CREATE TABLE IF NOT EXISTS public.employee_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    UNIQUE(employee_id, table_id, unassigned_at)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Tenant Isolation)
CREATE POLICY "Enable read for users based on restaurant_id" ON public.employees
    FOR SELECT USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable all for users based on restaurant_id" ON public.employees
    FOR ALL USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- Shifts RLS
CREATE POLICY "Enable read for users based on restaurant_id" ON public.employee_shifts
    FOR SELECT USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable all for users based on restaurant_id" ON public.employee_shifts
    FOR ALL USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- Attendance RLS
CREATE POLICY "Enable read for users based on restaurant_id" ON public.employee_attendance
    FOR SELECT USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable all for users based on restaurant_id" ON public.employee_attendance
    FOR ALL USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- Breaks RLS (Joins through attendance)
CREATE POLICY "Enable read for users based on attendance" ON public.employee_breaks
    FOR SELECT USING (attendance_id IN (
        SELECT id FROM public.employee_attendance WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Enable all for users based on attendance" ON public.employee_breaks
    FOR ALL USING (attendance_id IN (
        SELECT id FROM public.employee_attendance WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    ));

-- Assignments RLS
CREATE POLICY "Enable read for users based on restaurant_id" ON public.employee_assignments
    FOR SELECT USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable all for users based on restaurant_id" ON public.employee_assignments
    FOR ALL USING (restaurant_id IN (
        SELECT restaurant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));
