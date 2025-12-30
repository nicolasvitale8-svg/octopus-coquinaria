-- ==========================================
-- 🐙 FIX_LEADS_SCHEMA_V4.sql
-- Arreglo de esquema para diagnosticos_express y robustez de perfiles
-- ==========================================

-- 1. Añadir columnas faltantes a diagnosticos_express
ALTER TABLE public.diagnosticos_express 
ADD COLUMN IF NOT EXISTS cogs_percentage numeric,
ADD COLUMN IF NOT EXISTS labor_percentage numeric,
ADD COLUMN IF NOT EXISTS margin_percentage numeric;

-- 2. Asegurar que el Admin y Consultores tengan acceso total a Leads
DROP POLICY IF EXISTS "policy_leads_visibility" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_visibility" ON public.diagnosticos_express
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (public.get_auth_role() = 'consultant') OR
  (contact_email = auth.jwt()->>'email')
);

-- 3. Robustecer el disparador de creación de perfil (usuarios)
-- Para que maneje mejor los metadatos y asegure que el perfil existe siempre
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asegurar que las políticas de usuarios permitan ver a todos los colaboradores al Admin
DROP POLICY IF EXISTS "Perfiles visibles por Admins y dueños" ON public.usuarios;
CREATE POLICY "Perfiles visibles por Admins y dueños" ON public.usuarios
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (auth.uid() = id)
);

SELECT '✅ ESQUEMA DE LEADS Y PERFILES ACTUALIZADO.' as status;
