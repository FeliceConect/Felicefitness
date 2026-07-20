-- FASE 2 — porções caseiras para alimentos que só tinham 100g.
-- Gerado por scripts/generate-food-improvements.mjs (regras por palavra-chave,
-- baseadas no Dicionário de Medidas Caseiras / Guia Alimentar).
-- Idempotente: só preenche onde porcoes_comuns IS NULL.
-- Parte 6/6 (4 statements)

CREATE INDEX IF NOT EXISTS idx_global_foods_source_lookup ON fitness_global_foods(source, source_id);

UPDATE fitness_global_foods SET porcoes_comuns = '[{"label":"1 fatia pequena (60g)","grams":60},{"label":"1 fatia média (90g)","grams":90,"isDefault":true}]'::jsonb WHERE source = 'tbca' AND source_id = 'C0895A' AND porcoes_comuns IS NULL;
UPDATE fitness_global_foods SET porcoes_comuns = '[{"label":"1 bife pequeno (80g)","grams":80},{"label":"1 bife médio (120g)","grams":120,"isDefault":true},{"label":"1 bife grande (180g)","grams":180}]'::jsonb WHERE source = 'tbca' AND source_id = 'C0160F' AND porcoes_comuns IS NULL;
UPDATE fitness_global_foods SET porcoes_comuns = '[{"label":"1 unidade (50g)","grams":50,"isDefault":true},{"label":"meia unidade (25g)","grams":25},{"label":"2 unidades (100g)","grams":100}]'::jsonb WHERE source = 'tbca' AND source_id = 'C1158A' AND porcoes_comuns IS NULL;
UPDATE fitness_global_foods SET porcoes_comuns = '[{"label":"2 colheres de sopa (50g)","grams":50},{"label":"4 colheres de sopa (100g)","grams":100,"isDefault":true}]'::jsonb WHERE source = 'tbca' AND source_id = 'C0912B' AND porcoes_comuns IS NULL;
