# Importar micronutrientes para alimentos da TBCA

Pipeline para popular `fitness_global_foods` com **ferro, colesterol, zinco, selênio e magnésio**. Sódio já vem dos seeds originais; estas 5 colunas chegaram em 2026-05-03 e começam vazias.

## Quem precisa: a nutricionista

Os micros aparecem **apenas no editor de plano alimentar** (`/portal/nutrition/[id]`), na seção "Resumo do dia → Micronutrientes". O paciente não vê. Se o alimento não tem dado preenchido, entra como zero (transparente, com aviso na UI).

## Status — TACO já importada (2026-05-03)

A migration `20260503_food_micronutrients_data_taco.sql` traz **580 alimentos básicos brasileiros** (TACO 4ª edição da UNICAMP) já populados com **ferro, colesterol, zinco e magnésio**. Selênio fica `null` (TACO não mede). Para aplicar: rodar o SQL no Supabase SQL editor.

URL oficial da TACO (caso precise rebaixar):
https://www.nepa.unicamp.br/publicacoes/tabela-taco/

## Caminhos para mais cobertura

### TBCA completa (~6300 alimentos, inclui selênio)

A TBCA (USP/FCF) **não publica download programático** — verificado: nem URL fixo de Excel, nem API. Quem precisa da base completa solicita por e-mail ao time da TBCA (finalidade clínica/acadêmica).

Quando tiver o arquivo, exporte um CSV com este cabeçalho:

```
source_id,ferro,colesterol,zinco,selenio,magnesio
```

- `source_id`: código da TBCA (ex: `C0066C`) — precisa bater com `fitness_global_foods.source_id`
- `ferro` / `colesterol` / `zinco` / `magnesio`: **mg por 100g**
- `selenio`: **µg por 100g** (microgramas)
- Vazio, `NA`, `Tr`, `nd`, `-` viram `NULL`
- Aceita vírgula ou ponto como separador decimal

E rode:

```bash
node scripts/import-tbca-micros.mjs arquivo-tbca.csv --source=tbca
```

### Preencher manual (focado no que a nutri usa)

A nutri abre `tbca-micros-template.csv`, pega no Excel/Numbers e preenche **N alimentos** que usa muito. Consulta valores na TBCA online (tbca.net.br) ou TACO (UNICAMP). Mesmo formato + mesmo script.

## Como rodar o import

```bash
node scripts/import-tbca-micros.mjs caminho/do/arquivo.csv [--source=tbca|taco] [--out=arquivo.sql]
```

- `--source` default `tbca`. Use `taco` quando o CSV for da TACO da UNICAMP (IDs numéricos `1..N`).
- `--out` default `supabase/migrations/20260503_food_micronutrients_data.sql`.

O script:

1. Parseia o CSV (vírgula ou ponto-e-vírgula, aspas duplas com escape `""`)
2. Pula linhas sem `source_id` ou sem nenhum micro preenchido
3. Gera SQL com `UPDATE fitness_global_foods SET ... WHERE source = '<source>' AND source_id = '...'` em batches de 500 (cada batch em `BEGIN/COMMIT`)
4. Imprime um relatório (linhas lidas, updates gerados, pulados)

## Aplicar o SQL

Revise o arquivo gerado (especialmente o número de updates) e rode no **Supabase SQL Editor** ou via `psql`. É idempotente — pode rodar de novo sem efeito colateral.

## Validação após o import

No editor da nutri (`/portal/nutrition/[id]`), abra qualquer plano com refeições. A seção "Micronutrientes" no resumo do dia deve mostrar valores em vez de tudo zero. Alimentos com dado faltando entram silenciosamente como zero — a nota "Alimentos sem registro entram como zero — não significa ausência real" cobre esse caso.
