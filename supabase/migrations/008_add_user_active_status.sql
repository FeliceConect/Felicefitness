-- FeliceFit - Migration 008: Adicionar status ativo/inativo aos usuários
-- Execute este arquivo no Supabase SQL Editor

-- Adicionar coluna is_active na tabela fitness_profiles
ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Adicionar coluna deactivated_at para registrar quando foi desativado
ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para buscar usuários ativos
CREATE INDEX IF NOT EXISTS idx_fitness_profiles_is_active
ON fitness_profiles(is_active);

-- Atualizar todos os usuários existentes como ativos
UPDATE fitness_profiles
SET is_active = TRUE
WHERE is_active IS NULL;
