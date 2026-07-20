-- =============================================================
-- FASE 5 — Unifica o vocabulário de fitness_meals.tipo_refeicao em PT
--
-- Registros manuais sempre foram em português (cafe_manha, almoco...),
-- mas refeições concluídas via plano da nutri eram gravadas com o
-- meal_type em inglês do plano (breakfast, lunch...). O código passou a
-- gravar sempre em PT; esta migration converte o histórico.
--
-- Idempotente: re-executar não altera linhas já convertidas.
-- (fitness_meal_plan_meals.meal_type continua em inglês — vocabulário
-- interno do módulo de planos; a conversão acontece na aplicação.)
-- =============================================================

UPDATE fitness_meals SET tipo_refeicao = 'cafe_manha'   WHERE tipo_refeicao = 'breakfast';
UPDATE fitness_meals SET tipo_refeicao = 'lanche_manha' WHERE tipo_refeicao = 'morning_snack';
UPDATE fitness_meals SET tipo_refeicao = 'almoco'       WHERE tipo_refeicao = 'lunch';
UPDATE fitness_meals SET tipo_refeicao = 'lanche_tarde' WHERE tipo_refeicao = 'afternoon_snack';
UPDATE fitness_meals SET tipo_refeicao = 'lanche_tarde' WHERE tipo_refeicao = 'snack';
UPDATE fitness_meals SET tipo_refeicao = 'pre_treino'   WHERE tipo_refeicao = 'pre_workout';
UPDATE fitness_meals SET tipo_refeicao = 'jantar'       WHERE tipo_refeicao = 'dinner';
UPDATE fitness_meals SET tipo_refeicao = 'ceia'         WHERE tipo_refeicao = 'supper';

-- Variantes legadas em português
UPDATE fitness_meals SET tipo_refeicao = 'cafe_manha'   WHERE tipo_refeicao = 'cafe';
UPDATE fitness_meals SET tipo_refeicao = 'lanche_tarde' WHERE tipo_refeicao = 'lanche';

-- Verificação: deve retornar 0 linhas fora do vocabulário canônico
-- SELECT tipo_refeicao, COUNT(*) FROM fitness_meals
-- WHERE tipo_refeicao NOT IN ('cafe_manha','lanche_manha','almoco','lanche_tarde','pre_treino','jantar','ceia')
-- GROUP BY 1;
