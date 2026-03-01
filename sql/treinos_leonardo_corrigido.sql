-- =====================================================
-- FELICEFIT - SEED DE TREINOS PARA LEONARDO (ESQUI)
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. INSERIR EXERCICIOS NA BIBLIOTECA
-- =====================================================
INSERT INTO fitness_exercises_library (id, nome, grupo_muscular, equipamento, tipo, is_composto, dificuldade)
VALUES
  -- LOWER
  (gen_random_uuid(), 'Leg Press 45°', 'quadriceps', 'leg_press', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Agachamento Búlgaro', 'quadriceps', 'halteres', 'forca', true, 'avancado'),
  (gen_random_uuid(), 'Extensora', 'quadriceps', 'maquina', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Flexora Deitado', 'posterior', 'maquina', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Panturrilha em Pé', 'panturrilha', 'maquina', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Prancha com Toque no Ombro', 'core', 'peso_corporal', 'forca', false, 'intermediario'),
  (gen_random_uuid(), 'Dead Bug', 'core', 'peso_corporal', 'forca', false, 'iniciante'),
  -- PUSH
  (gen_random_uuid(), 'Supino Reto com Barra', 'peito', 'barra', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Supino Inclinado Halteres', 'peito', 'halteres', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Desenvolvimento Halteres', 'ombros', 'halteres', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Elevação Lateral', 'ombros', 'halteres', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Tríceps Pulley Corda', 'triceps', 'cabo', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Prancha Lateral', 'core', 'peso_corporal', 'forca', false, 'intermediario'),
  (gen_random_uuid(), 'Russian Twist', 'core', 'peso_corporal', 'forca', false, 'iniciante'),
  -- PULL
  (gen_random_uuid(), 'Puxada Frontal Aberta', 'costas', 'cabo', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Remada Curvada', 'costas', 'barra', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Remada Unilateral Haltere', 'costas', 'halteres', 'forca', true, 'intermediario'),
  (gen_random_uuid(), 'Face Pull', 'ombros', 'cabo', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Rosca Direta Barra', 'biceps', 'barra', 'forca', false, 'iniciante'),
  (gen_random_uuid(), 'Prancha com Alcance', 'core', 'peso_corporal', 'forca', false, 'intermediario'),
  (gen_random_uuid(), 'Bird Dog', 'core', 'peso_corporal', 'forca', false, 'iniciante')
ON CONFLICT DO NOTHING;


-- 2. CRIAR TREINO A - LOWER (Pernas + Core) - SEGUNDA-FEIRA
-- =====================================================
DO $$
DECLARE
  v_user_id UUID;
  v_template_a UUID;
  v_template_b UUID;
  v_template_c UUID;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felicemed@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario felicemed@gmail.com nao encontrado!';
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_user_id;

  -- Limpar templates antigos do usuario (preservando treinos já realizados)
  UPDATE fitness_workouts
  SET template_id = NULL
  WHERE template_id IN (
    SELECT id FROM fitness_workout_templates
    WHERE user_id = v_user_id AND nome LIKE 'Treino%'
  );

  DELETE FROM fitness_workout_template_exercises
  WHERE template_id IN (
    SELECT id FROM fitness_workout_templates
    WHERE user_id = v_user_id AND nome LIKE 'Treino%'
  );

  DELETE FROM fitness_workout_templates
  WHERE user_id = v_user_id AND nome LIKE 'Treino%';

  -- ============================================
  -- TREINO A - Lower (Pernas + Core) - SEGUNDA (dia_semana = 1)
  -- ============================================
  INSERT INTO fitness_workout_templates (
    id, user_id, nome, descricao, tipo, fase, dia_semana,
    duracao_estimada_min, is_ativo, ordem
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'Treino A - Lower (Pernas + Core)',
    'Foco em força de pernas para esqui. Leg Press com 3s de descida controlada (excêntrico).',
    'hipertrofia',
    'base',
    1,  -- Segunda-feira
    40,
    true,
    1
  ) RETURNING id INTO v_template_a;

  INSERT INTO fitness_workout_template_exercises (
    template_id, exercicio_nome, ordem, series, repeticoes,
    descanso_segundos, notas
  ) VALUES
    (v_template_a, 'Leg Press 45°', 1, 4, '10-12', 60, 'Descida controlada 3s (excêntrico) - simula esqui'),
    (v_template_a, 'Agachamento Búlgaro', 2, 3, '10 cada', 60, 'Unilateral para estabilidade'),
    (v_template_a, 'Extensora', 3, 3, '12-15', 45, NULL),
    (v_template_a, 'Flexora Deitado', 4, 3, '12-15', 45, NULL),
    (v_template_a, 'Panturrilha em Pé', 5, 3, '15-20', 30, NULL),
    (v_template_a, 'Prancha com Toque no Ombro', 6, 3, '30s', 30, 'Anti-rotação'),
    (v_template_a, 'Dead Bug', 7, 3, '10 cada', 30, 'Controle lombar');

  RAISE NOTICE 'Treino A criado: %', v_template_a;

  -- ============================================
  -- TREINO B - Upper Push + Core - QUARTA (dia_semana = 3)
  -- ============================================
  INSERT INTO fitness_workout_templates (
    id, user_id, nome, descricao, tipo, fase, dia_semana,
    duracao_estimada_min, is_ativo, ordem
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'Treino B - Upper Push + Core',
    'Peito, Ombros, Tríceps e Core rotacional para curvas no esqui.',
    'hipertrofia',
    'base',
    3,  -- Quarta-feira
    35,
    true,
    2
  ) RETURNING id INTO v_template_b;

  INSERT INTO fitness_workout_template_exercises (
    template_id, exercicio_nome, ordem, series, repeticoes,
    descanso_segundos, notas
  ) VALUES
    (v_template_b, 'Supino Reto com Barra', 1, 4, '8-10', 60, 'PR atual: 75kg'),
    (v_template_b, 'Supino Inclinado Halteres', 2, 3, '10-12', 60, NULL),
    (v_template_b, 'Desenvolvimento Halteres', 3, 3, '10-12', 60, NULL),
    (v_template_b, 'Elevação Lateral', 4, 3, '12-15', 45, NULL),
    (v_template_b, 'Tríceps Pulley Corda', 5, 3, '12-15', 45, NULL),
    (v_template_b, 'Prancha Lateral', 6, 3, '30s cada', 30, 'Estabilidade lateral'),
    (v_template_b, 'Russian Twist', 7, 3, '15 cada', 30, 'Rotação para curvas no esqui');

  RAISE NOTICE 'Treino B criado: %', v_template_b;

  -- ============================================
  -- TREINO C - Upper Pull + Core - SEXTA (dia_semana = 5)
  -- ============================================
  INSERT INTO fitness_workout_templates (
    id, user_id, nome, descricao, tipo, fase, dia_semana,
    duracao_estimada_min, is_ativo, ordem
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'Treino C - Upper Pull + Core',
    'Costas, Bíceps e Core de estabilização para postura no esqui.',
    'hipertrofia',
    'base',
    5,  -- Sexta-feira
    35,
    true,
    3
  ) RETURNING id INTO v_template_c;

  INSERT INTO fitness_workout_template_exercises (
    template_id, exercicio_nome, ordem, series, repeticoes,
    descanso_segundos, notas
  ) VALUES
    (v_template_c, 'Puxada Frontal Aberta', 1, 4, '10-12', 60, NULL),
    (v_template_c, 'Remada Curvada', 2, 4, '8-10', 60, 'PR atual: 60kg'),
    (v_template_c, 'Remada Unilateral Haltere', 3, 3, '10 cada', 45, NULL),
    (v_template_c, 'Face Pull', 4, 3, '15', 45, 'Saúde dos ombros'),
    (v_template_c, 'Rosca Direta Barra', 5, 3, '10-12', 45, NULL),
    (v_template_c, 'Prancha com Alcance', 6, 3, '10 cada', 30, 'Anti-extensão'),
    (v_template_c, 'Bird Dog', 7, 3, '10 cada', 30, 'Coordenação e postura');

  RAISE NOTICE 'Treino C criado: %', v_template_c;
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TREINOS CRIADOS COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Segunda (1): Treino A - Lower (Pernas + Core)';
  RAISE NOTICE 'Quarta (3): Treino B - Upper Push + Core';
  RAISE NOTICE 'Sexta (5): Treino C - Upper Pull + Core';
  RAISE NOTICE '==========================================';

END $$;


-- 3. VERIFICAR RESULTADO
-- =====================================================
SELECT
  t.nome as treino,
  t.dia_semana,
  t.duracao_estimada_min as minutos,
  t.is_ativo as ativo,
  COUNT(e.id) as exercicios
FROM fitness_workout_templates t
LEFT JOIN fitness_workout_template_exercises e ON e.template_id = t.id
WHERE t.user_id = (SELECT id FROM auth.users WHERE email = 'felicemed@gmail.com')
  AND t.nome LIKE 'Treino%'
  AND t.is_ativo = true
GROUP BY t.id, t.nome, t.dia_semana, t.duracao_estimada_min, t.is_ativo
ORDER BY t.ordem;
