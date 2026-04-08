-- ============================================================
-- SEED: Dados completos de dieta + treino para 8 testers
-- Executar no Supabase SQL Editor (supabase.feliceconect.com.br)
-- ============================================================

-- ============================================================
-- PARTE 1: PLANOS ALIMENTARES
-- ============================================================
DO $$
DECLARE
  v_prof_nutri_id UUID;
  v_prof_trainer_id UUID;
  v_user_id UUID;
  v_plan_id UUID;
  v_day_id UUID;
  v_today DATE := CURRENT_DATE;
  v_emails TEXT[] := ARRAY[
    'edjanequeiroz@complexofelice.com.br',
    'karlagarcia@complexofelice.com.br',
    'mariaangelicacarvalho@complexofelice.com.br',
    'crislenerodrigues@complexofelice.com.br',
    'samanthaalves@complexofelice.com.br',
    'ludmillalaisse@complexofelice.com.br',
    'kauesayao@complexofelice.com.br',
    'norraynedeoliveira@complexofelice.com.br'
  ];
  v_names TEXT[] := ARRAY[
    'Edjane', 'Karla', 'Maria Angélica', 'Crislene',
    'Samantha', 'Ludmilla', 'Kauê', 'Norrayne'
  ];
  v_goals TEXT[] := ARRAY[
    'weight_loss', 'maintenance', 'weight_loss', 'muscle_gain',
    'weight_loss', 'maintenance', 'muscle_gain', 'weight_loss'
  ];
  v_cals INT[] := ARRAY[1800, 2000, 1700, 2200, 1800, 1900, 2600, 1750];
  v_prot INT[] := ARRAY[120, 130, 110, 160, 120, 125, 180, 115];
  v_carbs INT[] := ARRAY[180, 220, 170, 250, 180, 200, 300, 175];
  v_fat INT[] := ARRAY[65, 70, 60, 75, 65, 68, 90, 62];
  v_email TEXT;
  v_idx INT;
