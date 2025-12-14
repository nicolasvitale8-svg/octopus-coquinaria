-- ASEGURAR ACCESO ADMIN AL DUEÑO
-- Este script busca al usuario por email y le asigna el rol 'admin' de forma permanente en la base de datos.
-- Esto es necesario antes de eliminar la "puerta trasera" del código.

UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

-- Verificación (opcional)
SELECT email, role FROM public.usuarios WHERE email = 'nicolasvitale8@gmail.com';
