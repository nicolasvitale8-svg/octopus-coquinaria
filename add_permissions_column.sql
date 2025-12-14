-- Add permissions column to users table
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';

-- Safely update type check-constraint if it exists, or just ensure 'manager' is allowed
-- Note: Supabase often uses text for roles, but if there's an enum, we might need to handle it.
-- For now, we assume 'role' is a text column or we just add the column if missing.

-- (Optional) Set default permissions for existing admins
UPDATE public.usuarios
SET permissions = ARRAY['view_dashboard', 'view_calendar', 'view_finance', 'edit_calendar', 'manage_users', 'view_ticker']
WHERE role = 'admin';
