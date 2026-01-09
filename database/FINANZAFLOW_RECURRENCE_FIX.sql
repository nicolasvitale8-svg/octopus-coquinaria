-- Add columns for recurrence and installments to fin_budget_items
ALTER TABLE public.fin_budget_items 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_installment INTEGER DEFAULT 1;

-- Add a comment to explain the columns
COMMENT ON COLUMN public.fin_budget_items.is_recurring IS 'Indicates if the item should repeat every month';
COMMENT ON COLUMN public.fin_budget_items.total_installments IS 'Total number of installments (1 if not split)';
COMMENT ON COLUMN public.fin_budget_items.current_installment IS 'The sequence number of the current installment';
