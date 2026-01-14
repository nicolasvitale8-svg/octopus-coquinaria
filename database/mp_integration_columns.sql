-- Agregar columnas para tracking de transacciones importadas de Mercado Pago
-- Ejecutar en Supabase SQL Editor

-- Agregar columna source para identificar origen de la transacción
ALTER TABLE fin_transactions 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT NULL;

-- Agregar columna external_id para evitar duplicados
ALTER TABLE fin_transactions 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(100) DEFAULT NULL;

-- Crear índice para búsqueda rápida de duplicados
CREATE INDEX IF NOT EXISTS idx_fin_transactions_external 
ON fin_transactions(source, external_id) 
WHERE source IS NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN fin_transactions.source IS 'Origen de la transacción: mercadopago, manual, import, etc';
COMMENT ON COLUMN fin_transactions.external_id IS 'ID externo para evitar duplicados (ej: payment_id de MP)';
