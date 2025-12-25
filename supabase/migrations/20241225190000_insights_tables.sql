-- =============================================
-- FeliceFit - Insights IA Tables
-- Fase 19: Tabelas para insights e relatórios IA
-- =============================================

-- Tabela de insights gerados
CREATE TABLE IF NOT EXISTS public.fitness_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10),
    data JSONB DEFAULT NULL,
    action JSONB DEFAULT NULL,
    viewed BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para fitness_insights
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.fitness_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON public.fitness_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON public.fitness_insights(user_id, priority) WHERE NOT dismissed;
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.fitness_insights(user_id, type);
CREATE INDEX IF NOT EXISTS idx_insights_category ON public.fitness_insights(user_id, category);

-- Constraint único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_insights_unique
ON public.fitness_insights(user_id, type, category, title)
WHERE NOT dismissed;

-- Tabela de relatórios IA
CREATE TABLE IF NOT EXISTS public.fitness_ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para fitness_ai_reports
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON public.fitness_ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_tipo ON public.fitness_ai_reports(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_created ON public.fitness_ai_reports(user_id, created_at DESC);

-- Adicionar coluna de configurações de alerta no perfil
ALTER TABLE public.fitness_profiles
ADD COLUMN IF NOT EXISTS alert_settings JSONB DEFAULT '{"notifyCritical": true, "notifyHigh": true, "dailySummary": true, "summaryTime": "08:00"}'::jsonb;

-- Adicionar colunas para objetivos especiais (esqui)
ALTER TABLE public.fitness_profiles
ADD COLUMN IF NOT EXISTS ski_trip_date DATE DEFAULT NULL;

ALTER TABLE public.fitness_profiles
ADD COLUMN IF NOT EXISTS revolade_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.fitness_profiles
ADD COLUMN IF NOT EXISTS revolade_horario VARCHAR(10) DEFAULT '07:00';

ALTER TABLE public.fitness_profiles
ADD COLUMN IF NOT EXISTS revolade_restricao_horas INTEGER DEFAULT 4;

-- Enable RLS
ALTER TABLE public.fitness_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_ai_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fitness_insights
DROP POLICY IF EXISTS "Usuários veem seus insights" ON public.fitness_insights;
CREATE POLICY "Usuários veem seus insights"
    ON public.fitness_insights FOR ALL
    USING (auth.uid() = user_id);

-- Políticas RLS para fitness_ai_reports
DROP POLICY IF EXISTS "Usuários veem seus relatórios" ON public.fitness_ai_reports;
CREATE POLICY "Usuários veem seus relatórios"
    ON public.fitness_ai_reports FOR ALL
    USING (auth.uid() = user_id);

-- Função para limpar insights antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_insights()
RETURNS void AS $$
BEGIN
    DELETE FROM public.fitness_insights
    WHERE dismissed = true
    AND dismissed_at < NOW() - INTERVAL '30 days';

    DELETE FROM public.fitness_insights
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para limpar relatórios antigos (mais de 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS void AS $$
BEGIN
    DELETE FROM public.fitness_ai_reports
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND tipo = 'weekly';

    DELETE FROM public.fitness_ai_reports
    WHERE created_at < NOW() - INTERVAL '365 days'
    AND tipo = 'monthly';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE public.fitness_insights IS 'Insights gerados automaticamente para o usuário';
COMMENT ON TABLE public.fitness_ai_reports IS 'Relatórios gerados por IA';
COMMENT ON COLUMN public.fitness_insights.type IS 'Tipo: achievement, pattern, trend, alert, recommendation, prediction, optimization, correlation, milestone, anomaly';
COMMENT ON COLUMN public.fitness_insights.priority IS 'Prioridade: low, medium, high, critical';
COMMENT ON COLUMN public.fitness_insights.category IS 'Categoria: workout, nutrition, body, sleep, wellness, hydration, consistency, goals, health';
