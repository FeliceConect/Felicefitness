-- Esconde posts antigos do feed que não têm foto.
-- A partir de agora foto é obrigatória para qualquer post (inclusive auto-gerados),
-- mas o histórico ficou com posts sem image_url. Este UPDATE remove eles do feed
-- sem apagar o registro (preserva contagem de pontos já distribuídos).

UPDATE fitness_community_posts
SET is_visible = false
WHERE image_url IS NULL
  AND is_visible = true;
