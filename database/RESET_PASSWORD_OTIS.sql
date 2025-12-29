-- ==============================================================================
-- 🐙 RESET DE CONTRASEÑA: OTIS
-- Setea la contraseña para otisdeled@gmail.com a 'Otis231079'
-- ==============================================================================

UPDATE auth.users
SET encrypted_password = crypt('Otis231079', gen_salt('bf'))
WHERE email = 'otisdeled@gmail.com';

-- También aseguramos que el usuario no esté bloqueado
UPDATE auth.users
SET confirmation_token = '',
    recovery_token = '',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    last_sign_in_at = NULL -- Esto fuerza un refresco de sesión
WHERE email = 'otisdeled@gmail.com';

SELECT '✅ CONTRASEÑA ACTUALIZADA PARA: otisdeled@gmail.com' as status;
