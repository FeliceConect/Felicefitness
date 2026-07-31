-- ============================================================================
-- AVALIAÇÃO DE COMPOSIÇÃO CORPORAL POR ULTRASSOM (modo B)
-- Data: 2026-08-01
-- ============================================================================
-- Motivação: a bioimpedância varia demais entre avaliações (hidratação, estado
-- alimentar, exercício recente), o que atrapalha a leitura de evolução do
-- paciente. A nutricionista passa a medir a espessura de gordura subcutânea e
-- de músculo por ultrassom, e o app assume o papel do software de composição
-- corporal: padroniza a coleta, calcula, versiona e historia.
--
-- Duas tabelas novas. NENHUMA alteração em fitness_body_compositions — aquela
-- tabela é, na prática, "a tabela do InBody": lib/bioimpedance/award.ts e
-- audit.ts tratam toda linha dela como medição elegível a pontos, e
-- cleanup-empty-bioimpedance apaga linhas "vazias". Gravar ultrassom lá
-- contaminaria a cadeia de pontos e os gráficos do paciente.
--
-- PRINCÍPIO: o BRUTO é imutável e soberano. A espessura em mm por sítio é o
-- dado clínico. Densidade, percentual de gordura e massas são DERIVADOS,
-- gravados por conveniência de leitura e 100% recalculáveis a partir das
-- medidas brutas + dos parâmetros gravados na própria avaliação.
--
-- O vocabulário de SÍTIOS e PROTOCOLOS vive em lib/usg/protocols.ts, não em
-- CHECK do banco: incluir um sítio novo é rotina clínica e não pode depender
-- de migration aplicada à mão no self-hosted. Já 'tecido', 'lado' e as chaves
-- de equação são vocabulário fechado, então viram CHECK.
--
-- Idempotente: pode ser reexecutada sem efeito colateral.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. fitness_usg_assessments — a sessão de avaliação
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_usg_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fitness_profiles(id) ON DELETE CASCADE,

  -- Metadados de coleta (espelham fitness_body_compositions de propósito)
  -- CURRENT_DATE usaria o fuso do servidor (UTC): uma avaliação lançada às
  -- 21h30 em Uberlândia cairia no dia seguinte. O default é a data em SP.
  data DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date),
  horario_coleta TIME,
  momento_avaliacao VARCHAR(3),
  avaliador_id UUID REFERENCES fitness_profiles(id) ON DELETE SET NULL,

  -- Protocolo de sítios usado (catálogo em lib/usg/protocols.ts)
  protocolo VARCHAR(24) NOT NULL,

  -- SNAPSHOT dos insumos da equação. Obrigatório: o paciente envelhece e muda
  -- de peso, e a avaliação de dois anos atrás precisa continuar reproduzindo
  -- exatamente o mesmo número.
  sexo VARCHAR(20),
  idade INTEGER,
  peso_kg DECIMAL(5,2),
  altura_cm DECIMAL(5,2),

  -- Equipamento (Butterfly iQ hoje). Congelar o método é o que torna a
  -- tendência intra-paciente confiável.
  equipamento VARCHAR(120),
  transdutor_mhz DECIMAL(4,1),

  -- ---------------- DERIVADOS (recalculáveis) ----------------
  soma_gordura_mm     DECIMAL(6,2),  -- Σ das espessuras BRUTAS — métrica primária
  soma_equivalente_mm DECIMAL(6,2),  -- Σ após conversão USG→dobra (entra na fórmula)
  soma_muscular_mm    DECIMAL(6,2),
  densidade_corporal  DECIMAL(7,5),
  percentual_gordura  DECIMAL(5,2),
  massa_gorda_kg      DECIMAL(5,2),
  massa_magra_kg      DECIMAL(5,2),

  -- ---------------- VERSIONAMENTO DO CÁLCULO ----------------
  -- equation_version pina o COMPORTAMENTO do motor; as colunas seguintes pinam
  -- os NÚMEROS. Juntas, tornam o recálculo retroativo auditável.
  equation_version     VARCHAR(32) NOT NULL DEFAULT 'usg-v1',
  equacao_densidade    VARCHAR(16),
  formula_percentual   VARCHAR(16) NOT NULL DEFAULT 'siri',
  conversao_id         VARCHAR(16) NOT NULL DEFAULT 'linear',
  conversao_fator      DECIMAL(6,4) NOT NULL DEFAULT 1.7,
  conversao_offset     DECIMAL(6,4) NOT NULL DEFAULT 2.04,
  agregacao_repeticoes VARCHAR(8)  NOT NULL DEFAULT 'median',

  -- FALSE enquanto a conversão USG→dobra não for calibrada contra método de
  -- referência nesta população. A interface lê isto para rotular "estimativa".
  estimativa_confiavel BOOLEAN NOT NULL DEFAULT FALSE,
  calculo_avisos       JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Texto único e explicitamente COMPARTILHADO com o paciente (ele vê a
  -- avaliação assim que ela é salva). Não existe campo de anotação interna
  -- aqui de propósito: a RLS libera a linha inteira ao titular, então um campo
  -- "só para a equipe" nesta tabela seria uma promessa que o banco não cumpre.
  -- Anotação interna pertence ao prontuário (fitness_professional_notes).
  interpretacao TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES fitness_profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES fitness_profiles(id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_momento_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_momento_check
      CHECK (momento_avaliacao IS NULL OR momento_avaliacao IN ('M0','M1','M2','M3','M4','M5','M6'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_sexo_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_sexo_check
      CHECK (sexo IS NULL OR sexo IN ('masculino','feminino'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_formula_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_formula_check
      CHECK (formula_percentual IN ('siri','brozek'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_conversao_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_conversao_check
      CHECK (conversao_id IN ('raw','double','linear')
             AND conversao_fator > 0 AND conversao_fator <= 4
             AND conversao_offset >= 0 AND conversao_offset <= 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_agregacao_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_agregacao_check
      CHECK (agregacao_repeticoes IN ('median','mean','max'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_idade_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_idade_check
      CHECK (idade IS NULL OR (idade >= 10 AND idade <= 100));
  END IF;

  -- Trava de sanidade dos derivados: fora disso é erro de cálculo, não paciente.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_percentual_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_percentual_check
      CHECK (percentual_gordura IS NULL OR (percentual_gordura >= 2 AND percentual_gordura <= 70));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_assessments_densidade_check') THEN
    ALTER TABLE fitness_usg_assessments ADD CONSTRAINT fitness_usg_assessments_densidade_check
      CHECK (densidade_corporal IS NULL OR (densidade_corporal >= 0.9 AND densidade_corporal <= 1.15));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usg_assessments_user_data
  ON fitness_usg_assessments(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_usg_assessments_user_momento
  ON fitness_usg_assessments(user_id, momento_avaliacao);
CREATE INDEX IF NOT EXISTS idx_usg_assessments_avaliador
  ON fitness_usg_assessments(avaliador_id);
-- Suporta o recálculo em massa quando a versão do motor mudar
CREATE INDEX IF NOT EXISTS idx_usg_assessments_version
  ON fitness_usg_assessments(equation_version);

-- Trava contra digitação duplicada da mesma avaliação
CREATE UNIQUE INDEX IF NOT EXISTS ux_usg_assessments_user_data_protocolo
  ON fitness_usg_assessments(user_id, data, protocolo);

COMMENT ON COLUMN fitness_usg_assessments.soma_gordura_mm IS
  'Soma das espessuras BRUTAS de gordura subcutânea (mm). Métrica primária confiável — não depende de nenhuma conversão.';
COMMENT ON COLUMN fitness_usg_assessments.soma_equivalente_mm IS
  'Soma após conversão para dobra equivalente. Existe apenas para alimentar as equações de dobra cutânea.';
COMMENT ON COLUMN fitness_usg_assessments.percentual_gordura IS
  'ESTIMATIVA derivada. As equações de Jackson & Pollock foram validadas para dobra cutânea (dupla, comprimida, com pele), não para ultrassom de camada única.';
COMMENT ON COLUMN fitness_usg_assessments.equation_version IS
  'Pina o comportamento do motor (lib/usg/engine.ts). Bump obrigatório a cada mudança de regra de cálculo.';
COMMENT ON COLUMN fitness_usg_assessments.estimativa_confiavel IS
  'FALSE enquanto a conversão ultrassom→equação não for calibrada contra método de referência nesta população.';

-- ----------------------------------------------------------------------------
-- 2. fitness_usg_measurements — uma linha por (sítio × tecido × lado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_usg_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES fitness_usg_assessments(id) ON DELETE CASCADE,

  site   VARCHAR(32) NOT NULL,
  tecido VARCHAR(8)  NOT NULL,
  lado   CHAR(1)     NOT NULL DEFAULT 'D',

  -- Repetições cruas, na ordem medida. É a única coisa que o recálculo NÃO
  -- consegue reconstruir — trate como imutável.
  repeticoes_mm DECIMAL(5,2)[] NOT NULL,

  -- Valor consolidado pela regra agregacao_repeticoes do pai.
  valor_mm DECIMAL(5,2) NOT NULL,

  cv_percent DECIMAL(5,2),
  fora_de_tolerancia BOOLEAN NOT NULL DEFAULT FALSE,
  observacao TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_measurements_tecido_check') THEN
    ALTER TABLE fitness_usg_measurements ADD CONSTRAINT fitness_usg_measurements_tecido_check
      CHECK (tecido IN ('gordura','musculo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_measurements_lado_check') THEN
    ALTER TABLE fitness_usg_measurements ADD CONSTRAINT fitness_usg_measurements_lado_check
      CHECK (lado IN ('D','E'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_measurements_reps_check') THEN
    ALTER TABLE fitness_usg_measurements ADD CONSTRAINT fitness_usg_measurements_reps_check
      CHECK (cardinality(repeticoes_mm) BETWEEN 1 AND 5);
  END IF;

  -- Plausibilidade física da espessura em mm (cobre gordura e músculo).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fitness_usg_measurements_valor_check') THEN
    ALTER TABLE fitness_usg_measurements ADD CONSTRAINT fitness_usg_measurements_valor_check
      CHECK (valor_mm > 0 AND valor_mm <= 120);
  END IF;
END $$;

-- Um sítio não pode ser medido duas vezes na mesma avaliação
CREATE UNIQUE INDEX IF NOT EXISTS ux_usg_measurement_site
  ON fitness_usg_measurements(assessment_id, site, tecido, lado);

CREATE INDEX IF NOT EXISTS idx_usg_measurements_assessment
  ON fitness_usg_measurements(assessment_id);
-- Suporta "evolução da espessura da coxa" sem varrer a tabela inteira
CREATE INDEX IF NOT EXISTS idx_usg_measurements_site
  ON fitness_usg_measurements(site, tecido);

-- ----------------------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------------------
-- Divergência DELIBERADA do padrão de fitness_body_compositions:
--
--  a) o PACIENTE só LÊ. O dado é produzido por profissional com equipamento;
--     paciente não digita ultrassom. Toda escrita passa por API route com
--     service role e checagem de vínculo em código.
--  b) o role 'admin' (secretária) NÃO tem acesso. O CLAUDE.md determina que a
--     secretária não vê dado clínico, e a policy de bioimpedância hoje viola
--     isso. Não repetimos o erro aqui.
--
-- Se um dia a paridade com bioimpedância for desejada, 'admin' entra na policy
-- E no helper lib/auth/require-clinical-access.ts — nos dois lugares, nunca
-- em um só.

ALTER TABLE fitness_usg_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_usg_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usg_owner_select" ON fitness_usg_assessments;
CREATE POLICY "usg_owner_select" ON fitness_usg_assessments
  FOR SELECT USING (auth.uid() = user_id);

-- A policy precisa ser tão estreita quanto a rota de API, senão a restrição da
-- rota é decorativa: o profissional lê o mesmo dado direto pelo PostgREST com
-- o próprio JWT. Hoje a rota aceita só nutricionista, então a policy também.
-- Para ampliar (ex.: incluir o personal), mude AQUI e em
-- lib/auth/require-clinical-access.ts na mesma alteração.
DROP POLICY IF EXISTS "usg_professional_select" ON fitness_usg_assessments;
CREATE POLICY "usg_professional_select" ON fitness_usg_assessments
  FOR SELECT USING (
    -- Checa o papel no perfil ALÉM do tipo em fitness_professionals: nada no
    -- schema impede cadastrar a secretária como profissional com um vínculo, e
    -- só o `type` deixaria essa porta aberta.
    EXISTS (
      SELECT 1 FROM fitness_profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'nutritionist'
    )
    AND user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid()
        AND p.type = 'nutritionist'
        AND ca.is_active = true
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "usg_superadmin_select" ON fitness_usg_assessments;
CREATE POLICY "usg_superadmin_select" ON fitness_usg_assessments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- A filha guarda o dado bruto — o ativo mais sensível e o único irreconstituível.
-- Ela repete o predicado do pai em vez de só herdá-lo por um EXISTS: herança
-- implícita funciona (a RLS do pai se aplica dentro do subselect), mas faria
-- qualquer alargamento futuro no pai propagar para cá sem revisão.
DROP POLICY IF EXISTS "usg_measurements_select" ON fitness_usg_measurements;
CREATE POLICY "usg_measurements_select" ON fitness_usg_measurements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fitness_usg_assessments a
      WHERE a.id = fitness_usg_measurements.assessment_id
        AND (
          a.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM fitness_profiles pr
            WHERE pr.id = auth.uid() AND pr.role = 'super_admin'
          )
          OR (
            EXISTS (
              SELECT 1 FROM fitness_profiles pr
              WHERE pr.id = auth.uid() AND pr.role = 'nutritionist'
            )
            AND a.user_id IN (
              SELECT ca.client_id FROM fitness_client_assignments ca
              JOIN fitness_professionals p ON p.id = ca.professional_id
              WHERE p.user_id = auth.uid()
                AND p.type = 'nutritionist'
                AND ca.is_active = true
                AND p.is_active = true
            )
          )
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Trigger de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fitness_update_usg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usg_assessments_updated_at ON fitness_usg_assessments;
CREATE TRIGGER trg_usg_assessments_updated_at
  BEFORE UPDATE ON fitness_usg_assessments
  FOR EACH ROW EXECUTE FUNCTION fitness_update_usg_updated_at();

-- ----------------------------------------------------------------------------
-- 5. RPC de gravação atômica das medidas
-- ----------------------------------------------------------------------------
-- O PostgREST não abre transação multi-statement. Sem esta função, editar uma
-- avaliação seria DELETE + INSERT em duas chamadas: se a segunda falhasse, a
-- avaliação ficaria sem NENHUM sítio e o percentual gravado viraria órfão do
-- dado bruto que o justifica.
--
-- SECURITY INVOKER de propósito (o default). A única chamadora é a rota com
-- service role, que já ignora RLS; SECURITY DEFINER não compraria nada e só
-- ampliaria o estrago caso o EXECUTE vazasse. Como INVOKER, mesmo que alguém
-- consiga chamar, a RLS (que não tem policy de INSERT nem DELETE) barra tudo.
CREATE OR REPLACE FUNCTION fitness_usg_replace_measurements(
  p_assessment_id UUID,
  p_rows JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  n INTEGER;
BEGIN
  DELETE FROM fitness_usg_measurements WHERE assessment_id = p_assessment_id;

  INSERT INTO fitness_usg_measurements
    (assessment_id, site, tecido, lado, repeticoes_mm, valor_mm, cv_percent, fora_de_tolerancia, observacao)
  SELECT
    p_assessment_id,
    r->>'site',
    r->>'tecido',
    COALESCE(r->>'lado', 'D'),
    ARRAY(SELECT (v#>>'{}')::DECIMAL(5,2) FROM jsonb_array_elements(r->'repeticoes_mm') v),
    (r->>'valor_mm')::DECIMAL(5,2),
    NULLIF(r->>'cv_percent', '')::DECIMAL(5,2),
    COALESCE((r->>'fora_de_tolerancia')::BOOLEAN, FALSE),
    NULLIF(r->>'observacao', '')
  FROM jsonb_array_elements(p_rows) r;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- REVOKE de PUBLIC não basta: o bootstrap do Supabase tem
-- ALTER DEFAULT PRIVILEGES ... GRANT ALL ON FUNCTIONS TO anon, authenticated,
-- service_role, então toda função nova no schema public já nasce executável por
-- esses papéis por grant DIRETO — e revogar de PUBLIC não remove grant direto.
-- Mesmo padrão adotado em 20260730_5_reversal_rpc.sql.
REVOKE ALL ON FUNCTION fitness_usg_replace_measurements(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fitness_usg_replace_measurements(UUID, JSONB) TO service_role;

-- ----------------------------------------------------------------------------
-- 6. LGPD — incluir o ultrassom no export de dados do titular
-- ----------------------------------------------------------------------------
-- A função monta o JSON tabela a tabela; tabela nova não entra sozinha.
--
-- CORREÇÃO DE SEGURANÇA na mesma alteração: a versão anterior
-- (20241227_onboarding_lgpd.sql:172) é SECURITY DEFINER, tem
-- GRANT EXECUTE TO authenticated e aceita QUALQUER p_user_id — ou seja,
-- qualquer paciente logado exportava o dossiê completo de outro paciente pelo
-- endpoint /rest/v1/rpc/export_user_data, e os UUIDs são obtíveis no ranking e
-- no feed. Como esta migration reescreve a função e ainda amplia o que ela
-- devolve com dado de saúde novo, a titularidade é amarrada aqui.
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM fitness_profiles
       WHERE id = auth.uid() AND role = 'super_admin'
     ) THEN
    RAISE EXCEPTION 'Não autorizado a exportar dados de outro titular'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(fp) FROM fitness_profiles fp WHERE fp.id = p_user_id),
    'workouts', (SELECT jsonb_agg(row_to_json(w)) FROM fitness_workouts w WHERE w.user_id = p_user_id),
    'meals', (SELECT jsonb_agg(row_to_json(m)) FROM fitness_meals m WHERE m.user_id = p_user_id),
    'water_logs', (SELECT jsonb_agg(row_to_json(wl)) FROM fitness_water_logs wl WHERE wl.user_id = p_user_id),
    'sleep_logs', (SELECT jsonb_agg(row_to_json(sl)) FROM fitness_sleep_logs sl WHERE sl.user_id = p_user_id),
    'body_compositions', (SELECT jsonb_agg(row_to_json(bc)) FROM fitness_body_compositions bc WHERE bc.user_id = p_user_id),
    'usg_assessments', (SELECT jsonb_agg(row_to_json(ua)) FROM fitness_usg_assessments ua WHERE ua.user_id = p_user_id),
    'usg_measurements', (
      SELECT jsonb_agg(row_to_json(um))
      FROM fitness_usg_measurements um
      JOIN fitness_usg_assessments ua2 ON ua2.id = um.assessment_id
      WHERE ua2.user_id = p_user_id
    ),
    'achievements', (SELECT jsonb_agg(row_to_json(au)) FROM fitness_achievements_users au WHERE au.user_id = p_user_id),
    'consent_history', (SELECT jsonb_agg(row_to_json(ch)) FROM fitness_consent_history ch WHERE ch.user_id = p_user_id),
    'exported_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
