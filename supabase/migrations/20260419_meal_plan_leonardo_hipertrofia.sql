-- Seed: Plano alimentar "Hipertrofia" de Leonardo Salomão Felice
-- Prescrito por Thayná Ramos Silva (CRN-MG 20922) em 18/04/2026
-- Importado como TEMPLATE reutilizável (is_template=true, client_id=NULL).
-- Macros são resolvidos dinamicamente via fitness_global_foods (TACO) com fallback.
-- Idempotente: roda duas vezes sem duplicar.

BEGIN;

-- ============================================
-- Helper: resolve um alimento a partir de padrão ILIKE em nome_busca
-- e devolve JSONB pronto para o campo foods (com macros escalados).
-- Fallback para alimentos ausentes na TACO (whey, granola, requeijão…).
-- ============================================
CREATE OR REPLACE FUNCTION tmp_food_jsonb(
  p_display_name TEXT,
  p_search TEXT,
  p_qty NUMERIC,
  p_portion_label TEXT DEFAULT NULL,
  p_fb_kcal NUMERIC DEFAULT NULL,
  p_fb_prot NUMERIC DEFAULT NULL,
  p_fb_carb NUMERIC DEFAULT NULL,
  p_fb_fat NUMERIC DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  f RECORD;
  mult NUMERIC;
  kcal NUMERIC; prot NUMERIC; carb NUMERIC; fat NUMERIC;
  v_unidade TEXT;
BEGIN
  SELECT g.porcao_padrao, g.unidade, g.calorias, g.proteinas, g.carboidratos, g.gorduras, g.nome
    INTO f
    FROM fitness_global_foods g
   WHERE g.is_active = true
     AND g.nome_busca ILIKE p_search
   ORDER BY CASE WHEN g.source = 'taco' THEN 0 ELSE 1 END, length(g.nome)
   LIMIT 1;

  IF FOUND AND f.porcao_padrao > 0 THEN
    mult := p_qty::NUMERIC / f.porcao_padrao;
    kcal := ROUND((f.calorias * mult)::NUMERIC);
    prot := ROUND((f.proteinas * mult)::NUMERIC, 1);
    carb := ROUND((f.carboidratos * mult)::NUMERIC, 1);
    fat  := ROUND((f.gorduras * mult)::NUMERIC, 1);
    v_unidade := f.unidade;
  ELSIF p_fb_kcal IS NOT NULL THEN
    kcal := p_fb_kcal;
    prot := p_fb_prot;
    carb := p_fb_carb;
    fat  := p_fb_fat;
    v_unidade := 'g';
    RAISE NOTICE 'Alimento não encontrado em TACO, usando fallback: % (search=%)', p_display_name, p_search;
  ELSE
    kcal := 0; prot := 0; carb := 0; fat := 0;
    v_unidade := 'g';
    RAISE WARNING 'Alimento não encontrado e sem fallback: % (search=%) — macros zerados', p_display_name, p_search;
  END IF;

  RETURN jsonb_build_object(
    'name', p_display_name,
    'quantity', p_qty,
    'unit', CASE WHEN v_unidade = 'unidade' THEN 'un' ELSE v_unidade END,
    'portion_label', p_portion_label,
    'calories', kcal,
    'protein', prot,
    'carbs', carb,
    'fat', fat
  );
END;
$$ LANGUAGE plpgsql;

-- Soma totais de um array JSONB de foods
CREATE OR REPLACE FUNCTION tmp_totals(p_foods JSONB)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'calories', COALESCE(SUM((x->>'calories')::NUMERIC), 0),
    'protein',  COALESCE(SUM((x->>'protein')::NUMERIC), 0),
    'carbs',    COALESCE(SUM((x->>'carbs')::NUMERIC), 0),
    'fat',      COALESCE(SUM((x->>'fat')::NUMERIC), 0)
  )
  FROM jsonb_array_elements(p_foods) AS x;
$$ LANGUAGE sql;

