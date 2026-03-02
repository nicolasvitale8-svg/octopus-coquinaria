-- Add SAVINGS type to fin_budget_items CHECK constraint
-- This allows budget items of type "Ahorro / Inversión"

ALTER TABLE public.fin_budget_items 
DROP CONSTRAINT IF EXISTS fin_budget_items_type_check;

ALTER TABLE public.fin_budget_items 
ADD CONSTRAINT fin_budget_items_type_check 
CHECK (type IN ('IN', 'OUT', 'SAVINGS'));
