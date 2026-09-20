-- Create Student Profiles Table (profile_ledger)
CREATE TABLE public.profile_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course TEXT,
    contact_number TEXT,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create Payables Table (linked to profile_ledger)
CREATE TABLE public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_ledger_id UUID REFERENCES public.profile_ledger(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    deadline DATE,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create Transaction Records Table (linked to payables & profile_ledger)
CREATE TABLE public.transaction_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payable_id UUID REFERENCES public.payables(id) ON DELETE SET NULL,
    profile_ledger_id UUID REFERENCES public.profile_ledger(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('full', 'partial')),
    note TEXT,
    recorded_by TEXT, -- Storing email or name for now, could be auth.uid() later
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Optional but recommended: Create Edit Requests Table (for the frontend functionality we built)
CREATE TABLE public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.transaction_records(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    requested_by TEXT NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Optional but recommended: Create Audit Logs Table (for the frontend functionality we built)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user" TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables to secure them
ALTER TABLE public.profile_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies allowing authenticated users to read/write 
-- (Since we enforce Roles like "Admin" and "Treasurer" in the Vue frontend)
CREATE POLICY "Allow authenticated full access to profile_ledger" ON public.profile_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to payables" ON public.payables FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to transaction_records" ON public.transaction_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to edit_requests" ON public.edit_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);
