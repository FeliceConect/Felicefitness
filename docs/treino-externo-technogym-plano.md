# Treino externo (Technogym) — diagnóstico e plano

**Data:** 2026-08-13
**Origem:** Leonardo e Marinella passaram a treinar em academia terceira com aparelhos
Technogym. O treino é prescrito e executado lá, e os dados ficam no ecossistema da
Technogym. A academia informou que não transmite dados e ofereceu gerar o PDF do treino.

**Pergunta do dono:** (a) o PDF resolve? (b) como otimizar para os próximos pacientes?

---

## 1. Resposta curta

**O PDF resolve metade — e é a metade barata.**

Existem dois problemas distintos sendo tratados como um só:

| | **A. Prescrição** (a ficha) | **B. Execução** (o que foi feito) |
|---|---|---|
| O que é | Quais exercícios, séries, reps, cargas alvo | Carga real por série, reps reais, duração |
| Frequência | 1× a cada 4–6 semanas | 3–5× por semana |
| O PDF resolve? | **Sim** | **Não** |
| Quem alimenta | Academia (PDF) → import | Só o paciente, digitando no app |
| O que depende disso | Ver a ficha no app, tela de executar pronta, carga sugerida, o profissional da clínica enxergar o que o terceiro prescreveu | 15pts de treino, PR, streak, ranking, evolução de carga, gráficos |

São ~10 importações por ano contra ~200 registros de execução. **O PDF não coloca um
único ponto no ranking.** Ele vale a pena porque desbloqueia a tela de executar (que é
onde o atrito de registro cai), mas anunciar internamente como "resolvido" seria errado.

**Nenhum caminho automático traz a execução.** Isso não é limitação nossa — está
detalhado abaixo. A execução vai continuar manual, e o plano precisa ser desenhado
aceitando isso.

---

## 2. Por que a integração automática está fora de alcance

Três caminhos foram avaliados. Todos descartados, por motivos diferentes:

