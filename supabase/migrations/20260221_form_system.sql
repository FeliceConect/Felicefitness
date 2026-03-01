-- FeliceFit - Migration: Sistema de Formulários Pré-Consulta
-- Execute este arquivo no Supabase SQL Editor
-- Sistema para profissionais enviarem formulários para pacientes preencherem antes das consultas

-- ============================================
-- PARTE 1: TEMPLATES DE FORMULÁRIOS
-- ============================================

-- Templates criados por profissionais ou pelo sistema
CREATE TABLE IF NOT EXISTS fitness_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  specialty VARCHAR(50) NOT NULL, -- 'trainer', 'nutritionist', 'coach'
  form_type VARCHAR(50) NOT NULL, -- 'initial_assessment', 'weekly_checkin', 'progress_review', 'food_recall', 'custom'
  is_system_template BOOLEAN DEFAULT false, -- Templates padrão do sistema (não editáveis)
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 2: PERGUNTAS DOS FORMULÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES fitness_form_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  -- Tipos suportados:
  -- 'short_text'       - Texto curto (input)
  -- 'long_text'        - Texto longo (textarea)
  -- 'number'           - Número (input number)
  -- 'scale'            - Escala (1-10 com slider)
  -- 'single_choice'    - Múltipla escolha, uma resposta (radio)
  -- 'multiple_choice'  - Múltipla escolha, várias respostas (checkbox)
  -- 'dropdown'         - Dropdown/select
  -- 'yes_no'           - Sim/Não (toggle)
  -- 'date'             - Seletor de data
  -- 'consent'          - Checkbox de consentimento com texto
  -- 'section_header'   - Cabeçalho de seção (sem resposta)
  options JSONB, -- Para tipos com opções: [{"value": "opt1", "label": "Opção 1"}, ...]
  config JSONB DEFAULT '{}',
  -- Configurações extras por tipo:
  -- number: {"min": 0, "max": 300, "step": 0.1, "unit": "kg"}
  -- scale:  {"min": 1, "max": 10, "minLabel": "Nenhuma", "maxLabel": "Máxima"}
  -- short_text/long_text: {"placeholder": "Digite aqui...", "maxLength": 500}
  -- consent: {"consentText": "Li e aceito os termos..."}
  -- section_header: {"subtitle": "Subtítulo opcional"}
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  section VARCHAR(100), -- Agrupar por seção visual
  conditional_on JSONB, -- Lógica condicional (Fase 2): {"questionId": "uuid", "operator": "equals", "value": "sim"}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 3: ENVIOS DE FORMULÁRIOS (ASSIGNMENTS)
-- ============================================

-- Quando um profissional envia um formulário para um cliente
CREATE TABLE IF NOT EXISTS fitness_form_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES fitness_form_templates(id) ON DELETE CASCADE,
  template_version INTEGER NOT NULL DEFAULT 1, -- Snapshot da versão do template
  professional_id UUID NOT NULL REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: 'pending' (enviado, não iniciado)
  --         'in_progress' (paciente começou a preencher)
  --         'completed' (paciente enviou)
  --         'expired' (prazo expirou)
  due_date TIMESTAMPTZ, -- Prazo para preenchimento
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ, -- Quando o paciente abriu o formulário
  completed_at TIMESTAMPTZ, -- Quando o paciente enviou as respostas
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT, -- Notas do profissional para o paciente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 4: RESPOSTAS DO PACIENTE
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES fitness_form_assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES fitness_form_questions(id) ON DELETE CASCADE,
  question_snapshot JSONB NOT NULL, -- Snapshot da pergunta no momento da resposta (versionamento)
  response_value JSONB NOT NULL,
  -- Formato por tipo:
  -- short_text/long_text: {"value": "texto da resposta"}
  -- number:               {"value": 75.5}
  -- scale:                {"value": 7}
  -- single_choice:        {"value": "opt2"}
  -- multiple_choice:      {"values": ["opt1", "opt3"]}
  -- dropdown:             {"value": "opt1"}
  -- yes_no:               {"value": true}
  -- date:                 {"value": "2026-02-21"}
  -- consent:              {"value": true}
  responded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 5: RASCUNHOS (AUTO-SAVE)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_form_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES fitness_form_assignments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  -- Formato: {"questionId1": {"value": "..."}, "questionId2": {"values": [...]}, ...}
  current_step INTEGER DEFAULT 0, -- Qual step o paciente parou
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, client_id)
);

-- ============================================
-- PARTE 6: ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_form_templates_professional ON fitness_form_templates(professional_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_specialty ON fitness_form_templates(specialty);
CREATE INDEX IF NOT EXISTS idx_form_templates_system ON fitness_form_templates(is_system_template);
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON fitness_form_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_form_questions_template ON fitness_form_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_questions_order ON fitness_form_questions(template_id, order_index);

CREATE INDEX IF NOT EXISTS idx_form_assignments_professional ON fitness_form_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_client ON fitness_form_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_status ON fitness_form_assignments(status);
CREATE INDEX IF NOT EXISTS idx_form_assignments_template ON fitness_form_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_due ON fitness_form_assignments(due_date) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_form_responses_assignment ON fitness_form_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_question ON fitness_form_responses(question_id);

CREATE INDEX IF NOT EXISTS idx_form_drafts_assignment ON fitness_form_drafts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_form_drafts_client ON fitness_form_drafts(client_id);

-- ============================================
-- PARTE 7: RLS POLICIES
-- ============================================

ALTER TABLE fitness_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_form_drafts ENABLE ROW LEVEL SECURITY;

-- === TEMPLATES ===

DROP POLICY IF EXISTS "Profissionais podem ver templates do sistema" ON fitness_form_templates;
CREATE POLICY "Profissionais podem ver templates do sistema"
  ON fitness_form_templates FOR SELECT
  USING (is_system_template = true);

DROP POLICY IF EXISTS "Profissionais podem gerenciar seus templates" ON fitness_form_templates;
CREATE POLICY "Profissionais podem gerenciar seus templates"
  ON fitness_form_templates FOR ALL
  USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins podem ver todos templates" ON fitness_form_templates;
CREATE POLICY "Admins podem ver todos templates"
  ON fitness_form_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- === PERGUNTAS ===

DROP POLICY IF EXISTS "Perguntas de templates do sistema são visíveis" ON fitness_form_questions;
CREATE POLICY "Perguntas de templates do sistema são visíveis"
  ON fitness_form_questions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM fitness_form_templates WHERE is_system_template = true
    )
  );

