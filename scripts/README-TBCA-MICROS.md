# Importar micronutrientes para alimentos da TBCA

Pipeline para popular `fitness_global_foods` com **ferro, colesterol, zinco, selênio e magnésio**. Sódio já vem dos seeds originais; estas 5 colunas chegaram em 2026-05-03 e começam vazias.

## Quem precisa: a nutricionista

Os micros aparecem **apenas no editor de plano alimentar** (`/portal/nutrition/[id]`), na seção "Resumo do dia → Micronutrientes". O paciente não vê. Se o alimento não tem dado preenchido, entra como zero (transparente, com aviso na UI).

## Caminhos para popular os dados

### Caminho A — TBCA completa (oficial, ~6300 alimentos)

A TBCA (USP/FCF) **não publica download programático**. Quem tem acesso à versão Excel oficial precisa exportar para CSV com estas colunas exatas (cabeçalho na primeira linha):

```
source_id,ferro,colesterol,zinco,selenio,magnesio
```

- `source_id`: código da TBCA (ex: `C0066C`) — precisa bater com o que está em `fitness_global_foods.source_id` para o `UPDATE` encontrar a linha
- `ferro` / `colesterol` / `zinco` / `magnesio`: em **mg por 100g**
- `selenio`: em **µg por 100g** (microgramas — TBCA usa essa unidade pra Se)
- Vazio, `NA`, `Tr` (traços), `nd`, `-` viram `NULL`
- Aceita vírgula ou ponto como separador decimal

### Caminho B — preencher só os mais usados (rápido, focado)

A nutri abre o arquivo `tbca-micros-template.csv`, pega no Excel/Numbers e preenche **30-50 alimentos** que ela mais usa nos cardápios. Mesmo formato. Ela consulta os valores na TBCA online (tbca.net.br) ou na TACO (UNICAMP).

Tradeoff: cobertura menor, mas valida a feature pros casos reais antes de investir nos 6000+ restantes.

## Como rodar o import

Depois que tiver o CSV pronto:

```bash
node scripts/import-tbca-micros.mjs caminho/do/arquivo.csv
```

Saída por padrão: `supabase/migrations/20260503_food_micronutrients_data.sql`. O script:

1. Parseia o CSV
2. Pula linhas sem `source_id` ou sem nenhum micro preenchido
3. Gera SQL com `UPDATE fitness_global_foods SET ferro=..., colesterol=...` em batches de 500 (cada batch envolto em `BEGIN/COMMIT` — se um batch falhar, os outros seguem)
4. Imprime um relatório (linhas lidas, updates gerados, pulados)

Pra mudar o nome de saída:

```bash
node scripts/import-tbca-micros.mjs entrada.csv --out=supabase/seed-tbca-micros.sql
```

## Aplicar o SQL

Revise o arquivo gerado (especialmente o número de updates) e rode no **Supabase SQL Editor** ou via `psql`. É idempotente — pode rodar de novo sem efeito colateral.

## Validação após o import

No editor da nutri (`/portal/nutrition/[id]`), abra qualquer plano com refeições. A seção "Micronutrientes" no resumo do dia deve mostrar valores em vez de tudo zero. Alimentos com dado faltando entram silenciosamente como zero — a nota "Alimentos sem registro entram como zero — não significa ausência real" cobre esse caso.
