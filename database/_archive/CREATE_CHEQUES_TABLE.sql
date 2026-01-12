-- 1. Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create Finance Cheques Table
CREATE TABLE IF NOT EXISTS public.finance_cheques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Core Details
    cheque_number TEXT NOT NULL,
    bank_name TEXT NOT NULL, -- Banco Galicia, Santander, etc.
    amount DECIMAL(12,2) NOT NULL,
    
    -- Dates
    issue_date DATE NOT NULL, -- Fecha Emisión
    payment_date DATE NOT NULL, -- Fecha de Cobro/Vencimiento
    
    -- Type & Status
    type TEXT NOT NULL CHECK (type IN ('PROPIO', 'TERCERO')),
    status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'ENTREGADO', 'DEPOSITADO', 'COBRADO', 'ANULADO', 'RECHAZADO')),
    
    -- Context
    recipient_sender TEXT, -- A quien se le dio o de quien se recibio
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_finance_cheques_project ON public.finance_cheques(project_id);
CREATE INDEX IF NOT EXISTS idx_finance_cheques_payment_date ON public.finance_cheques(payment_date);

-- 4. Enable RLS
ALTER TABLE public.finance_cheques ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Drop existing policy if it exists to avoid error on rerun
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.finance_cheques;

CREATE POLICY "Enable all access for authenticated users" ON public.finance_cheques
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Add Trigger for updated_at
-- Drop trigger if exists to avoid error
DROP TRIGGER IF EXISTS update_finance_cheques_modtime ON public.finance_cheques;

CREATE TRIGGER update_finance_cheques_modtime
    BEFORE UPDATE ON public.finance_cheques
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
