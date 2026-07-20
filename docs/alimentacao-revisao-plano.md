# Revisão Completa — Módulo Alimentação (Complexo Wellness)

**Data:** 20/07/2026
**Contexto:** pacientes reclamam que registrar alimentação fora do plano prescrito é complicado — os alimentos são difíceis de achar na busca e muitos não existem no app. A análise por foto com IA é bem avaliada, mas tem pontos de melhoria. Este documento consolida o diagnóstico técnico completo e o planejamento de correção.

---

## 1. Diagnóstico

### 1.1 Por que "não acho o alimento" — a busca é o maior gargalo

A busca em produção (`app/api/foods/route.ts`) funciona assim:

- **Sem tolerância a erro de digitação.** É `ILIKE '%token%'` puro via PostgREST. Não existe `pg_trgm`, `unaccent` (no banco), full-text search nem índice GIN — confirmado em todas as migrations. Digitou "frnago" ou "iorgute" → zero resultados.
- **Índice inútil.** `idx_global_foods_nome_busca` é B-tree, que não acelera `ILIKE '%...%'`. Toda busca é um sequential scan (com `.limit(500)` por termo), com ranking e paginação feitos em JS na API.
- **Sinônimos hardcoded.** Há um dicionário `ALIASES` com ~40-50 entradas no código ("arroz branco"→"arroz, tipo 1"). Fora dele, o paciente precisa adivinhar a nomenclatura técnica.
- **Nomenclatura TACO/TBCA crua na tela.** O banco tem ~6.239 alimentos (TACO 597 + TBCA 5.643 + ~13 suplementos manuais). Os nomes são técnicos: `'Mexerica, ´Rio´, in natura, Citrus reticulata,'`, `'Falafel, c/ grão de bico, frito, c/ sal, (grão de bico, cebola, ...)'`. O paciente vê isso literalmente nos resultados.
- **Categorias TBCA erradas.** O auto-mapeamento de categoria do seed errou muito: anchova → `condimento`, pão de queijo → `vegetal`, papa de carne → `suplemento`. O filtro por categoria da UI está quebrado na prática (688 itens em "suplemento", a maioria não é).
- **90% do banco sem porção caseira.** Só um subconjunto do TACO (115 padrões de UPDATE) tem `porcoes_comuns` ("1 fatia", "1 colher de sopa"). Todos os 5.643 itens TBCA só têm 100g — o paciente precisa saber gramas de cabeça.
- **Sem industrializados/marcas.** Zero códigos de barras no seed, nenhuma barra de proteína, marcas só nos 13 suplementos manuais. O Open Food Facts só entra via rota de barcode (`app/api/foods/barcode/route.ts`) que **não está ligada à UI** do fluxo de registro (botões "Escanear rótulo"/"Código de barras" são placeholders inertes em `alimento/novo/page.tsx:122-137`).

### 1.2 Fricções do registro manual (`refeicao/nova`)

Fluxo atual: escolher tipo → buscar alimento (2+ chars, debounce 300ms) → tocar no resultado → ajustar porção no bottom-sheet → "Adicionar" → repetir por item → "Salvar". ~4 cliques + digitação para 1 alimento, +2 cliques por item extra.

- **Sem "repetir refeição de ontem", sem duplicar, sem templates.** Quem come o mesmo café da manhã todo dia remonta tudo item a item. A interface `MealTemplate` existe em `lib/nutrition/types.ts:140-147` mas é um tipo órfão, nunca usado.
- **Favoritos só para alimentos próprios.** `toggleFavorite` só age em `fitness_user_foods`; é impossível favoritar um alimento TACO/TBCA — mas a UI mostra o botão, dando falsa impressão (`hooks/use-foods.ts:308-346`).
- **Recentes somem no reload.** IDs ficam no localStorage mas o objeto `Food` global fica só em memória; após recarregar, recentes de alimentos globais desaparecem da lista (`use-foods.ts:349-373`).
- **Substituir 1 item do plano = reconstruir a refeição inteira.** Se o plano diz "frango + arroz + salada" e o paciente trocou só o arroz por batata, não há como editar o prato do plano: ou marca "Comi" (mentindo), ou monta a refeição do zero item a item.
- **`window.location.reload()`** após concluir refeição do plano (`alimentacao/page.tsx:55`) — pisca a tela e perde estado.
- Salvamento de itens em loop sem transação, com erros engolidos (`use-daily-meals.ts:251-254`) — refeição pode salvar com itens faltando silenciosamente.
- Metas nutricionais ainda hardcoded do Leonardo em parte do fluxo (`use-daily-meals.ts:148`, `historico/page.tsx`).
- Alimento manual criado pelo paciente é gravado com `source: 'ai_analysis'` (bug em `app/api/user-foods/route.ts:111`) e **não realimenta o banco global** — cada paciente recria os mesmos itens.

