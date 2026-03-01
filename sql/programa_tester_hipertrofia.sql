-- ============================================
-- PROGRAMA COMPLETO DE TREINO E ALIMENTAÇÃO
-- Para: Atleta 40 anos, 85kg - Objetivo: Hipertrofia
-- User ID: 0bd7b474-cdfe-499f-98bf-ac6832089d0e
-- ============================================
-- MACROS CALCULADOS PARA 85KG:
-- Proteína: 170-200g (2-2.4g/kg) = 180g médio
-- Carboidratos: 350-400g (4-5g/kg) para ganho de massa
-- Gorduras: 85-100g (1-1.2g/kg)
-- Calorias: ~3000-3200 kcal
-- ============================================

DO $$
DECLARE
  v_personal_id UUID;
  v_nutri_id UUID;
  v_program_id UUID;
  v_meal_plan_id UUID;
  v_week_id UUID;
  v_day_a_id UUID;
  v_day_b_id UUID;
  v_day_c_id UUID;
  v_day_d_id UUID;
  v_meal_day_id UUID;
  v_client_id UUID := '0bd7b474-cdfe-499f-98bf-ac6832089d0e';
BEGIN

  -- IDs dos profissionais (já verificados no banco)
  v_personal_id := '2b38de56-cd43-45ec-a746-5a23b81c4dcb'; -- Trainer
  v_nutri_id := '405123fa-db45-4cab-9f3f-5ea0739cf5ce';    -- Nutritionist

  -- Log dos profissionais
  RAISE NOTICE 'Personal Trainer: %', v_personal_id;
  RAISE NOTICE 'Nutricionista: %', v_nutri_id;

  -- ============================================
  -- PARTE 1: PROGRAMA DE TREINO - HIPERTROFIA 4x/semana
  -- ============================================

  INSERT INTO fitness_training_programs (
    id, professional_id, client_id, name, description, goal, difficulty,
    duration_weeks, days_per_week, session_duration, equipment_needed,
    is_template, is_active, starts_at, notes
  ) VALUES (
    gen_random_uuid(),
    v_personal_id,
    v_client_id,
    'Hipertrofia Avançada - 4x/semana',
    'Programa de hipertrofia para atleta de 40 anos. Foco em volume progressivo com exercícios compostos e isoladores. Divisão Push/Pull/Legs adaptada para 4 dias.',
    'hypertrophy',
    'advanced',
    4,
    4,
    75,
    '["barbell", "dumbbells", "cables", "machines", "pull_up_bar"]'::jsonb,
    false,
    true,
    CURRENT_DATE,
    'Semana 1-2: Adaptação | Semana 3-4: Volume aumentado | Descanso mínimo de 48h entre treinos do mesmo grupo muscular.'
  )
  RETURNING id INTO v_program_id;

  -- Criar semanas do programa
  INSERT INTO fitness_training_weeks (id, program_id, week_number, name, focus, intensity_modifier, notes)
  VALUES (gen_random_uuid(), v_program_id, 1, 'Semana de Adaptação', 'volume', 0.85, 'Foco em técnica e conexão mente-músculo. RPE 7-8.')
  RETURNING id INTO v_week_id;

  -- ============================================
  -- DIA A - PEITO + TRÍCEPS (Segunda-feira)
  -- ============================================

  INSERT INTO fitness_training_days (
    id, week_id, day_of_week, day_number, name, muscle_groups,
    estimated_duration, warmup_notes, cooldown_notes, notes, order_index
  ) VALUES (
    gen_random_uuid(),
    v_week_id,
    1, -- Segunda
    1,
    'Treino A - Peito e Tríceps',
    '["chest", "triceps"]'::jsonb,
    75,
    '5-10 min de esteira ou bike leve + rotação de ombros + 2 séries leves de supino',
    'Alongamento de peitorais e tríceps por 5 minutos',
    'Foco em hipertrofia do peitoral com ênfase em contração excêntrica controlada',
    1
  )
  RETURNING id INTO v_day_a_id;

  -- Exercícios Dia A
  INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, tempo, weight_suggestion, rpe_target, instructions, order_index) VALUES
  (v_day_a_id, 'Supino Reto com Barra', 'compound', 'chest', 4, '8-10', 120, '3-1-2', '70-80% 1RM', 8, 'Desça a barra até o peito, controle a descida. Mantenha escápulas retraídas.', 1),
  (v_day_a_id, 'Supino Inclinado com Halteres', 'compound', 'chest', 4, '10-12', 90, '3-1-2', 'Moderado', 8, 'Banco a 30-45 graus. Foco na porção clavicular do peitoral.', 2),
  (v_day_a_id, 'Crucifixo na Máquina (Peck Deck)', 'isolation', 'chest', 3, '12-15', 60, '2-1-3', 'Leve/Moderado', 8, 'Squeeze no pico da contração por 2 segundos.', 3),
  (v_day_a_id, 'Crossover Cabo (de cima para baixo)', 'isolation', 'chest', 3, '12-15', 60, '2-1-2', 'Leve', 7, 'Cruze as mãos no final do movimento. Foco na porção inferior.', 4),
  (v_day_a_id, 'Paralelas (Dips)', 'compound', 'triceps', 3, '8-12', 90, '2-1-2', 'Peso corporal ou lastro', 8, 'Incline o tronco levemente para frente para mais peitoral, reto para tríceps.', 5),
  (v_day_a_id, 'Tríceps Pulley (Corda)', 'isolation', 'triceps', 4, '12-15', 60, '2-1-2', 'Moderado', 8, 'Abra a corda no final do movimento. Cotovelos fixos.', 6),
  (v_day_a_id, 'Tríceps Francês com Halter', 'isolation', 'triceps', 3, '10-12', 60, '3-1-2', 'Moderado', 7, 'Deite no banco, desça o halter atrás da cabeça controladamente.', 7),
  (v_day_a_id, 'Tríceps Testa com Barra W', 'isolation', 'triceps', 3, '10-12', 60, '3-1-2', 'Moderado', 8, 'Cotovelos apontados para o teto, desça até a testa.', 8);

  -- ============================================
  -- DIA B - COSTAS + BÍCEPS (Terça-feira)
  -- ============================================

  INSERT INTO fitness_training_days (
    id, week_id, day_of_week, day_number, name, muscle_groups,
    estimated_duration, warmup_notes, cooldown_notes, notes, order_index
  ) VALUES (
    gen_random_uuid(),
    v_week_id,
    2, -- Terça
    2,
    'Treino B - Costas e Bíceps',
    '["back", "biceps"]'::jsonb,
    75,
    '5-10 min cardio leve + mobilidade de ombros + 2 séries de remada leve',
    'Alongamento de dorsais e bíceps por 5 minutos',
    'Foco em largura e espessura das costas. Retração escapular em todos os exercícios.',
    2
  )
  RETURNING id INTO v_day_b_id;

  -- Exercícios Dia B
  INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, tempo, weight_suggestion, rpe_target, instructions, order_index) VALUES
  (v_day_b_id, 'Barra Fixa (Pull-up) ou Graviton', 'compound', 'back', 4, '6-10', 120, '2-1-3', 'Peso corporal ou assistido', 8, 'Pegada pronada, largura maior que ombros. Puxe até o queixo passar a barra.', 1),
  (v_day_b_id, 'Remada Curvada com Barra', 'compound', 'back', 4, '8-10', 120, '2-1-2', '70% 1RM', 8, 'Tronco a 45 graus, puxe a barra até o abdômen. Contraia dorsais no topo.', 2),
  (v_day_b_id, 'Puxada Frontal no Pulley', 'compound', 'back', 4, '10-12', 90, '2-1-3', 'Moderado/Pesado', 8, 'Pegada aberta, puxe até a clavícula. Squeeze nas escápulas.', 3),
  (v_day_b_id, 'Remada Cavalinho (T-Bar)', 'compound', 'back', 3, '10-12', 90, '2-1-2', 'Moderado', 8, 'Peito apoiado se disponível. Foco na espessura.', 4),
  (v_day_b_id, 'Remada Unilateral com Halter', 'compound', 'back', 3, '10-12', 60, '2-1-2', 'Moderado', 7, 'Apoie o joelho no banco. Puxe o cotovelo para trás.', 5),
  (v_day_b_id, 'Pullover com Halter', 'isolation', 'back', 3, '12-15', 60, '3-1-2', 'Leve/Moderado', 7, 'Deitado transversal no banco. Sinta o alongamento dos dorsais.', 6),
  (v_day_b_id, 'Rosca Direta com Barra W', 'isolation', 'biceps', 4, '10-12', 60, '2-1-2', 'Moderado', 8, 'Cotovelos fixos na lateral. Contraia no topo.', 7),
  (v_day_b_id, 'Rosca Alternada com Halteres', 'isolation', 'biceps', 3, '10-12', 60, '2-1-2', 'Moderado', 8, 'Supine durante o movimento. Controle a descida.', 8),
  (v_day_b_id, 'Rosca Martelo', 'isolation', 'biceps', 3, '12-15', 60, '2-1-2', 'Moderado', 7, 'Pegada neutra. Trabalha braquial e antebraço.', 9),
  (v_day_b_id, 'Rosca Scott com Barra W', 'isolation', 'biceps', 3, '10-12', 60, '3-1-2', 'Leve/Moderado', 8, 'Apoie os braços no banco Scott. Movimento completo.', 10);

  -- ============================================
  -- DIA C - PERNAS ANTERIOR (Quinta-feira)
  -- ============================================

  INSERT INTO fitness_training_days (
    id, week_id, day_of_week, day_number, name, muscle_groups,
    estimated_duration, warmup_notes, cooldown_notes, notes, order_index
  ) VALUES (
    gen_random_uuid(),
    v_week_id,
    4, -- Quinta
    3,
    'Treino C - Pernas (Quadríceps e Glúteos)',
    '["quadriceps", "glutes"]'::jsonb,
    80,
    '10 min bike ou esteira + agachamento livre só com barra + alongamento dinâmico',
    'Alongamento de quadríceps, glúteos e lombar por 10 minutos',
    'Dia mais intenso da semana. Hidrate bem e alimente-se adequadamente antes.',
    3
  )
  RETURNING id INTO v_day_c_id;

  -- Exercícios Dia C
  INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, tempo, weight_suggestion, rpe_target, instructions, order_index) VALUES
  (v_day_c_id, 'Agachamento Livre com Barra', 'compound', 'quadriceps', 4, '6-8', 180, '3-1-2', '75-85% 1RM', 9, 'Profundidade até paralelo ou abaixo. Joelhos alinhados com os pés.', 1),
  (v_day_c_id, 'Leg Press 45°', 'compound', 'quadriceps', 4, '10-12', 120, '3-1-2', 'Pesado', 8, 'Pés na largura dos ombros, na parte média da plataforma.', 2),
  (v_day_c_id, 'Hack Squat', 'compound', 'quadriceps', 3, '10-12', 90, '3-1-2', 'Moderado/Pesado', 8, 'Mantenha a lombar apoiada. Desça controladamente.', 3),
  (v_day_c_id, 'Afundo (Passada) com Halteres', 'compound', 'glutes', 3, '10-12 cada', 90, '2-1-2', 'Moderado', 8, 'Passo longo para ênfase em glúteos. Joelho de trás quase toca o chão.', 4),
  (v_day_c_id, 'Cadeira Extensora', 'isolation', 'quadriceps', 4, '12-15', 60, '2-2-2', 'Moderado', 8, 'Squeeze no topo por 2 segundos. Descida controlada.', 5),
  (v_day_c_id, 'Agachamento Búlgaro', 'compound', 'glutes', 3, '10-12 cada', 90, '2-1-2', 'Leve/Moderado', 8, 'Pé traseiro elevado no banco. Tronco levemente inclinado.', 6),
  (v_day_c_id, 'Elevação Pélvica (Hip Thrust)', 'isolation', 'glutes', 4, '12-15', 60, '2-2-2', 'Pesado', 8, 'Apoie as escápulas no banco. Squeeze máximo no topo.', 7),
  (v_day_c_id, 'Panturrilha no Leg Press', 'isolation', 'calves', 4, '15-20', 45, '2-2-2', 'Moderado', 7, 'Amplitude completa. Alongue bem na descida.', 8);

  -- ============================================
  -- DIA D - OMBROS + POSTERIOR (Sexta-feira)
  -- ============================================

  INSERT INTO fitness_training_days (
    id, week_id, day_of_week, day_number, name, muscle_groups,
    estimated_duration, warmup_notes, cooldown_notes, notes, order_index
  ) VALUES (
    gen_random_uuid(),
    v_week_id,
    5, -- Sexta
    4,
    'Treino D - Ombros e Posterior de Pernas',
    '["shoulders", "hamstrings", "calves"]'::jsonb,
    75,
    '5-10 min cardio + rotação de ombros com elástico + 2 séries leves de desenvolvimento',
    'Alongamento de ombros, posteriores e panturrilhas por 10 minutos',
    'Treino misto para finalizar a semana. Ombros completos + posterior de coxa.',
    4
  )
  RETURNING id INTO v_day_d_id;

  -- Exercícios Dia D
  INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, tempo, weight_suggestion, rpe_target, instructions, order_index) VALUES
  (v_day_d_id, 'Desenvolvimento com Halteres (sentado)', 'compound', 'shoulders', 4, '8-10', 90, '2-1-2', 'Moderado/Pesado', 8, 'Banco a 90 graus. Desça até orelhas, suba sem travar cotovelos.', 1),
  (v_day_d_id, 'Elevação Lateral com Halteres', 'isolation', 'shoulders', 4, '12-15', 60, '2-1-2', 'Leve/Moderado', 8, 'Cotovelos levemente flexionados. Eleve até a linha dos ombros.', 2),
  (v_day_d_id, 'Elevação Frontal Alternada', 'isolation', 'shoulders', 3, '12-15', 60, '2-1-2', 'Leve', 7, 'Pegada neutra ou pronada. Até a altura dos olhos.', 3),
  (v_day_d_id, 'Crucifixo Inverso na Máquina', 'isolation', 'shoulders', 4, '12-15', 60, '2-1-2', 'Leve/Moderado', 8, 'Foco no deltóide posterior. Squeeze nas escápulas.', 4),
  (v_day_d_id, 'Encolhimento com Halteres (Trapézio)', 'isolation', 'shoulders', 3, '12-15', 60, '2-2-2', 'Pesado', 7, 'Eleve os ombros em direção às orelhas. Segure no topo.', 5),
  (v_day_d_id, 'Stiff com Barra', 'compound', 'hamstrings', 4, '10-12', 90, '3-1-2', 'Moderado', 8, 'Joelhos levemente flexionados. Desça até sentir o alongamento.', 6),
  (v_day_d_id, 'Mesa Flexora (Leg Curl)', 'isolation', 'hamstrings', 4, '12-15', 60, '2-1-2', 'Moderado', 8, 'Movimento completo. Squeeze no topo.', 7),
  (v_day_d_id, 'Cadeira Flexora', 'isolation', 'hamstrings', 3, '12-15', 60, '2-1-2', 'Moderado', 7, 'Sente-se ereto. Flexione até o máximo.', 8),
  (v_day_d_id, 'Panturrilha em Pé na Máquina', 'isolation', 'calves', 4, '12-15', 45, '2-2-2', 'Pesado', 8, 'Amplitude máxima. Suba na ponta dos pés.', 9),
  (v_day_d_id, 'Panturrilha Sentado', 'isolation', 'calves', 3, '15-20', 45, '2-2-2', 'Moderado', 7, 'Foco no sóleo. Movimento completo.', 10);

  -- ============================================
  -- Criar as outras 3 semanas (cópia da semana 1 com ajustes)
  -- ============================================

  -- Semana 2: Volume
  INSERT INTO fitness_training_weeks (program_id, week_number, name, focus, intensity_modifier, notes)
  VALUES (v_program_id, 2, 'Semana de Volume', 'volume', 0.90, 'Aumente ligeiramente as cargas. RPE 8.');

  -- Semana 3: Intensificação
  INSERT INTO fitness_training_weeks (program_id, week_number, name, focus, intensity_modifier, notes)
  VALUES (v_program_id, 3, 'Semana de Intensificação', 'intensity', 0.95, 'Cargas mais pesadas, menos repetições nos compostos. RPE 8-9.');

  -- Semana 4: Deload
  INSERT INTO fitness_training_weeks (program_id, week_number, name, focus, intensity_modifier, notes)
  VALUES (v_program_id, 4, 'Semana de Deload', 'deload', 0.70, 'Reduza cargas em 30%. Mantenha volume. Recuperação ativa.');

  -- ============================================
  -- PARTE 2: PLANO ALIMENTAR - GANHO DE MASSA (85kg)
  -- ~3000-3200 kcal | 180g proteína | 380g carbs | 90g gordura
  -- ============================================

  INSERT INTO fitness_meal_plans (
    id, professional_id, client_id, name, description, goal,
    calories_target, protein_target, carbs_target, fat_target, fiber_target, water_target,
    duration_weeks, is_template, is_active, starts_at, notes
  ) VALUES (
    gen_random_uuid(),
    v_nutri_id,
    v_client_id,
    'Plano Hipertrofia 85kg - 3100 kcal',
    'Plano alimentar para ganho de massa muscular. 6 refeições diárias com foco em proteína de alta qualidade e carboidratos complexos. Adaptado para atleta de 40 anos com 85kg. Proteína: 2.1g/kg | Carbs: 4.5g/kg | Gordura: 1g/kg.',
    'muscle_gain',
    3100,
    180,
    380,
    85,
    35,
    3500,
    4,
    false,
    true,
    CURRENT_DATE,
    'Ajuste as porções conforme resposta do corpo. Aumente 200-300 kcal se não houver ganho de peso após 2 semanas. Priorize proteínas em todas as refeições.'
  )
  RETURNING id INTO v_meal_plan_id;

  -- ============================================
  -- DIAS DA SEMANA COM REFEIÇÕES
  -- ============================================

  -- SEGUNDA-FEIRA (Dia de Treino - Peito/Tríceps)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 1, 'Segunda - Dia de Treino', 3100, 'Treino à tarde. Aumentar carbs pré e pós treino.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '06:30',
   '[{"name": "Ovos inteiros", "quantity": 4, "unit": "unidades", "calories": 312, "protein": 26, "carbs": 2, "fat": 22},
     {"name": "Pão integral", "quantity": 2, "unit": "fatias", "calories": 140, "protein": 6, "carbs": 24, "fat": 2},
     {"name": "Queijo cottage", "quantity": 50, "unit": "g", "calories": 50, "protein": 6, "carbs": 2, "fat": 2},
     {"name": "Banana", "quantity": 1, "unit": "média", "calories": 105, "protein": 1, "carbs": 27, "fat": 0},
     {"name": "Café preto", "quantity": 200, "unit": "ml", "calories": 5, "protein": 0, "carbs": 1, "fat": 0}]'::jsonb,
   612, 39, 56, 26,
   'Preparar ovos mexidos ou omelete. Café sem açúcar.',
   '[{"name": "Tapioca com ovo", "note": "2 ovos + 3 colheres de tapioca"},
     {"name": "Aveia com whey", "note": "50g aveia + 1 scoop whey + banana"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '09:30',
   '[{"name": "Iogurte grego natural", "quantity": 200, "unit": "g", "calories": 130, "protein": 12, "carbs": 8, "fat": 5},
     {"name": "Granola sem açúcar", "quantity": 40, "unit": "g", "calories": 160, "protein": 4, "carbs": 28, "fat": 4},
     {"name": "Castanha do Pará", "quantity": 3, "unit": "unidades", "calories": 99, "protein": 2, "carbs": 2, "fat": 10}]'::jsonb,
   389, 18, 38, 19,
   'Misturar tudo. Rico em selênio das castanhas.',
   '[{"name": "Shake proteico", "note": "1 scoop whey + 200ml leite + 1 banana"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '12:30',
   '[{"name": "Arroz integral", "quantity": 150, "unit": "g cozido", "calories": 165, "protein": 4, "carbs": 35, "fat": 1},
     {"name": "Feijão carioca", "quantity": 100, "unit": "g cozido", "calories": 76, "protein": 5, "carbs": 14, "fat": 0},
     {"name": "Peito de frango grelhado", "quantity": 200, "unit": "g", "calories": 330, "protein": 62, "carbs": 0, "fat": 7},
     {"name": "Brócolis cozido", "quantity": 100, "unit": "g", "calories": 35, "protein": 3, "carbs": 7, "fat": 0},
     {"name": "Azeite de oliva", "quantity": 15, "unit": "ml", "calories": 135, "protein": 0, "carbs": 0, "fat": 15},
     {"name": "Salada verde", "quantity": 100, "unit": "g", "calories": 20, "protein": 2, "carbs": 4, "fat": 0}]'::jsonb,
   761, 76, 60, 23,
   'Grelhar o frango com temperos naturais. Salada à vontade.',
   '[{"name": "Patinho grelhado", "note": "200g de carne vermelha magra"},
     {"name": "Tilápia grelhada", "note": "250g de peixe"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
   '[{"name": "Batata doce", "quantity": 200, "unit": "g cozida", "calories": 172, "protein": 2, "carbs": 40, "fat": 0},
     {"name": "Peito de frango", "quantity": 100, "unit": "g", "calories": 165, "protein": 31, "carbs": 0, "fat": 4},
     {"name": "Mel", "quantity": 15, "unit": "g", "calories": 46, "protein": 0, "carbs": 12, "fat": 0}]'::jsonb,
   383, 33, 52, 4,
   'Consumir 1h30 antes do treino. Fonte de energia rápida.',
   '[{"name": "Pão integral com frango", "note": "2 fatias + 100g frango desfiado"},
     {"name": "Banana com pasta de amendoim", "note": "2 bananas + 30g pasta"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar (Pós-Treino)', '19:30',
   '[{"name": "Arroz branco", "quantity": 200, "unit": "g cozido", "calories": 260, "protein": 5, "carbs": 56, "fat": 1},
     {"name": "Carne patinho grelhada", "quantity": 200, "unit": "g", "calories": 286, "protein": 52, "carbs": 0, "fat": 8},
     {"name": "Batata inglesa cozida", "quantity": 150, "unit": "g", "calories": 115, "protein": 2, "carbs": 26, "fat": 0},
     {"name": "Legumes salteados", "quantity": 100, "unit": "g", "calories": 50, "protein": 2, "carbs": 10, "fat": 1}]'::jsonb,
   711, 61, 92, 10,
   'Refeição pós-treino rica em proteína e carboidratos para recuperação.',
   '[{"name": "Frango grelhado", "note": "200g com arroz e legumes"},
     {"name": "Salmão", "note": "200g com quinoa e vegetais"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Queijo cottage", "quantity": 150, "unit": "g", "calories": 147, "protein": 18, "carbs": 5, "fat": 6},
     {"name": "Abacate", "quantity": 100, "unit": "g", "calories": 160, "protein": 2, "carbs": 9, "fat": 15}]'::jsonb,
   307, 20, 14, 21,
   'Proteína de absorção lenta + gorduras boas para a noite.',
   '[{"name": "Caseína", "note": "1 scoop de caseína com água"},
     {"name": "Ovo cozido", "note": "3 ovos cozidos"}]'::jsonb, 6);

  -- TERÇA-FEIRA (Dia de Treino - Costas/Bíceps)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 2, 'Terça - Dia de Treino', 3100, 'Treino à tarde. Manter carbs elevados.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '06:30',
   '[{"name": "Aveia em flocos", "quantity": 80, "unit": "g", "calories": 304, "protein": 10, "carbs": 54, "fat": 6},
     {"name": "Whey Protein", "quantity": 30, "unit": "g", "calories": 120, "protein": 24, "carbs": 3, "fat": 1},
     {"name": "Leite desnatado", "quantity": 300, "unit": "ml", "calories": 99, "protein": 10, "carbs": 15, "fat": 0},
     {"name": "Morango", "quantity": 100, "unit": "g", "calories": 32, "protein": 1, "carbs": 8, "fat": 0},
     {"name": "Mel", "quantity": 20, "unit": "g", "calories": 61, "protein": 0, "carbs": 17, "fat": 0}]'::jsonb,
   616, 45, 97, 7,
   'Preparar mingau de aveia ou overnight oats.',
   '[{"name": "Panqueca proteica", "note": "2 ovos + 1 banana + 30g aveia + whey"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '09:30',
   '[{"name": "Pão integral", "quantity": 2, "unit": "fatias", "calories": 140, "protein": 6, "carbs": 24, "fat": 2},
     {"name": "Pasta de amendoim", "quantity": 30, "unit": "g", "calories": 188, "protein": 8, "carbs": 6, "fat": 16},
     {"name": "Banana", "quantity": 1, "unit": "média", "calories": 105, "protein": 1, "carbs": 27, "fat": 0}]'::jsonb,
   433, 15, 57, 18,
   'Sanduíche de pasta de amendoim com banana.',
   '[{"name": "Mix de oleaginosas", "note": "50g de castanhas variadas + 1 fruta"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '12:30',
   '[{"name": "Macarrão integral", "quantity": 150, "unit": "g cozido", "calories": 195, "protein": 8, "carbs": 39, "fat": 1},
     {"name": "Carne moída magra", "quantity": 150, "unit": "g", "calories": 250, "protein": 38, "carbs": 0, "fat": 10},
     {"name": "Molho de tomate caseiro", "quantity": 100, "unit": "g", "calories": 35, "protein": 2, "carbs": 7, "fat": 0},
     {"name": "Queijo parmesão", "quantity": 20, "unit": "g", "calories": 86, "protein": 8, "carbs": 1, "fat": 6},
     {"name": "Salada de folhas", "quantity": 100, "unit": "g", "calories": 20, "protein": 2, "carbs": 4, "fat": 0},
     {"name": "Azeite", "quantity": 10, "unit": "ml", "calories": 90, "protein": 0, "carbs": 0, "fat": 10}]'::jsonb,
   676, 58, 51, 27,
   'Macarrão à bolonhesa caseiro.',
   '[{"name": "Arroz com frango", "note": "Porção tradicional brasileira"},
     {"name": "Nhoque com frango", "note": "Nhoque de batata doce"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
   '[{"name": "Pão sírio integral", "quantity": 1, "unit": "unidade", "calories": 140, "protein": 5, "carbs": 28, "fat": 1},
     {"name": "Atum em água", "quantity": 100, "unit": "g", "calories": 116, "protein": 26, "carbs": 0, "fat": 1},
     {"name": "Cream cheese light", "quantity": 30, "unit": "g", "calories": 50, "protein": 2, "carbs": 2, "fat": 4}]'::jsonb,
   306, 33, 30, 6,
   'Wrap de atum. Leve e energético.',
   '[{"name": "Tapioca com frango", "note": "Tapioca recheada com frango desfiado"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar (Pós-Treino)', '19:30',
   '[{"name": "Arroz integral", "quantity": 180, "unit": "g cozido", "calories": 198, "protein": 5, "carbs": 42, "fat": 1},
     {"name": "Salmão grelhado", "quantity": 200, "unit": "g", "calories": 412, "protein": 44, "carbs": 0, "fat": 26},
     {"name": "Aspargos grelhados", "quantity": 100, "unit": "g", "calories": 22, "protein": 2, "carbs": 4, "fat": 0},
     {"name": "Purê de batata doce", "quantity": 150, "unit": "g", "calories": 129, "protein": 2, "carbs": 30, "fat": 0}]'::jsonb,
   761, 53, 76, 27,
   'Salmão fonte de ômega-3 excelente para recuperação.',
   '[{"name": "Tilápia", "note": "200g de tilápia com os mesmos acompanhamentos"},
     {"name": "Frango ao molho", "note": "Frango com molho de mostarda e mel"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Iogurte natural integral", "quantity": 200, "unit": "g", "calories": 122, "protein": 8, "carbs": 9, "fat": 6},
     {"name": "Semente de chia", "quantity": 15, "unit": "g", "calories": 73, "protein": 2, "carbs": 6, "fat": 5},
     {"name": "Kiwi", "quantity": 1, "unit": "unidade", "calories": 42, "protein": 1, "carbs": 10, "fat": 0}]'::jsonb,
   237, 11, 25, 11,
   'Iogurte com chia e frutas. Rico em probióticos.',
   '[{"name": "Caseína", "note": "30g de caseína com água"}]'::jsonb, 6);

  -- QUARTA-FEIRA (Dia de Descanso)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 3, 'Quarta - Descanso', 2800, 'Dia de recuperação. Reduzir levemente carboidratos.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '07:00',
   '[{"name": "Omelete (4 ovos)", "quantity": 4, "unit": "ovos", "calories": 312, "protein": 26, "carbs": 2, "fat": 22},
     {"name": "Espinafre refogado", "quantity": 50, "unit": "g", "calories": 12, "protein": 1, "carbs": 2, "fat": 0},
     {"name": "Tomate", "quantity": 50, "unit": "g", "calories": 9, "protein": 0, "carbs": 2, "fat": 0},
     {"name": "Abacate", "quantity": 100, "unit": "g", "calories": 160, "protein": 2, "carbs": 9, "fat": 15},
     {"name": "Torrada integral", "quantity": 2, "unit": "fatias", "calories": 120, "protein": 4, "carbs": 22, "fat": 2}]'::jsonb,
   613, 33, 37, 39,
   'Omelete com vegetais. Rico em gorduras boas.',
   '[{"name": "Ovos mexidos com salmão", "note": "3 ovos + 50g salmão defumado"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
   '[{"name": "Shake proteico", "quantity": 1, "unit": "porção", "calories": 200, "protein": 30, "carbs": 8, "fat": 5},
     {"name": "Amêndoas", "quantity": 30, "unit": "g", "calories": 174, "protein": 6, "carbs": 6, "fat": 15}]'::jsonb,
   374, 36, 14, 20,
   '1 scoop whey + leite + amêndoas.',
   '[{"name": "Iogurte com granola", "note": "200g iogurte grego + 30g granola"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '13:00',
   '[{"name": "Arroz integral", "quantity": 120, "unit": "g cozido", "calories": 132, "protein": 3, "carbs": 28, "fat": 1},
     {"name": "Feijão preto", "quantity": 100, "unit": "g cozido", "calories": 77, "protein": 5, "carbs": 14, "fat": 0},
     {"name": "Frango assado (coxa/sobrecoxa)", "quantity": 200, "unit": "g", "calories": 350, "protein": 40, "carbs": 0, "fat": 20},
     {"name": "Abobrinha grelhada", "quantity": 100, "unit": "g", "calories": 17, "protein": 1, "carbs": 3, "fat": 0},
     {"name": "Cenoura crua", "quantity": 50, "unit": "g", "calories": 20, "protein": 0, "carbs": 5, "fat": 0}]'::jsonb,
   596, 49, 50, 21,
   'Prato brasileiro tradicional. Frango com pele para mais gordura.',
   '[{"name": "Carne assada", "note": "200g de carne bovina assada"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Lanche da Tarde', '16:00',
   '[{"name": "Queijo cottage", "quantity": 150, "unit": "g", "calories": 147, "protein": 18, "carbs": 5, "fat": 6},
     {"name": "Pepino", "quantity": 100, "unit": "g", "calories": 16, "protein": 1, "carbs": 4, "fat": 0},
     {"name": "Azeitonas", "quantity": 30, "unit": "g", "calories": 44, "protein": 0, "carbs": 1, "fat": 5}]'::jsonb,
   207, 19, 10, 11,
   'Snack proteico com vegetais.',
   '[{"name": "Ovo cozido", "note": "2 ovos cozidos + palitos de cenoura"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar', '19:30',
   '[{"name": "Filé de tilápia", "quantity": 250, "unit": "g", "calories": 270, "protein": 55, "carbs": 0, "fat": 5},
     {"name": "Quinoa cozida", "quantity": 150, "unit": "g", "calories": 180, "protein": 7, "carbs": 32, "fat": 3},
     {"name": "Mix de legumes", "quantity": 150, "unit": "g", "calories": 60, "protein": 3, "carbs": 12, "fat": 0},
     {"name": "Azeite", "quantity": 15, "unit": "ml", "calories": 135, "protein": 0, "carbs": 0, "fat": 15}]'::jsonb,
   645, 65, 44, 23,
   'Peixe leve com quinoa. Rico em proteína completa.',
   '[{"name": "Peito de frango", "note": "250g de peito grelhado"},
     {"name": "Atum fresco", "note": "200g de atum grelhado"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Leite integral", "quantity": 300, "unit": "ml", "calories": 183, "protein": 10, "carbs": 14, "fat": 10},
     {"name": "Caseína", "quantity": 25, "unit": "g", "calories": 90, "protein": 20, "carbs": 2, "fat": 1}]'::jsonb,
   273, 30, 16, 11,
   'Proteína de absorção lenta para a noite.',
   '[{"name": "Queijo branco", "note": "100g de queijo minas + chá"}]'::jsonb, 6);

  -- QUINTA-FEIRA (Dia de Treino - Pernas)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 4, 'Quinta - Treino Pernas', 3200, 'Dia mais intenso. Aumentar carboidratos.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '06:30',
   '[{"name": "Tapioca", "quantity": 60, "unit": "g", "calories": 210, "protein": 0, "carbs": 52, "fat": 0},
     {"name": "Ovos mexidos", "quantity": 4, "unit": "unidades", "calories": 312, "protein": 26, "carbs": 2, "fat": 22},
     {"name": "Banana", "quantity": 2, "unit": "médias", "calories": 210, "protein": 2, "carbs": 54, "fat": 0},
     {"name": "Mel", "quantity": 20, "unit": "g", "calories": 61, "protein": 0, "carbs": 17, "fat": 0}]'::jsonb,
   793, 28, 125, 22,
   'Tapioca com ovos. Alta energia para treino de pernas.',
   '[{"name": "Panqueca de banana", "note": "3 ovos + 2 bananas + aveia"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '09:30',
   '[{"name": "Vitamina de banana", "quantity": 400, "unit": "ml", "calories": 280, "protein": 15, "carbs": 45, "fat": 5},
     {"name": "Pasta de amendoim", "quantity": 20, "unit": "g", "calories": 125, "protein": 5, "carbs": 4, "fat": 11}]'::jsonb,
   405, 20, 49, 16,
   'Vitamina: leite + banana + aveia + whey.',
   '[{"name": "Smoothie de frutas", "note": "Frutas vermelhas + whey + iogurte"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '12:30',
   '[{"name": "Arroz branco", "quantity": 200, "unit": "g cozido", "calories": 260, "protein": 5, "carbs": 56, "fat": 1},
     {"name": "Feijão", "quantity": 100, "unit": "g cozido", "calories": 77, "protein": 5, "carbs": 14, "fat": 0},
     {"name": "Picanha grelhada", "quantity": 200, "unit": "g", "calories": 420, "protein": 48, "carbs": 0, "fat": 24},
     {"name": "Farofa", "quantity": 30, "unit": "g", "calories": 120, "protein": 2, "carbs": 20, "fat": 4},
     {"name": "Vinagrete", "quantity": 50, "unit": "g", "calories": 30, "protein": 1, "carbs": 6, "fat": 0}]'::jsonb,
   907, 61, 96, 29,
   'Almoço reforçado para dia de pernas.',
   '[{"name": "Fraldinha", "note": "200g de fraldinha grelhada"},
     {"name": "Alcatra", "note": "200g de alcatra grelhada"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Pré-Treino', '15:00',
   '[{"name": "Batata doce", "quantity": 250, "unit": "g cozida", "calories": 215, "protein": 2, "carbs": 50, "fat": 0},
     {"name": "Peito de frango", "quantity": 150, "unit": "g", "calories": 248, "protein": 47, "carbs": 0, "fat": 5},
     {"name": "Mel", "quantity": 20, "unit": "g", "calories": 61, "protein": 0, "carbs": 17, "fat": 0}]'::jsonb,
   524, 49, 67, 5,
   'Alto carbo para treino intenso. Consumir 1h30 antes.',
   '[{"name": "Macarrão com frango", "note": "Massa com frango desfiado"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar (Pós-Treino)', '19:30',
   '[{"name": "Arroz arbóreo (risoto)", "quantity": 200, "unit": "g cozido", "calories": 260, "protein": 5, "carbs": 56, "fat": 1},
     {"name": "Filé mignon", "quantity": 200, "unit": "g", "calories": 340, "protein": 52, "carbs": 0, "fat": 14},
     {"name": "Cogumelos salteados", "quantity": 100, "unit": "g", "calories": 30, "protein": 3, "carbs": 5, "fat": 0},
     {"name": "Parmesão", "quantity": 20, "unit": "g", "calories": 86, "protein": 8, "carbs": 1, "fat": 6}]'::jsonb,
   716, 68, 62, 21,
   'Risoto de filé mignon. Carboidrato de rápida absorção pós-treino.',
   '[{"name": "Massa com carne", "note": "Macarrão ao molho com carne moída"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Queijo cottage", "quantity": 200, "unit": "g", "calories": 196, "protein": 24, "carbs": 6, "fat": 8},
     {"name": "Castanha de caju", "quantity": 30, "unit": "g", "calories": 175, "protein": 5, "carbs": 9, "fat": 14}]'::jsonb,
   371, 29, 15, 22,
   'Proteína e gorduras para recuperação noturna.',
   '[{"name": "Shake de caseína", "note": "30g caseína + pasta de amendoim"}]'::jsonb, 6);

  -- SEXTA-FEIRA (Dia de Treino - Ombros/Posterior)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 5, 'Sexta - Treino Ombros', 3000, 'Último treino da semana.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '06:30',
   '[{"name": "Pão de forma integral", "quantity": 3, "unit": "fatias", "calories": 210, "protein": 9, "carbs": 36, "fat": 3},
     {"name": "Ovos", "quantity": 3, "unit": "unidades", "calories": 234, "protein": 20, "carbs": 2, "fat": 17},
     {"name": "Queijo mussarela", "quantity": 40, "unit": "g", "calories": 127, "protein": 10, "carbs": 1, "fat": 10},
     {"name": "Suco de laranja natural", "quantity": 300, "unit": "ml", "calories": 134, "protein": 2, "carbs": 31, "fat": 0}]'::jsonb,
   705, 41, 70, 30,
   'Sanduíche de ovo com queijo + suco.',
   '[{"name": "Wrap de ovos", "note": "Wrap integral com ovos mexidos"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '09:30',
   '[{"name": "Iogurte grego", "quantity": 170, "unit": "g", "calories": 150, "protein": 15, "carbs": 8, "fat": 7},
     {"name": "Granola", "quantity": 40, "unit": "g", "calories": 160, "protein": 4, "carbs": 28, "fat": 4},
     {"name": "Blueberry", "quantity": 50, "unit": "g", "calories": 29, "protein": 0, "carbs": 7, "fat": 0}]'::jsonb,
   339, 19, 43, 11,
   'Parfait de iogurte com frutas.',
   '[{"name": "Açaí proteico", "note": "200g açaí + whey + granola"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '12:30',
   '[{"name": "Arroz integral", "quantity": 150, "unit": "g cozido", "calories": 165, "protein": 4, "carbs": 35, "fat": 1},
     {"name": "Lentilha", "quantity": 100, "unit": "g cozida", "calories": 116, "protein": 9, "carbs": 20, "fat": 0},
     {"name": "Costela bovina", "quantity": 200, "unit": "g", "calories": 400, "protein": 40, "carbs": 0, "fat": 26},
     {"name": "Couve refogada", "quantity": 100, "unit": "g", "calories": 30, "protein": 2, "carbs": 5, "fat": 1}]'::jsonb,
   711, 55, 60, 28,
   'Costela com lentilha - proteína + ferro.',
   '[{"name": "Frango com grão de bico", "note": "Frango ao curry com grão de bico"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
   '[{"name": "Banana", "quantity": 2, "unit": "médias", "calories": 210, "protein": 2, "carbs": 54, "fat": 0},
     {"name": "Whey protein", "quantity": 30, "unit": "g", "calories": 120, "protein": 24, "carbs": 3, "fat": 1},
     {"name": "Aveia", "quantity": 30, "unit": "g", "calories": 114, "protein": 4, "carbs": 20, "fat": 2}]'::jsonb,
   444, 30, 77, 3,
   'Shake de banana com aveia pré-treino.',
   '[{"name": "Batata doce", "note": "200g batata + 100g frango"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar (Pós-Treino)', '19:30',
   '[{"name": "Purê de batata", "quantity": 200, "unit": "g", "calories": 174, "protein": 4, "carbs": 36, "fat": 2},
     {"name": "Frango grelhado", "quantity": 250, "unit": "g", "calories": 412, "protein": 77, "carbs": 0, "fat": 9},
     {"name": "Ervilhas", "quantity": 80, "unit": "g", "calories": 67, "protein": 5, "carbs": 12, "fat": 0},
     {"name": "Molho gravy", "quantity": 50, "unit": "ml", "calories": 40, "protein": 1, "carbs": 6, "fat": 2}]'::jsonb,
   693, 87, 54, 13,
   'Frango com purê - clássico pós-treino.',
   '[{"name": "Peru grelhado", "note": "250g de peito de peru"},
     {"name": "Carne moída", "note": "200g de carne moída magra com purê"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Ovo cozido", "quantity": 2, "unit": "unidades", "calories": 156, "protein": 13, "carbs": 1, "fat": 11},
     {"name": "Abacate", "quantity": 80, "unit": "g", "calories": 128, "protein": 2, "carbs": 7, "fat": 12}]'::jsonb,
   284, 15, 8, 23,
   'Ovos cozidos com abacate.',
   '[{"name": "Cottage com nozes", "note": "150g cottage + 20g nozes"}]'::jsonb, 6);

  -- SÁBADO (Dia de Descanso)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 6, 'Sábado - Descanso', 2900, 'Recuperação. Pode ter uma refeição livre moderada.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '08:00',
   '[{"name": "Panqueca americana", "quantity": 3, "unit": "unidades", "calories": 350, "protein": 12, "carbs": 45, "fat": 14},
     {"name": "Ovos mexidos", "quantity": 3, "unit": "unidades", "calories": 234, "protein": 20, "carbs": 2, "fat": 17},
     {"name": "Bacon", "quantity": 30, "unit": "g", "calories": 150, "protein": 9, "carbs": 0, "fat": 12},
     {"name": "Maple syrup (light)", "quantity": 30, "unit": "ml", "calories": 60, "protein": 0, "carbs": 15, "fat": 0}]'::jsonb,
   794, 41, 62, 43,
   'Café da manhã americano. Dia de descanso permite mais flexibilidade.',
   '[{"name": "French toast", "note": "Rabanada proteica com whey"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '11:00',
   '[{"name": "Frutas variadas", "quantity": 200, "unit": "g", "calories": 100, "protein": 2, "carbs": 25, "fat": 0},
     {"name": "Nuts mix", "quantity": 40, "unit": "g", "calories": 240, "protein": 6, "carbs": 8, "fat": 22}]'::jsonb,
   340, 8, 33, 22,
   'Mix de frutas e oleaginosas.',
   '[{"name": "Smoothie bowl", "note": "Açaí com frutas e granola"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço (Refeição Livre)', '13:00',
   '[{"name": "Refeição livre moderada", "quantity": 1, "unit": "porção", "calories": 800, "protein": 40, "carbs": 80, "fat": 35}]'::jsonb,
   800, 40, 80, 35,
   'Pode escolher o que desejar. Aproveite com moderação!',
   '[{"name": "Churrasco", "note": "Carnes variadas com acompanhamentos"},
     {"name": "Comida japonesa", "note": "Sushi e sashimi variados"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Lanche da Tarde', '16:30',
   '[{"name": "Shake proteico", "quantity": 1, "unit": "porção", "calories": 250, "protein": 30, "carbs": 15, "fat": 8}]'::jsonb,
   250, 30, 15, 8,
   'Shake simples para manter proteína.',
   '[{"name": "Barra proteica", "note": "1 barra de proteína (~250kcal)"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar', '20:00',
   '[{"name": "Sopa de legumes com frango", "quantity": 500, "unit": "ml", "calories": 350, "protein": 35, "carbs": 30, "fat": 10}]'::jsonb,
   350, 35, 30, 10,
   'Sopa leve para equilibrar o dia.',
   '[{"name": "Salada Caesar", "note": "Salada com frango grelhado"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:30',
   '[{"name": "Iogurte natural", "quantity": 150, "unit": "g", "calories": 90, "protein": 6, "carbs": 7, "fat": 5},
     {"name": "Mel", "quantity": 10, "unit": "g", "calories": 30, "protein": 0, "carbs": 8, "fat": 0}]'::jsonb,
   120, 6, 15, 5,
   'Ceia leve.',
   '[{"name": "Chá com queijo", "note": "Chá de camomila + 50g queijo branco"}]'::jsonb, 6);

  -- DOMINGO (Dia de Descanso)
  INSERT INTO fitness_meal_plan_days (id, meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (gen_random_uuid(), v_meal_plan_id, 0, 'Domingo - Descanso', 2800, 'Preparação para nova semana.')
  RETURNING id INTO v_meal_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, order_index) VALUES
  (v_meal_day_id, 'breakfast', 'Café da Manhã', '08:30',
   '[{"name": "Açaí", "quantity": 300, "unit": "g", "calories": 330, "protein": 4, "carbs": 48, "fat": 15},
     {"name": "Granola", "quantity": 30, "unit": "g", "calories": 120, "protein": 3, "carbs": 21, "fat": 3},
     {"name": "Banana", "quantity": 1, "unit": "média", "calories": 105, "protein": 1, "carbs": 27, "fat": 0},
     {"name": "Whey protein", "quantity": 30, "unit": "g", "calories": 120, "protein": 24, "carbs": 3, "fat": 1}]'::jsonb,
   675, 32, 99, 19,
   'Açaí proteico. Misturar whey no açaí.',
   '[{"name": "Mingau de aveia", "note": "Aveia + whey + frutas"}]'::jsonb, 1),

  (v_meal_day_id, 'morning_snack', 'Lanche da Manhã', '11:00',
   '[{"name": "Ovos cozidos", "quantity": 3, "unit": "unidades", "calories": 234, "protein": 20, "carbs": 2, "fat": 17},
     {"name": "Pão integral", "quantity": 1, "unit": "fatia", "calories": 70, "protein": 3, "carbs": 12, "fat": 1}]'::jsonb,
   304, 23, 14, 18,
   'Snack proteico simples.',
   '[{"name": "Wrap de ovo", "note": "Wrap com ovo mexido e vegetais"}]'::jsonb, 2),

  (v_meal_day_id, 'lunch', 'Almoço', '13:00',
   '[{"name": "Arroz", "quantity": 150, "unit": "g cozido", "calories": 195, "protein": 4, "carbs": 42, "fat": 0},
     {"name": "Feijão tropeiro", "quantity": 150, "unit": "g", "calories": 200, "protein": 10, "carbs": 25, "fat": 7},
     {"name": "Pernil assado", "quantity": 200, "unit": "g", "calories": 380, "protein": 48, "carbs": 0, "fat": 20},
     {"name": "Couve refogada", "quantity": 100, "unit": "g", "calories": 30, "protein": 2, "carbs": 5, "fat": 1}]'::jsonb,
   805, 64, 72, 28,
   'Almoço mineiro tradicional.',
   '[{"name": "Feijoada light", "note": "Feijoada com carnes magras"}]'::jsonb, 3),

  (v_meal_day_id, 'afternoon_snack', 'Lanche da Tarde', '16:00',
   '[{"name": "Queijo coalho", "quantity": 80, "unit": "g", "calories": 272, "protein": 18, "carbs": 2, "fat": 22},
     {"name": "Melão", "quantity": 150, "unit": "g", "calories": 51, "protein": 1, "carbs": 13, "fat": 0}]'::jsonb,
   323, 19, 15, 22,
   'Queijo coalho grelhado com fruta.',
   '[{"name": "Espetinho de frango", "note": "100g de frango grelhado"}]'::jsonb, 4),

  (v_meal_day_id, 'dinner', 'Jantar', '19:30',
   '[{"name": "Omelete", "quantity": 4, "unit": "ovos", "calories": 312, "protein": 26, "carbs": 2, "fat": 22},
     {"name": "Queijo", "quantity": 50, "unit": "g", "calories": 160, "protein": 12, "carbs": 1, "fat": 12},
     {"name": "Vegetais", "quantity": 100, "unit": "g", "calories": 40, "protein": 2, "carbs": 8, "fat": 0},
     {"name": "Torrada", "quantity": 2, "unit": "unidades", "calories": 120, "protein": 4, "carbs": 22, "fat": 2}]'::jsonb,
   632, 44, 33, 36,
   'Jantar leve à base de ovos.',
   '[{"name": "Salada proteica", "note": "Salada com frango e ovos"}]'::jsonb, 5),

  (v_meal_day_id, 'supper', 'Ceia', '22:00',
   '[{"name": "Caseína", "quantity": 30, "unit": "g", "calories": 110, "protein": 24, "carbs": 3, "fat": 1},
     {"name": "Pasta de amendoim", "quantity": 15, "unit": "g", "calories": 94, "protein": 4, "carbs": 3, "fat": 8}]'::jsonb,
   204, 28, 6, 9,
   'Caseína com pasta de amendoim para noite.',
   '[{"name": "Cottage", "note": "150g de cottage"}]'::jsonb, 6);

  -- ============================================
  -- ATUALIZAR PERFIL DO CLIENTE COM METAS
  -- ============================================

  UPDATE fitness_profiles
  SET
    peso_atual = 85,
    objetivo = 'hipertrofia',
    nivel_atividade = 'intenso',
    meta_calorias_diarias = 3100,
    meta_proteina_g = 180,
    meta_carboidrato_g = 380,
    meta_gordura_g = 85,
    meta_agua_ml = 3500,
    updated_at = NOW()
  WHERE id = v_client_id;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'PROGRAMA CRIADO COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Cliente: %', v_client_id;
  RAISE NOTICE 'Personal Trainer: %', v_personal_id;
  RAISE NOTICE 'Nutricionista: %', v_nutri_id;
  RAISE NOTICE 'Programa de Treino: %', v_program_id;
  RAISE NOTICE 'Plano Alimentar: %', v_meal_plan_id;
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TREINO: 4x/semana (Seg, Ter, Qui, Sex)';
  RAISE NOTICE 'A: Peito + Tríceps | B: Costas + Bíceps';
  RAISE NOTICE 'C: Pernas Anterior | D: Ombros + Posterior';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'ALIMENTAÇÃO: 6 refeições/dia';
  RAISE NOTICE 'Meta: 3100 kcal | 180g prot | 380g carbs | 85g fat';
  RAISE NOTICE '==========================================';

END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado:

-- SELECT * FROM fitness_training_programs WHERE client_id = '0bd7b474-cdfe-499f-98bf-ac6832089d0e';
-- SELECT * FROM fitness_meal_plans WHERE client_id = '0bd7b474-cdfe-499f-98bf-ac6832089d0e';
-- SELECT COUNT(*) as total_exercicios FROM fitness_training_exercises;
-- SELECT COUNT(*) as total_refeicoes FROM fitness_meal_plan_meals;
