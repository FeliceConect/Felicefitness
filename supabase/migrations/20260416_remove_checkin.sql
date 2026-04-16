-- Remove a feature de check-in de bem-estar do app
-- Contexto: check-in foi removido da UI; este migration limpa dados e metadata órfãos.

-- 1) Apaga reações e comentários dos posts check_in (FKs sem ON DELETE CASCADE)
DELETE FROM fitness_community_reactions
 WHERE post_id IN (SELECT id FROM fitness_community_posts WHERE post_type = 'check_in');

DELETE FROM fitness_community_comments
 WHERE post_id IN (SELECT id FROM fitness_community_posts WHERE post_type = 'check_in');

-- 2) Apaga posts do feed do tipo check_in (não são mais renderizados pela UI)
DELETE FROM fitness_community_posts WHERE post_type = 'check_in';

-- 3) Apaga transações de pontos do action 'wellness_checkin' (não mais concedidos)
DELETE FROM fitness_point_transactions WHERE reason = 'Check-in de bem-estar';

-- 4) Apaga a tabela de check-ins de bem-estar (não há mais UI para escrever/ler)
DROP TABLE IF EXISTS fitness_wellness_checkins CASCADE;
