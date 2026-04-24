-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    urgency INTEGER DEFAULT 1,
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    responsible TEXT,
    deadline DATE,
    status TEXT DEFAULT 'por-fazer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pivots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pivots ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow all access" ON public.projects;
DROP POLICY IF EXISTS "Allow all access" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access" ON public.pivots;
DROP POLICY IF EXISTS "Allow all for now" ON public.projects;
DROP POLICY IF EXISTS "Allow all for now" ON public.tasks;
DROP POLICY IF EXISTS "Allow all for now" ON public.pivots;
DROP POLICY IF EXISTS "Acesso Total" ON public.projects;
DROP POLICY IF EXISTS "Acesso Total" ON public.tasks;
DROP POLICY IF EXISTS "Acesso Total" ON public.pivots;

-- 4. Create new inclusive policies
CREATE POLICY "Allow all access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.pivots FOR ALL USING (true) WITH CHECK (true);
