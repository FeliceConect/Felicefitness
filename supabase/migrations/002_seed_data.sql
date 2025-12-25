-- FeliceFit - Migration 002: Seed Data
-- Execute este arquivo no Supabase SQL Editor após criar as tabelas

-- ============================================
-- EXERCÍCIOS DA BIBLIOTECA
-- ============================================

INSERT INTO fitness_exercises_library (nome, grupo_muscular, equipamento, tipo, dificuldade, is_composto, musculos_secundarios) VALUES
-- PERNAS
('Leg Press', 'pernas', 'maquina', 'forca', 'iniciante', true, ARRAY['quadriceps', 'gluteos', 'posterior']),
('Agachamento Goblet', 'pernas', 'halteres', 'forca', 'iniciante', true, ARRAY['quadriceps', 'gluteos', 'core']),
('Agachamento Livre', 'pernas', 'barra', 'forca', 'intermediario', true, ARRAY['quadriceps', 'gluteos', 'posterior', 'core']),
('Agachamento Sumô', 'pernas', 'halteres', 'forca', 'iniciante', true, ARRAY['adutores', 'gluteos', 'quadriceps']),
('Agachamento Isométrico na Parede', 'pernas', 'peso_corporal', 'isometrico', 'iniciante', false, ARRAY['quadriceps']),
('Agachamento Unilateral (Pistol)', 'pernas', 'peso_corporal', 'forca', 'avancado', true, ARRAY['quadriceps', 'gluteos', 'core']),
('Afundo Búlgaro', 'pernas', 'halteres', 'forca', 'intermediario', true, ARRAY['quadriceps', 'gluteos', 'posterior']),
('Afundo Alternado', 'pernas', 'peso_corporal', 'forca', 'iniciante', true, ARRAY['quadriceps', 'gluteos']),
('Afundo com Salto', 'pernas', 'peso_corporal', 'forca', 'avancado', true, ARRAY['quadriceps', 'gluteos', 'cardio']),
('Cadeira Extensora', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['quadriceps']),
('Cadeira Flexora', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['posterior']),
('Mesa Flexora', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['posterior', 'gluteos']),
('Stiff', 'pernas', 'barra', 'forca', 'intermediario', true, ARRAY['posterior', 'gluteos', 'lombar']),
('Stiff Unilateral', 'pernas', 'halteres', 'forca', 'intermediario', true, ARRAY['posterior', 'gluteos', 'core']),
('Stiff com Halteres', 'pernas', 'halteres', 'forca', 'intermediario', true, ARRAY['posterior', 'gluteos', 'lombar']),
('Step Up', 'pernas', 'peso_corporal', 'forca', 'iniciante', true, ARRAY['quadriceps', 'gluteos']),
('Elevação de Panturrilha em Pé', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['panturrilha']),
('Elevação de Panturrilha Sentado', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['panturrilha']),
('Panturrilha Unilateral', 'pernas', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['panturrilha']),
('Ponte de Glúteos', 'pernas', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['gluteos', 'posterior']),
('Ponte de Glúteos Unilateral', 'pernas', 'peso_corporal', 'forca', 'intermediario', false, ARRAY['gluteos', 'core']),
('Hip Thrust', 'pernas', 'barra', 'forca', 'intermediario', false, ARRAY['gluteos', 'posterior']),
('Abdução de Quadril', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['gluteo_medio', 'abdutores']),
('Adução de Quadril', 'pernas', 'maquina', 'forca', 'iniciante', false, ARRAY['adutores']),
('Hack Squat', 'pernas', 'maquina', 'forca', 'intermediario', true, ARRAY['quadriceps', 'gluteos']),
('Agachamento Smith', 'pernas', 'maquina', 'forca', 'iniciante', true, ARRAY['quadriceps', 'gluteos']),

