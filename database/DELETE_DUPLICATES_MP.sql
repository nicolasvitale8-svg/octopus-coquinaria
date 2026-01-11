-- Script para eliminar movimientos duplicados de Mercado Pago
-- Período: 1 al 9 de enero de 2026
-- IMPORTANTE: Ejecutar en Supabase SQL Editor

-- Primero, ver qué se va a eliminar (SELECT para revisar antes de DELETE)
SELECT id, date, description, amount, type, created_at
FROM fin_transactions
WHERE date >= '2026-01-01' 
  AND date <= '2026-01-09'
ORDER BY date, description, amount;

-- ⚠️ ADVERTENCIA: El siguiente DELETE eliminará TODOS los movimientos del 1 al 9 de enero
-- Si solo quieres eliminar duplicados y dejar 1 de cada uno, usa la segunda opción

-- OPCIÓN 1: Eliminar TODOS los movimientos del 1-9 enero (para reimportar)
DELETE FROM fin_transactions
WHERE date >= '2026-01-01' 
  AND date <= '2026-01-09';

-- OPCIÓN 2: Eliminar solo duplicados (mantener 1 de cada uno)
-- Esto mantiene el registro más antiguo (por created_at) de cada combinación fecha+descripción+monto
/*
DELETE FROM fin_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY date, description, amount, type
             ORDER BY created_at ASC
           ) as rn
    FROM fin_transactions
    WHERE date >= '2026-01-01' AND date <= '2026-01-09'
  ) sub
  WHERE rn > 1
);
*/
