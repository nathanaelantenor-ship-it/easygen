-- ========================================================
-- APP TESTE V2.1: SCHEMA DE BANCO DE DADOS & ROW LEVEL SECURITY (RLS)
-- Multi-Tenant seguro por user_id conectado ao Supabase Auth
-- ========================================================

-- 1. TABELA DE PERFIS DE USUÁRIO
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  business_type TEXT DEFAULT 'Designer',
  team_size TEXT DEFAULT 'sozinho',
  theme TEXT DEFAULT 'light',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  dashboard_widgets JSONB DEFAULT '{"attention":true,"finance":true,"cashflow":true,"commercial":true,"health":true,"projects":true,"deliveries":true,"goals":true,"routine":true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seu próprio perfil" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  channel TEXT DEFAULT 'Indicação',
  client_type TEXT DEFAULT 'pontual',
  status TEXT DEFAULT 'active',
  total_generated NUMERIC DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus clientes" ON public.clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. TABELA DE LEADS (CRM)
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  stage TEXT DEFAULT 'lead',
  channel TEXT,
  service_of_interest TEXT,
  estimated_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  client_name TEXT,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'Briefing',
  progress INTEGER DEFAULT 0,
  value NUMERIC DEFAULT 0,
  deadline DATE,
  links JSONB DEFAULT '{"figma":"","drive":"","notion":"","github":""}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus projetos" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. TABELA DE ENTREGAS (KANBAN)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  project_id TEXT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'media',
  due_date DATE,
  assignee TEXT,
  tags JSONB DEFAULT '[]',
  description TEXT,
  checklist JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id ON public.deliveries(project_id);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas suas entregas" ON public.deliveries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  project_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  scope TEXT DEFAULT 'business' CHECK (scope IN ('business', 'personal')),
  due_date DATE NOT NULL,
  paid_at DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  installment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas suas transações" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. TABELA DE INBOX & CAPTURA RÁPIDA
CREATE TABLE IF NOT EXISTS public.inbox (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'ideia',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  suggested_type TEXT DEFAULT 'task',
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inbox_user_id ON public.inbox(user_id);
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seu inbox" ON public.inbox
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. TABELA DE TAREFAS DE ROTINA
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'media',
  due_date DATE,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas suas tarefas" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. TABELA DE AGENDA & EVENTOS
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  project_id TEXT,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'reuniao',
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT DEFAULT 'Google Meet',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus eventos" ON public.events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. TABELA DE HÁBITOS & STREAKS
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  category TEXT DEFAULT 'Produtividade',
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  consistency_rate INTEGER DEFAULT 100,
  completed_today BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus hábitos" ON public.habits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. TABELA DE METAS
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Receita',
  scope TEXT DEFAULT 'business',
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  deadline DATE NOT NULL,
  priority TEXT DEFAULT 'media',
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas suas metas" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. TABELA DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  project_id TEXT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Outros',
  format TEXT DEFAULT 'pdf',
  size TEXT DEFAULT '1.0 MB',
  url TEXT DEFAULT '#',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas seus documentos" ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