-- ============================================
-- Plano + profissional + dias + refeições
-- ============================================
DO $$
DECLARE
  v_user_id UUID;
  v_prof_id UUID;
  v_plan_id UUID;
  v_day_id UUID;
  v_day INTEGER;
  v_plan_name TEXT := 'Hipertrofia — Thayná Ramos (18/04/2026)';

  -- JSONBs reutilizados entre dias
  v_breakfast_foods JSONB;
  v_breakfast_alt_1 JSONB;  -- Opção 1 (prática)
  v_breakfast_alt_dom JSONB; -- Café de domingo
  v_breakfast_alternatives JSONB;

  v_lunch_foods JSONB;

  v_snack_foods JSONB;
  v_snack_alt_coxinha JSONB;
  v_snack_alternatives JSONB;

  v_dinner_foods JSONB;  -- Opção 1 (refeição completa)
  v_dinner_alt_2 JSONB;  -- Opção 2 (crepioca)
  v_dinner_alt_3 JSONB;  -- Opção 3 (macarrão)
  v_dinner_alternatives JSONB;

  v_bf_tot JSONB; v_lu_tot JSONB; v_sn_tot JSONB; v_di_tot JSONB;
BEGIN
  -- 1) Resolver profissional dono do plano.
  -- Prioridade: qualquer nutricionista ativa → super_admin Leonardo.
  -- Não dependemos de email específico: o template precisa pertencer a uma nutri
  -- pra aparecer no portal /portal/nutrition (API filtra por professional_id do usuário logado).
  SELECT id INTO v_prof_id
    FROM fitness_professionals
   WHERE type = 'nutritionist' AND is_active = true
   ORDER BY created_at
   LIMIT 1;

  IF v_prof_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'felicemed@gmail.com' LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma nutri ativa e felicemed@gmail.com não encontrado. Ajuste o email do fallback no script.';
    END IF;

    SELECT id INTO v_prof_id FROM fitness_professionals WHERE user_id = v_user_id LIMIT 1;

    IF v_prof_id IS NULL THEN
      INSERT INTO fitness_professionals (user_id, type, registration, specialty, is_active)
      VALUES (v_user_id, 'super_admin', NULL, 'Template (Thayná Ramos CRN-MG 20922)', true)
      RETURNING id INTO v_prof_id;
      RAISE NOTICE 'Criado fitness_professionals % para super_admin (fallback)', v_prof_id;
    END IF;
  END IF;

  -- 3) Idempotência: se o template já existe, parar
  IF EXISTS (
    SELECT 1 FROM fitness_meal_plans
     WHERE name = v_plan_name AND is_template = true AND professional_id = v_prof_id
  ) THEN
    RAISE NOTICE 'Template "%" já existe — nada a fazer.', v_plan_name;
    RETURN;
  END IF;

  -- ============================================
  -- 4) Montar JSONBs de alimentos (uma vez só, reutiliza para os 7 dias)
  -- ============================================

  -- CAFÉ DA MANHÃ — cardápio principal
  v_breakfast_foods := jsonb_build_array(
    tmp_food_jsonb('Ovo de galinha mexido', '%ovo%galinha%inteiro%cozido%', 100, '2 unidades médias (100g)', 155, 13, 1.1, 11),
    tmp_food_jsonb('Pão francês', '%pao%frances%', 50, '1 unidade (50g)', 150, 4.5, 29, 1.6),
    tmp_food_jsonb('Suco de uva integral orgânico (Aliança)', '%suco%uva%', 250, '250ml', 155, 0.7, 38, 0.2),
    tmp_food_jsonb('Mamão formosa', '%mamao%formosa%', 100, '100g', 45, 0.8, 11.6, 0.1),
    tmp_food_jsonb('Aveia em flocos', '%aveia%floc%', 30, '2 colheres de sopa cheias (30g)', 118, 4.2, 20, 2.4)
  );

  -- CAFÉ DA MANHÃ — Opção 1 (prática, com whey)
  v_breakfast_alt_1 := jsonb_build_array(
    tmp_food_jsonb('Aveia em flocos', '%aveia%floc%', 30, '2 colheres de sopa cheias (30g)', 118, 4.2, 20, 2.4),
    tmp_food_jsonb('Whey Protein Isolado — Baunilha (Dux)', '%whey%isolad%', 30, '1 dosador (30g)', 114, 25, 2, 0.5),
    tmp_food_jsonb('Banana prata', '%banana%prata%', 100, '1 unidade grande (100g)', 98, 1.3, 26, 0.1),
    tmp_food_jsonb('Mel', '%mel%abelha%', 15, '1 colher de sopa rasa (15g)', 46, 0.0, 12.5, 0.0),
    tmp_food_jsonb('Granola', '%granola%', 30, '1 porção (30g)', 135, 3, 20, 5),
    tmp_food_jsonb('Iogurte desnatado natural', '%iogurte%desnatado%natural%', 100, '1 unidade (100ml)', 57, 4.5, 6.3, 0.2)
  );

  -- CAFÉ DA MANHÃ — Café de domingo
  v_breakfast_alt_dom := jsonb_build_array(
    tmp_food_jsonb('Salada de frutas (laranja, banana, maçã e mamão)', '__no_match__', 165, '3 colheres de servir rasas (165g)', 86, 1.3, 22, 0.2),
    tmp_food_jsonb('Mel', '%mel%abelha%', 20, '20g', 62, 0.0, 16.7, 0.0),
    tmp_food_jsonb('Granola', '%granola%', 20, '20g', 90, 2, 13.3, 3.3)
  );

  v_breakfast_alternatives := jsonb_build_array(
    jsonb_build_object('option', 'B', 'name', 'Opção 1 (prática — whey + iogurte)', 'foods', v_breakfast_alt_1),
    jsonb_build_object('option', 'C', 'name', 'Café de domingo (salada de frutas)', 'foods', v_breakfast_alt_dom)
  );

  -- ALMOÇO
  v_lunch_foods := jsonb_build_array(
    tmp_food_jsonb('Peito de frango sem pele grelhado', '%frango%peito%grelhad%', 200, '2 filés médios (200g)', 330, 62, 0, 7.2),
    tmp_food_jsonb('Arroz branco cozido', '%arroz%tipo 1%cozido%', 90, '2 colheres de arroz cheias (90g)', 115, 2.3, 25.2, 0.2),
    tmp_food_jsonb('Batata doce cozida', '%batata%doce%cozida%', 120, '3 fatias pequenas (120g)', 92, 1.0, 21.5, 0.1),
    tmp_food_jsonb('Feijão preto cozido', '%feijao%preto%cozido%', 80, '1 concha rasa (80g)', 62, 4.3, 11.3, 0.4),
    tmp_food_jsonb('Alface americana', '%alface%', 50, 'À vontade (~50g)', 7, 0.7, 1.4, 0.1),
    tmp_food_jsonb('Tomate cereja', '%tomate%', 50, 'À vontade (~50g)', 11, 0.5, 2.6, 0.1),
    tmp_food_jsonb('Repolho', '%repolho%', 50, 'À vontade (~50g)', 13, 0.7, 3.0, 0.1),
    tmp_food_jsonb('Mel de abelha', '%mel%abelha%', 9, '1 colher sobremesa rasa (9g)', 28, 0.0, 7.5, 0.0),
    tmp_food_jsonb('Iogurte natural desnatado', '%iogurte%desnatado%natural%', 30, '2 colheres de sopa (30g)', 17, 1.4, 1.9, 0.1),
    tmp_food_jsonb('Molho de mostarda', '%mostarda%', 15, '1 colher sobremesa cheia (15g)', 10, 0.7, 1.0, 0.5),
    tmp_food_jsonb('Azeite de oliva', '%azeite%', 1, '1 colher café rasa (1g)', 9, 0, 0, 1)
  );

  -- LANCHE — principal (prático, whey + castanhas + damasco)
  v_snack_foods := jsonb_build_array(
    tmp_food_jsonb('Whey protein concentrado', '%whey%concentrad%', 30, '1 medidor (30g)', 120, 24, 3, 2),
    tmp_food_jsonb('Castanha do Brasil (castanha do Pará)', '%castanha%brasil%', 12, '3 unidades (12g)', 80, 1.7, 1.4, 7.9),
    tmp_food_jsonb('Damasco seco', '%damasco%', 140, '4 unidades (140g)', 333, 4.7, 86, 0.7),
    tmp_food_jsonb('Castanha do Pará sem sal', '%castanha%para%', 12, '3 unidades (12g)', 80, 1.7, 1.4, 7.9)
  );

  -- LANCHE — Opção 2 (coxinha de frango)
  v_snack_alt_coxinha := jsonb_build_array(
    tmp_food_jsonb('Batata inglesa cozida', '%batata%inglesa%cozida%', 240, '8 colheres de sopa cheias (240g)', 184, 4.8, 42, 0.2),
    tmp_food_jsonb('Frango desfiado', '%frango%peito%cozid%', 100, '5 colheres de sopa cheias (100g)', 165, 31, 0, 3.6),
    tmp_food_jsonb('Farinha de aveia', '%aveia%floc%', 40, '40g', 157, 5.6, 26.7, 3.2)
  );

  v_snack_alternatives := jsonb_build_array(
    jsonb_build_object(
      'option', 'B',
      'name', 'Coxinha de frango com batata (receita fit)',
      'foods', v_snack_alt_coxinha
    )
  );

  -- JANTAR — Opção 1 (refeição completa: tilápia + purê + salada)
  v_dinner_foods := jsonb_build_array(
    tmp_food_jsonb('Salada de brócolis, couve-flor e cenoura', '__no_match__', 103, '1 porção (103g)', 40, 3.0, 8.0, 0.4),
    tmp_food_jsonb('Purê de batata-doce', '__no_match__', 127, '1,5 porção (127,5g)', 110, 1.7, 26, 0.2),
    tmp_food_jsonb('Filé de tilápia sem pele cozido com sal', '%tilapia%', 300, '3 fatias médias (300g)', 384, 78, 0, 7.8)
  );

  -- JANTAR — Opção 2 (crepioca com frango e queijo)
  v_dinner_alt_2 := jsonb_build_array(
    tmp_food_jsonb('Ovo de galinha (cozido/mexido/omelete)', '%ovo%galinha%inteiro%cozido%', 100, '2 unidades médias (100g)', 155, 13, 1.1, 11),
    tmp_food_jsonb('Goma de tapioca', '%tapioca%', 75, '5 colheres de sopa rasas (75g)', 255, 0.3, 63, 0.2),
    tmp_food_jsonb('Queijo minas', '%queijo%minas%', 30, '1 fatia média (30g)', 72, 5.2, 0.9, 5.6),
    tmp_food_jsonb('Requeijão', '%requeijao%', 60, '2 colheres de sopa cheias (60g)', 160, 4, 2, 16),
    tmp_food_jsonb('Frango desfiado', '%frango%peito%cozid%', 60, '3 colheres de sopa cheias (60g)', 99, 18.6, 0, 2.2),
    tmp_food_jsonb('Abacaxi', '%abacaxi%', 150, '2 fatias médias (150g)', 72, 1.4, 18.6, 0.2)
  );

  -- JANTAR — Opção 3 (macarrão ao sugo + carne + salada)
  v_dinner_alt_3 := jsonb_build_array(
    tmp_food_jsonb('Macarrão ao sugo', '%macarrao%', 165, '1,5 escumadeira média cheia (165g)', 210, 6, 38, 3.5),
    tmp_food_jsonb('Carne bovina cozida (alcatra/contrafilé/patinho)', '%alcatra%', 110, '1 fatia média (110g)', 231, 34, 0, 10),
    tmp_food_jsonb('Queijo mussarela light (Verde Campo)', '%mucarela%', 60, '2 fatias médias (60g)', 160, 15, 2, 10),
    tmp_food_jsonb('Salada de legumes (cenoura, beterraba e pepino)', '__no_match__', 120, '2 porções (120g)', 52, 1.6, 12, 0.2)
  );

  v_dinner_alternatives := jsonb_build_array(
    jsonb_build_object('option', 'B', 'name', 'Opção 2 — Crepioca de frango com queijo', 'foods', v_dinner_alt_2),
    jsonb_build_object('option', 'C', 'name', 'Opção 3 — Macarrão ao sugo com carne', 'foods', v_dinner_alt_3)
  );

  -- Totais por refeição (reaproveitados em todos os 7 dias)
  v_bf_tot := tmp_totals(v_breakfast_foods);
  v_lu_tot := tmp_totals(v_lunch_foods);
  v_sn_tot := tmp_totals(v_snack_foods);
  v_di_tot := tmp_totals(v_dinner_foods);

  -- ============================================
  -- 5) Criar plano + dias + refeições
  -- ============================================
  INSERT INTO fitness_meal_plans (
    professional_id, client_id, name, description, goal,
    calories_target, protein_target, carbs_target, fat_target,
    water_target, duration_weeks, is_template, is_active, notes
  ) VALUES (
    v_prof_id,
    NULL,
    v_plan_name,
    'Plano alimentar de hipertrofia prescrito por Thayná Ramos Silva (CRN-MG 20922) em 18/04/2026. Horários 06:00, 12:00, 15:00 e 19:00. Importado como template reutilizável.',
    'muscle_gain',
    ROUND(((v_bf_tot->>'calories')::NUMERIC + (v_lu_tot->>'calories')::NUMERIC + (v_sn_tot->>'calories')::NUMERIC + (v_di_tot->>'calories')::NUMERIC))::INTEGER,
    ROUND(((v_bf_tot->>'protein')::NUMERIC + (v_lu_tot->>'protein')::NUMERIC + (v_sn_tot->>'protein')::NUMERIC + (v_di_tot->>'protein')::NUMERIC))::INTEGER,
    ROUND(((v_bf_tot->>'carbs')::NUMERIC + (v_lu_tot->>'carbs')::NUMERIC + (v_sn_tot->>'carbs')::NUMERIC + (v_di_tot->>'carbs')::NUMERIC))::INTEGER,
    ROUND(((v_bf_tot->>'fat')::NUMERIC + (v_lu_tot->>'fat')::NUMERIC + (v_sn_tot->>'fat')::NUMERIC + (v_di_tot->>'fat')::NUMERIC))::INTEGER,
    3000,
    4,
    true,
    true,
    'Substituições e receitas (coxinha, molho de limão, pão de aveia, hambúrguer, purê, saladas) estão no campo instructions de cada refeição.'
  ) RETURNING id INTO v_plan_id;

  RAISE NOTICE 'Plano criado: %', v_plan_id;

  -- Loop 7 dias
  FOR v_day IN 0..6 LOOP
    INSERT INTO fitness_meal_plan_days (meal_plan_id, day_of_week, day_name)
    VALUES (v_plan_id, v_day,
      CASE v_day
        WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta' WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta'
        ELSE 'Sábado'
      END)
    RETURNING id INTO v_day_id;

    -- Café da manhã (06:00)
    INSERT INTO fitness_meal_plan_meals (
      meal_plan_day_id, meal_type, meal_name, scheduled_time,
      foods, alternatives, instructions,
      total_calories, total_protein, total_carbs, total_fat, order_index
    ) VALUES (
      v_day_id, 'breakfast', 'Café da manhã', '06:00'::TIME,
      v_breakfast_foods, v_breakfast_alternatives,
      E'Substituições item-a-item:\n• Ovo mexido → Queijo minas, 2 fatias médias (60g)\n• Pão francês → Pão de forma integral, 1 fatia (25g)\n• Suco de uva integral → Suco de laranja, 250ml\n• Mamão formosa → Abacaxi, 0,7 fatia média (55,6g)\n\nVariações completas: ver "Opção 1 (prática)" e "Café de domingo" nas alternativas.',
      (v_bf_tot->>'calories')::INTEGER,
      (v_bf_tot->>'protein')::NUMERIC(6,2),
      (v_bf_tot->>'carbs')::NUMERIC(6,2),
      (v_bf_tot->>'fat')::NUMERIC(6,2),
      0
    );

    -- Almoço (12:00)
    INSERT INTO fitness_meal_plan_meals (
      meal_plan_day_id, meal_type, meal_name, scheduled_time,
      foods, alternatives, instructions,
      total_calories, total_protein, total_carbs, total_fat, order_index
    ) VALUES (
      v_day_id, 'lunch', 'Almoço', '12:00'::TIME,
      v_lunch_foods, '[]'::JSONB,
      E'Molho para salada: bater mostarda, mel, azeite e iogurte natural.\n\nSubstituições item-a-item:\n• Peito de frango grelhado → Músculo cozido 1,5 pedaço médio (165g) | Coxa de frango sem pele assada 2 unidades (130g) | Sobrecoxa sem pele assada 2 unidades (130g) | Carne moída refogada 4 colheres de sopa cheias (100g)\n• Arroz branco cozido → Arroz com brócolis 2 colheres servir cheia (110g)\n• Batata doce → Inhame/cará cozido 100g | Batata inglesa assada 100g | Mandioca cozida 1 pedaço médio (100g)\n• Feijão preto → Feijão carioca cozido 1,3 concha cheia (186,7g)\n• Alface americana → Repolho roxo cru 2 cs (20g) | Brócolis cozido 2 cs (30g)\n• Tomate cereja → Pimentão vermelho 3 fatias (15g) | Abóbora cabotiã 1 cs (36g) | Abobrinha cozida 2 cs (60g) | Cebola picada 1 cs (10g) | Beterraba cozida 1 cs (38g) | Rabanete 3 unidades (75g)\n• Repolho → Pepino 6 fatias (18g) | Quiabo 2 cs (80g) | Abobrinha italiana 6 fatias (30g)',
      (v_lu_tot->>'calories')::INTEGER,
      (v_lu_tot->>'protein')::NUMERIC(6,2),
      (v_lu_tot->>'carbs')::NUMERIC(6,2),
      (v_lu_tot->>'fat')::NUMERIC(6,2),
      1
    );

    -- Lanche (15:00)
    INSERT INTO fitness_meal_plan_meals (
      meal_plan_day_id, meal_type, meal_name, scheduled_time,
      foods, alternatives, instructions,
      total_calories, total_protein, total_carbs, total_fat, order_index
    ) VALUES (
      v_day_id, 'afternoon_snack', 'Lanche', '15:00'::TIME,
      v_snack_foods, v_snack_alternatives,
      E'Misturar o whey na água.\n\nReceita da coxinha (alternativa):\n• Cozinhe e desfie o frango temperado.\n• Cozinhe as batatas e amasse.\n• Use a quantidade descrita de batata e frango, enrole juntos em formato de coxinha.\n• Passe na farinha de aveia e leve ao forno.\n• Rende várias porções — pode congelar e levar ao microondas depois.',
      (v_sn_tot->>'calories')::INTEGER,
      (v_sn_tot->>'protein')::NUMERIC(6,2),
      (v_sn_tot->>'carbs')::NUMERIC(6,2),
      (v_sn_tot->>'fat')::NUMERIC(6,2),
      2
    );

    -- Jantar (19:00)
    INSERT INTO fitness_meal_plan_meals (
      meal_plan_day_id, meal_type, meal_name, scheduled_time,
      foods, alternatives, instructions,
      total_calories, total_protein, total_carbs, total_fat, order_index
    ) VALUES (
      v_day_id, 'dinner', 'Jantar', '19:00'::TIME,
      v_dinner_foods, v_dinner_alternatives,
      E'Substituição para carne (Opção 3): Ovo de galinha cozido 3 unidades médias (150g).\n\nReceita da crepioca (Opção 2):\n• Misturar ovos e goma de tapioca.\n• Dourar dos dois lados em frigideira antiaderente.\n• Rechear com frango desfiado e requeijão.\n• Consumir abacaxi em seguida.\n\nObs. Opção 3: macarrão apenas com molho de tomate e temperos naturais.\n\nReceita do purê de batata-doce (Opção 1):\n• Cozinhar batata doce (140g) com casca.\n• Amassar e misturar com 3 cs rasas de azeite (24g) e 2 dentes de alho (6g) refogados. Sal a gosto.\n\nReceita da salada de brócolis, couve-flor e cenoura (Opção 1):\n• Couve-flor 2 cs (50g), brócolis 2 cs (20g), cenoura crua 2 cs (24g), azeite 1 cs rasa (8g), orégano e sal a gosto.',
      (v_di_tot->>'calories')::INTEGER,
      (v_di_tot->>'protein')::NUMERIC(6,2),
      (v_di_tot->>'carbs')::NUMERIC(6,2),
      (v_di_tot->>'fat')::NUMERIC(6,2),
      3
    );
  END LOOP;

  RAISE NOTICE 'Template "%" criado com sucesso em % (7 dias, 4 refeições/dia).', v_plan_name, v_plan_id;
END;
$$;

-- Cleanup: remover funções temporárias
DROP FUNCTION IF EXISTS tmp_food_jsonb(TEXT, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS tmp_totals(JSONB);

COMMIT;

-- NOTIFY pgrst, 'reload schema';
