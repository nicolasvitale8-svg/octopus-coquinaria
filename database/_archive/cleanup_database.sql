-- CLEANUP SCRIPT
-- Deleting unused duplicate tables identified by the user

-- 1. "diagnosticos_express" is the active table (1 row). "diagnostics" is empty (0 rows).
DROP TABLE IF EXISTS diagnostics;

-- 2. "usuarios" is the active table (4 rows). "profiles" is empty (0 rows).
DROP TABLE IF EXISTS profiles;

-- 3. "leads" (6 rows) appears to be legacy. The app uses "diagnosticos_express" for leads.
-- We drop it to avoid confusion.
DROP TABLE IF EXISTS leads;

-- 4. "configuracion" (2 rows) vs "admin_config" (4 rows).
-- Neither seems actively used in the code found so far, but "admin_config" looks more recent.
-- We will keep both for now to be safe, or you can uncomment below to drop 'configuracion'
-- DROP TABLE IF EXISTS configuracion;