DROP POLICY IF EXISTS "Profissionais gerenciam perguntas dos seus templates" ON fitness_form_questions;
CREATE POLICY "Profissionais gerenciam perguntas dos seus templates"
  ON fitness_form_questions FOR ALL
  USING (
    template_id IN (
      SELECT id FROM fitness_form_templates
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clientes podem ver perguntas dos seus formulários" ON fitness_form_questions;
CREATE POLICY "Clientes podem ver perguntas dos seus formulários"
  ON fitness_form_questions FOR SELECT
  USING (
    template_id IN (
      SELECT template_id FROM fitness_form_assignments
      WHERE client_id = auth.uid()
    )
  );

-- === ASSIGNMENTS ===

DROP POLICY IF EXISTS "Profissionais gerenciam seus envios" ON fitness_form_assignments;
CREATE POLICY "Profissionais gerenciam seus envios"
  ON fitness_form_assignments FOR ALL
  USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clientes podem ver seus formulários" ON fitness_form_assignments;
CREATE POLICY "Clientes podem ver seus formulários"
  ON fitness_form_assignments FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clientes podem atualizar status dos seus formulários" ON fitness_form_assignments;
CREATE POLICY "Clientes podem atualizar status dos seus formulários"
  ON fitness_form_assignments FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todos envios" ON fitness_form_assignments;
CREATE POLICY "Admins podem ver todos envios"
  ON fitness_form_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- === RESPOSTAS ===

DROP POLICY IF EXISTS "Profissionais podem ver respostas dos seus formulários" ON fitness_form_responses;
CREATE POLICY "Profissionais podem ver respostas dos seus formulários"
  ON fitness_form_responses FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM fitness_form_assignments
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clientes podem inserir respostas" ON fitness_form_responses;
CREATE POLICY "Clientes podem inserir respostas"
  ON fitness_form_responses FOR INSERT
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM fitness_form_assignments WHERE client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clientes podem ver suas respostas" ON fitness_form_responses;
CREATE POLICY "Clientes podem ver suas respostas"
  ON fitness_form_responses FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM fitness_form_assignments WHERE client_id = auth.uid()
    )
  );

-- === RASCUNHOS ===

DROP POLICY IF EXISTS "Clientes podem gerenciar seus rascunhos" ON fitness_form_drafts;
CREATE POLICY "Clientes podem gerenciar seus rascunhos"
  ON fitness_form_drafts FOR ALL
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Profissionais podem ver rascunhos dos seus formulários" ON fitness_form_drafts;
CREATE POLICY "Profissionais podem ver rascunhos dos seus formulários"
  ON fitness_form_drafts FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM fitness_form_assignments
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- PARTE 8: TRIGGERS
-- ============================================

-- Trigger updated_at para templates
DROP TRIGGER IF EXISTS update_form_templates_updated_at ON fitness_form_templates;
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON fitness_form_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at para assignments
DROP TRIGGER IF EXISTS update_form_assignments_updated_at ON fitness_form_assignments;
CREATE TRIGGER update_form_assignments_updated_at
  BEFORE UPDATE ON fitness_form_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at para drafts
DROP TRIGGER IF EXISTS update_form_drafts_updated_at ON fitness_form_drafts;
CREATE TRIGGER update_form_drafts_updated_at
  BEFORE UPDATE ON fitness_form_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 9: COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE fitness_form_templates IS 'Templates de formulários pré-consulta (sistema ou customizados por profissional)';
COMMENT ON TABLE fitness_form_questions IS 'Perguntas de cada template, ordenadas por order_index';
COMMENT ON TABLE fitness_form_assignments IS 'Formulários enviados por profissionais para pacientes preencherem';
COMMENT ON TABLE fitness_form_responses IS 'Respostas dos pacientes com snapshot da pergunta para versionamento';
COMMENT ON TABLE fitness_form_drafts IS 'Rascunhos auto-salvos para o paciente continuar depois';

COMMENT ON COLUMN fitness_form_templates.specialty IS 'trainer, nutritionist, ou coach';
COMMENT ON COLUMN fitness_form_templates.form_type IS 'initial_assessment, weekly_checkin, progress_review, food_recall, custom';
COMMENT ON COLUMN fitness_form_questions.question_type IS 'short_text, long_text, number, scale, single_choice, multiple_choice, dropdown, yes_no, date, consent, section_header';
COMMENT ON COLUMN fitness_form_questions.options IS 'Array de opções: [{"value": "opt1", "label": "Opção 1"}]';
COMMENT ON COLUMN fitness_form_questions.config IS 'Configurações extras do tipo (min, max, placeholder, unit, etc)';
COMMENT ON COLUMN fitness_form_assignments.status IS 'pending, in_progress, completed, expired';
COMMENT ON COLUMN fitness_form_responses.response_value IS 'JSONB flexível: {"value": ...} ou {"values": [...]}';
COMMENT ON COLUMN fitness_form_drafts.draft_data IS 'Map de questionId → response para auto-save';