BEGIN

  -- Buscar nutricionista e personal
  SELECT id INTO v_prof_nutri_id FROM fitness_professionals WHERE type = 'nutritionist' AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_prof_trainer_id FROM fitness_professionals WHERE type = 'trainer' AND is_active = TRUE LIMIT 1;

  IF v_prof_nutri_id IS NULL THEN
    SELECT id INTO v_prof_nutri_id FROM fitness_professionals WHERE is_active = TRUE LIMIT 1;
  END IF;
  IF v_prof_trainer_id IS NULL THEN
    v_prof_trainer_id := v_prof_nutri_id;
  END IF;

  -- Loop por cada tester
  FOR v_idx IN 1..8 LOOP
    v_email := v_emails[v_idx];

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NULL THEN
      RAISE NOTICE 'SKIP: % não encontrado', v_email;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Processando: % (%)', v_names[v_idx], v_email;

    -- ========================================
    -- LIMPAR DADOS ANTERIORES
    -- ========================================
    DELETE FROM fitness_meal_plan_adherence WHERE client_id = v_user_id;
    DELETE FROM fitness_meal_plan_meals WHERE meal_plan_day_id IN (
      SELECT d.id FROM fitness_meal_plan_days d JOIN fitness_meal_plans p ON d.meal_plan_id = p.id WHERE p.client_id = v_user_id
    );
    DELETE FROM fitness_meal_plan_days WHERE meal_plan_id IN (SELECT id FROM fitness_meal_plans WHERE client_id = v_user_id);
    DELETE FROM fitness_meal_plans WHERE client_id = v_user_id;

    DELETE FROM fitness_training_adherence WHERE client_id = v_user_id;
    DELETE FROM fitness_training_exercises WHERE training_day_id IN (
      SELECT td.id FROM fitness_training_days td
      JOIN fitness_training_weeks tw ON td.week_id = tw.id
      JOIN fitness_training_programs tp ON tw.program_id = tp.id
      WHERE tp.client_id = v_user_id
    );
    DELETE FROM fitness_training_days WHERE week_id IN (
      SELECT tw.id FROM fitness_training_weeks tw
      JOIN fitness_training_programs tp ON tw.program_id = tp.id
      WHERE tp.client_id = v_user_id
    );
    DELETE FROM fitness_training_weeks WHERE program_id IN (SELECT id FROM fitness_training_programs WHERE client_id = v_user_id);
    DELETE FROM fitness_training_programs WHERE client_id = v_user_id;

    DELETE FROM fitness_meal_items WHERE meal_id IN (SELECT id FROM fitness_meals WHERE user_id = v_user_id);
    DELETE FROM fitness_meals WHERE user_id = v_user_id;

    -- ========================================
    -- PLANO ALIMENTAR
    -- ========================================
    INSERT INTO fitness_meal_plans (
      professional_id, client_id, name, description, goal,
      calories_target, protein_target, carbs_target, fat_target, fiber_target, water_target,
      duration_weeks, is_template, is_active, starts_at, ends_at, notes
    ) VALUES (
      v_prof_nutri_id, v_user_id,
      'Plano Personalizado - ' || v_names[v_idx],
      'Plano alimentar personalizado focado em ' ||
        CASE v_goals[v_idx]
          WHEN 'weight_loss' THEN 'emagrecimento saudável com manutenção de massa magra'
          WHEN 'maintenance' THEN 'manutenção do peso e qualidade nutricional'
          WHEN 'muscle_gain' THEN 'ganho de massa muscular com alimentação limpa'
        END,
      v_goals[v_idx],
      v_cals[v_idx], v_prot[v_idx], v_carbs[v_idx], v_fat[v_idx], 25, 2500,
      8, FALSE, TRUE,
      v_today - INTERVAL '7 days',
      v_today + INTERVAL '49 days',
      'Ajustar porções conforme resposta individual. Beber bastante água.'
    ) RETURNING id INTO v_plan_id;

    -- ==========================================
    -- SEGUNDA (day_of_week = 1)
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 1, 'Segunda - Dia de Treino', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã', '07:00',
      '[{"name":"Ovos mexidos","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Queijo branco","quantity":30,"unit":"g","calories":75,"protein":6,"carbs":1,"fat":5},{"name":"Café com leite desnatado","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
      425, 30, 36, 17, NULL,
      '[{"option":"B","name":"Tapioca com ovo","foods":[{"name":"Tapioca","quantity":2,"unit":"unidade","calories":140,"protein":0,"carbs":34,"fat":0},{"name":"Ovo mexido","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]},{"option":"C","name":"Smoothie proteico","foods":[{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Leite desnatado","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0},{"name":"Aveia","quantity":30,"unit":"g","calories":110,"protein":4,"carbs":18,"fat":3}]}]'::jsonb,
      FALSE, 1),
    (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
      '[{"name":"Iogurte natural","quantity":170,"unit":"g","calories":100,"protein":10,"carbs":8,"fat":3},{"name":"Castanhas","quantity":20,"unit":"g","calories":120,"protein":3,"carbs":4,"fat":11}]'::jsonb,
      220, 13, 12, 14, NULL,
      '[{"option":"B","name":"Fruta com granola","foods":[{"name":"Maçã","quantity":1,"unit":"unidade","calories":80,"protein":0,"carbs":20,"fat":0},{"name":"Granola sem açúcar","quantity":25,"unit":"g","calories":100,"protein":3,"carbs":15,"fat":4}]}]'::jsonb,
      FALSE, 2),
    (v_day_id, 'lunch', 'Almoço', '12:30',
      '[{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Feijão","quantity":80,"unit":"g","calories":62,"protein":4,"carbs":11,"fat":0},{"name":"Frango grelhado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Salada verde","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Legumes refogados","quantity":100,"unit":"g","calories":45,"protein":2,"carbs":8,"fat":1},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      564, 48, 53, 17, 'Grelhar o frango com temperos naturais.',
      '[{"option":"B","name":"Peixe com batata doce","foods":[{"name":"Tilápia grelhada","quantity":180,"unit":"g","calories":198,"protein":40,"carbs":0,"fat":4},{"name":"Batata doce","quantity":150,"unit":"g","calories":129,"protein":2,"carbs":30,"fat":0},{"name":"Salada","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]},{"option":"C","name":"Carne com quinoa","foods":[{"name":"Patinho grelhado","quantity":130,"unit":"g","calories":195,"protein":33,"carbs":0,"fat":7},{"name":"Quinoa","quantity":100,"unit":"g","calories":120,"protein":4,"carbs":21,"fat":2},{"name":"Brócolis","quantity":100,"unit":"g","calories":35,"protein":3,"carbs":7,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]}]'::jsonb,
      FALSE, 3),
    (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '15:30',
      '[{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Pasta de amendoim","quantity":15,"unit":"g","calories":90,"protein":4,"carbs":3,"fat":8}]'::jsonb,
      180, 5, 26, 8, NULL,
      '[{"option":"B","name":"Sanduíche natural","foods":[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Peito de peru","quantity":40,"unit":"g","calories":40,"protein":8,"carbs":1,"fat":1}]}]'::jsonb,
      FALSE, 4),
    (v_day_id, 'dinner', 'Jantar', '19:30',
      '[{"name":"Salmão grelhado","quantity":130,"unit":"g","calories":234,"protein":26,"carbs":0,"fat":14},{"name":"Arroz integral","quantity":80,"unit":"g","calories":96,"protein":2,"carbs":20,"fat":1},{"name":"Salada de folhas","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      395, 29, 24, 20, NULL,
      '[{"option":"B","name":"Omelete com salada","foods":[{"name":"Ovos","quantity":3,"unit":"unidade","calories":210,"protein":18,"carbs":2,"fat":15},{"name":"Espinafre","quantity":50,"unit":"g","calories":12,"protein":1,"carbs":2,"fat":0},{"name":"Queijo minas","quantity":30,"unit":"g","calories":75,"protein":6,"carbs":1,"fat":5},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]}]'::jsonb,
      FALSE, 5);

    -- ==========================================
    -- TERÇA (day_of_week = 2)
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 2, 'Terça - Dia de Treino', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã', '07:00',
      '[{"name":"Panqueca de aveia e banana","quantity":2,"unit":"unidade","calories":180,"protein":8,"carbs":24,"fat":6},{"name":"Mel","quantity":10,"unit":"g","calories":30,"protein":0,"carbs":8,"fat":0},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
      280, 14, 42, 6, 'Bater 1 banana, 2 ovos e 3 colheres de aveia.',
      '[{"option":"B","name":"Açaí com granola","foods":[{"name":"Açaí sem açúcar","quantity":150,"unit":"g","calories":90,"protein":2,"carbs":12,"fat":5},{"name":"Granola","quantity":30,"unit":"g","calories":120,"protein":3,"carbs":18,"fat":4},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0}]}]'::jsonb,
      FALSE, 1),
    (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
      '[{"name":"Frutas da estação","quantity":150,"unit":"g","calories":75,"protein":1,"carbs":19,"fat":0},{"name":"Castanha do Pará","quantity":2,"unit":"unidade","calories":66,"protein":1,"carbs":1,"fat":6}]'::jsonb,
      141, 2, 20, 6, NULL, NULL, FALSE, 2),
    (v_day_id, 'lunch', 'Almoço', '12:30',
      '[{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Lentilha","quantity":80,"unit":"g","calories":93,"protein":7,"carbs":16,"fat":0},{"name":"Peito de frango grelhado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Cenoura e abobrinha","quantity":100,"unit":"g","calories":30,"protein":1,"carbs":6,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      560, 49, 52, 16, NULL,
      '[{"option":"B","name":"Strogonoff saudável","foods":[{"name":"Frango em cubos","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Creme de leite light","quantity":40,"unit":"g","calories":52,"protein":1,"carbs":2,"fat":4},{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]}]'::jsonb,
      FALSE, 3),
    (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '15:30',
      '[{"name":"Iogurte grego","quantity":170,"unit":"g","calories":100,"protein":10,"carbs":8,"fat":3},{"name":"Chia","quantity":10,"unit":"g","calories":49,"protein":2,"carbs":4,"fat":3}]'::jsonb,
      149, 12, 12, 6, NULL,
      '[{"option":"B","name":"Wrap de atum","foods":[{"name":"Tortilla integral","quantity":1,"unit":"unidade","calories":120,"protein":4,"carbs":18,"fat":3},{"name":"Atum","quantity":60,"unit":"g","calories":60,"protein":14,"carbs":0,"fat":1}]}]'::jsonb,
      FALSE, 4),
    (v_day_id, 'dinner', 'Jantar', '19:30',
      '[{"name":"Tilápia grelhada","quantity":150,"unit":"g","calories":165,"protein":33,"carbs":0,"fat":3},{"name":"Purê de abóbora","quantity":120,"unit":"g","calories":48,"protein":1,"carbs":11,"fat":0},{"name":"Salada verde","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      278, 35, 15, 8, NULL,
      '[{"option":"B","name":"Sopa de legumes com frango","foods":[{"name":"Sopa caseira","quantity":400,"unit":"ml","calories":200,"protein":20,"carbs":18,"fat":5},{"name":"Torrada integral","quantity":2,"unit":"unidade","calories":80,"protein":3,"carbs":14,"fat":1}]}]'::jsonb,
      FALSE, 5);

    -- ==========================================
    -- QUARTA (day_of_week = 3) — Descanso
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 3, 'Quarta - Descanso', v_cals[v_idx] - 200)
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã Leve', '07:30',
      '[{"name":"Iogurte natural","quantity":200,"unit":"g","calories":120,"protein":8,"carbs":12,"fat":5},{"name":"Granola sem açúcar","quantity":30,"unit":"g","calories":120,"protein":3,"carbs":18,"fat":4},{"name":"Morango","quantity":80,"unit":"g","calories":26,"protein":1,"carbs":6,"fat":0}]'::jsonb,
      266, 12, 36, 9, NULL,
      '[{"option":"B","name":"Crepioca","foods":[{"name":"Crepioca","quantity":1,"unit":"unidade","calories":90,"protein":7,"carbs":8,"fat":3},{"name":"Queijo branco","quantity":30,"unit":"g","calories":75,"protein":6,"carbs":1,"fat":5},{"name":"Café","quantity":200,"unit":"ml","calories":5,"protein":0,"carbs":0,"fat":0}]}]'::jsonb,
      FALSE, 1),
    (v_day_id, 'lunch', 'Almoço', '12:30',
      '[{"name":"Arroz integral","quantity":100,"unit":"g","calories":120,"protein":3,"carbs":25,"fat":1},{"name":"Feijão","quantity":80,"unit":"g","calories":62,"protein":4,"carbs":11,"fat":0},{"name":"Carne moída magra","quantity":120,"unit":"g","calories":180,"protein":24,"carbs":0,"fat":9},{"name":"Salada colorida","quantity":120,"unit":"g","calories":30,"protein":1,"carbs":6,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      437, 32, 42, 15, NULL,
      '[{"option":"B","name":"Frango com purê","foods":[{"name":"Frango grelhado","quantity":130,"unit":"g","calories":215,"protein":33,"carbs":0,"fat":9},{"name":"Purê de batata","quantity":120,"unit":"g","calories":100,"protein":2,"carbs":22,"fat":0},{"name":"Salada","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]}]'::jsonb,
      FALSE, 2),
    (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '16:00',
      '[{"name":"Maçã","quantity":1,"unit":"unidade","calories":80,"protein":0,"carbs":20,"fat":0},{"name":"Amêndoas","quantity":15,"unit":"g","calories":90,"protein":3,"carbs":3,"fat":8}]'::jsonb,
      170, 3, 23, 8, NULL, NULL, FALSE, 3),
    (v_day_id, 'dinner', 'Jantar Leve', '19:30',
      '[{"name":"Omelete","quantity":1,"unit":"porção","calories":210,"protein":18,"carbs":2,"fat":15},{"name":"Salada de folhas","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Tomate","quantity":80,"unit":"g","calories":14,"protein":1,"carbs":3,"fat":0}]'::jsonb,
      244, 20, 9, 15, NULL,
      '[{"option":"B","name":"Salada completa","foods":[{"name":"Mix de folhas","quantity":100,"unit":"g","calories":20,"protein":2,"carbs":3,"fat":0},{"name":"Frango desfiado","quantity":100,"unit":"g","calories":165,"protein":25,"carbs":0,"fat":7},{"name":"Ovo cozido","quantity":1,"unit":"unidade","calories":70,"protein":6,"carbs":0,"fat":5}]}]'::jsonb,
      FALSE, 4);

    -- ==========================================
    -- QUINTA (day_of_week = 4) — Treino
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 4, 'Quinta - Dia de Treino', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    -- Reutiliza as mesmas refeições de segunda com pequenas variações
    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã', '07:00',
      '[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Ricota","quantity":40,"unit":"g","calories":50,"protein":4,"carbs":1,"fat":3},{"name":"Ovo cozido","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Mamão","quantity":100,"unit":"g","calories":40,"protein":1,"carbs":10,"fat":0},{"name":"Café","quantity":200,"unit":"ml","calories":5,"protein":0,"carbs":0,"fat":0}]'::jsonb,
      375, 23, 36, 15, NULL,
      '[{"option":"B","name":"Overnight oats","foods":[{"name":"Aveia","quantity":40,"unit":"g","calories":147,"protein":5,"carbs":24,"fat":4},{"name":"Leite desnatado","quantity":150,"unit":"ml","calories":53,"protein":5,"carbs":7,"fat":0},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Chia","quantity":10,"unit":"g","calories":49,"protein":2,"carbs":4,"fat":3}]}]'::jsonb,
      FALSE, 1),
    (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
      '[{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Pasta de amendoim","quantity":10,"unit":"g","calories":60,"protein":3,"carbs":2,"fat":5}]'::jsonb,
      150, 4, 25, 5, NULL, NULL, FALSE, 2),
    (v_day_id, 'lunch', 'Almoço', '12:30',
      '[{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Feijão preto","quantity":80,"unit":"g","calories":67,"protein":5,"carbs":12,"fat":0},{"name":"Alcatra grelhada","quantity":130,"unit":"g","calories":221,"protein":29,"carbs":0,"fat":11},{"name":"Beterraba e cenoura","quantity":80,"unit":"g","calories":30,"protein":1,"carbs":7,"fat":0},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      522, 39, 52, 17, NULL,
      '[{"option":"B","name":"Moqueca light","foods":[{"name":"Peixe branco","quantity":150,"unit":"g","calories":150,"protein":30,"carbs":0,"fat":3},{"name":"Leite de coco light","quantity":40,"unit":"ml","calories":36,"protein":0,"carbs":1,"fat":4},{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]}]'::jsonb,
      FALSE, 3),
    (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '15:30',
      '[{"name":"Iogurte grego","quantity":170,"unit":"g","calories":100,"protein":10,"carbs":8,"fat":3},{"name":"Mix de castanhas","quantity":15,"unit":"g","calories":90,"protein":2,"carbs":3,"fat":8}]'::jsonb,
      190, 12, 11, 11, NULL, NULL, FALSE, 4),
    (v_day_id, 'dinner', 'Jantar', '19:30',
      '[{"name":"Frango desfiado","quantity":130,"unit":"g","calories":215,"protein":33,"carbs":0,"fat":9},{"name":"Macarrão integral","quantity":80,"unit":"g","calories":128,"protein":5,"carbs":24,"fat":2},{"name":"Molho de tomate","quantity":60,"unit":"g","calories":24,"protein":1,"carbs":4,"fat":0},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
      382, 40, 31, 11, NULL,
      '[{"option":"B","name":"Escondidinho de frango","foods":[{"name":"Frango desfiado","quantity":120,"unit":"g","calories":198,"protein":30,"carbs":0,"fat":8},{"name":"Purê de couve-flor","quantity":150,"unit":"g","calories":38,"protein":3,"carbs":6,"fat":1},{"name":"Queijo gratinado","quantity":20,"unit":"g","calories":73,"protein":5,"carbs":1,"fat":6}]}]'::jsonb,
      FALSE, 5);

    -- ==========================================
    -- SEXTA (day_of_week = 5) — Treino
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 5, 'Sexta - Dia de Treino', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã', '07:00',
      '[{"name":"Tapioca","quantity":2,"unit":"unidade","calories":140,"protein":0,"carbs":34,"fat":0},{"name":"Queijo coalho","quantity":40,"unit":"g","calories":120,"protein":8,"carbs":1,"fat":9},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
      330, 14, 45, 9, NULL,
      '[{"option":"B","name":"Pão com abacate","foods":[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Abacate amassado","quantity":50,"unit":"g","calories":80,"protein":1,"carbs":4,"fat":7},{"name":"Ovo","quantity":1,"unit":"unidade","calories":70,"protein":6,"carbs":0,"fat":5}]}]'::jsonb,
      FALSE, 1),
    (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
      '[{"name":"Vitamina de frutas","quantity":300,"unit":"ml","calories":180,"protein":6,"carbs":30,"fat":3}]'::jsonb,
      180, 6, 30, 3, 'Bater leite desnatado, banana e morango.', NULL, FALSE, 2),
    (v_day_id, 'lunch', 'Almoço', '12:30',
      '[{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Feijão tropeiro","quantity":100,"unit":"g","calories":142,"protein":8,"carbs":17,"fat":5},{"name":"Frango assado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Salada","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
      599, 50, 51, 21, NULL,
      '[{"option":"B","name":"Poke bowl","foods":[{"name":"Salmão cru","quantity":120,"unit":"g","calories":184,"protein":24,"carbs":0,"fat":10},{"name":"Arroz","quantity":120,"unit":"g","calories":156,"protein":3,"carbs":33,"fat":0},{"name":"Edamame","quantity":40,"unit":"g","calories":48,"protein":4,"carbs":4,"fat":2},{"name":"Abacate","quantity":40,"unit":"g","calories":64,"protein":1,"carbs":3,"fat":6}]}]'::jsonb,
      FALSE, 3),
    (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '15:30',
      '[{"name":"Queijo minas","quantity":40,"unit":"g","calories":100,"protein":8,"carbs":1,"fat":7},{"name":"Tomate cereja","quantity":60,"unit":"g","calories":11,"protein":1,"carbs":2,"fat":0}]'::jsonb,
      111, 9, 3, 7, NULL, NULL, FALSE, 4),
    (v_day_id, 'dinner', 'Jantar', '19:30',
      '[{"name":"Sopa de legumes com frango","quantity":400,"unit":"ml","calories":200,"protein":20,"carbs":18,"fat":5},{"name":"Torrada integral","quantity":2,"unit":"unidade","calories":80,"protein":3,"carbs":14,"fat":1}]'::jsonb,
      280, 23, 32, 6, NULL,
      '[{"option":"B","name":"Wrap de frango","foods":[{"name":"Tortilla integral","quantity":1,"unit":"unidade","calories":120,"protein":4,"carbs":18,"fat":3},{"name":"Frango desfiado","quantity":80,"unit":"g","calories":132,"protein":20,"carbs":0,"fat":5},{"name":"Alface e tomate","quantity":50,"unit":"g","calories":10,"protein":0,"carbs":2,"fat":0}]}]'::jsonb,
      FALSE, 5);

    -- ==========================================
    -- SÁBADO (day_of_week = 6) — Flexível
    -- ==========================================
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 6, 'Sábado - Flexível', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Brunch', '09:00',
      '[{"name":"Ovos mexidos","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Pão artesanal","quantity":2,"unit":"fatia","calories":160,"protein":5,"carbs":28,"fat":3},{"name":"Suco de laranja","quantity":250,"unit":"ml","calories":112,"protein":2,"carbs":25,"fat":0}]'::jsonb,
      412, 19, 54, 13, NULL, NULL, FALSE, 1),
    (v_day_id, 'lunch', 'Almoço', '13:00',
      '[{"name":"Arroz","quantity":120,"unit":"g","calories":156,"protein":3,"carbs":33,"fat":0},{"name":"Feijão","quantity":80,"unit":"g","calories":62,"protein":4,"carbs":11,"fat":0},{"name":"Carne grelhada","quantity":150,"unit":"g","calories":255,"protein":30,"carbs":0,"fat":15},{"name":"Vinagrete","quantity":50,"unit":"g","calories":25,"protein":0,"carbs":4,"fat":1},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
      513, 38, 51, 16, NULL,
      '[{"option":"B","name":"Churrasco saudável","foods":[{"name":"Fraldinha","quantity":120,"unit":"g","calories":204,"protein":24,"carbs":0,"fat":12},{"name":"Frango","quantity":100,"unit":"g","calories":165,"protein":25,"carbs":0,"fat":7},{"name":"Arroz","quantity":100,"unit":"g","calories":130,"protein":3,"carbs":28,"fat":0},{"name":"Salada","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0}]}]'::jsonb,
      FALSE, 2),
    (v_day_id, 'afternoon_snack', 'Lanche', '16:00',
      '[{"name":"Açaí","quantity":200,"unit":"g","calories":120,"protein":2,"carbs":16,"fat":7},{"name":"Granola","quantity":20,"unit":"g","calories":80,"protein":2,"carbs":12,"fat":3},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0}]'::jsonb,
      290, 5, 51, 10, NULL, NULL, FALSE, 3),
    (v_day_id, 'dinner', 'Jantar Leve', '20:00',
      '[{"name":"Salada Caesar light","quantity":1,"unit":"porção","calories":250,"protein":20,"carbs":12,"fat":14}]'::jsonb,
      250, 20, 12, 14, NULL, NULL, FALSE, 4);

    -- DOMINGO (day_of_week = 0) — Mesmo que sábado
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target)
    VALUES (v_plan_id, 0, 'Domingo', v_cals[v_idx])
    RETURNING id INTO v_day_id;

    INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
    VALUES
    (v_day_id, 'breakfast', 'Café da Manhã', '09:00',
      '[{"name":"Pão francês integral","quantity":1,"unit":"unidade","calories":150,"protein":5,"carbs":28,"fat":2},{"name":"Requeijão light","quantity":20,"unit":"g","calories":33,"protein":2,"carbs":1,"fat":2},{"name":"Presunto de peru","quantity":30,"unit":"g","calories":30,"protein":6,"carbs":1,"fat":1},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
      283, 19, 40, 5, NULL, NULL, FALSE, 1),
    (v_day_id, 'lunch', 'Almoço de Domingo', '13:00',
      '[{"name":"Arroz","quantity":130,"unit":"g","calories":169,"protein":3,"carbs":35,"fat":0},{"name":"Feijão tropeiro","quantity":100,"unit":"g","calories":142,"protein":8,"carbs":17,"fat":5},{"name":"Frango assado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Maionese de batata light","quantity":60,"unit":"g","calories":60,"protein":1,"carbs":9,"fat":2},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
      634, 51, 64, 17, NULL, NULL, FALSE, 2),
    (v_day_id, 'afternoon_snack', 'Lanche', '16:30',
      '[{"name":"Pipoca caseira","quantity":30,"unit":"g","calories":112,"protein":4,"carbs":18,"fat":2}]'::jsonb,
      112, 4, 18, 2, NULL, NULL, FALSE, 3),
    (v_day_id, 'dinner', 'Jantar', '19:30',
      '[{"name":"Wrap integral de atum","quantity":1,"unit":"unidade","calories":230,"protein":18,"carbs":22,"fat":8},{"name":"Salada","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
      245, 19, 25, 8, NULL, NULL, FALSE, 4);

    -- ========================================
    -- HISTÓRICO DE REFEIÇÕES (5 dias)
    -- ========================================
    INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total)
    VALUES
    (v_user_id, v_today - 1, 'cafe_manha', '07:15', 'concluido', 425, 30, 36, 17),
    (v_user_id, v_today - 1, 'lanche_manha', '10:05', 'concluido', 220, 13, 12, 14),
    (v_user_id, v_today - 1, 'almoco', '12:40', 'concluido', 564, 48, 53, 17),
    (v_user_id, v_today - 1, 'lanche_tarde', '15:35', 'concluido', 180, 5, 26, 8),
    (v_user_id, v_today - 1, 'jantar', '19:40', 'concluido', 395, 29, 24, 20),
    (v_user_id, v_today - 2, 'cafe_manha', '07:20', 'concluido', 280, 14, 42, 6),
    (v_user_id, v_today - 2, 'almoco', '12:35', 'concluido', 560, 49, 52, 16),
    (v_user_id, v_today - 2, 'lanche_tarde', '15:40', 'concluido', 149, 12, 12, 6),
    (v_user_id, v_today - 2, 'jantar', '19:45', 'concluido', 278, 35, 15, 8),
    (v_user_id, v_today - 3, 'cafe_manha', '07:30', 'concluido', 266, 12, 36, 9),
    (v_user_id, v_today - 3, 'almoco', '12:45', 'concluido', 437, 32, 42, 15),
    (v_user_id, v_today - 3, 'jantar', '19:30', 'concluido', 244, 20, 9, 15),
    (v_user_id, v_today - 4, 'cafe_manha', '07:10', 'concluido', 375, 23, 36, 15),
    (v_user_id, v_today - 4, 'almoco', '12:30', 'concluido', 522, 39, 52, 17),
    (v_user_id, v_today - 4, 'jantar', '19:35', 'concluido', 382, 40, 31, 11),
    (v_user_id, v_today - 5, 'cafe_manha', '07:05', 'concluido', 330, 14, 45, 9),
    (v_user_id, v_today - 5, 'almoco', '12:30', 'concluido', 599, 50, 51, 21),
    (v_user_id, v_today - 5, 'jantar', '19:30', 'concluido', 280, 23, 32, 6);

    -- Aderência
    INSERT INTO fitness_meal_plan_adherence (meal_plan_id, client_id, date, meals_planned, meals_completed, adherence_percentage, calories_consumed)
    VALUES
    (v_plan_id, v_user_id, v_today - 1, 5, 5, 100.0, 1784),
    (v_plan_id, v_user_id, v_today - 2, 5, 4, 80.0, 1267),
    (v_plan_id, v_user_id, v_today - 3, 4, 3, 75.0, 947),
    (v_plan_id, v_user_id, v_today - 4, 5, 3, 60.0, 1279),
    (v_plan_id, v_user_id, v_today - 5, 5, 3, 60.0, 1209);

    RAISE NOTICE '✅ Dieta criada para %', v_names[v_idx];

  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PLANOS ALIMENTARES CRIADOS PARA TODOS!';

