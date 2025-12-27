-- FeliceFit - Migration 009: Adicionar nome de exibição e foto para profissionais
-- Execute este arquivo no Supabase SQL Editor

-- Adicionar coluna display_name na tabela fitness_professionals
ALTER TABLE fitness_professionals
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Adicionar coluna avatar_url para foto do profissional
ALTER TABLE fitness_professionals
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN fitness_professionals.display_name IS 'Nome de exibição do profissional para os clientes';
COMMENT ON COLUMN fitness_professionals.avatar_url IS 'URL da foto do profissional';

-- Atualizar profissionais existentes com o nome e avatar do perfil (se disponível)
UPDATE fitness_professionals fp
SET
  display_name = COALESCE(fp.display_name, (SELECT nome FROM fitness_profiles WHERE id = fp.user_id)),
  avatar_url = COALESCE(fp.avatar_url, (SELECT avatar_url FROM fitness_profiles WHERE id = fp.user_id))
WHERE fp.display_name IS NULL OR fp.avatar_url IS NULL;
