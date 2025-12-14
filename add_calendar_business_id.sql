-- Add business_id to eventos_calendario
ALTER TABLE public.eventos_calendario 
ADD COLUMN IF NOT EXISTS business_id uuid; -- Nullable implies public/global

-- (Optional) Add RLS policy for this later
-- CREATE POLICY "Clients see their own events" ON eventos_calendario
-- FOR SELECT USING (business_id IS NULL OR business_id = auth.uid() OR auth.jwt()->>'role' = 'admin');
