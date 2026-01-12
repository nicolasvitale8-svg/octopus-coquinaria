-- Add finanzaflow_enabled to projects table to control module access
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS finanzaflow_enabled BOOLEAN DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN public.projects.finanzaflow_enabled IS 'Determines if the business financial module (FinanzaFlow) is active for this project';
