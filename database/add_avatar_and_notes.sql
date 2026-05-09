-- ============================================================
-- MIGRACIÓN: agregar avatar_url + notes a usuarios
-- ============================================================
-- Idempotente. Correr en Supabase SQL editor (rol postgres/admin).
-- Después crear el bucket "avatars" en Storage (Public access).
--
-- Bucket policy mínima (RLS sobre storage.objects):
-- INSERT/UPDATE/DELETE: el dueño puede operar sobre su propio archivo.
-- SELECT: público.
-- ============================================================

-- 1) Columnas
ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2) Comentarios para autodocumentar
COMMENT ON COLUMN public.usuarios.avatar_url IS 'URL pública de la foto de perfil (Supabase Storage bucket "avatars").';
COMMENT ON COLUMN public.usuarios.notes      IS 'Notas internas del admin sobre el usuario. NO visible al usuario.';

-- 3) Storage bucket policies (correr una sola vez después de crear el bucket "avatars")
-- ----------------------------------------------------------------------
-- Si todavía no creaste el bucket, hacelo desde Storage > New bucket >
-- Name: avatars · Public: true.
-- Después correr lo siguiente:

-- DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
-- CREATE POLICY "avatars_public_read"
--     ON storage.objects FOR SELECT
--     TO public
--     USING (bucket_id = 'avatars');

-- DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
-- CREATE POLICY "avatars_owner_insert"
--     ON storage.objects FOR INSERT
--     TO authenticated
--     WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
-- CREATE POLICY "avatars_owner_update"
--     ON storage.objects FOR UPDATE
--     TO authenticated
--     USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
-- CREATE POLICY "avatars_owner_delete"
--     ON storage.objects FOR DELETE
--     TO authenticated
--     USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Verificación
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='usuarios' AND column_name IN ('avatar_url','notes');
