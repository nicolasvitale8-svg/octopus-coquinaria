-- ===========================================
-- AGREGAR COLUMNA CREDIT_LIMIT A FIN_ACCOUNTS
-- ===========================================
-- Esta columna permite almacenar el límite de crédito para tarjetas de crédito

ALTER TABLE fin_accounts 
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT NULL;

-- Comentario para documentar
COMMENT ON COLUMN fin_accounts.credit_limit IS 'Límite de crédito para tarjetas de crédito. NULL para otros tipos de cuenta.';

-- Verificar que se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fin_accounts' AND column_name = 'credit_limit';
