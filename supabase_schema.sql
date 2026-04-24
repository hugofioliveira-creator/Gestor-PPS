-- 1. Garante que as funções de UUID estão disponíveis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Projetos
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 3. Tabela de Tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    responsible TEXT,
    deadline DATE,
    status TEXT DEFAULT 'por-fazer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Pivots
CREATE TABLE IF NOT EXISTS public.pivots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pivots ENABLE ROW LEVEL SECURITY;

-- 6. Limpar e recriar políticas para evitar erros de duplicado
DROP POLICY IF EXISTS "Acesso Total" ON public.projects;
DROP POLICY IF EXISTS "Acesso Total" ON public.tasks;
DROP POLICY IF EXISTS "Acesso Total" ON public.pivots;
DROP POLICY IF EXISTS "Allow all for now" ON public.projects;
DROP POLICY IF EXISTS "Allow all for now" ON public.tasks;
DROP POLICY IF EXISTS "Allow all for now" ON public.pivots;

CREATE POLICY "Acesso Total" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON public.pivots FOR ALL USING (true) WITH CHECK (true);
