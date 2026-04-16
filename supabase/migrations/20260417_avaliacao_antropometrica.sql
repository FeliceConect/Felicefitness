-- Avaliação Antropométrica — campos faltantes conforme ebook_Avaliacao_Antropometrica
-- Todos os ALTERs são IF NOT EXISTS (idempotente, seguro para re-execução).

-- =============================================================
-- 1) fitness_body_compositions
-- =============================================================

-- Campo do InBody ainda não modelado
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS idade_metabolica INTEGER;

-- Circunferências que faltavam (ebook pede 10 pontos)
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_cintura DECIMAL(5,2);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_quadril DECIMAL(5,2);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_braco_contraido_d DECIMAL(5,2);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_braco_contraido_e DECIMAL(5,2);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_coxa_medial_d DECIMAL(5,2);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS circ_coxa_medial_e DECIMAL(5,2);

-- Metadados da coleta (ebook exige registrar avaliador, horário, momento M0-M6)
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS momento_avaliacao VARCHAR(3);
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS avaliador_id UUID REFERENCES fitness_profiles(id) ON DELETE SET NULL;
ALTER TABLE fitness_body_compositions
  ADD COLUMN IF NOT EXISTS horario_coleta TIME;

-- CHECK para momento_avaliacao (M0 .. M6) — só aplica se constraint ainda não existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fitness_body_compositions_momento_check'
  ) THEN
    ALTER TABLE fitness_body_compositions
      ADD CONSTRAINT fitness_body_compositions_momento_check
      CHECK (momento_avaliacao IS NULL OR momento_avaliacao IN ('M0','M1','M2','M3','M4','M5','M6'));
  END IF;
END $$;

COMMENT ON COLUMN fitness_body_compositions.idade_metabolica IS 'Idade metabólica estimada pelo InBody';
COMMENT ON COLUMN fitness_body_compositions.circ_cintura IS 'Circunferência da cintura (menor perímetro entre costelas e crista ilíaca)';
COMMENT ON COLUMN fitness_body_compositions.circ_quadril IS 'Circunferência do quadril (maior protuberância glútea)';
COMMENT ON COLUMN fitness_body_compositions.circ_braco_contraido_d IS 'Braço direito contraído (bíceps em flexão 90°)';
COMMENT ON COLUMN fitness_body_compositions.circ_braco_contraido_e IS 'Braço esquerdo contraído (bíceps em flexão 90°)';
COMMENT ON COLUMN fitness_body_compositions.circ_coxa_medial_d IS 'Coxa medial direita (ponto médio entre virilha e joelho)';
COMMENT ON COLUMN fitness_body_compositions.circ_coxa_medial_e IS 'Coxa medial esquerda (ponto médio entre virilha e joelho)';
COMMENT ON COLUMN fitness_body_compositions.momento_avaliacao IS 'Momento do programa: M0 (inicial) .. M6 (mês 6)';
COMMENT ON COLUMN fitness_body_compositions.avaliador_id IS 'Profissional que realizou a coleta';
COMMENT ON COLUMN fitness_body_compositions.horario_coleta IS 'Horário da coleta (ebook exige registrar)';

-- =============================================================
-- 2) fitness_progress_photos — estrutura M0-M6 + posições padronizadas
-- =============================================================

ALTER TABLE fitness_progress_photos
  ADD COLUMN IF NOT EXISTS momento_avaliacao VARCHAR(3);
ALTER TABLE fitness_progress_photos
  ADD COLUMN IF NOT EXISTS posicao VARCHAR(16);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fitness_progress_photos_momento_check'
  ) THEN
    ALTER TABLE fitness_progress_photos
      ADD CONSTRAINT fitness_progress_photos_momento_check
      CHECK (momento_avaliacao IS NULL OR momento_avaliacao IN ('M0','M1','M2','M3','M4','M5','M6'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fitness_progress_photos_posicao_check'
  ) THEN
    ALTER TABLE fitness_progress_photos
      ADD CONSTRAINT fitness_progress_photos_posicao_check
      CHECK (posicao IS NULL OR posicao IN ('frontal','lateral_d','lateral_e','costas'));
  END IF;
END $$;

COMMENT ON COLUMN fitness_progress_photos.momento_avaliacao IS 'Momento do programa (M0..M6) vinculado à avaliação antropométrica';
COMMENT ON COLUMN fitness_progress_photos.posicao IS 'Posição fotográfica: frontal, lateral_d, lateral_e, costas';

-- Index composto para buscar fotos por momento
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_momento
  ON fitness_progress_photos(user_id, momento_avaliacao);