### 1.3 Análise por foto com IA (`analisar` + `api/meals/analyze`)

O que está bom: fluxo em tela única, compressão client-side (1600px/0.82 → ~300-600KB), resultado editável (nome, gramas, macros, adicionar/remover), custo logado em `fitness_api_usage` (~US$0,005-0,015/análise com GPT-4o).

Problemas encontrados:

1. **BUG CRÍTICO — limite de 15/mês nunca é aplicado.** A rota conta análises filtrando `fitness_meals.analise_ia IS NOT NULL` (`analyze/route.ts:36-44`), mas o save **nunca grava `analise_ia`** (`use-daily-meals.ts` só grava `notas`). O contador é sempre ~0 → quota infinita → risco de custo/abuso. O contador "X de 15" na UI também fica errado.
2. **Ajustar gramas não reescala macros.** O paciente corrige 150g→80g e as calorias continuam as de 150g até editar na mão (`analisar/page.tsx:646-660`).
3. **Parsing frágil, sem retry, sem timeout.** Pede "JSON válido" por prompt e faz `JSON.parse` manual — sem `response_format: json_schema`/tool use, sem retentativa em erro transitório, sem `maxDuration` na rota.
4. **Itens da IA ficam órfãos.** `food_id: 'ai-N'` vira `null` no banco — nenhum vínculo com a base de alimentos, sem reaproveitamento.
5. **Foto é descartada.** Nenhum `foto_url` é salvo; o paciente não pode rever a imagem depois (e a nutri também não — perda clínica relevante).
6. **Não existe registro por texto livre.** "Descreva o que você comeu" sem foto não existe — a IA só atua sobre foto. É a lacuna mais estratégica: resolveria o "não acho o alimento" de forma definitiva.
7. Menores: quota só aparece após a 1ª análise; corrida se clicar "Analisar" antes do base64 carregar; sem cap de payload no servidor; mime forçado `image/jpeg`; categoria não editável; UX de espera é só um spinner 5-15s.

### 1.4 Plano da nutri e aderência — o dado que o ranking usa não é aderência

- **"Feita" ≠ "seguiu o plano".** Qualquer `fitness_meals` do mesmo `tipo_refeicao` na data marca a refeição do plano como concluída (`complete/route.ts:172-259` + `meal-plan-card.tsx:324`). Um lanche qualquer registrado como "Almoço" conta como aderência.
- **Aderência semanal = contagem de registros.** O cron (`cron/weekly-adherence/route.ts`) dá 10pts se ≥6 dias da semana tiveram ≥3 refeições registradas. Nada compara com o cardápio prescrito. A tabela `fitness_meal_plan_adherence` (feita para isso) **nunca é preenchida em produção** — só em seeds de demo.
- **Grupos "escolher 1" só nascem via importação por IA.** O editor manual da nutri não expõe o campo `group` — impossível criar "frango OU peixe" do zero pelo editor (`portal/nutrition/[id]/page.tsx`, modais sem o campo).
- **Sem refeição parcial, sem "pulei", sem refeição livre.** Não registrar é a única saída, o que pune aderência mesmo quando o pulo foi orientado pela nutri.
- **`is_training_day_only` é cosmético.** O save não persiste o flag e `getTodayMeals` não filtra — badge "Dia de Treino" não muda nada.
- Importação por IA replica o mesmo cardápio nos 7 dias; variação exige edição manual.

### 1.5 Resumo dos bugs a corrigir independentemente do redesign

| # | Bug | Arquivo | Gravidade |
|---|-----|---------|-----------|
| 1 | Rate-limit IA (15/mês) nunca aplicado | `api/meals/analyze/route.ts` + save | 🔴 custo |
| 2 | Gramas editadas não reescalam macros (IA) | `analisar/page.tsx` | 🔴 dados errados |
| 3 | Alimento manual gravado como `ai_analysis` | `api/user-foods/route.ts:111` | 🟡 |
| 4 | Favoritar global não funciona mas UI mostra botão | `use-foods.ts` | 🟡 |
| 5 | Recentes globais somem no reload | `use-foods.ts` | 🟡 |
| 6 | Inserts de itens sem transação, erros engolidos | `use-daily-meals.ts` | 🟡 |
| 7 | Metas hardcoded (Leonardo) no histórico/hook | `use-daily-meals.ts`, `historico/` | 🟡 |
| 8 | `window.location.reload()` pós-"Comi" | `alimentacao/page.tsx:55` | 🟢 |
| 9 | Micros mapeados de colunas inexistentes em user_foods | `api/foods/route.ts:277-281` | 🟢 |

