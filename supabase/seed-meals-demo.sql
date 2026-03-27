-- ============================================================
-- SEED: Dados de refeições demo para felicemed@gmail.com
-- Executar no Supabase SQL Editor (supabase.feliceconect.com.br)
-- ============================================================

-- RLS: permitir que clientes vejam profissionais (necessário para join do plano alimentar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Clients can view professionals' AND tablename = 'fitness_professionals'
  ) THEN
    EXECUTE 'CREATE POLICY "Clients can view professionals" ON fitness_professionals FOR SELECT USING (true)';
  END IF;
END $$;

DO $$
DECLARE
  v_user_id UUID;
  v_prof_id UUID;
  v_plan_id UUID;
  v_day_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN

  -- 1. Buscar user_id do felicemed@gmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felicemed@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário felicemed@gmail.com não encontrado';
  END IF;

  -- 2. Buscar um profissional nutricionista (ou o primeiro disponível)
  SELECT id INTO v_prof_id FROM fitness_professionals
    WHERE type = 'nutritionist' AND is_active = TRUE
    LIMIT 1;

  -- Se não existe nutricionista, tentar qualquer profissional
  IF v_prof_id IS NULL THEN
    SELECT id INTO v_prof_id FROM fitness_professionals WHERE is_active = TRUE LIMIT 1;
  END IF;

  -- ============================================================
  -- 3. PLANO ALIMENTAR (do nutricionista)
  -- ============================================================

  -- Limpar plano anterior (se houver)
  DELETE FROM fitness_meal_plan_adherence WHERE client_id = v_user_id;
  DELETE FROM fitness_meal_plan_meals WHERE meal_plan_day_id IN (
    SELECT d.id FROM fitness_meal_plan_days d
    JOIN fitness_meal_plans p ON d.meal_plan_id = p.id
    WHERE p.client_id = v_user_id
  );
  DELETE FROM fitness_meal_plan_days WHERE meal_plan_id IN (
    SELECT id FROM fitness_meal_plans WHERE client_id = v_user_id
  );
  DELETE FROM fitness_meal_plans WHERE client_id = v_user_id;

  -- Criar plano alimentar
  INSERT INTO fitness_meal_plans (
    professional_id, client_id, name, description, goal,
    calories_target, protein_target, carbs_target, fat_target, fiber_target, water_target,
    duration_weeks, is_template, is_active, starts_at, ends_at, notes
  ) VALUES (
    v_prof_id, v_user_id,
    'Plano Wellness - Hipertrofia e Saúde',
    'Plano alimentar personalizado focado em ganho de massa magra com saúde. Prioriza proteínas de alta qualidade, carboidratos complexos e gorduras boas.',
    'muscle_gain',
    2500, 170, 280, 85, 30, 3000,
    8, FALSE, TRUE,
    v_today - INTERVAL '14 days',
    v_today + INTERVAL '42 days',
    'Ajustar porções conforme treino. Dias de descanso: reduzir carbos em ~20%.'
  ) RETURNING id INTO v_plan_id;

  -- ============================================================
  -- DIA: SEGUNDA (day_of_week = 1) — Dia de Treino
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 1, 'Dia de Treino - Superior', 2500, 'Foco em proteína pós-treino')
  RETURNING id INTO v_day_id;

  -- Café da manhã
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'breakfast', 'Café da Manhã Proteico', '07:00',
    '[{"name":"Ovos mexidos","quantity":3,"unit":"unidade","calories":210,"protein":18,"carbs":2,"fat":15},{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Abacate","quantity":50,"unit":"g","calories":80,"protein":1,"carbs":4,"fat":7},{"name":"Café com leite desnatado","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
    500, 31, 40, 24,
    'Mexer os ovos em fogo baixo com azeite. Servir no pão com abacate amassado.',
    '[{"option":"B","name":"Tapioca com queijo e ovo","foods":[{"name":"Tapioca","quantity":2,"unit":"unidade","calories":140,"protein":0,"carbs":34,"fat":0},{"name":"Queijo minas","quantity":40,"unit":"g","calories":100,"protein":8,"carbs":1,"fat":7},{"name":"Ovo frito","quantity":2,"unit":"unidade","calories":180,"protein":12,"carbs":1,"fat":14},{"name":"Suco de laranja natural","quantity":200,"unit":"ml","calories":90,"protein":1,"carbs":20,"fat":0}]},{"option":"C","name":"Smoothie proteico com granola","foods":[{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Leite desnatado","quantity":300,"unit":"ml","calories":105,"protein":9,"carbs":15,"fat":0},{"name":"Granola sem açúcar","quantity":40,"unit":"g","calories":160,"protein":4,"carbs":24,"fat":6}]}]'::jsonb,
    FALSE, 1);

  -- Lanche da manhã
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
    '[{"name":"Iogurte grego natural","quantity":170,"unit":"g","calories":100,"protein":10,"carbs":8,"fat":3},{"name":"Mix de castanhas","quantity":30,"unit":"g","calories":180,"protein":5,"carbs":6,"fat":16}]'::jsonb,
    280, 15, 14, 19,
    NULL,
    '[{"option":"B","name":"Frutas com pasta de amendoim","foods":[{"name":"Maçã","quantity":1,"unit":"unidade","calories":80,"protein":0,"carbs":20,"fat":0},{"name":"Pasta de amendoim","quantity":20,"unit":"g","calories":120,"protein":5,"carbs":4,"fat":10}]},{"option":"C","name":"Vitamina de frutas","foods":[{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Leite desnatado","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0},{"name":"Aveia","quantity":30,"unit":"g","calories":110,"protein":4,"carbs":18,"fat":3}]}]'::jsonb,
    FALSE, 2);

  -- Almoço
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'lunch', 'Almoço Completo', '12:30',
    '[{"name":"Arroz integral","quantity":150,"unit":"g","calories":180,"protein":4,"carbs":38,"fat":1},{"name":"Feijão carioca","quantity":100,"unit":"g","calories":77,"protein":5,"carbs":14,"fat":0},{"name":"Frango grelhado","quantity":180,"unit":"g","calories":297,"protein":45,"carbs":0,"fat":12},{"name":"Brócolis refogado","quantity":100,"unit":"g","calories":35,"protein":3,"carbs":7,"fat":0},{"name":"Salada verde","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0},{"name":"Azeite extra virgem","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    694, 58, 62, 23,
    'Grelhar o frango com temperos naturais. Refogar brócolis no azeite com alho.',
    '[{"option":"B","name":"Filé de peixe com batata doce","foods":[{"name":"Tilápia grelhada","quantity":200,"unit":"g","calories":220,"protein":44,"carbs":0,"fat":4},{"name":"Batata doce","quantity":200,"unit":"g","calories":172,"protein":2,"carbs":40,"fat":0},{"name":"Legumes grelhados","quantity":150,"unit":"g","calories":60,"protein":2,"carbs":12,"fat":1},{"name":"Azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]},{"option":"C","name":"Carne com quinoa","foods":[{"name":"Patinho grelhado","quantity":150,"unit":"g","calories":225,"protein":38,"carbs":0,"fat":8},{"name":"Quinoa cozida","quantity":120,"unit":"g","calories":144,"protein":5,"carbs":25,"fat":2},{"name":"Abobrinha refogada","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Salada de tomate e pepino","quantity":100,"unit":"g","calories":25,"protein":1,"carbs":5,"fat":0},{"name":"Azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]}]'::jsonb,
    FALSE, 3);

  -- Lanche da tarde / Pré-treino
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
    '[{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Aveia em flocos","quantity":30,"unit":"g","calories":110,"protein":4,"carbs":18,"fat":3}]'::jsonb,
    320, 29, 44, 4,
    'Bater tudo no liquidificador com água gelada. Consumir 40min antes do treino.',
    '[{"option":"B","name":"Pão com frango e suco","foods":[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Peito de peru","quantity":60,"unit":"g","calories":60,"protein":12,"carbs":1,"fat":1},{"name":"Suco de uva integral","quantity":200,"unit":"ml","calories":130,"protein":0,"carbs":32,"fat":0}]},{"option":"C","name":"Açaí proteico","foods":[{"name":"Açaí sem açúcar","quantity":150,"unit":"g","calories":90,"protein":2,"carbs":12,"fat":5},{"name":"Granola","quantity":30,"unit":"g","calories":120,"protein":3,"carbs":18,"fat":4},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1}]}]'::jsonb,
    FALSE, 4);

  -- Jantar
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'dinner', 'Jantar Leve e Proteico', '19:30',
    '[{"name":"Salmão grelhado","quantity":150,"unit":"g","calories":270,"protein":30,"carbs":0,"fat":16},{"name":"Arroz integral","quantity":100,"unit":"g","calories":120,"protein":3,"carbs":25,"fat":1},{"name":"Aspargos grelhados","quantity":100,"unit":"g","calories":20,"protein":2,"carbs":4,"fat":0},{"name":"Salada de rúcula com tomate","quantity":80,"unit":"g","calories":20,"protein":1,"carbs":3,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
    475, 36, 32, 22,
    'Salmão temperado com limão, sal e ervas. Grelhar 4 min de cada lado.',
    '[{"option":"B","name":"Omelete caprichada","foods":[{"name":"Ovos","quantity":3,"unit":"unidade","calories":210,"protein":18,"carbs":2,"fat":15},{"name":"Espinafre","quantity":50,"unit":"g","calories":12,"protein":1,"carbs":2,"fat":0},{"name":"Queijo minas","quantity":40,"unit":"g","calories":100,"protein":8,"carbs":1,"fat":7},{"name":"Tomate","quantity":50,"unit":"g","calories":10,"protein":0,"carbs":2,"fat":0},{"name":"Pão integral","quantity":1,"unit":"fatia","calories":70,"protein":3,"carbs":12,"fat":1}]},{"option":"C","name":"Frango com legumes","foods":[{"name":"Frango desfiado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Purê de mandioquinha","quantity":120,"unit":"g","calories":100,"protein":1,"carbs":22,"fat":0},{"name":"Cenoura e vagem cozidas","quantity":100,"unit":"g","calories":40,"protein":2,"carbs":8,"fat":0},{"name":"Azeite","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]}]'::jsonb,
    FALSE, 5);

  -- Ceia
  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES (v_day_id, 'supper', 'Ceia', '21:30',
    '[{"name":"Caseína ou whey","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Leite desnatado","quantity":150,"unit":"ml","calories":53,"protein":5,"carbs":7,"fat":0}]'::jsonb,
    173, 29, 10, 1,
    'Misturar e tomar antes de dormir.',
    '[{"option":"B","name":"Iogurte com chia","foods":[{"name":"Iogurte grego","quantity":170,"unit":"g","calories":100,"protein":10,"carbs":8,"fat":3},{"name":"Chia","quantity":15,"unit":"g","calories":70,"protein":3,"carbs":6,"fat":4}]}]'::jsonb,
    TRUE, 6);

  -- ============================================================
  -- DIA: TERÇA (day_of_week = 2) — Dia de Treino
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 2, 'Dia de Treino - Inferior', 2500, 'Mais carboidratos para treino de pernas')
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Café da Manhã Energético', '07:00',
    '[{"name":"Panqueca de banana com aveia","quantity":3,"unit":"unidade","calories":270,"protein":12,"carbs":36,"fat":8},{"name":"Mel","quantity":15,"unit":"g","calories":45,"protein":0,"carbs":12,"fat":0},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Café preto","quantity":200,"unit":"ml","calories":5,"protein":0,"carbs":0,"fat":0}]'::jsonb,
    440, 36, 51, 9,
    'Bater banana, aveia e ovo. Fritar em frigideira antiaderente.',
    '[{"option":"B","name":"Overnight oats","foods":[{"name":"Aveia","quantity":60,"unit":"g","calories":220,"protein":8,"carbs":36,"fat":6},{"name":"Leite desnatado","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Morango","quantity":80,"unit":"g","calories":26,"protein":1,"carbs":6,"fat":0}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
    '[{"name":"Frutas da estação","quantity":200,"unit":"g","calories":100,"protein":1,"carbs":25,"fat":0},{"name":"Castanha do Pará","quantity":3,"unit":"unidade","calories":100,"protein":2,"carbs":2,"fat":9}]'::jsonb,
    200, 3, 27, 9,
    NULL,
    '[{"option":"B","name":"Wrap de frutas","foods":[{"name":"Crepioca","quantity":1,"unit":"unidade","calories":90,"protein":7,"carbs":8,"fat":3},{"name":"Pasta de amendoim","quantity":15,"unit":"g","calories":90,"protein":4,"carbs":3,"fat":8},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0}]}]'::jsonb,
    FALSE, 2),
  (v_day_id, 'lunch', 'Almoço Reforçado', '12:30',
    '[{"name":"Arroz integral","quantity":180,"unit":"g","calories":216,"protein":5,"carbs":45,"fat":2},{"name":"Feijão preto","quantity":120,"unit":"g","calories":100,"protein":7,"carbs":18,"fat":0},{"name":"Patinho grelhado","quantity":180,"unit":"g","calories":270,"protein":38,"carbs":0,"fat":12},{"name":"Beterraba ralada","quantity":60,"unit":"g","calories":26,"protein":1,"carbs":6,"fat":0},{"name":"Espinafre refogado","quantity":80,"unit":"g","calories":20,"protein":2,"carbs":3,"fat":0},{"name":"Azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    722, 53, 72, 24,
    NULL,
    '[{"option":"B","name":"Strogonoff de frango saudável","foods":[{"name":"Frango em cubos","quantity":180,"unit":"g","calories":297,"protein":45,"carbs":0,"fat":12},{"name":"Creme de leite light","quantity":50,"unit":"g","calories":65,"protein":1,"carbs":3,"fat":5},{"name":"Arroz integral","quantity":150,"unit":"g","calories":180,"protein":4,"carbs":38,"fat":1},{"name":"Salada verde","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]}]'::jsonb,
    FALSE, 3),
  (v_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
    '[{"name":"Batata doce","quantity":150,"unit":"g","calories":129,"protein":2,"carbs":30,"fat":0},{"name":"Frango desfiado","quantity":80,"unit":"g","calories":132,"protein":20,"carbs":0,"fat":5},{"name":"Suco de beterraba com laranja","quantity":200,"unit":"ml","calories":80,"protein":1,"carbs":18,"fat":0}]'::jsonb,
    341, 23, 48, 5,
    'Consumir 1h antes do treino para energia sustentada.',
    '[{"option":"B","name":"Shake pré-treino","foods":[{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Mel","quantity":15,"unit":"g","calories":45,"protein":0,"carbs":12,"fat":0},{"name":"Aveia","quantity":30,"unit":"g","calories":110,"protein":4,"carbs":18,"fat":3}]}]'::jsonb,
    FALSE, 4),
  (v_day_id, 'dinner', 'Jantar', '19:30',
    '[{"name":"Peito de frango grelhado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Macarrão integral","quantity":100,"unit":"g","calories":160,"protein":6,"carbs":30,"fat":2},{"name":"Molho de tomate caseiro","quantity":80,"unit":"g","calories":30,"protein":1,"carbs":6,"fat":0},{"name":"Salada Caesar light","quantity":100,"unit":"g","calories":60,"protein":3,"carbs":4,"fat":3}]'::jsonb,
    498, 48, 40, 15,
    NULL,
    '[{"option":"B","name":"Sopa de legumes com frango","foods":[{"name":"Frango desfiado","quantity":120,"unit":"g","calories":198,"protein":30,"carbs":0,"fat":8},{"name":"Legumes variados","quantity":200,"unit":"g","calories":70,"protein":3,"carbs":14,"fat":0},{"name":"Macarrão integral","quantity":50,"unit":"g","calories":80,"protein":3,"carbs":15,"fat":1},{"name":"Caldo caseiro","quantity":300,"unit":"ml","calories":30,"protein":2,"carbs":4,"fat":0}]}]'::jsonb,
    FALSE, 5),
  (v_day_id, 'supper', 'Ceia', '21:30',
    '[{"name":"Cottage","quantity":100,"unit":"g","calories":98,"protein":11,"carbs":3,"fat":4},{"name":"Nozes","quantity":20,"unit":"g","calories":130,"protein":3,"carbs":3,"fat":13}]'::jsonb,
    228, 14, 6, 17,
    NULL,
    '[{"option":"B","name":"Chá com torrada","foods":[{"name":"Chá de camomila","quantity":200,"unit":"ml","calories":2,"protein":0,"carbs":0,"fat":0},{"name":"Torrada integral","quantity":2,"unit":"unidade","calories":80,"protein":3,"carbs":14,"fat":1},{"name":"Pasta de amendoim","quantity":10,"unit":"g","calories":60,"protein":3,"carbs":2,"fat":5}]}]'::jsonb,
    TRUE, 6);

  -- ============================================================
  -- DIA: QUARTA (day_of_week = 3) — Dia de Descanso
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 3, 'Descanso Ativo', 2200, 'Menos carboidratos, manter proteínas altas')
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Café Low Carb', '07:30',
    '[{"name":"Omelete de claras com espinafre","quantity":1,"unit":"porção","calories":180,"protein":24,"carbs":3,"fat":8},{"name":"Abacate","quantity":80,"unit":"g","calories":128,"protein":2,"carbs":6,"fat":12},{"name":"Tomate","quantity":60,"unit":"g","calories":12,"protein":1,"carbs":3,"fat":0},{"name":"Café preto","quantity":200,"unit":"ml","calories":5,"protein":0,"carbs":0,"fat":0}]'::jsonb,
    325, 27, 12, 20,
    NULL,
    '[{"option":"B","name":"Bowl de açaí proteico","foods":[{"name":"Açaí sem açúcar","quantity":200,"unit":"g","calories":120,"protein":2,"carbs":16,"fat":7},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Granola low sugar","quantity":20,"unit":"g","calories":80,"protein":2,"carbs":12,"fat":3}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'morning_snack', 'Lanche', '10:00',
    '[{"name":"Queijo minas frescal","quantity":60,"unit":"g","calories":150,"protein":12,"carbs":2,"fat":10},{"name":"Tomate cereja","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
    165, 13, 5, 10,
    NULL,
    '[{"option":"B","name":"Mix de oleaginosas","foods":[{"name":"Castanhas variadas","quantity":40,"unit":"g","calories":240,"protein":6,"carbs":8,"fat":22}]}]'::jsonb,
    FALSE, 2),
  (v_day_id, 'lunch', 'Almoço', '12:30',
    '[{"name":"Arroz integral","quantity":120,"unit":"g","calories":144,"protein":3,"carbs":30,"fat":1},{"name":"Lentilha","quantity":100,"unit":"g","calories":116,"protein":9,"carbs":20,"fat":0},{"name":"Salmão assado","quantity":170,"unit":"g","calories":306,"protein":34,"carbs":0,"fat":18},{"name":"Couve refogada","quantity":80,"unit":"g","calories":25,"protein":2,"carbs":4,"fat":0},{"name":"Cenoura ralada","quantity":60,"unit":"g","calories":25,"protein":1,"carbs":6,"fat":0},{"name":"Limão e azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    706, 49, 60, 29,
    NULL,
    '[{"option":"B","name":"Frango ao curry com grão-de-bico","foods":[{"name":"Frango em cubos","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Grão-de-bico","quantity":100,"unit":"g","calories":164,"protein":9,"carbs":27,"fat":3},{"name":"Leite de coco","quantity":50,"unit":"ml","calories":90,"protein":1,"carbs":2,"fat":9},{"name":"Arroz basmati","quantity":100,"unit":"g","calories":130,"protein":3,"carbs":28,"fat":0}]}]'::jsonb,
    FALSE, 3),
  (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '15:30',
    '[{"name":"Iogurte natural","quantity":200,"unit":"g","calories":120,"protein":8,"carbs":12,"fat":5},{"name":"Blueberry","quantity":80,"unit":"g","calories":46,"protein":1,"carbs":12,"fat":0},{"name":"Chia","quantity":10,"unit":"g","calories":49,"protein":2,"carbs":4,"fat":3}]'::jsonb,
    215, 11, 28, 8,
    NULL,
    '[{"option":"B","name":"Wrap de atum","foods":[{"name":"Tortilla integral","quantity":1,"unit":"unidade","calories":120,"protein":4,"carbs":18,"fat":3},{"name":"Atum em água","quantity":80,"unit":"g","calories":80,"protein":18,"carbs":0,"fat":1},{"name":"Cream cheese light","quantity":20,"unit":"g","calories":40,"protein":2,"carbs":2,"fat":3}]}]'::jsonb,
    FALSE, 4),
  (v_day_id, 'dinner', 'Jantar Leve', '19:30',
    '[{"name":"Tilápia grelhada","quantity":180,"unit":"g","calories":198,"protein":40,"carbs":0,"fat":4},{"name":"Purê de abóbora","quantity":150,"unit":"g","calories":60,"protein":1,"carbs":14,"fat":0},{"name":"Salada de folhas com pepino","quantity":100,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0},{"name":"Azeite e vinagrete","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    368, 42, 18, 14,
    NULL,
    '[{"option":"B","name":"Escondidinho de frango","foods":[{"name":"Frango desfiado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Purê de couve-flor","quantity":200,"unit":"g","calories":50,"protein":4,"carbs":8,"fat":1},{"name":"Queijo gratinado","quantity":30,"unit":"g","calories":110,"protein":7,"carbs":1,"fat":9}]}]'::jsonb,
    FALSE, 5);

  -- ============================================================
  -- DIA: QUINTA (day_of_week = 4) — Dia de Treino
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 4, 'Dia de Treino - Full Body', 2500, NULL)
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Café Completo', '07:00',
    '[{"name":"Pão de fermentação natural","quantity":2,"unit":"fatia","calories":160,"protein":5,"carbs":30,"fat":2},{"name":"Ricota temperada","quantity":60,"unit":"g","calories":75,"protein":6,"carbs":2,"fat":5},{"name":"Ovo cozido","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Mamão","quantity":150,"unit":"g","calories":60,"protein":1,"carbs":15,"fat":0},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
    505, 30, 58, 17,
    NULL,
    '[{"option":"B","name":"French toast proteica","foods":[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Ovos","quantity":2,"unit":"unidade","calories":140,"protein":12,"carbs":1,"fat":10},{"name":"Canela","quantity":2,"unit":"g","calories":5,"protein":0,"carbs":1,"fat":0},{"name":"Mel","quantity":15,"unit":"g","calories":45,"protein":0,"carbs":12,"fat":0},{"name":"Whey protein","quantity":0.5,"unit":"scoop","calories":60,"protein":12,"carbs":1,"fat":1}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
    '[{"name":"Banana com canela","quantity":1,"unit":"unidade","calories":95,"protein":1,"carbs":24,"fat":0},{"name":"Pasta de amendoim","quantity":20,"unit":"g","calories":120,"protein":5,"carbs":4,"fat":10}]'::jsonb,
    215, 6, 28, 10,
    NULL,
    '[{"option":"B","name":"Mix trail","foods":[{"name":"Damasco seco","quantity":30,"unit":"g","calories":70,"protein":1,"carbs":16,"fat":0},{"name":"Amêndoas","quantity":20,"unit":"g","calories":120,"protein":4,"carbs":4,"fat":10},{"name":"Chocolate 70%","quantity":15,"unit":"g","calories":85,"protein":2,"carbs":7,"fat":6}]}]'::jsonb,
    FALSE, 2),
  (v_day_id, 'lunch', 'Almoço', '12:30',
    '[{"name":"Arroz integral","quantity":150,"unit":"g","calories":180,"protein":4,"carbs":38,"fat":1},{"name":"Feijão carioca","quantity":100,"unit":"g","calories":77,"protein":5,"carbs":14,"fat":0},{"name":"Alcatra grelhada","quantity":160,"unit":"g","calories":272,"protein":36,"carbs":0,"fat":14},{"name":"Abóbora assada","quantity":100,"unit":"g","calories":40,"protein":1,"carbs":10,"fat":0},{"name":"Salada colorida","quantity":100,"unit":"g","calories":25,"protein":1,"carbs":5,"fat":0},{"name":"Azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    684, 47, 67, 25,
    NULL,
    '[{"option":"B","name":"Moqueca de peixe","foods":[{"name":"Peixe branco","quantity":200,"unit":"g","calories":200,"protein":40,"carbs":0,"fat":4},{"name":"Leite de coco","quantity":60,"unit":"ml","calories":108,"protein":1,"carbs":2,"fat":11},{"name":"Pimentão e tomate","quantity":100,"unit":"g","calories":25,"protein":1,"carbs":5,"fat":0},{"name":"Arroz integral","quantity":150,"unit":"g","calories":180,"protein":4,"carbs":38,"fat":1},{"name":"Farofa de banana","quantity":40,"unit":"g","calories":80,"protein":1,"carbs":16,"fat":2}]}]'::jsonb,
    FALSE, 3),
  (v_day_id, 'afternoon_snack', 'Pré-Treino', '15:30',
    '[{"name":"Crepioca","quantity":1,"unit":"unidade","calories":140,"protein":10,"carbs":14,"fat":5},{"name":"Queijo branco","quantity":40,"unit":"g","calories":100,"protein":8,"carbs":1,"fat":7},{"name":"Suco verde","quantity":300,"unit":"ml","calories":60,"protein":1,"carbs":14,"fat":0}]'::jsonb,
    300, 19, 29, 12,
    NULL,
    '[{"option":"B","name":"Shake energético","foods":[{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Pasta de amendoim","quantity":15,"unit":"g","calories":90,"protein":4,"carbs":3,"fat":8}]}]'::jsonb,
    FALSE, 4),
  (v_day_id, 'dinner', 'Jantar', '19:30',
    '[{"name":"Frango ao limão","quantity":170,"unit":"g","calories":280,"protein":42,"carbs":0,"fat":12},{"name":"Nhoque de batata doce","quantity":150,"unit":"g","calories":180,"protein":3,"carbs":38,"fat":2},{"name":"Rúcula com parmesão","quantity":60,"unit":"g","calories":50,"protein":3,"carbs":2,"fat":3},{"name":"Azeite trufado","quantity":5,"unit":"ml","calories":45,"protein":0,"carbs":0,"fat":5}]'::jsonb,
    555, 48, 40, 22,
    NULL,
    '[{"option":"B","name":"Bowl mexicano","foods":[{"name":"Carne moída magra","quantity":150,"unit":"g","calories":225,"protein":30,"carbs":0,"fat":12},{"name":"Arroz integral","quantity":100,"unit":"g","calories":120,"protein":3,"carbs":25,"fat":1},{"name":"Feijão preto","quantity":80,"unit":"g","calories":67,"protein":5,"carbs":12,"fat":0},{"name":"Abacate","quantity":50,"unit":"g","calories":80,"protein":1,"carbs":4,"fat":7},{"name":"Tomate e cebola","quantity":50,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]}]'::jsonb,
    FALSE, 5);

  -- ============================================================
  -- DIA: SEXTA (day_of_week = 5) — Dia de Treino
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 5, 'Dia de Treino - Beach Tennis', 2600, 'Dia mais ativo, hidratar bem')
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Café Reforçado', '07:00',
    '[{"name":"Açaí com granola e banana","quantity":300,"unit":"g","calories":280,"protein":4,"carbs":48,"fat":10},{"name":"Whey protein","quantity":1,"unit":"scoop","calories":120,"protein":24,"carbs":3,"fat":1}]'::jsonb,
    400, 28, 51, 11,
    'Misturar whey no açaí para aumentar proteína.',
    '[{"option":"B","name":"Panqueca proteica","foods":[{"name":"Panqueca de banana e whey","quantity":3,"unit":"unidade","calories":300,"protein":30,"carbs":30,"fat":6},{"name":"Frutas vermelhas","quantity":80,"unit":"g","calories":40,"protein":1,"carbs":10,"fat":0},{"name":"Mel","quantity":10,"unit":"g","calories":30,"protein":0,"carbs":8,"fat":0}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'morning_snack', 'Lanche da Manhã', '10:00',
    '[{"name":"Vitamina de abacate","quantity":300,"unit":"ml","calories":250,"protein":8,"carbs":20,"fat":16}]'::jsonb,
    250, 8, 20, 16,
    'Bater abacate, leite e whey. Boa dose de gordura boa.',
    '[{"option":"B","name":"Sanduíche natural","foods":[{"name":"Pão integral","quantity":2,"unit":"fatia","calories":140,"protein":6,"carbs":24,"fat":2},{"name":"Frango desfiado","quantity":60,"unit":"g","calories":99,"protein":15,"carbs":0,"fat":4},{"name":"Cenoura ralada","quantity":30,"unit":"g","calories":12,"protein":0,"carbs":3,"fat":0}]}]'::jsonb,
    FALSE, 2),
  (v_day_id, 'lunch', 'Almoço', '12:30',
    '[{"name":"Arroz integral","quantity":180,"unit":"g","calories":216,"protein":5,"carbs":45,"fat":2},{"name":"Feijão tropeiro","quantity":120,"unit":"g","calories":170,"protein":10,"carbs":20,"fat":6},{"name":"Frango empanado assado","quantity":180,"unit":"g","calories":300,"protein":40,"carbs":10,"fat":12},{"name":"Salada tropical","quantity":120,"unit":"g","calories":40,"protein":1,"carbs":10,"fat":0},{"name":"Azeite","quantity":10,"unit":"ml","calories":90,"protein":0,"carbs":0,"fat":10}]'::jsonb,
    816, 56, 85, 30,
    NULL,
    '[{"option":"B","name":"Poke bowl","foods":[{"name":"Salmão cru (sashimi)","quantity":150,"unit":"g","calories":230,"protein":30,"carbs":0,"fat":12},{"name":"Arroz japonês","quantity":150,"unit":"g","calories":195,"protein":4,"carbs":42,"fat":0},{"name":"Edamame","quantity":50,"unit":"g","calories":60,"protein":5,"carbs":5,"fat":3},{"name":"Abacate","quantity":50,"unit":"g","calories":80,"protein":1,"carbs":4,"fat":7},{"name":"Molho shoyu","quantity":10,"unit":"ml","calories":10,"protein":1,"carbs":1,"fat":0}]}]'::jsonb,
    FALSE, 3),
  (v_day_id, 'afternoon_snack', 'Pré-Treino / Beach Tennis', '15:00',
    '[{"name":"Sanduíche natural de frango","quantity":1,"unit":"unidade","calories":280,"protein":20,"carbs":30,"fat":8},{"name":"Água de coco","quantity":330,"unit":"ml","calories":66,"protein":0,"carbs":16,"fat":0}]'::jsonb,
    346, 20, 46, 8,
    'Comer 1h antes do beach tennis. Hidratar com água de coco.',
    '[{"option":"B","name":"Barra proteica e frutas","foods":[{"name":"Barra proteica","quantity":1,"unit":"unidade","calories":200,"protein":20,"carbs":20,"fat":6},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0}]}]'::jsonb,
    FALSE, 4),
  (v_day_id, 'dinner', 'Jantar Pós-Atividade', '20:00',
    '[{"name":"Massa integral ao pesto","quantity":120,"unit":"g","calories":220,"protein":8,"carbs":40,"fat":4},{"name":"Frango desfiado","quantity":150,"unit":"g","calories":248,"protein":38,"carbs":0,"fat":10},{"name":"Tomate seco","quantity":30,"unit":"g","calories":75,"protein":2,"carbs":8,"fat":4},{"name":"Parmesão ralado","quantity":15,"unit":"g","calories":60,"protein":4,"carbs":0,"fat":4}]'::jsonb,
    603, 52, 48, 22,
    NULL,
    '[{"option":"B","name":"Pizza proteica caseira","foods":[{"name":"Massa de couve-flor","quantity":1,"unit":"unidade","calories":120,"protein":6,"carbs":10,"fat":6},{"name":"Molho de tomate","quantity":60,"unit":"g","calories":24,"protein":1,"carbs":4,"fat":0},{"name":"Frango desfiado","quantity":120,"unit":"g","calories":198,"protein":30,"carbs":0,"fat":8},{"name":"Mussarela light","quantity":60,"unit":"g","calories":180,"protein":14,"carbs":2,"fat":12},{"name":"Rúcula","quantity":30,"unit":"g","calories":8,"protein":1,"carbs":1,"fat":0}]}]'::jsonb,
    FALSE, 5);

  -- ============================================================
  -- DIAS: SÁBADO (6) e DOMINGO (0)
  -- ============================================================
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 6, 'Fim de Semana', 2300, 'Flexível, manter proteínas')
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Brunch de Sábado', '09:00',
    '[{"name":"Ovos beneditinos","quantity":2,"unit":"unidade","calories":280,"protein":16,"carbs":18,"fat":16},{"name":"Salmão defumado","quantity":50,"unit":"g","calories":100,"protein":12,"carbs":0,"fat":6},{"name":"Suco de laranja","quantity":300,"unit":"ml","calories":135,"protein":2,"carbs":30,"fat":0}]'::jsonb,
    515, 30, 48, 22,
    NULL,
    '[{"option":"B","name":"Waffle proteico","foods":[{"name":"Waffle de aveia e whey","quantity":2,"unit":"unidade","calories":280,"protein":22,"carbs":30,"fat":8},{"name":"Frutas frescas","quantity":100,"unit":"g","calories":50,"protein":1,"carbs":12,"fat":0},{"name":"Mel","quantity":15,"unit":"g","calories":45,"protein":0,"carbs":12,"fat":0}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'lunch', 'Almoço', '13:00',
    '[{"name":"Arroz integral","quantity":130,"unit":"g","calories":156,"protein":3,"carbs":32,"fat":1},{"name":"Feijão","quantity":100,"unit":"g","calories":77,"protein":5,"carbs":14,"fat":0},{"name":"Picanha grelhada (magra)","quantity":150,"unit":"g","calories":285,"protein":32,"carbs":0,"fat":17},{"name":"Farofa de ovos","quantity":40,"unit":"g","calories":80,"protein":3,"carbs":12,"fat":2},{"name":"Vinagrete","quantity":60,"unit":"g","calories":30,"protein":0,"carbs":5,"fat":1},{"name":"Salada verde","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
    643, 44, 66, 21,
    NULL,
    '[{"option":"B","name":"Churrasco saudável","foods":[{"name":"Fraldinha grelhada","quantity":150,"unit":"g","calories":255,"protein":30,"carbs":0,"fat":15},{"name":"Linguiça de frango","quantity":80,"unit":"g","calories":130,"protein":14,"carbs":2,"fat":7},{"name":"Arroz","quantity":100,"unit":"g","calories":120,"protein":3,"carbs":25,"fat":1},{"name":"Salada completa","quantity":150,"unit":"g","calories":60,"protein":2,"carbs":10,"fat":1}]}]'::jsonb,
    FALSE, 2),
  (v_day_id, 'afternoon_snack', 'Lanche', '16:00',
    '[{"name":"Açaí bowl","quantity":250,"unit":"g","calories":200,"protein":3,"carbs":32,"fat":8},{"name":"Granola","quantity":30,"unit":"g","calories":120,"protein":3,"carbs":18,"fat":4},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0}]'::jsonb,
    410, 7, 73, 12,
    NULL, NULL,
    FALSE, 3),
  (v_day_id, 'dinner', 'Jantar Leve', '20:00',
    '[{"name":"Sopa de legumes com frango","quantity":400,"unit":"ml","calories":250,"protein":25,"carbs":20,"fat":8},{"name":"Torrada integral","quantity":2,"unit":"unidade","calories":80,"protein":3,"carbs":14,"fat":1}]'::jsonb,
    330, 28, 34, 9,
    NULL,
    '[{"option":"B","name":"Salada completa","foods":[{"name":"Mix de folhas","quantity":100,"unit":"g","calories":20,"protein":2,"carbs":3,"fat":0},{"name":"Frango grelhado","quantity":120,"unit":"g","calories":198,"protein":30,"carbs":0,"fat":8},{"name":"Ovo cozido","quantity":1,"unit":"unidade","calories":70,"protein":6,"carbs":0,"fat":5},{"name":"Croutons integrais","quantity":20,"unit":"g","calories":60,"protein":2,"carbs":10,"fat":1},{"name":"Molho de iogurte","quantity":30,"unit":"ml","calories":30,"protein":2,"carbs":2,"fat":2}]}]'::jsonb,
    FALSE, 4);

  -- Domingo = mesmo plano do sábado
  INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name, calories_target, notes)
  VALUES (v_plan_id, 0, 'Domingo', 2300, 'Mesmo esquema do sábado, flexível')
  RETURNING id INTO v_day_id;

  INSERT INTO fitness_meal_plan_meals (meal_plan_day_id, meal_type, meal_name, scheduled_time, foods, total_calories, total_protein, total_carbs, total_fat, instructions, alternatives, is_optional, order_index)
  VALUES
  (v_day_id, 'breakfast', 'Café da Manhã', '09:00',
    '[{"name":"Tapioca recheada","quantity":2,"unit":"unidade","calories":200,"protein":2,"carbs":44,"fat":0},{"name":"Queijo coalho grelhado","quantity":60,"unit":"g","calories":180,"protein":12,"carbs":1,"fat":14},{"name":"Banana","quantity":1,"unit":"unidade","calories":90,"protein":1,"carbs":23,"fat":0},{"name":"Café com leite","quantity":200,"unit":"ml","calories":70,"protein":6,"carbs":10,"fat":0}]'::jsonb,
    540, 21, 78, 14,
    NULL,
    '[{"option":"B","name":"Pão na chapa com requeijão","foods":[{"name":"Pão francês integral","quantity":1,"unit":"unidade","calories":150,"protein":5,"carbs":28,"fat":2},{"name":"Requeijão light","quantity":30,"unit":"g","calories":50,"protein":3,"carbs":2,"fat":3},{"name":"Presunto de peru","quantity":40,"unit":"g","calories":40,"protein":8,"carbs":1,"fat":1},{"name":"Suco de manga","quantity":250,"unit":"ml","calories":120,"protein":1,"carbs":28,"fat":0}]}]'::jsonb,
    FALSE, 1),
  (v_day_id, 'lunch', 'Almoço de Domingo', '13:00',
    '[{"name":"Arroz branco","quantity":150,"unit":"g","calories":195,"protein":4,"carbs":42,"fat":0},{"name":"Feijão tropeiro","quantity":120,"unit":"g","calories":170,"protein":10,"carbs":20,"fat":6},{"name":"Frango assado","quantity":180,"unit":"g","calories":297,"protein":45,"carbs":0,"fat":12},{"name":"Maionese de batata light","quantity":80,"unit":"g","calories":80,"protein":2,"carbs":12,"fat":3},{"name":"Salada","quantity":80,"unit":"g","calories":20,"protein":1,"carbs":4,"fat":0}]'::jsonb,
    762, 62, 78, 21,
    NULL, NULL,
    FALSE, 2),
  (v_day_id, 'afternoon_snack', 'Lanche da Tarde', '16:30',
    '[{"name":"Pipoca caseira","quantity":40,"unit":"g","calories":150,"protein":5,"carbs":24,"fat":3},{"name":"Suco de limão","quantity":300,"unit":"ml","calories":30,"protein":0,"carbs":8,"fat":0}]'::jsonb,
    180, 5, 32, 3,
    NULL, NULL,
    FALSE, 3),
  (v_day_id, 'dinner', 'Jantar', '19:30',
    '[{"name":"Wrap integral de atum","quantity":2,"unit":"unidade","calories":360,"protein":28,"carbs":36,"fat":10},{"name":"Salada de folhas","quantity":80,"unit":"g","calories":15,"protein":1,"carbs":3,"fat":0}]'::jsonb,
    375, 29, 39, 10,
    NULL,
    '[{"option":"B","name":"Omelete recheada","foods":[{"name":"Ovos","quantity":3,"unit":"unidade","calories":210,"protein":18,"carbs":2,"fat":15},{"name":"Presunto de peru","quantity":40,"unit":"g","calories":40,"protein":8,"carbs":1,"fat":1},{"name":"Queijo minas","quantity":30,"unit":"g","calories":75,"protein":6,"carbs":1,"fat":5},{"name":"Tomate e orégano","quantity":40,"unit":"g","calories":8,"protein":0,"carbs":2,"fat":0}]}]'::jsonb,
    FALSE, 4);

  -- ============================================================
  -- 4. REFEIÇÕES REGISTRADAS (últimos 7 dias de histórico)
  -- ============================================================

  -- Limpar refeições anteriores do período
  DELETE FROM fitness_meal_items WHERE meal_id IN (
    SELECT id FROM fitness_meals WHERE user_id = v_user_id AND data >= v_today - 7
  );
  DELETE FROM fitness_meals WHERE user_id = v_user_id AND data >= v_today - 7;

  -- === ONTEM ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 1, 'cafe_manha', '07:15', 'concluido', 500, 31, 40, 24, NULL),
  (v_user_id, v_today - 1, 'lanche_manha', '10:10', 'concluido', 280, 15, 14, 19, NULL),
  (v_user_id, v_today - 1, 'almoco', '12:45', 'concluido', 694, 58, 62, 23, 'Almoço completo, comi tudo'),
  (v_user_id, v_today - 1, 'lanche_tarde', '15:40', 'concluido', 320, 29, 44, 4, 'Shake pré-treino'),
  (v_user_id, v_today - 1, 'jantar', '19:45', 'concluido', 475, 36, 32, 22, NULL),
  (v_user_id, v_today - 1, 'ceia', '21:30', 'concluido', 173, 29, 10, 1, NULL);

  -- === 2 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 2, 'cafe_manha', '07:30', 'concluido', 440, 36, 51, 9, 'Panqueca ficou ótima'),
  (v_user_id, v_today - 2, 'lanche_manha', '10:00', 'concluido', 200, 3, 27, 9, NULL),
  (v_user_id, v_today - 2, 'almoco', '12:30', 'concluido', 722, 53, 72, 24, NULL),
  (v_user_id, v_today - 2, 'lanche_tarde', '15:30', 'concluido', 341, 23, 48, 5, NULL),
  (v_user_id, v_today - 2, 'jantar', '20:00', 'concluido', 498, 48, 40, 15, NULL);

  -- === 3 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 3, 'cafe_manha', '07:20', 'concluido', 325, 27, 12, 20, NULL),
  (v_user_id, v_today - 3, 'lanche_manha', '10:15', 'concluido', 165, 13, 5, 10, NULL),
  (v_user_id, v_today - 3, 'almoco', '13:00', 'concluido', 706, 49, 60, 29, NULL),
  (v_user_id, v_today - 3, 'lanche_tarde', '15:45', 'concluido', 215, 11, 28, 8, NULL),
  (v_user_id, v_today - 3, 'jantar', '19:30', 'concluido', 368, 42, 18, 14, 'Tilápia estava boa');

  -- === 4 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 4, 'cafe_manha', '07:00', 'concluido', 505, 30, 58, 17, NULL),
  (v_user_id, v_today - 4, 'lanche_manha', '10:00', 'concluido', 215, 6, 28, 10, NULL),
  (v_user_id, v_today - 4, 'almoco', '12:30', 'concluido', 684, 47, 67, 25, NULL),
  (v_user_id, v_today - 4, 'lanche_tarde', '15:30', 'concluido', 300, 19, 29, 12, NULL),
  (v_user_id, v_today - 4, 'jantar', '19:30', 'concluido', 555, 48, 40, 22, NULL);

  -- === 5 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 5, 'cafe_manha', '07:10', 'concluido', 400, 28, 51, 11, NULL),
  (v_user_id, v_today - 5, 'almoco', '12:30', 'concluido', 816, 56, 85, 30, 'Poke bowl delicioso'),
  (v_user_id, v_today - 5, 'lanche_tarde', '15:00', 'concluido', 346, 20, 46, 8, NULL),
  (v_user_id, v_today - 5, 'jantar', '20:00', 'concluido', 603, 52, 48, 22, NULL);

  -- === 6 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 6, 'cafe_manha', '09:00', 'concluido', 515, 30, 48, 22, 'Brunch de sábado'),
  (v_user_id, v_today - 6, 'almoco', '13:00', 'concluido', 643, 44, 66, 21, 'Churrasco em família'),
  (v_user_id, v_today - 6, 'lanche_tarde', '16:00', 'concluido', 410, 7, 73, 12, 'Açaí bowl'),
  (v_user_id, v_today - 6, 'jantar', '20:00', 'concluido', 330, 28, 34, 9, NULL);

  -- === 7 DIAS ATRÁS ===
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today - 7, 'cafe_manha', '09:00', 'concluido', 540, 21, 78, 14, NULL),
  (v_user_id, v_today - 7, 'almoco', '13:00', 'concluido', 762, 62, 78, 21, 'Almoço de domingo'),
  (v_user_id, v_today - 7, 'lanche_tarde', '16:30', 'concluido', 180, 5, 32, 3, NULL),
  (v_user_id, v_today - 7, 'jantar', '19:30', 'concluido', 375, 29, 39, 10, NULL);

  -- ============================================================
  -- 5. HOJE — Café da manhã já feito, resto pendente
  -- ============================================================
  INSERT INTO fitness_meals (user_id, data, tipo_refeicao, horario, status, calorias_total, proteinas_total, carboidratos_total, gorduras_total, notas)
  VALUES
  (v_user_id, v_today, 'cafe_manha', '07:10', 'concluido', 500, 31, 40, 24, 'Ovos mexidos com pão e abacate');

  -- ============================================================
  -- 6. ADERÊNCIA DO PLANO (últimos 7 dias)
  -- ============================================================
  INSERT INTO fitness_meal_plan_adherence (meal_plan_id, client_id, date, meals_planned, meals_completed, adherence_percentage, calories_consumed)
  VALUES
  (v_plan_id, v_user_id, v_today - 1, 6, 6, 100.0, 2442),
  (v_plan_id, v_user_id, v_today - 2, 6, 5, 83.3, 2201),
  (v_plan_id, v_user_id, v_today - 3, 5, 5, 100.0, 1779),
  (v_plan_id, v_user_id, v_today - 4, 5, 5, 100.0, 2259),
  (v_plan_id, v_user_id, v_today - 5, 5, 4, 80.0, 2165),
  (v_plan_id, v_user_id, v_today - 6, 4, 4, 100.0, 1898),
  (v_plan_id, v_user_id, v_today - 7, 4, 4, 100.0, 1857);

  RAISE NOTICE '✅ Dados de demo alimentar inseridos com sucesso para felicemed@gmail.com!';
  RAISE NOTICE '📋 Plano: % (ID: %)', 'Plano Wellness - Hipertrofia e Saúde', v_plan_id;
  RAISE NOTICE '🗓️ 7 dias de plano (seg-dom) com alternativas em cada refeição';
  RAISE NOTICE '📊 7 dias de histórico de refeições registradas';
  RAISE NOTICE '✅ Aderência dos últimos 7 dias inserida';

END $$;
