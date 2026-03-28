-- Tabela global de alimentos (TACO + TBCA + Open Food Facts)
-- Alimentos compartilhados por todos os usuários, sem RLS restritivo

CREATE TABLE IF NOT EXISTS fitness_global_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  nome VARCHAR(500) NOT NULL,
  nome_busca VARCHAR(500) NOT NULL, -- nome em lowercase, sem acentos, para busca
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT,

  -- Origem dos dados
  source VARCHAR(30) NOT NULL DEFAULT 'taco' CHECK (source IN ('taco', 'tbca', 'openfoodfacts', 'manual')),
  source_id VARCHAR(100), -- ID original na base de origem (ex: código TBCA, barcode OFF)
  codigo_barras VARCHAR(50), -- EAN/UPC para produtos industrializados

  -- Porção padrão (valores sempre por 100g/100ml)
  porcao_padrao INTEGER NOT NULL DEFAULT 100,
  unidade VARCHAR(20) NOT NULL DEFAULT 'g' CHECK (unidade IN ('g', 'ml', 'unidade')),

  -- Macronutrientes por 100g
  calorias DECIMAL(8,2) NOT NULL DEFAULT 0,
  proteinas DECIMAL(8,2) NOT NULL DEFAULT 0,
  carboidratos DECIMAL(8,2) NOT NULL DEFAULT 0,
  gorduras DECIMAL(8,2) NOT NULL DEFAULT 0,
  fibras DECIMAL(8,2),
  sodio DECIMAL(8,2),

  -- Porções comuns (JSON array)
  porcoes_comuns JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca performática
CREATE INDEX IF NOT EXISTS idx_global_foods_nome ON fitness_global_foods(nome);
CREATE INDEX IF NOT EXISTS idx_global_foods_nome_busca ON fitness_global_foods(nome_busca);
CREATE INDEX IF NOT EXISTS idx_global_foods_categoria ON fitness_global_foods(categoria);
CREATE INDEX IF NOT EXISTS idx_global_foods_source ON fitness_global_foods(source);
CREATE INDEX IF NOT EXISTS idx_global_foods_source_id ON fitness_global_foods(source_id);
CREATE INDEX IF NOT EXISTS idx_global_foods_codigo_barras ON fitness_global_foods(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_global_foods_is_active ON fitness_global_foods(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_global_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_global_foods_updated_at ON fitness_global_foods;
CREATE TRIGGER trigger_global_foods_updated_at
  BEFORE UPDATE ON fitness_global_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_global_foods_updated_at();

-- RLS: todos podem ler, apenas service_role pode escrever
ALTER TABLE fitness_global_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read global foods" ON fitness_global_foods;
CREATE POLICY "Anyone can read global foods" ON fitness_global_foods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage global foods" ON fitness_global_foods;
CREATE POLICY "Service role can manage global foods" ON fitness_global_foods
  FOR ALL USING (auth.role() = 'service_role');

-- Comentários
COMMENT ON TABLE fitness_global_foods IS 'Base global de alimentos: TACO (597), TBCA (5668), Open Food Facts (cache local)';
COMMENT ON COLUMN fitness_global_foods.nome_busca IS 'Nome normalizado (lowercase, sem acentos) para busca performática';
COMMENT ON COLUMN fitness_global_foods.source IS 'Origem: taco (UNICAMP), tbca (USP), openfoodfacts (API), manual (admin)';
COMMENT ON COLUMN fitness_global_foods.source_id IS 'ID original na base de origem';
