-- VER RELACIONES DE MEMBRESÍAS
SELECT 
    m.user_id,
    m.business_id,
    p.business_name
FROM public.business_memberships m
JOIN public.projects p ON m.business_id = p.id
LIMIT 10;
