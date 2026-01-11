-- Verificación rápida del estado actual de RLS
-- Ejecutar para ver qué políticas están activas

SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('project_members', 'eventos_calendario', 'projects')
ORDER BY tablename, policyname;

-- Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('project_members', 'eventos_calendario', 'projects');

-- Contar eventos
SELECT COUNT(*) as total_eventos FROM eventos_calendario;

-- Verificar membresía de Juan Pablo específicamente
SELECT 
    pm.user_id,
    pm.project_id,
    pm.role_id,
    u.email,
    p.business_name,
    r.name as rol_nombre
FROM project_members pm
JOIN usuarios u ON pm.user_id = u.id
JOIN projects p ON pm.project_id = p.id
LEFT JOIN roles r ON pm.role_id = r.id
WHERE u.email = 'juanpablogerchunoff@gmail.com';