-- PEITO
('Supino Reto com Barra', 'peito', 'barra', 'forca', 'intermediario', true, ARRAY['peitoral', 'triceps', 'ombros']),
('Supino Reto com Halteres', 'peito', 'halteres', 'forca', 'intermediario', true, ARRAY['peitoral', 'triceps', 'ombros']),
('Supino Inclinado com Barra', 'peito', 'barra', 'forca', 'intermediario', true, ARRAY['peitoral_superior', 'triceps', 'ombros']),
('Supino Inclinado com Halteres', 'peito', 'halteres', 'forca', 'intermediario', true, ARRAY['peitoral_superior', 'triceps', 'ombros']),
('Supino Declinado', 'peito', 'barra', 'forca', 'intermediario', true, ARRAY['peitoral_inferior', 'triceps']),
('Supino Máquina', 'peito', 'maquina', 'forca', 'iniciante', true, ARRAY['peitoral', 'triceps']),
('Flexão de Braço', 'peito', 'peso_corporal', 'forca', 'iniciante', true, ARRAY['peitoral', 'triceps', 'core']),
('Flexão de Braço Inclinada', 'peito', 'peso_corporal', 'forca', 'iniciante', true, ARRAY['peitoral_inferior', 'triceps']),
('Flexão de Braço Declinada', 'peito', 'peso_corporal', 'forca', 'intermediario', true, ARRAY['peitoral_superior', 'triceps']),
('Crucifixo com Halteres', 'peito', 'halteres', 'forca', 'intermediario', false, ARRAY['peitoral']),
('Crucifixo Inclinado', 'peito', 'halteres', 'forca', 'intermediario', false, ARRAY['peitoral_superior']),
('Crossover no Cabo', 'peito', 'cabo', 'forca', 'intermediario', false, ARRAY['peitoral']),
('Peck Deck', 'peito', 'maquina', 'forca', 'iniciante', false, ARRAY['peitoral']),
('Pullover', 'peito', 'halteres', 'forca', 'intermediario', false, ARRAY['peitoral', 'costas', 'triceps']),

-- COSTAS
('Barra Fixa (Pull-up)', 'costas', 'peso_corporal', 'forca', 'intermediario', true, ARRAY['dorsal', 'biceps', 'core']),
('Barra Fixa Pegada Supinada (Chin-up)', 'costas', 'peso_corporal', 'forca', 'intermediario', true, ARRAY['dorsal', 'biceps']),
('Puxada Frontal', 'costas', 'cabo', 'forca', 'iniciante', true, ARRAY['dorsal', 'biceps']),
('Puxada Frontal Pegada Fechada', 'costas', 'cabo', 'forca', 'iniciante', true, ARRAY['dorsal', 'biceps']),
('Puxada Atrás da Nuca', 'costas', 'cabo', 'forca', 'intermediario', true, ARRAY['dorsal', 'biceps']),
('Remada Curvada', 'costas', 'barra', 'forca', 'intermediario', true, ARRAY['dorsal', 'biceps', 'lombar']),
('Remada Unilateral', 'costas', 'halteres', 'forca', 'intermediario', true, ARRAY['dorsal', 'biceps']),
('Remada Cavalinho', 'costas', 'maquina', 'forca', 'iniciante', true, ARRAY['dorsal', 'biceps']),
('Remada Baixa no Cabo', 'costas', 'cabo', 'forca', 'iniciante', true, ARRAY['dorsal', 'biceps', 'romboides']),
('Remada Alta', 'costas', 'barra', 'forca', 'intermediario', false, ARRAY['trapezio', 'ombros']),
('Remada Máquina', 'costas', 'maquina', 'forca', 'iniciante', true, ARRAY['dorsal', 'biceps']),
('Levantamento Terra', 'costas', 'barra', 'forca', 'avancado', true, ARRAY['lombar', 'gluteos', 'posterior', 'trapezio']),
('Levantamento Terra Romeno', 'costas', 'barra', 'forca', 'intermediario', true, ARRAY['posterior', 'gluteos', 'lombar']),
('Encolhimento de Ombros', 'costas', 'halteres', 'forca', 'iniciante', false, ARRAY['trapezio']),
('Face Pull', 'costas', 'cabo', 'forca', 'iniciante', false, ARRAY['romboides', 'deltoide_posterior']),
('Hiperextensão', 'costas', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['lombar', 'gluteos']),

