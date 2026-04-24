-- Tabela de Projetos
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

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    responsible TEXT,
    deadline DATE,
    status TEXT DEFAULT 'por-fazer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pivots
CREATE TABLE IF NOT EXISTS public.pivots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Opcional, mas recomendado para produção)
-- Por agora, vamos permitir acesso total para simplificar se o utilizador não configurou Auth
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pivots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for now" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.pivots FOR ALL USING (true) WITH CHECK (true);
