# Deploy da Revisão do Módulo Alimentação — Guia de Migrations e Testes

**Data:** 20/07/2026 · Commits das fases 1-5 na main.

## ⚠️ ORDEM OBRIGATÓRIA: migrations ANTES do deploy

O Supabase é self-hosted (supabase.feliceconect.com.br) — as migrations rodam manualmente (SQL Editor ou psql), **nesta ordem exata**, ANTES de fazer o deploy do código na Vercel. O código tem fallbacks defensivos (funciona sem as migrations, voltando ao comportamento antigo), mas as features novas só ligam com elas aplicadas.

```
1. supabase/migrations/20260720_fase1_alimentacao_fixes.sql   (favoritos, FK de meal_items, micros)
2. supabase/migrations/20260720_fase2_search_infra.sql        (pg_trgm, unaccent, RPC de busca, aliases, misses)
3. supabase/migrations/20260720_fase2_nome_popular_data.sql   (~6.2k UPDATEs — ~1-2 min)
4. supabase/migrations/20260720_fase2_categorias_data.sql     (~1.9k UPDATEs)
5. supabase/migrations/20260720_fase2_porcoes_data.sql        (~4k UPDATEs)
6. supabase/migrations/20260720_fase3_registro.sql            (modelos, moderação, XP sem refeição pulada)
7. supabase/migrations/20260720_fase4_aderencia.sql           (plan_meal_id, adherence_status, is_training_day_only)
```

### Antes de rodar (backup)

```sql
-- Backup rápido da tabela que recebe updates em massa
CREATE TABLE backup_global_foods_20260720 AS SELECT * FROM fitness_global_foods;
```

Para reverter os dados da fase 2 se algo sair estranho:
```sql
UPDATE fitness_global_foods g
SET nome_popular = NULL, nome_popular_busca = NULL,
    categoria = b.categoria, porcoes_comuns = b.porcoes_comuns
FROM backup_global_foods_20260720 b WHERE b.id = g.id;
```

### Observações por migration

- **Fase 1**: o `DROP CONSTRAINT IF EXISTS fitness_meal_items_food_id_fkey` assume o nome padrão do Postgres. Confirme depois que a FK sumiu:
  ```sql
  SELECT conname FROM pg_constraint
  WHERE conrelid = 'fitness_meal_items'::regclass AND contype = 'f';
  -- não deve listar constraint sobre food_id; se listar, rode:
  -- ALTER TABLE fitness_meal_items DROP CONSTRAINT <nome_listado>;
  ```
- **Fase 2 infra**: `CREATE EXTENSION` exige superuser (postgres) — no SQL Editor do Supabase Studio funciona. Se `unaccent`/`word_similarity` reclamarem de função inexistente ao testar o RPC, as extensões foram para o schema `extensions` — rode:
  ```sql
  ALTER FUNCTION fitness_search_foods(TEXT[], TEXT, TEXT[], INTEGER, INTEGER)
    SET search_path = public, extensions;
  ```
- **Teste rápido pós-fase 2**:
  ```sql
  SELECT nome_popular, categoria FROM fitness_search_foods(ARRAY['pao de queijo'], NULL, NULL, 5, 0);
  SELECT nome_popular FROM fitness_search_foods(ARRAY['frnago'], NULL, NULL, 5, 0);  -- typo proposital: deve achar frango
  ```

Depois: **deploy na Vercel** (push já feito; promover/aguardar o deploy da main).

---

## Roteiro de teste manual (para você e a equipe)

### Como paciente (app)

1. **Busca melhor** — Alimentação → refeição nova → buscar:
   - "pão de queijo" → nome limpo "Pão de queijo assado" (nome técnico em cinza embaixo)
   - "frnago" (errado de propósito) → ainda acha frango
   - "arroz" → itens com porções tipo "1 escumadeira (90g)" no seletor de porção
   - Categorias → Suplementos → não deve mais ter comida aleatória no meio
2. **Favoritos e recentes** — favoritar um alimento TACO (estrela) → sair, voltar → deve continuar nos Favoritos. Adicionar um alimento, recarregar a página → deve continuar nos Recentes.
3. **Repetir/Modelos** — registrar um almoço → amanhã (ou trocando o tipo) a tela nova mostra "Repetir última...". Marcar "Salvar como modelo" ao salvar → aparece nos Atalhos.
4. **Texto livre com IA** — Alimentação → Analisar → aba "✍️ Descrever" → "2 pães franceses na chapa com manteiga e café com leite" → confere alimentos/macros → salvar.
5. **Foto com IA** — analisar um prato → expandir alimentos → **editar as gramas de um item** → kcal/macros devem reescalar sozinhos. O contador "X/30" aparece antes de analisar.
6. **Plano da nutri** — no card do plano:
   - "Comi" → refeição marcada Feita (sem recarregar a página inteira)
   - "Troquei algum item" → abre a refeição já preenchida com os itens do plano; troque um e salve
   - "Pulei" → badge "Pulada"; os macros do dia NÃO sobem; não ganha pontos
7. **Código de barras** — na busca, ícone de código de barras → escanear um produto (ou digitar o EAN) → produto do Open Food Facts aparece.
8. **Alimento que não existe** — buscar algo inexistente → "Adicionar manualmente" → salvar sem calorias deve pedir confirmação.

### Como nutricionista (portal)

9. **Moderação** — Portal → Nutrição → botão "🍎 Alimentos" → o alimento criado no passo 8 está lá → editar nome/categoria → Aprovar → buscar no app como paciente: agora aparece para todos.
10. **Aderência** — Portal → paciente → aba Plano Alimentar → card "Aderência ao plano (7 dias)": os passos 6 devem aparecer como seguiu / substituiu / pulou, com o que foi comido nas substituições.
11. **Editor** — editar um plano → adicionar/editar alimento → novo campo "Grupo escolher 1" (dois itens com o grupo "Proteína" viram opção de escolha para o paciente).

### Verificações de banco (1 semana depois)

```sql
-- O que os pacientes buscaram e não acharam (backlog de alimentos/aliases):
SELECT query, COUNT(*) FROM fitness_food_search_misses
GROUP BY query ORDER BY 2 DESC LIMIT 30;

-- Aderência preenchida pelo cron (segunda-feira):
SELECT * FROM fitness_meal_plan_adherence ORDER BY date DESC LIMIT 20;

-- Custo de IA no mês:
SELECT COUNT(*), ROUND(SUM(cost_usd)::numeric, 2) AS usd
FROM fitness_api_usage WHERE feature = 'meal_analysis'
AND created_at >= date_trunc('month', now());
```

## O que ficou de fora (decisões)

- **Fotos das análises IA não são salvas** (decisão: não encher o storage). Se a nutri sentir falta, dá para salvar thumbnail comprimido com retenção de 30 dias.
- Nome popular/categorias/porções foram gerados por **regras determinísticas** (script `scripts/generate-food-improvements.mjs`), não por IA — revisáveis e regeneráveis. Refinar com IA depois é opcional.
- O modelo da análise segue **gpt-4o**; custo logado em `fitness_api_usage` (limite 30/mês/paciente agora aplicado de verdade).
