-- Atualizar tabela fitness_sleep_logs com colunas adicionais
-- Executar no Supabase SQL Editor

-- Adicionar colunas que faltam
ALTER TABLE fitness_sleep_logs
ADD COLUMN IF NOT EXISTS vezes_acordou INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sensacao_acordar INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS fatores_positivos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fatores_negativos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Converter hora_dormir e hora_acordar para TIME se forem TIMESTAMP
-- (manter compatibilidade com formato HH:MM)

-- Criar policy de delete se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fitness_sleep_logs'
    AND policyname = 'Usuários podem deletar seus registros de sono'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus registros de sono"
      ON fitness_sleep_logs FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Comentarios das colunas
COMMENT ON COLUMN fitness_sleep_logs.vezes_acordou IS 'Quantas vezes acordou durante a noite';
COMMENT ON COLUMN fitness_sleep_logs.sensacao_acordar IS 'Como acordou: 1=Muito cansado a 5=Descansado';
COMMENT ON COLUMN fitness_sleep_logs.fatores_positivos IS 'Fatores que ajudaram o sono';
COMMENT ON COLUMN fitness_sleep_logs.fatores_negativos IS 'Fatores que atrapalharam o sono';
