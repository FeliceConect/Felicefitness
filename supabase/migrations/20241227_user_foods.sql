-- Tabela para alimentos personalizados do usuário
-- Esta tabela permite que usuários salvem alimentos analisados por IA ou criados manualmente

CREATE TABLE IF NOT EXISTS fitness_user_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informações básicas do alimento
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'proteina', 'carboidrato', 'vegetal', 'fruta',
    'laticinio', 'gordura', 'suplemento', 'bebida', 'outros'
  )),
  marca VARCHAR(100),
  descricao TEXT,

  -- Porção padrão
  porcao_padrao INTEGER NOT NULL DEFAULT 100,
  unidade VARCHAR(20) NOT NULL DEFAULT 'g' CHECK (unidade IN ('g', 'ml', 'unidade')),

  -- Valores nutricionais por porção padrão
  calorias INTEGER NOT NULL DEFAULT 0,
  proteinas DECIMAL(6,2) NOT NULL DEFAULT 0,
  carboidratos DECIMAL(6,2) NOT NULL DEFAULT 0,
  gorduras DECIMAL(6,2) NOT NULL DEFAULT 0,
  fibras DECIMAL(6,2),
  sodio INTEGER,

  -- Porções comuns (JSON array)
  -- Formato: [{"label": "1 unidade", "grams": 50, "isDefault": true}, ...]
  porcoes_comuns JSONB,

  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE, -- Soft delete
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'ai_analysis', 'import')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_foods_user_id ON fitness_user_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_foods_nome ON fitness_user_foods(nome);
CREATE INDEX IF NOT EXISTS idx_user_foods_categoria ON fitness_user_foods(categoria);
CREATE INDEX IF NOT EXISTS idx_user_foods_is_active ON fitness_user_foods(is_active);
CREATE INDEX IF NOT EXISTS idx_user_foods_is_favorite ON fitness_user_foods(is_favorite);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_foods_updated_at ON fitness_user_foods;
CREATE TRIGGER trigger_user_foods_updated_at
  BEFORE UPDATE ON fitness_user_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_user_foods_updated_at();

-- RLS (Row Level Security)
ALTER TABLE fitness_user_foods ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios alimentos
DROP POLICY IF EXISTS "Users can view own foods" ON fitness_user_foods;
CREATE POLICY "Users can view own foods" ON fitness_user_foods
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios alimentos
DROP POLICY IF EXISTS "Users can insert own foods" ON fitness_user_foods;
CREATE POLICY "Users can insert own foods" ON fitness_user_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios alimentos
DROP POLICY IF EXISTS "Users can update own foods" ON fitness_user_foods;
CREATE POLICY "Users can update own foods" ON fitness_user_foods
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios alimentos
DROP POLICY IF EXISTS "Users can delete own foods" ON fitness_user_foods;
CREATE POLICY "Users can delete own foods" ON fitness_user_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE fitness_user_foods IS 'Alimentos personalizados criados pelo usuário ou analisados por IA';
COMMENT ON COLUMN fitness_user_foods.porcoes_comuns IS 'Array JSON com porções comuns: [{"label": "1 ovo", "grams": 50, "isDefault": true}]';
COMMENT ON COLUMN fitness_user_foods.source IS 'Origem do alimento: manual (criado pelo usuário), ai_analysis (analisado por IA), import (importado)';