-- OMBROS
('Desenvolvimento com Halteres', 'ombros', 'halteres', 'forca', 'intermediario', true, ARRAY['deltoides', 'triceps']),
('Desenvolvimento com Barra', 'ombros', 'barra', 'forca', 'intermediario', true, ARRAY['deltoides', 'triceps']),
('Desenvolvimento Arnold', 'ombros', 'halteres', 'forca', 'intermediario', true, ARRAY['deltoides', 'triceps']),
('Desenvolvimento Máquina', 'ombros', 'maquina', 'forca', 'iniciante', true, ARRAY['deltoides', 'triceps']),
('Elevação Lateral', 'ombros', 'halteres', 'forca', 'iniciante', false, ARRAY['deltoide_lateral']),
('Elevação Lateral no Cabo', 'ombros', 'cabo', 'forca', 'iniciante', false, ARRAY['deltoide_lateral']),
('Elevação Frontal', 'ombros', 'halteres', 'forca', 'iniciante', false, ARRAY['deltoide_anterior']),
('Elevação Posterior (Crucifixo Inverso)', 'ombros', 'halteres', 'forca', 'iniciante', false, ARRAY['deltoide_posterior']),
('Crucifixo Inverso na Máquina', 'ombros', 'maquina', 'forca', 'iniciante', false, ARRAY['deltoide_posterior']),
('Pike Push-up', 'ombros', 'peso_corporal', 'forca', 'intermediario', true, ARRAY['deltoides', 'triceps']),