---

## 2. Planejamento por fases

### FASE 1 — Bugs críticos e quick wins (2-3 dias)

Nenhuma mudança de UX visível; estanca custo e dados errados.

| Tarefa | Detalhe | Esforço |
|--------|---------|---------|
| 1.1 Corrigir rate-limit da IA | Contar por `fitness_api_usage` (já registra toda análise) em vez de `fitness_meals.analise_ia`; mostrar quota antes da 1ª análise | P |
| 1.2 Reescalar macros ao editar gramas | Guardar macros-base por 100g de cada item da IA e recalcular proporcionalmente | P |
| 1.3 Robustecer rota analyze | `response_format: json_schema` (structured output), 1 retry em erro transitório, `maxDuration: 60`, cap de payload no servidor | P |
| 1.4 Corrigir `source` do alimento manual | Respeitar o `source` enviado pelo client | P |
| 1.5 Favoritos para alimentos globais | Nova tabela `fitness_food_favorites (user_id, food_id, source)` com RLS; UI já existe | M |
| 1.6 Recentes persistentes | Guardar snapshot do alimento (não só o id) no localStorage, ou tabela `fitness_food_recents` | P |
| 1.7 Remover `window.location.reload()` | Invalidar queries do React Query | P |
| 1.8 Transação nos itens da refeição | Insert em lote (um array) em vez de loop; falha → rollback da refeição | P |

**Migração necessária:** tabela de favoritos (rodar manualmente ANTES do deploy — Supabase self-hosted).

### FASE 2 — Busca que encontra (1 semana) ← ataca a queixa principal

| Tarefa | Detalhe | Esforço |
|--------|---------|---------|
| 2.1 Fuzzy search no Postgres | Migração: extensões `pg_trgm` + `unaccent`; índice GIN trigram em `nome_busca`; RPC `search_foods(query)` com `similarity()` + ranking no SQL (prefixo > popularidade > similaridade). Elimina o scan + rerank em JS e tolera erros de digitação | M |
| 2.2 Nome popular (display name) | Coluna `nome_popular` em `fitness_global_foods`. Gerar via IA em batch para os 6.239 itens ("Pão, de queijo, assado" → "Pão de queijo") com revisão amostral; buscar em ambos, exibir o popular | M |
| 2.3 Recategorizar TBCA | Script one-off com IA para reclassificar os 5.643 TBCA (corrigir pão de queijo="vegetal" etc.); conserta o filtro por categoria | M |
| 2.4 Porções caseiras em escala | Gerar `porcoes_comuns` via IA para os ~500-1000 alimentos mais prováveis de uso (priorizar por logs de `fitness_meal_items.nome_alimento`); revisão da nutri | M |
| 2.5 Aliases no banco | Tabela `fitness_food_aliases` (alimentável pela equipe/admin) substituindo o dicionário hardcoded; seed com os atuais + os termos que os pacientes buscam sem resultado | P |
| 2.6 Log de buscas sem resultado | Gravar `query` quando retorna vazio → vira backlog de aliases/alimentos faltantes. É o termômetro real do "não tem no app" | P |
| 2.7 Ranking por popularidade | Coluna `times_used` incrementada no log de refeição; usar no ranking da busca | P |

**Migrações:** extensões + índices + colunas + 2 tabelas novas + updates em massa (nome_popular, categorias, porções). Rodar em janela controlada, manualmente, antes do deploy.

### FASE 3 — Registrar sem dor (1-1,5 semana) ← maior impacto de UX

| Tarefa | Detalhe | Esforço |
|--------|---------|---------|
| 3.1 **Registro por texto livre com IA** | "Escreva o que comeu" ("2 pães na chapa e café com leite") → mesma pipeline da foto, sem foto. Reusa a rota analyze com input texto. Resolve de vez o "não acho o alimento" para quem não quer fotografar | M |
| 3.2 Repetir refeição | "Repetir de ontem" / "Repetir última {tipo}" com 1 toque na tela de nova refeição (busca última `fitness_meals` do mesmo tipo e pré-carrega itens) | M |
| 3.3 Refeições salvas (templates do paciente) | "Salvar como favorita" ao registrar; lista "Minhas refeições" no topo da tela de registro. Usar o tipo `MealTemplate` órfão como base | M |
| 3.4 Substituição pontual no plano | "Editar este prato": abre a refeição do plano pré-preenchida, paciente troca/remove só o que mudou e salva. Gravar quais itens vieram do plano vs substituídos (base para aderência real da Fase 4) | M/G |
| 3.5 Marcar "pulei esta refeição" | Estado explícito (não penaliza silenciosamente; dado clínico para a nutri) | P |
| 3.6 Ligar o barcode scanner | A rota `/api/foods/barcode` + Open Food Facts já existem; conectar o botão da UI (câmera via `BarcodeDetector` com fallback) | M |
| 3.7 Promover alimentos customizados ao banco global | Fila de moderação (nutri/superadmin aprova) → item vira global com nome popular. O banco cresce com o uso real | M |

