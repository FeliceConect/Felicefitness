-- Criar tabela de atividades extras
CREATE TABLE IF NOT EXISTS fitness_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    activity_type TEXT NOT NULL,
    custom_name TEXT,
    duration_minutes INTEGER NOT NULL,
    intensity TEXT NOT NULL CHECK (intensity IN ('leve', 'moderado', 'intenso', 'muito_intenso')),
    calories_burned INTEGER,
    distance_km DECIMAL(10, 2),
    heart_rate_avg INTEGER,
    notes TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_fitness_activities_user_id ON fitness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_date ON fitness_activities(date);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_user_date ON fitness_activities(user_id, date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fitness_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fitness_activities_updated_at ON fitness_activities;
CREATE TRIGGER trigger_fitness_activities_updated_at
    BEFORE UPDATE ON fitness_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_fitness_activities_updated_at();

-- Habilitar RLS
ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver suas próprias atividades" ON fitness_activities;
CREATE POLICY "Usuários podem ver suas próprias atividades"
    ON fitness_activities FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias atividades" ON fitness_activities;
CREATE POLICY "Usuários podem criar suas próprias atividades"
    ON fitness_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias atividades" ON fitness_activities;
CREATE POLICY "Usuários podem atualizar suas próprias atividades"
    ON fitness_activities FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias atividades" ON fitness_activities;
CREATE POLICY "Usuários podem deletar suas próprias atividades"
    ON fitness_activities FOR DELETE
    USING (auth.uid() = user_id);
