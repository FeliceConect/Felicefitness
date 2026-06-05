-- Feature: respostas a comentários no feed (threading de 1 nível, estilo Instagram)
-- Adiciona parent_comment_id em fitness_community_comments.
-- Respostas apontam para o comentário de 1º nível (o app/API achatam profundidade >1).
-- Idempotente: roda duas vezes sem erro. RLS já cobre a tabela (mesmas policies).

BEGIN;

ALTER TABLE fitness_community_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID
    REFERENCES fitness_community_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON fitness_community_comments(parent_comment_id);

COMMIT;

-- NOTIFY pgrst, 'reload schema';