### FASE 4 — Aderência de verdade + portal da nutri (1 semana)

| Tarefa | Detalhe | Esforço |
|--------|---------|---------|
| 4.1 Vincular consumo ao plano | `fitness_meals.plan_meal_id` + status por refeição: `seguiu` / `substituiu` / `fora_do_plano` / `pulou` (a Fase 3.4 já produz o dado) | M |
| 4.2 Cálculo real de aderência | Preencher `fitness_meal_plan_adherence` (tabela já existe, hoje morta) por dia: % refeições do plano seguidas + desvio calórico. Cron semanal passa a usar isso (manter regra antiga como fallback para quem não tem plano) | M |
| 4.3 Dashboard de aderência para a nutri | Por paciente: % da semana, refeições substituídas/puladas, o que comeu no lugar (com foto quando houver) | M |
| 4.4 Campo `group` no editor manual | Nutri consegue criar "frango OU peixe" sem depender da importação por IA | P |
| 4.5 `is_training_day_only` ponta a ponta | Persistir o flag e filtrar em `getTodayMeals` — ou remover o badge para não enganar | P |

### FASE 5 — IA melhor (contínuo, após Fases 1-3)

| Tarefa | Detalhe | Esforço |
|--------|---------|---------|
| 5.1 Casar itens da IA com o banco | Pós-análise, match dos nomes retornados contra a busca (agora boa, Fase 2) → `food_id` vinculado, macros da tabela em vez de estimativa | M |
| 5.2 Salvar a foto | Upload para Storage + `foto_url` em `fitness_meals`; paciente revê e a nutri vê o prato real no dashboard | M |
| 5.3 UX de espera | Etapas no loading ("Identificando alimentos…"), cancelar, quota visível antes | P |
| 5.4 Avaliar modelo/custo | Testar structured output com modelo mais barato (ou Claude via gateway) mantendo qualidade; medir com `fitness_api_usage` | P |

---

## 3. Sequência recomendada

```
Semana 1: FASE 1 inteira + migração pg_trgm (2.1) preparada
Semana 2: FASE 2 (busca + nomes populares + categorias + porções)
Semana 3: FASE 3.1-3.3 (texto livre, repetir, refeições salvas)  ← alívio imediato pros pacientes
Semana 4: FASE 3.4-3.7 (substituição no plano, barcode, moderação)
Semana 5: FASE 4 (aderência real + nutri)
Contínuo: FASE 5
```

Se for preciso escolher UMA coisa para acalmar as reclamações já: **Fase 3.1 (texto livre com IA)** — é o caminho que ignora completamente a fraqueza da busca — seguida da Fase 2.

## 4. Riscos e cuidados

- **Migrations manuais (self-hosted):** toda migração deve rodar em `supabase.feliceconect.com.br` ANTES do deploy que usa a coluna/tabela. Os updates em massa (nome_popular, categorias) devem rodar em transação com backup prévio da tabela.
- **Custo de IA nos batches:** gerar nome popular/categoria/porções para ~6k itens ≈ 6k chamadas pequenas (ou lotes de 50/chamada ≈ 120 chamadas). Estimar e logar em `fitness_api_usage` como categoria própria.
- **Não quebrar aderência/pontos existentes:** a regra atual (3 refeições/dia) continua valendo até a Fase 4 entrar; trocar a fórmula do cron só com a nova métrica validada (dedup por `reference_id` semanal já protege contra duplicação de pontos).
- **RLS:** novas tabelas (`fitness_food_favorites`, `fitness_food_recents`, `fitness_food_aliases`, moderação) com prefixo `fitness_` e RLS desde a criação.
- **Compatibilidade:** refeições antigas não têm `plan_meal_id`/status — o dashboard da nutri deve tratar histórico pré-migração como "sem classificação".

## 5. Métricas de sucesso

- % de buscas sem resultado (nova telemetria da Fase 2.6) — meta: < 5%
- Tempo médio para registrar refeição manual — meta: < 30s
- % de refeições registradas via atalho (repetir/template/texto livre) vs busca item a item
- Nº de análises IA/mês por paciente dentro da quota (agora aplicada)
- Aderência real média por paciente (Fase 4) visível para a nutri
- Reclamações de "não acho o alimento" no suporte — tendência a zero