-- BÍCEPS
('Rosca Direta com Barra', 'biceps', 'barra', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca Direta com Halteres', 'biceps', 'halteres', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca Alternada', 'biceps', 'halteres', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca Martelo', 'biceps', 'halteres', 'forca', 'iniciante', false, ARRAY['biceps', 'braquial']),
('Rosca Concentrada', 'biceps', 'halteres', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca Scott', 'biceps', 'barra', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca no Cabo', 'biceps', 'cabo', 'forca', 'iniciante', false, ARRAY['biceps']),
('Rosca Inclinada', 'biceps', 'halteres', 'forca', 'intermediario', false, ARRAY['biceps']),
('Rosca 21', 'biceps', 'barra', 'forca', 'intermediario', false, ARRAY['biceps']),

-- TRÍCEPS
('Tríceps Corda', 'triceps', 'cabo', 'forca', 'iniciante', false, ARRAY['triceps']),
('Tríceps Barra', 'triceps', 'cabo', 'forca', 'iniciante', false, ARRAY['triceps']),
('Tríceps Francês', 'triceps', 'halteres', 'forca', 'iniciante', false, ARRAY['triceps']),
('Tríceps Testa', 'triceps', 'barra', 'forca', 'intermediario', false, ARRAY['triceps']),
('Tríceps no Banco', 'triceps', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['triceps']),
('Tríceps Coice', 'triceps', 'halteres', 'forca', 'iniciante', false, ARRAY['triceps']),
('Mergulho (Dips)', 'triceps', 'peso_corporal', 'forca', 'intermediario', true, ARRAY['triceps', 'peitoral', 'ombros']),
('Supino Fechado', 'triceps', 'barra', 'forca', 'intermediario', true, ARRAY['triceps', 'peitoral']),

-- CORE / ABDOMINAIS
('Prancha Frontal', 'core', 'peso_corporal', 'isometrico', 'iniciante', false, ARRAY['abdominais', 'lombar']),
('Prancha Lateral', 'core', 'peso_corporal', 'isometrico', 'iniciante', false, ARRAY['obliquos', 'abdominais']),
('Prancha com Elevação de Braço', 'core', 'peso_corporal', 'isometrico', 'intermediario', false, ARRAY['abdominais', 'core']),
('Dead Bug', 'core', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['abdominais', 'core']),
('Bird Dog', 'core', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['core', 'lombar']),
('Mountain Climber', 'core', 'peso_corporal', 'cardio', 'iniciante', false, ARRAY['abdominais', 'cardio']),
('Pallof Press', 'core', 'elastico', 'forca', 'intermediario', false, ARRAY['obliquos', 'core']),
('Abdominal Reto', 'core', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['abdominais']),
('Abdominal Infra', 'core', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['abdominais_inferiores']),
('Abdominal Oblíquo', 'core', 'peso_corporal', 'forca', 'iniciante', false, ARRAY['obliquos']),
('Abdominal na Máquina', 'core', 'maquina', 'forca', 'iniciante', false, ARRAY['abdominais']),
('Russian Twist', 'core', 'peso_corporal', 'forca', 'intermediario', false, ARRAY['obliquos']),
('Leg Raise (Elevação de Pernas)', 'core', 'peso_corporal', 'forca', 'intermediario', false, ARRAY['abdominais_inferiores']),
('Hollow Hold', 'core', 'peso_corporal', 'isometrico', 'intermediario', false, ARRAY['core']),
('Ab Wheel (Roda Abdominal)', 'core', 'equipamento', 'forca', 'avancado', false, ARRAY['abdominais', 'core']),

-- CARDIO
('Corrida na Esteira', 'cardio', 'maquina', 'cardio', 'iniciante', false, ARRAY['cardiovascular']),
('Caminhada na Esteira', 'cardio', 'maquina', 'cardio', 'iniciante', false, ARRAY['cardiovascular']),
('Bicicleta Ergométrica', 'cardio', 'maquina', 'cardio', 'iniciante', false, ARRAY['cardiovascular', 'pernas']),
('Elíptico', 'cardio', 'maquina', 'cardio', 'iniciante', false, ARRAY['cardiovascular']),
('Remo Ergométrico', 'cardio', 'maquina', 'cardio', 'intermediario', true, ARRAY['cardiovascular', 'costas', 'pernas']),
('Pular Corda', 'cardio', 'equipamento', 'cardio', 'iniciante', false, ARRAY['cardiovascular', 'panturrilha']),
('Burpee', 'cardio', 'peso_corporal', 'cardio', 'intermediario', true, ARRAY['corpo_todo']),
('Jumping Jack', 'cardio', 'peso_corporal', 'cardio', 'iniciante', false, ARRAY['cardiovascular']),
('Box Jump', 'cardio', 'equipamento', 'forca', 'intermediario', true, ARRAY['pernas', 'explosao']),
('Battle Ropes', 'cardio', 'equipamento', 'cardio', 'intermediario', false, ARRAY['ombros', 'core', 'cardiovascular']),

-- MOBILIDADE / ALONGAMENTO
('Cat-Cow', 'core', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['coluna']),
('Rotação Torácica', 'core', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['coluna_toracica']),
('Alongamento Piriforme', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['gluteos', 'piriforme']),
('Mobilidade Quadril 90/90', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['quadril']),
('Alongamento Flexores de Quadril', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['flexores_quadril']),
('World Greatest Stretch', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['quadril', 'coluna', 'posterior']),
('Alongamento de Panturrilha', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['panturrilha']),
('Alongamento de Posterior de Coxa', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['posterior']),
('Alongamento de Quadríceps', 'pernas', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['quadriceps']),
('Alongamento de Peitoral na Porta', 'peito', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['peitoral']),
('Alongamento de Ombros', 'ombros', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['deltoides']),
('Rotação de Ombros com Bastão', 'ombros', 'equipamento', 'mobilidade', 'iniciante', false, ARRAY['ombros']),
('Child Pose (Postura da Criança)', 'core', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['lombar', 'ombros']),
('Downward Dog (Cachorro Olhando para Baixo)', 'core', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['posterior', 'ombros', 'panturrilha']),
('Cobra', 'core', 'peso_corporal', 'mobilidade', 'iniciante', false, ARRAY['abdominais', 'coluna']);

-- ============================================
-- CONQUISTAS INICIAIS
-- ============================================

INSERT INTO fitness_achievements (nome, descricao, icone, categoria, pontos, criterio) VALUES
-- Conquistas de Streak
('Primeiro Passo', 'Complete seu primeiro treino', 'trophy', 'treino', 10, '{"treinos_completos": 1}'),
('Semana Perfeita', 'Complete 7 dias seguidos de treino', 'flame', 'streak', 50, '{"streak": 7}'),
('Duas Semanas Firme', 'Complete 14 dias seguidos de treino', 'fire', 'streak', 100, '{"streak": 14}'),
('Mês de Foco', 'Complete 30 dias seguidos de treino', 'crown', 'streak', 200, '{"streak": 30}'),
('Trimestre Dedicado', 'Complete 90 dias seguidos de treino', 'star', 'streak', 500, '{"streak": 90}'),
('Um Ano de Transformação', 'Complete 365 dias seguidos de treino', 'gem', 'streak', 1000, '{"streak": 365}'),

-- Conquistas de Hidratação
('Hidratado', 'Atinja a meta de água por 7 dias seguidos', 'droplet', 'agua', 30, '{"agua_streak": 7}'),
('Fonte de Vida', 'Atinja a meta de água por 30 dias seguidos', 'droplets', 'agua', 100, '{"agua_streak": 30}'),

-- Conquistas de Alimentação
('Máquina de Comer', 'Registre todas as refeições por 7 dias', 'utensils', 'alimentacao', 30, '{"alimentacao_streak": 7}'),
('Nutrição em Dia', 'Atinja suas metas de macros por 7 dias', 'apple', 'alimentacao', 50, '{"macros_ok_streak": 7}'),
('Mestre da Nutrição', 'Atinja suas metas de macros por 30 dias', 'salad', 'alimentacao', 200, '{"macros_ok_streak": 30}'),

-- Conquistas de Recordes Pessoais
('Primeiro PR', 'Bata seu primeiro recorde pessoal', 'medal', 'pr', 25, '{"prs": 1}'),
('5 PRs', 'Bata 5 recordes pessoais', 'medal', 'pr', 50, '{"prs": 5}'),
('10 PRs', 'Bata 10 recordes pessoais', 'medal', 'pr', 100, '{"prs": 10}'),
('25 PRs', 'Bata 25 recordes pessoais', 'trophy', 'pr', 200, '{"prs": 25}'),
('50 PRs', 'Bata 50 recordes pessoais', 'crown', 'pr', 500, '{"prs": 50}'),

-- Conquistas de Progresso
('Selfie Fitness', 'Tire sua primeira foto de progresso', 'camera', 'treino', 15, '{"fotos": 1}'),
('Diário Visual', 'Tire 10 fotos de progresso', 'images', 'treino', 50, '{"fotos": 10}'),
('Check-in Completo', 'Faça o check-in diário por 7 dias', 'clipboard', 'treino', 25, '{"checkin_streak": 7}'),

-- Conquistas de Sono
('Dorminhoco Saudável', 'Durma 7+ horas por 7 dias seguidos', 'moon', 'treino', 40, '{"sono_streak": 7}'),
('Mestre do Sono', 'Durma 7+ horas por 30 dias seguidos', 'bed', 'treino', 150, '{"sono_streak": 30}'),

-- Conquistas de Treino
('10 Treinos', 'Complete 10 treinos', 'dumbbell', 'treino', 30, '{"treinos_completos": 10}'),
('50 Treinos', 'Complete 50 treinos', 'dumbbell', 'treino', 100, '{"treinos_completos": 50}'),
('100 Treinos', 'Complete 100 treinos', 'trophy', 'treino', 250, '{"treinos_completos": 100}'),
('500 Treinos', 'Complete 500 treinos', 'crown', 'treino', 750, '{"treinos_completos": 500}'),
('1000 Treinos', 'Complete 1000 treinos', 'gem', 'treino', 1500, '{"treinos_completos": 1000}'),

-- Conquistas de Peso
('Primeira Balança', 'Registre seu peso pela primeira vez', 'scale', 'peso', 10, '{"registros_peso": 1}'),
('Monitoramento Semanal', 'Registre seu peso toda semana por 4 semanas', 'chart', 'peso', 40, '{"semanas_peso": 4}'),
('Meta de Peso', 'Atinja sua meta de peso', 'target', 'peso', 500, '{"meta_peso_atingida": true}'),

-- Conquistas Especiais
('Madrugador', 'Treine antes das 6h da manhã 10 vezes', 'sunrise', 'treino', 75, '{"treinos_madruga": 10}'),
('Guerreiro do Fim de Semana', 'Treine em 10 fins de semana', 'calendar', 'treino', 50, '{"treinos_fds": 10}'),
('Explorador', 'Experimente 20 exercícios diferentes', 'compass', 'treino', 60, '{"exercicios_diferentes": 20}'),
('Equilibrado', 'Treine todos os grupos musculares em uma semana', 'balance', 'treino', 40, '{"grupos_semana": true}');
