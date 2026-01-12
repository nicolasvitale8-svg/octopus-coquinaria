
-- ==============================================================================
-- 🐙 RESET DE CONTRASEÑA: NICOLÁS VITALE
-- Setea la contraseña para nicolasvitale8@gmail.com a 'Octopus2026!'
-- ==============================================================================

UPDATE auth.users
SET encrypted_password = crypt('Octopus2026!', gen_salt('bf'))
WHERE email = 'nicolasvitale8@gmail.com';

-- Aseguramos que el usuario esté confirmado y no bloqueado
UPDATE auth.users
SET confirmation_token = '',
    recovery_token = '',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    last_sign_in_at = NULL,
    is_sso_user = false -- Por si hubo intentos con Google que fallaron
WHERE email = 'nicolasvitale8@gmail.com';

-- VERIFICACIÓN: Ver si el usuario existe en auth.users
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'nicolasvitale8@gmail.com';