**a) Technogym Enterprise API / mywellness cloud API** — existe e é real
([openplatformdocs.mywellness.com](https://openplatformdocs.mywellness.com/),
[apidocs.mywellness.com](https://apidocs.mywellness.com/)). Mas o acesso é **contrato
B2B mediado pela facility** — a academia precisa ser parceira e liberar. A academia já
recusou. Sem contrato não existe credencial. *Reabrir só se a academia virar parceira
formal.*

**b) Ponte via Apple Health / Strava / Garmin** — o Technogym App realmente exporta para
essas plataformas. O problema é **o que atravessa**: o HealthKit não tem modelo de dados
para série/repetição/carga, e o Strava só recebe exercício a exercício de apps parceiros
que empurram direto — o que vem via Health chega como "Treino, 50 min, 320 kcal". Some
a isso que nosso app é **PWA: no iOS a web não acessa o HealthKit**. Custo de uma
integração inteira para receber o que o paciente digita em 15 segundos.

**c) OCR de foto do console do aparelho** — dado por aparelho, sem série e carga
confiáveis, com taxa de erro que contamina PR e histórico. Descartado.

---

## 3. O que descobrimos no nosso próprio código (muda o plano)

O levantamento encontrou cinco coisas que importam mais que a Technogym:

1. **A rota de import por IA já existiu e foi removida.**
   `app/api/training-plan/import/route.ts` é hoje um stub de 8 linhas que devolve 503. A
   versão real (376 linhas, commit `07d0826`, removida em `07c385b`) já fazia `unpdf` +
   LLM com um prompt de personal trainer que extraía semanas/dias/exercícios/séries/
   reps/descanso/regras especiais/exercícios proibidos. Recuperável com
   `git show 07d0826:app/api/training-plan/import/route.ts`.
   **A tela `app/(app)/configuracoes/importar-treino/page.tsx` continua no ar e quebra no 503.**

2. **O app não precisa de periodização — a ficha A/B/C é o formato nativo.**
   `hooks/use-workouts.ts:238` lê **só a primeira semana** do programa e rotaciona os
   dias ciclicamente. Ou seja, o que a Technogym entrega (ficha A/B/C sem semanas) é
   exatamente o que o app espera. Isso simplifica muito o import.

3. **Programa do profissional e templates próprios são mutuamente exclusivos.**
   Em `hooks/use-workouts.ts` é `if (programData) { ... } else { templates próprios }`.
   Se o Leonardo receber um programa de profissional, **os templates dele somem da tela**.
   Isso quebra o caso "treino na clínica + treino na academia" e precisa de decisão.

4. **Não existe "um programa de treino ativo por paciente".**
   `app/api/training-plan/save/route.ts:185` grava `is_active: true` e **não desativa o
   anterior**. `app/api/client/training-program/route.ts` pega o mais recente e ignora o
   resto — então o plano antigo some da tela do paciente sem ninguém ter apagado nada.
   O plano *alimentar* tem esse helper (`lib/meal-plans/ensure-single-active.ts`); o de
   treino não tem.

5. **Cardio importado vira musculação.**
   `use-workouts.ts` separa cardio pelo `set_type`/`cardio_type`, mas
   `/api/training-plan/save` **não grava** `set_type`, `cardio_type`,
   `target_duration_min`, `intensity` nem `circuit_group`. Um plano Technogym é cheio de
   cardio (Skillrow, esteira, bike): importado como está, "Skillrow 20 min" vira um
   exercício de força 3×12 e o paciente perde os 3–10pts de cardio.

**Bônus:** o superadmin não consegue abrir `/portal/training` (o gate exige
`professional.type === 'trainer'`), e `/api/training-plan/save` contorna isso criando um
`fitness_professionals` fantasma do tipo `admin` — resíduo que já gerou uma página de
limpeza no projeto.

---

## 4. Plano

### Rodada 0 — esta semana, zero linha de código

O Leonardo cadastra a ficha da Technogym como **template próprio** em
`/treino/templates/novo`: nome livre de exercício, séries, reps, descanso, carga
sugerida, dia da semana. São ~30–40 min de digitação por ficha, a cada 4–6 semanas.

Ele passa a ter **tudo** que o import entregaria: tela de executar, PR, pré-carga da
última sessão, 15pts, streak.

- **Pré-requisito (checar antes):** o Leonardo não pode ter um programa de profissional
  ativo, senão os templates dele não aparecem (achado #3). Verificação de 5 segundos:
  abrir `/treino` e ver se os templates próprios estão listados.
- **Cardio da academia:** registrar como **atividade avulsa**, não como parte do treino
  (3–10pts, aceita data passada, preserva o streak).

Isso resolve o problema do Leonardo e da Marinella **agora**, e compra tempo para fazer
o resto certo.

### Rodada 1 — a feature de verdade (~1 dia)

Religar o import, mas **começando por texto colado, não por arquivo** — é o caminho que
o import de plano alimentar já percorreu (`app/api/meal-plan/import/route.ts` migrou de
arquivo para texto colado, o que sugere que o arquivo era a parte frágil). O PDF entra na
rodada seguinte, e é incremento barato porque `unpdf` já está instalado e em uso.

Escopo:
- **Uma rota** `/api/training-plan/import` aceitando texto colado → `ParsedTrainingPlan`.
  Sem adaptador por academia: a variação entre Technogym/Smart Fit/planilha está no
  *conteúdo* (que o prompt absorve), não no *formato de entrada*.
- **Prévia editável obrigatória.** Nada é gravado no passo de extração. O revisor corrige
  nome de exercício, séries, reps, dia, marca cardio, remove linha — e só então salva.
- **Import sempre CRIA programa novo**, nunca faz `PUT` sobre existente. O `PUT` é
  literalmente o caminho que zerou dados de um paciente em 01/07.
- **`ensure-single-active` para treino**, espelhando o de plano alimentar (achado #4).
- **Gravar os campos de cardio e circuito** no `save` (achado #5) — sem isso o import
  entrega plano errado.
- **Mora no portal do profissional**, não em `(app)/configuracoes`. Paciente não importa
  o próprio programa (contorna o trainer e quebra o modelo de cuidado). Para o superadmin
  entrar, criar `canManageTrainingPrograms(profile, professional)` no molde de
  `lib/auth/admin-gate.ts` — e eliminar o profissional fantasma.
- **Normalização de nomes de exercício na prévia.** Ver seção 5.

### Rodada 2 — PDF + endurecimento

- `unpdf` para PDF, vision para foto, no molde de `/api/inbody/analyze`.
- Bucket **privado** `training-imports` (molde de `20260424_chat_attachments.sql`),
  **nunca** `progress-photos`, que ainda é público. Signed URL curta, path por UUID
  (não o nome do arquivo, que carrega o nome do paciente).
- Gravação transacional: hoje `portal/training-programs` insere em loop e engole erro com
  `continue`, devolvendo `success: true` com dias faltando.
- Checagem de vínculo trainer↔paciente antes de atribuir (hoje qualquer trainer atribui
  programa a qualquer paciente).
- Política de privacidade: **OpenAI não é mencionada em `/privacidade`**, nem tratamento
  automatizado, nem transferência internacional — lacuna que **já existe em produção**
  por causa do InBody e do plano alimentar. Ver seção 6.

---

## 5. O detalhe que vale mais que o parser

**Estabilidade do nome do exercício.**

PR e pré-carga da última sessão são casados por `exercicio_nome` (string), em
`lib/services/points-server.ts` (`prHasPriorHistory`) e `hooks/use-exercise-history.ts`.

O PDF da Technogym traz nomenclatura de fabricante: *"Selection Pro Chest Press"*,
*"Leg Press MED"*, *"Skillrow"*. Se cada reimportação escrever o nome de um jeito
diferente, ou diferente do que o paciente já usava:

- o histórico de carga não conecta e o gráfico de evolução recomeça do zero;
- o primeiro registro vira baseline e o PR de 3pts só aparece na sessão seguinte;
- a pré-carga automática (`/api/workout/last-weights`) deixa de funcionar — e é ela que
  transforma "digitar 18 séries no vestiário" em "confirmar 18 séries".

Por isso a prévia editável precisa **sugerir o casamento** com os nomes que o paciente já
usou, antes de salvar. Isso é mais rentável do que qualquer melhoria no parser.

Detalhe correlato: máquina selectorizada Technogym marca carga em **nível** ("carga 8"),
não em kg. Gravar nível como se fosse kg deixa o PR e o gráfico mentirosos.

---

## 6. Decisões que só o dono pode tomar

1. **Paciente com prescrição externa + prescrição da clínica ao mesmo tempo:**
   (a) importar substitui, um plano ativo só; (b) os dois convivem e o paciente escolhe;
   (c) quem treina fora sai da prescrição da clínica.
   *Hoje o código faz (a) por acidente e sem avisar ninguém.*

2. **Treino externo autodeclarado vale os mesmos 15pts do presencial?**
   Ninguém consegue verificar. Leonardo e Marinella competem no mesmo ranking dos
   pacientes.

3. **Registrar treino de dia passado:** hoje é impossível (a tela grava sempre
   `getTodayDateSP()`); só `fitness_activities` aceita data passada. Isso decide se
   "esqueci de registrar" custa o streak.

4. **Quem importa:** só super_admin, ou também trainer, ou também a secretária como
   serviço de recepção.

5. **Privacidade / LGPD** — precisa de validação de quem cuida do jurídico: o texto de
   `/privacidade` não cita nenhum provedor de IA, não cita tratamento automatizado nem
   transferência internacional, e a base legal declarada para dado sensível é
   consentimento genérico. Um PDF de treino costuma carregar lesão e restrição
   ("evitar agachamento — hérnia L5-S1"), que é diagnóstico. **Isso já vale para o
   InBody e o plano alimentar hoje**, não é criado pelo treino — o treino só amplia.
   Correção barata: registrar consentimento `'ia_documentos'` via `register_consent`
   (a função já aceita qualquer tipo, não precisa de migration) e acrescentar três
   parágrafos em `/privacidade`.

---

## 7. Definição de pronto

Com o **PDF real da Technogym em mãos** (não um exemplo):

1. A ficha é importada, revisada e salva em menos de 5 minutos.
2. O paciente abre `/treino` no celular, vê os dias A/B/C e executa registrando carga.
3. 15pts, streak e PR aparecem corretamente.
4. Uma segunda importação (troca de 6 semanas) deixa **exatamente um** programa ativo e
   não apaga o histórico da primeira.
5. Um exercício de cardio da ficha aparece como cardio, não como 3×12.
6. Um segundo paciente recebe o mesmo fluxo sem reescrita de código.

Sem o item 6, isto é um favor para o dono, não uma feature de produto.

---

## 8. O que NÃO construir

- Conector Technogym (API, mywellness) — bloqueado pela academia, não por nós.
- Sincronização via Strava / Apple Health / Garmin — não carrega série, reps e carga.
- OCR de foto de console de aparelho.
- Adaptador de parsing por academia (Technogym, Smart Fit...) — abstração especulativa.
- Import direto pelo paciente.
- Regra de pontuação diferente para treino externo (por ora).
- Botão "repetir último treino" — é o maior salto de redução de atrito possível, **mas**
  é indistinguível de um clique falso, e o dono compete no mesmo ranking. Só depois da
  decisão nº 2 acima.

---

## Fontes

- [Technogym Enterprise API Documentation](https://openplatformdocs.mywellness.com/)
- [mywellness cloud API Documentation](https://apidocs.mywellness.com/)
- [Technogym integrations — Ecosystem Open Platform](https://technogym.com/en-US/open-ecosystem)
- [Strava — Strength Training](https://support.strava.com/en-us/articles/15401547-strength-training)
- [Connecting Apple Watch with Technogym App](https://www.technogym.com/en-US/support/post/connecting-apple-watch-with-technogym-app/)
