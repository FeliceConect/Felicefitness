-- ============================================
-- Adicionar campos de medidas circunferenciais e fonte/foto_url
-- na tabela fitness_body_compositions
-- ============================================

-- Adicionar campo fonte (inbody ou manual)
ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS fonte VARCHAR(20) DEFAULT 'manual';

-- Adicionar campo foto_url para armazenar a foto do InBody
ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);

-- Adicionar campo notas
ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Medidas circunferenciais (cm)
ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_torax DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_abdome DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_braco_d DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_braco_e DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_antebraco_d DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_antebraco_e DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_coxa_d DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_coxa_e DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_panturrilha_d DECIMAL(5,2);

ALTER TABLE fitness_body_compositions
ADD COLUMN IF NOT EXISTS circ_panturrilha_e DECIMAL(5,2);

-- Comentários para documentação
COMMENT ON COLUMN fitness_body_compositions.fonte IS 'Fonte dos dados: inbody ou manual';
COMMENT ON COLUMN fitness_body_compositions.foto_url IS 'URL da foto do resultado InBody';
COMMENT ON COLUMN fitness_body_compositions.circ_torax IS 'Circunferência do tórax em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_abdome IS 'Circunferência do abdome em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_braco_d IS 'Circunferência do braço direito em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_braco_e IS 'Circunferência do braço esquerdo em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_antebraco_d IS 'Circunferência do antebraço direito em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_antebraco_e IS 'Circunferência do antebraço esquerdo em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_coxa_d IS 'Circunferência da coxa direita em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_coxa_e IS 'Circunferência da coxa esquerda em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_panturrilha_d IS 'Circunferência da panturrilha direita em cm';
COMMENT ON COLUMN fitness_body_compositions.circ_panturrilha_e IS 'Circunferência da panturrilha esquerda em cm';