END $$;

-- ============================================================
-- PARTE 2: PROGRAMAS DE TREINO
-- ============================================================
DO $$
DECLARE
  v_prof_trainer_id UUID;
  v_user_id UUID;
  v_program_id UUID;
  v_week_id UUID;
  v_day1_id UUID;
  v_day2_id UUID;
  v_day3_id UUID;
  v_today DATE := CURRENT_DATE;
  v_emails TEXT[] := ARRAY[
    'edjanequeiroz@complexofelice.com.br',
    'karlagarcia@complexofelice.com.br',
    'mariaangelicacarvalho@complexofelice.com.br',
    'crislenerodrigues@complexofelice.com.br',
    'samanthaalves@complexofelice.com.br',
    'ludmillalaisse@complexofelice.com.br',
    'kauesayao@complexofelice.com.br',
    'norraynedeoliveira@complexofelice.com.br'
  ];
  v_names TEXT[] := ARRAY[
    'Edjane', 'Karla', 'Maria Angélica', 'Crislene',
    'Samantha', 'Ludmilla', 'Kauê', 'Norrayne'
  ];
  v_goals TEXT[] := ARRAY[
    'weight_loss', 'functional', 'weight_loss', 'hypertrophy',
    'weight_loss', 'functional', 'hypertrophy', 'weight_loss'
  ];
  v_difficulties TEXT[] := ARRAY[
    'beginner', 'intermediate', 'beginner', 'intermediate',
    'beginner', 'intermediate', 'advanced', 'beginner'
  ];
  v_email TEXT;
  v_idx INT;
