-- FeliceFit - Criar Templates de Treino para o Usuário
-- Execute este arquivo no Supabase SQL Editor
--
-- Este script cria templates de treino para todos os dias da semana
-- Baseado em treino Push/Pull/Legs para hipertrofia
--
-- User ID: 6ec8c5cc-b4c3-4d39-a71a-c3204fcbad85

DO $$
DECLARE
    v_user_id UUID := '6ec8c5cc-b4c3-4d39-a71a-c3204fcbad85';
    v_template_segunda UUID;
    v_template_terca UUID;
    v_template_quarta UUID;
    v_template_quinta UUID;
    v_template_sexta UUID;
    v_template_sabado UUID;
BEGIN
    RAISE NOTICE 'Criando templates para usuário: %', v_user_id;

    -- Primeiro, remover a referência de template_id dos treinos existentes
    -- (isso preserva os treinos já realizados, apenas remove o link com o template)
    UPDATE fitness_workouts
    SET template_id = NULL
    WHERE template_id IN (
        SELECT id FROM fitness_workout_templates WHERE user_id = v_user_id
    );

    -- Agora podemos limpar os exercícios dos templates
    DELETE FROM fitness_workout_template_exercises
    WHERE template_id IN (
        SELECT id FROM fitness_workout_templates WHERE user_id = v_user_id
    );

    -- E os templates antigos
    DELETE FROM fitness_workout_templates WHERE user_id = v_user_id;

    -- ============================================
    -- SEGUNDA-FEIRA (dia_semana = 1) - PEITO + OMBROS + TRÍCEPS (PUSH A)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Push A - Peito e Ombros', 'Treino de empurrar com foco em peito e ombros anteriores', 'hipertrofia', 'base', 1, 60, true, 1)
    RETURNING id INTO v_template_segunda;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_segunda, 'Supino Reto com Barra', 1, 4, '8-10', 120, 60),
    (v_template_segunda, 'Supino Inclinado com Halteres', 2, 4, '10-12', 90, 24),
    (v_template_segunda, 'Desenvolvimento com Halteres', 3, 4, '10-12', 90, 20),
    (v_template_segunda, 'Crucifixo na Máquina', 4, 3, '12-15', 60, 40),
    (v_template_segunda, 'Elevação Lateral', 5, 4, '12-15', 60, 10),
    (v_template_segunda, 'Tríceps Corda', 6, 4, '12-15', 60, 25),
    (v_template_segunda, 'Tríceps Testa', 7, 3, '10-12', 60, 15);

    -- ============================================
    -- TERÇA-FEIRA (dia_semana = 2) - COSTAS + BÍCEPS (PULL A)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Pull A - Costas e Bíceps', 'Treino de puxar com foco em largura das costas', 'hipertrofia', 'base', 2, 55, true, 2)
    RETURNING id INTO v_template_terca;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_terca, 'Puxada Frente Pegada Aberta', 1, 4, '10-12', 90, 60),
    (v_template_terca, 'Remada Curvada', 2, 4, '8-10', 120, 50),
    (v_template_terca, 'Remada Cavalinho', 3, 4, '10-12', 90, 40),
    (v_template_terca, 'Pulldown Pegada Fechada', 4, 3, '12-15', 60, 50),
    (v_template_terca, 'Face Pull', 5, 4, '15-20', 60, 15),
    (v_template_terca, 'Rosca Direta Barra', 6, 4, '10-12', 60, 25),
    (v_template_terca, 'Rosca Martelo', 7, 3, '12-15', 60, 12);

    -- ============================================
    -- QUARTA-FEIRA (dia_semana = 3) - PERNAS + GLÚTEOS (LEGS A)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Legs A - Quadríceps', 'Treino de pernas com foco em quadríceps', 'hipertrofia', 'base', 3, 65, true, 3)
    RETURNING id INTO v_template_quarta;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_quarta, 'Agachamento Livre', 1, 4, '8-10', 180, 80),
    (v_template_quarta, 'Leg Press 45', 2, 4, '10-12', 120, 200),
    (v_template_quarta, 'Hack Squat', 3, 4, '10-12', 120, 80),
    (v_template_quarta, 'Cadeira Extensora', 4, 4, '12-15', 60, 50),
    (v_template_quarta, 'Afundo com Halteres', 5, 3, '12 cada', 90, 16),
    (v_template_quarta, 'Panturrilha em Pé', 6, 5, '15-20', 45, 60),
    (v_template_quarta, 'Abdominal na Máquina', 7, 4, '15-20', 45, 40);

    -- ============================================
    -- QUINTA-FEIRA (dia_semana = 4) - PEITO + OMBROS + TRÍCEPS (PUSH B)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Push B - Ombros e Peito', 'Treino de empurrar com foco em ombros', 'hipertrofia', 'base', 4, 55, true, 4)
    RETURNING id INTO v_template_quinta;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_quinta, 'Desenvolvimento Militar', 1, 4, '8-10', 120, 40),
    (v_template_quinta, 'Supino Inclinado com Barra', 2, 4, '10-12', 90, 50),
    (v_template_quinta, 'Supino Declinado', 3, 3, '10-12', 90, 55),
    (v_template_quinta, 'Elevação Frontal', 4, 3, '12-15', 60, 10),
    (v_template_quinta, 'Fly Inclinado', 5, 3, '12-15', 60, 14),
    (v_template_quinta, 'Tríceps Francês', 6, 4, '10-12', 60, 20),
    (v_template_quinta, 'Mergulho no Banco', 7, 3, '12-15', 60, NULL);

    -- ============================================
    -- SEXTA-FEIRA (dia_semana = 5) - COSTAS + BÍCEPS (PULL B)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Pull B - Costas Densidade', 'Treino de puxar com foco em densidade das costas', 'hipertrofia', 'base', 5, 55, true, 5)
    RETURNING id INTO v_template_sexta;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_sexta, 'Barra Fixa', 1, 4, '8-10', 120, NULL),
    (v_template_sexta, 'Remada Unilateral', 2, 4, '10-12', 90, 30),
    (v_template_sexta, 'Remada Baixa Pegada Neutra', 3, 4, '10-12', 90, 60),
    (v_template_sexta, 'Pullover na Máquina', 4, 3, '12-15', 60, 45),
    (v_template_sexta, 'Encolhimento com Halteres', 5, 4, '12-15', 60, 30),
    (v_template_sexta, 'Rosca Scott', 6, 4, '10-12', 60, 20),
    (v_template_sexta, 'Rosca Concentrada', 7, 3, '12-15', 45, 10);

    -- ============================================
    -- SÁBADO (dia_semana = 6) - PERNAS + POSTERIOR (LEGS B)
    -- ============================================
    INSERT INTO fitness_workout_templates (id, user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min, is_ativo, ordem)
    VALUES (gen_random_uuid(), v_user_id, 'Legs B - Posterior e Glúteos', 'Treino de pernas com foco em posterior de coxa e glúteos', 'hipertrofia', 'base', 6, 60, true, 6)
    RETURNING id INTO v_template_sabado;

    INSERT INTO fitness_workout_template_exercises (template_id, exercicio_nome, ordem, series, repeticoes, descanso_segundos, carga_sugerida) VALUES
    (v_template_sabado, 'Levantamento Terra Romeno', 1, 4, '10-12', 120, 60),
    (v_template_sabado, 'Leg Press Pés Altos', 2, 4, '12-15', 90, 180),
    (v_template_sabado, 'Cadeira Flexora', 3, 4, '12-15', 60, 45),
    (v_template_sabado, 'Stiff com Halteres', 4, 3, '10-12', 90, 20),
    (v_template_sabado, 'Glúteo na Máquina', 5, 4, '15 cada', 60, 50),
    (v_template_sabado, 'Panturrilha Sentado', 6, 5, '15-20', 45, 40),
    (v_template_sabado, 'Prancha', 7, 3, '60s', 45, NULL);

    -- DOMINGO (dia_semana = 0) - DESCANSO
    -- Não criamos template para domingo (dia de descanso)

    RAISE NOTICE 'Templates criados com sucesso!';
    RAISE NOTICE 'Segunda (1): Push A - Peito e Ombros';
    RAISE NOTICE 'Terça (2): Pull A - Costas e Bíceps';
    RAISE NOTICE 'Quarta (3): Legs A - Quadríceps';
    RAISE NOTICE 'Quinta (4): Push B - Ombros e Peito';
    RAISE NOTICE 'Sexta (5): Pull B - Costas Densidade';
    RAISE NOTICE 'Sábado (6): Legs B - Posterior e Glúteos';
    RAISE NOTICE 'Domingo (0): Descanso';

END $$;

-- Verificar templates criados
SELECT
    t.id,
    t.nome,
    t.dia_semana,
    t.duracao_estimada_min,
    COUNT(e.id) as exercicios
FROM fitness_workout_templates t
LEFT JOIN fitness_workout_template_exercises e ON e.template_id = t.id
WHERE t.user_id = '6ec8c5cc-b4c3-4d39-a71a-c3204fcbad85' AND t.is_ativo = true
GROUP BY t.id, t.nome, t.dia_semana, t.duracao_estimada_min
ORDER BY t.dia_semana;
