-- ADD PILLARS TO ACADEMY
-- Adds a text array column to tag resources with 7P pillars (Orden, Creatividad, etc.)

ALTER TABLE public.recursos_academia 
ADD COLUMN IF NOT EXISTS pilares text[] DEFAULT '{}';

-- Allow public read (already covered by previous policy, but good to be safe)
-- The 'Allow Public Sync Academy' policy we created covers ALL operations for anon, so we are good.

COMMENT ON COLUMN public.recursos_academia.pilares IS 'Array of 7P keys: orden, creatividad, tecnologia, observacion, pragmatismo, universalidad, sutileza';