BEGIN

  SELECT id INTO v_prof_trainer_id FROM fitness_professionals WHERE type = 'trainer' AND is_active = TRUE LIMIT 1;
  IF v_prof_trainer_id IS NULL THEN
    SELECT id INTO v_prof_trainer_id FROM fitness_professionals WHERE is_active = TRUE LIMIT 1;
  END IF;

  FOR v_idx IN 1..8 LOOP
    v_email := v_emails[v_idx];
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NULL THEN CONTINUE; END IF;

    -- Criar programa de treino
    INSERT INTO fitness_training_programs (
      professional_id, client_id, name, description, goal, difficulty,
      duration_weeks, days_per_week, session_duration, equipment_needed,
      is_template, is_active, starts_at, ends_at, notes
    ) VALUES (
      v_prof_trainer_id, v_user_id,
      'Programa ' || v_names[v_idx] || ' - ' || INITCAP(REPLACE(v_goals[v_idx], '_', ' ')),
      'Programa personalizado para ' || v_names[v_idx],
      v_goals[v_idx], v_difficulties[v_idx],
      8, 3, 50,
      '["dumbbells", "cables", "machines"]'::jsonb,
      FALSE, TRUE,
      v_today - INTERVAL '7 days',
      v_today + INTERVAL '49 days',
      'Ajustar cargas progressivamente. Descanso de 48h entre treinos do mesmo grupo.'
    ) RETURNING id INTO v_program_id;

    -- Semana 1
    INSERT INTO fitness_training_weeks (program_id, week_number, name, focus, intensity_modifier)
    VALUES (v_program_id, 1, 'Semana de Adaptação', 'volume', 0.8)
    RETURNING id INTO v_week_id;

    -- TREINO A — Superior (Segunda / day_of_week=1)
    INSERT INTO fitness_training_days (week_id, day_of_week, day_number, name, muscle_groups, estimated_duration, order_index)
    VALUES (v_week_id, 1, 1, 'Treino A - Superior', '["chest","shoulders","triceps"]'::jsonb, 50, 1)
    RETURNING id INTO v_day1_id;

    INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, weight_suggestion, rpe_target, instructions, order_index)
    VALUES
    (v_day1_id, 'Supino reto com halteres', 'compound', 'chest', 4, '10-12', 60, 'Moderado', 7, 'Descer controlado até a linha do peito. Subir forte.', 1),
    (v_day1_id, 'Supino inclinado máquina', 'compound', 'chest', 3, '12', 60, 'Moderado', 7, 'Foco na contração do peitoral superior.', 2),
    (v_day1_id, 'Crucifixo na polia', 'isolation', 'chest', 3, '12-15', 45, 'Leve-moderado', 7, 'Braços levemente flexionados. Squeeze no final.', 3),
    (v_day1_id, 'Desenvolvimento com halteres', 'compound', 'shoulders', 3, '10-12', 60, 'Moderado', 7, 'Subir sem travar os cotovelos.', 4),
    (v_day1_id, 'Elevação lateral', 'isolation', 'shoulders', 3, '12-15', 45, 'Leve', 7, 'Cotovelos levemente flexionados. Subir até linha dos ombros.', 5),
    (v_day1_id, 'Tríceps corda na polia', 'isolation', 'triceps', 3, '12-15', 45, 'Moderado', 7, 'Abrir as mãos na parte final do movimento.', 6),
    (v_day1_id, 'Tríceps francês', 'isolation', 'triceps', 3, '10-12', 45, 'Moderado', 7, 'Descer atrás da cabeça controlando.', 7);

    -- TREINO B — Inferior (Quarta / day_of_week=3)
    INSERT INTO fitness_training_days (week_id, day_of_week, day_number, name, muscle_groups, estimated_duration, order_index)
    VALUES (v_week_id, 3, 2, 'Treino B - Inferior', '["legs","glutes","calves"]'::jsonb, 50, 2)
    RETURNING id INTO v_day2_id;

    INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, weight_suggestion, rpe_target, instructions, order_index)
    VALUES
    (v_day2_id, 'Agachamento no Smith', 'compound', 'legs', 4, '10-12', 90, 'Moderado-pesado', 8, 'Descer até 90 graus. Joelhos alinhados com os pés.', 1),
    (v_day2_id, 'Leg Press 45°', 'compound', 'legs', 4, '12', 90, 'Pesado', 8, 'Não travar os joelhos na subida.', 2),
    (v_day2_id, 'Cadeira extensora', 'isolation', 'legs', 3, '12-15', 60, 'Moderado', 7, 'Extensão completa. Descida controlada.', 3),
    (v_day2_id, 'Mesa flexora', 'isolation', 'legs', 3, '12', 60, 'Moderado', 7, 'Foco no posterior da coxa.', 4),
    (v_day2_id, 'Búlgaro com halteres', 'compound', 'glutes', 3, '10 cada', 60, 'Moderado', 8, 'Pé de trás elevado no banco.', 5),
    (v_day2_id, 'Elevação pélvica', 'compound', 'glutes', 3, '15', 60, 'Moderado', 7, 'Squeeze forte no topo. Segurar 2s.', 6),
    (v_day2_id, 'Panturrilha no leg press', 'isolation', 'calves', 4, '15-20', 30, 'Moderado', 7, 'Amplitude máxima.', 7);

    -- TREINO C — Costas e Bíceps (Sexta / day_of_week=5)
    INSERT INTO fitness_training_days (week_id, day_of_week, day_number, name, muscle_groups, estimated_duration, order_index)
    VALUES (v_week_id, 5, 3, 'Treino C - Costas e Bíceps', '["back","biceps","core"]'::jsonb, 50, 3)
    RETURNING id INTO v_day3_id;

    INSERT INTO fitness_training_exercises (training_day_id, exercise_name, exercise_category, muscle_group, sets, reps, rest_seconds, weight_suggestion, rpe_target, instructions, order_index)
    VALUES
    (v_day3_id, 'Puxada frontal', 'compound', 'back', 4, '10-12', 60, 'Moderado', 7, 'Puxar até o queixo. Foco nas costas.', 1),
    (v_day3_id, 'Remada curvada com halteres', 'compound', 'back', 4, '10-12', 60, 'Moderado', 7, 'Tronco a 45 graus. Cotovelos próximos ao corpo.', 2),
    (v_day3_id, 'Remada sentada na polia', 'compound', 'back', 3, '12', 60, 'Moderado', 7, 'Não balançar o tronco.', 3),
    (v_day3_id, 'Pullover na polia', 'isolation', 'back', 3, '12-15', 45, 'Leve-moderado', 7, 'Braços estendidos. Foco no dorsal.', 4),
    (v_day3_id, 'Rosca direta com barra', 'isolation', 'biceps', 3, '10-12', 45, 'Moderado', 7, 'Cotovelos fixos ao lado do corpo.', 5),
    (v_day3_id, 'Rosca martelo', 'isolation', 'biceps', 3, '12', 45, 'Moderado', 7, 'Alternando os braços.', 6),
    (v_day3_id, 'Abdominal na máquina', 'isolation', 'core', 3, '15-20', 30, 'Leve', 6, 'Contração controlada. Sem forçar o pescoço.', 7);

    RAISE NOTICE '✅ Treino criado para %', v_names[v_idx];

  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PROGRAMAS DE TREINO CRIADOS PARA TODOS!';

END $$;
