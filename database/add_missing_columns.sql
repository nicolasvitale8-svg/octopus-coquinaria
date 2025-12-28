-- Add missing columns to projects table to match TypeScript interface
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS drive_url TEXT,
ADD COLUMN IF NOT EXISTS chatgpt_url TEXT;

-- Verify columns (optional select to confirm no error)
SELECT id, business_name, drive_url, chatgpt_url FROM public.projects LIMIT 1;
