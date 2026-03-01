# Felice Wellness — Plataforma do Programa Wellness
## Planejamento Completo v2.0

---

## 1. VISÃO GERAL

### Propósito
O Felice Wellness é a plataforma digital do programa de acompanhamento wellness do Complexo Felice. Cada paciente do plano recebe acesso ao app como ferramenta do dia a dia — agenda de consultas, alimentação, exercícios, qualidade de vida, comunidade e gamificação — tudo integrado com a equipe multidisciplinar (Nutricionista, Personal Trainer, Coach de Alta Performance).

### Transformação

| Aspecto | Antes (FeliceFit) | Depois (Felice Wellness) |
|---|---|---|
| Público | Leonardo (pessoal) | Pacientes do programa wellness |
| Propósito | Tracking pessoal | Centro de controle do programa |
| Profissionais | Genérico | Nutri + Personal + Coach (Psicóloga) |
| Social | Individual | Comunidade com feed, ranking, interações |
| Comunicação | Chat básico | Chat + mensagens em massa + email |
| Gamificação | XP simples | Rankings múltiplos, por período, categoria |
| Branding | FeliceFit genérico | Identidade visual Complexo Felice |

### Princípios

1. **Premium** — visual que transmite a qualidade do Complexo Felice
2. **Intuitivo** — pacientes de todas as idades usam sem instrução
3. **Engajamento diário** — o paciente FAZ QUESTÃO de abrir o app
4. **Comunidade** — pertencimento ao grupo, jornada compartilhada
5. **Simplicidade** — menos cliques possível para ações do dia a dia

---

## 2. IDENTIDADE VISUAL

### Paleta de Cores (conforme manual da marca)

```
CORES PRINCIPAIS
├── Café       #322b29  — Autoridade, sofisticação, estabilidade, força
├── Vinho      #663739  — Sofisticação e maturidade, luxo e exclusividade
├── Dourado    #c29863  — Luxo, qualidade, requinte, sucesso
├── Nude       #ae9b89  — Equilíbrio, sabedoria
├── Fendi      #cac2b9  — Neutralidade, tranquilidade, modernidade
└── Seda       #ddd5c7  — Suavidade, leveza

APLICAÇÃO NO APP (Dark Mode Premium)
├── Background principal:  #1a1614 (café muito escuro, quase preto)
├── Background cards:      #241f1d (café escuro)
├── Background elevated:   #2e2724 (café médio-escuro)
├── Borders/dividers:      #3d3431 (café sutil)
├── Texto primário:        #ddd5c7 (seda)
├── Texto secundário:      #ae9b89 (nude)
├── Accent primário:       #c29863 (dourado) — CTAs, destaques, ranking
├── Accent secundário:     #663739 (vinho) — badges, alertas suaves
├── Success:               #7dad6a (verde suave, harmoniza com dourado)
├── Warning:               #c29863 (dourado funciona como warning)
├── Error:                 #a04045 (vinho mais claro)
└── Info:                  #ae9b89 (nude)
```

### Tipografia

```
FONTES
├── Butler    — Títulos, headings, nome do app, números grandes
│              Serif elegante, transmite sofisticação
│              Google Fonts: importar via @font-face ou self-host
├── Sarabun   — Corpo de texto, labels, UI elements
│              Sans-serif limpa, boa legibilidade em telas
│              Google Fonts: disponível
└── Fallback  — system-ui, -apple-system, sans-serif

HIERARQUIA
├── H1: Butler Bold, 28-32px
├── H2: Butler Medium, 22-26px
├── H3: Sarabun Bold, 18-20px
├── Body: Sarabun Regular, 14-16px
├── Caption: Sarabun Light, 12-13px
├── Numbers grandes (ranking, stats): Butler Bold, 36-48px
└── Badges/labels: Sarabun Medium, 11-12px, uppercase, letter-spacing
```

### Design Tokens

```
ESPAÇAMENTO
├── xs: 4px    sm: 8px    md: 16px    lg: 24px    xl: 32px    2xl: 48px

BORDER RADIUS
├── sm: 8px    md: 12px    lg: 16px    xl: 24px    full: 9999px

SOMBRAS (sutis, premium feel)
├── sm: 0 1px 3px rgba(50, 43, 41, 0.3)
├── md: 0 4px 12px rgba(50, 43, 41, 0.4)
├── lg: 0 8px 24px rgba(50, 43, 41, 0.5)
└── glow: 0 0 20px rgba(194, 152, 99, 0.15)  (dourado glow para destaques)
```

---

## 3. ARQUITETURA DE PAPÉIS E PERMISSÕES

### Hierarquia

```
SUPER_ADMIN (Leonardo / Marinella)
├── Acesso TOTAL a tudo
├── Chat com pacientes (receber e enviar mensagens)
├── Acompanhar mensagens dos profissionais
├── Configurar rankings, pontuações, desafios
├── Moderar feed social e chats
├── Avaliar melhora na bioimpedância (pontuar 20-50 pts)
├── Ver dados de todos os profissionais e pacientes
├── Gestão de usuários e profissionais
├── Envio de mensagens em massa (push + email)
└── Configurações do sistema

ADMIN (Secretária)
├── Agendamentos (CRUD completo de todos os profissionais)
├── Envio de mensagens em massa (push + email)
├── Cadastro de pacientes
├── Visualizar ranking (somente leitura)
├── Moderar feed social e chats
├── Receber solicitações de reagendamento
├── ❌ NÃO vê: formulários, dados clínicos, notas de profissionais
└── ❌ NÃO vê: detalhes de alimentação/treino/coaching dos pacientes

PROFISSIONAL — NUTRICIONISTA
├── Portal próprio com dashboard de pacientes linkados
├── Prescrever e acompanhar planos alimentares
├── Ver aderência nutricional dos pacientes
├── Criar formulários personalizados (1ª consulta + retornos)
├── Formulário pré-consulta enviado automaticamente 24h antes
├── Chat com pacientes linkados
├── Atribuir pontos de gamificação
├── Marcar presença em consulta (gera pontos)
├── Ver bioimpedância dos pacientes linkados
└── Registrar observações/notas no prontuário

PROFISSIONAL — PERSONAL TRAINER
├── Portal próprio com dashboard de pacientes linkados
├── Criar e prescrever programas de treino
├── Gerenciar biblioteca de exercícios (com vídeos)
├── Acompanhar execução e cargas dos pacientes
├── Criar formulários personalizados (1ª consulta + retornos)
├── Formulário pré-consulta enviado automaticamente 24h antes
├── Chat com pacientes linkados
├── Atribuir pontos de gamificação
├── Marcar presença em consulta (gera pontos)
└── Ver bioimpedância dos pacientes linkados

PROFISSIONAL — COACH ALTA PERFORMANCE (Psicóloga)
├── Portal próprio com dashboard de pacientes linkados
├── Criar formulários personalizados (1ª consulta + retornos)
├── Formulário pré-consulta enviado automaticamente 24h antes
├── Prontuário privado (notas/observações — só coach + superadmin)
├── Chat com pacientes linkados
├── Atribuir pontos de gamificação
├── Marcar presença em consulta (gera pontos)
└── ❌ NÃO vê: dados de alimentação/treino

PACIENTE
├── Dashboard pessoal
├── Agenda de consultas (ver, confirmar, solicitar reagendamento)
├── Tracking: alimentação, treino, água, sono
├── Análise de refeição por IA (limite 15/mês)
├── Feed social da comunidade
├── Chat com profissionais e superadmin
├── Rankings e conquistas
├── Preencher formulários pré-consulta
└── Perfil e configurações
```

### Matriz de Visibilidade

| Dado | Paciente | Nutri | Personal | Coach | Admin | SuperAdmin |
|---|---|---|---|---|---|---|
| Alimentação | Próprio | Linkados | ❌ | ❌ | ❌ | ✅ Todos |
| Treinos | Próprio | ❌ | Linkados | ❌ | ❌ | ✅ Todos |
| Notas Coach | ❌ | ❌ | ❌ | Próprias | ❌ | ✅ Todas |
| Notas Nutri/Personal | ❌ | Próprias | Próprias | ❌ | ❌ | ✅ Todas |
| Formulários | Próprios | Próprios | Próprios | Próprios | ❌ | ✅ Todos |
| Agenda | Própria | Própria | Própria | Própria | ✅ Todas | ✅ Todas |
| Ranking | Público | Público | Público | Público | Público | ✅ Config |
| Feed social | Público | Público | Público | Público | Moderação | ✅ Moderação |
| Bioimpedância | Própria | Linkados | Linkados | ❌ | ❌ | ✅ Todos |
| Hidratação/Sono | Próprio | Linkados | ❌ | ❌ | ❌ | ✅ Todos |
| Chat paciente | Próprio | Linkados | Linkados | Linkados | Moderação | ✅ Todos |

---

## 4. FEATURES DETALHADAS

### 4.1 DASHBOARD DO PACIENTE ⭐

A primeira tela. Clean, motivadora, mostra o essencial do dia.

**Widgets:**
- Saudação personalizada com nome + mensagem do dia
- **Próxima consulta** — profissional, data, horário, botão "Entrar" se online
- **Progresso diário** — ring circular: treinou? comeu? hidratou? dormiu?
- **Posição no ranking** — posição atual, pontos, tendência ↑↓
- **Feed resumido** — últimas 2-3 interações da comunidade
- **Quick actions** — registrar água, refeição, iniciar treino
- **Mensagens não lidas** — badge no header
- **Streak** — dias consecutivos ativo

---

### 4.2 AGENDA 🆕

**Para o paciente:**
- Calendário visual (mensal + semanal + lista)
- Consultas com: profissional, data/hora, tipo (presencial/online), local/link
- Status: agendada → confirmada → realizada | cancelada | faltou
- **Link para consulta online** (Google Meet ou link customizado)
- **Botão "Solicitar Reagendamento"** → gera notificação para admin
- Notificações push: 24h antes, 1h antes, 15min antes
- **Sincronização com calendário nativo** (iPhone/Android) via .ics ou CalDAV

**Sobre sincronização com calendário do celular:**
- **Recomendação: Gerar link .ics (padrão iCal)** ao criar o agendamento
- Paciente recebe botão "Adicionar ao Calendário" que abre o app nativo
- Funciona tanto no iPhone (Apple Calendar) quanto Android (Google Calendar)
- Não precisa de integração complexa com API do Google — o .ics é universal
- O evento criado inclui: título, profissional, horário, local/link do Meet

**Sobre Google Meet:**
- Campo genérico `meeting_link` — o profissional/admin cola qualquer link
- Se quiser automatizar: usar Google Calendar API para criar evento + Meet automaticamente
- **Recomendação fase 1:** Link manual (cola o Meet). Fase posterior: automação Google Calendar API
- A automação geraria o Meet automaticamente ao criar a consulta online e já inseriria no .ics

**Reagendamento:**
1. Paciente toca "Solicitar Reagendamento" → modal com motivo (opcional)
2. Status muda para `reschedule_requested`
3. Admin recebe notificação
4. Admin entra em contato e reagenda
5. Paciente recebe notificação da nova data + novo .ics

**Modelo de dados:**
```sql
CREATE TABLE fitness_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users NOT NULL,
  professional_id UUID REFERENCES fitness_professionals NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('presencial', 'online')),
  meeting_link TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show','reschedule_requested')),
  reschedule_reason TEXT,
  reschedule_requested_at TIMESTAMPTZ,
  notes TEXT,
  confirmed_by_patient BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  ics_data TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4.3 ALIMENTAÇÃO 🔄

**Reaproveitar do FeliceFit:**
- Tracking diário de refeições com macros (cal/prot/carb/fat)
- 8 tipos de refeição
- Banco de alimentos (global + customizado)
- Plano alimentar prescrito pela nutricionista
- Histórico e tendências
- **Análise de refeição por IA** — manter com limite de 15 análises/mês/paciente

**Adaptar:**
- Portal da nutricionista com visão de pacientes linkados
- Aderência ao plano = métrica de ranking (10 pts/semana com boa aderência)
- Integração com feed social (postar foto da refeição)
- Formulário pré-consulta da nutricionista (envio automático 24h antes)

**Remover:**
- ❌ Revolade (medicação pessoal)
- ❌ Alerta de laticínios
- ❌ Coach IA
- ❌ Insights IA / predições

**Controle de custo da IA:**
- Limite: 15 análises por paciente por mês
- Contador visível para o paciente: "Você usou 3 de 15 análises este mês"
- SuperAdmin monitora custo total no painel
- Custo estimado: ~R$0,15/análise × 15 × 50 pacientes = ~R$112/mês

---

### 4.4 TREINOS / EXERCÍCIOS 🔄

**Reaproveitar:**
- Templates de treino e execução com timer
- Registro de séries (peso/reps/RPE)
- Personal Records
- Atividades extras (beach tennis, corrida, etc.)
- Histórico

**Adicionar — Vídeos de exercícios:**
- Cada exercício na library pode ter link de vídeo (YouTube público ou não-listado)
- Thumbnail do vídeo
- Player embedded (lite-youtube-embed para performance)
- Durante execução do treino: botão para ver vídeo de referência
- Personal gerencia a biblioteca de exercícios no portal

**Modelo de dados (alterações):**
```sql
ALTER TABLE exercises_library ADD COLUMN video_url TEXT;
ALTER TABLE exercises_library ADD COLUMN video_thumbnail TEXT;
ALTER TABLE exercises_library ADD COLUMN instructions TEXT;
ALTER TABLE exercises_library ADD COLUMN muscle_groups TEXT[];
ALTER TABLE exercises_library ADD COLUMN difficulty TEXT
  CHECK (difficulty IN ('beginner','intermediate','advanced'));
```

**Adaptar:**
- Portal do personal com visão de pacientes linkados
- Formulário pré-consulta do personal (envio automático 24h antes)
- Aderência ao plano de treino como métrica de ranking

**Simplificar:**
- Modo imersivo: manter timer e registro, simplificar feedback sonoro/voz
- Remover: exercícios respiratórios, meditação

---

### 4.5 COACH DE ALTA PERFORMANCE 🆕

**Portal da Coach (Psicóloga):**
- Dashboard com pacientes ativos e próximas consultas
- **Formulários personalizáveis:**
  - Criar templates de formulário próprios
  - Template para 1ª consulta + template para retornos
  - Envio automático 24h antes da consulta
- **Prontuário/Notas de consulta (PRIVADO):**
  - Visível APENAS para: a coach + superadmin
  - Editor de texto simples
  - Vinculado à consulta/data
  - Tipos: observação, evolução, plano de ação, alerta
- Chat com pacientes
- Atribuir pontos no ranking

**Modelo de dados:**
```sql
CREATE TABLE fitness_professional_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES fitness_professionals NOT NULL,
  patient_id UUID REFERENCES auth.users NOT NULL,
  appointment_id UUID REFERENCES fitness_appointments,
  note_type TEXT NOT NULL CHECK (note_type IN ('observation','evolution','action_plan','alert')),
  content TEXT NOT NULL,
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['super_admin'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: somente o professional_id ou super_admin podem SELECT/INSERT/UPDATE
```

**Nota:** Nutricionista e Personal também terão notas/prontuário, mas com visibilidade diferente — podem ser vistos pelo superadmin e pelo próprio profissional.

---

### 4.6 FORMULÁRIOS PRÉ-CONSULTA ⭐ (Expandir)

**Sistema unificado para todos os profissionais:**

Cada profissional (nutri, personal, coach) pode:
- **Criar formulários personalizados** com os 10 tipos de pergunta existentes
- **2 templates por profissional:** 1ª consulta + retorno
- **Envio automático:** 24h antes da consulta, o sistema verifica se é 1ª consulta ou retorno e envia o formulário correspondente via push notification
- Paciente preenche no app (wizard step-by-step)
- Profissional vê respostas antes da consulta
- Auto-save de rascunhos

**Lógica de envio automático:**
```
CRON diário (ex: 20h):
1. Busca consultas de amanhã
2. Para cada consulta:
   a. Verifica se paciente já teve consulta anterior com esse profissional
   b. Se não → envia formulário de 1ª consulta
   c. Se sim → envia formulário de retorno
   d. Envia push notification: "Preencha seu formulário para a consulta de amanhã com [Profissional]"
3. Se formulário não preenchido 2h antes → lembrete push
```

---

### 4.7 QUALIDADE DE VIDA 🔄

**Sono — Manter simplificado:**
- Registro de hora dormir/acordar
- Qualidade (1-5)
- Estatísticas e tendências
- Dados visíveis para a nutricionista (linkados)

**Hidratação — Manter como está:**
- Tracking rápido com botões de quantidade
- Meta personalizada (35ml/kg)
- Progress ring, streak, gráfico semanal

**Remover:**
- ❌ Meditação guiada
- ❌ Exercícios respiratórios
- ❌ Diário de gratidão
- ❌ Mapa de dor / recovery score complexo

**Simplificar:**
- Bem-estar: manter check-in diário simples (humor 1-5, energia 1-5) como opcional
- Sem correlações automáticas ou insights IA

---

### 4.8 FEED SOCIAL / COMUNIDADE 🆕

**O coração do engajamento.** Feed estilo Instagram simplificado.

**Funcionalidades:**
- Posts com foto + texto (refeição, treino, conquista, texto livre, check-in)
- **Reações:** 💪 Força, 🔥 Fogo, ❤️ Amor, 👏 Palmas, ⭐ Estrela
- **Comentários** em cada post
- **Privacidade semi-anônima:**
  - Paciente escolhe nome de exibição (primeiro nome ou apelido)
  - Sem sobrenome visível no feed
  - Avatar customizável (foto ou avatar genérico)
- **Auto-post sugerido:** Ao completar treino, bater meta de água, etc. → "Compartilhar?"
- **Moderação:** SuperAdmin + Admin podem remover posts/comentários
- **Gamificação:** Postar = 2pts, comentar/reagir = 1pt

**Modelo de dados:**
```sql
CREATE TABLE fitness_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('meal','workout','achievement','free_text','check_in')),
  content TEXT,
  image_url TEXT,
  related_id UUID,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  reactions_count JSONB DEFAULT '{}',
  comments_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fitness_community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fitness_community_posts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('fire','heart','strength','clap','star')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE TABLE fitness_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fitness_community_posts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4.9 GAMIFICAÇÃO & RANKING ⭐⭐

**A feature mais importante para engajamento.**

**Tipos de ranking:**

| Ranking | Período | Zera? | Descrição |
|---|---|---|---|
| **Geral** | Desde sempre | Nunca | Pontuação lifetime acumulada |
| **Semestral** | Jan-Jun / Jul-Dez | Sim, a cada semestre | Competição do semestre |
| **Mensal** | Mês corrente | Sim, a cada mês | Sprint mensal |
| **Desafio** | Customizado | Sim, por desafio | Período e regras definidos pelo superadmin |
| **Rei da Nutrição** | Mensal/Semestral | Sim | Só pontos de alimentação |
| **Rei do Treino** | Mensal/Semestral | Sim | Só pontos de exercício |
| **Rei da Consistência** | Mensal/Semestral | Sim | Streaks, check-ins, frequência |

**Sistema de Pontuação:**

| Ação | Pontos | Quem atribui |
|---|---|---|
| **Comparecer à consulta** | **20 pts** | Profissional confirma presença |
| **Aderência ao plano alimentar (semana)** | **10 pts** | Automático (>80% aderência) |
| **Melhora na bioimpedância** | **20-50 pts** | Manual — Dr. Leonardo ou Dra. Marinella |
| Completar treino prescrito | 15 pts | Automático |
| Registrar todas as refeições do dia | 10 pts | Automático |
| Bater meta de água | 5 pts | Automático |
| Registrar sono | 3 pts | Automático |
| Check-in de bem-estar | 3 pts | Automático |
| Personal Record | 10 pts | Automático |
| Postar no feed | 2 pts | Automático |
| Comentar/reagir no feed | 1 pt | Automático |
| Streak 7 dias consecutivos | 15 pts bônus | Automático |
| Streak 30 dias consecutivos | 50 pts bônus | Automático |
| Bônus profissional | 5-50 pts (config) | Manual por qualquer profissional |
| Desafio especial | Variável | Configurável pelo superadmin |
| Preencher formulário pré-consulta | 5 pts | Automático |

**Pontuação de presença em consulta:**
- Profissional marca "compareceu" no app → 20pts automáticos para o paciente
- Se faltou sem avisar → pode perder pontos (configurável)

**Pontuação de bioimpedância (20-50 pts):**
- Após avaliação, Dr. Leonardo ou Dra. Marinella atribuem pontos manualmente
- Critérios: melhora de composição corporal, redução de gordura, ganho de massa, etc.
- Interface: selecionar paciente → campo de pontos (20-50) + justificativa

**Modelo de dados:**
```sql
CREATE TABLE fitness_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general','semester','monthly','challenge','category')),
  category TEXT CHECK (category IN ('nutrition','workout','consistency')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  point_rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fitness_ranking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID REFERENCES fitness_rankings NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_position INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ranking_id, user_id)
);

CREATE TABLE fitness_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'workout','nutrition','hydration','sleep','wellness',
    'attendance','social','bonus','bioimpedance','challenge',
    'consistency','form_completion'
  )),
  source TEXT NOT NULL CHECK (source IN ('automatic','professional','superadmin')),
  awarded_by UUID REFERENCES auth.users,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: ao INSERT em fitness_point_transactions, atualiza total_points em todos os rankings ativos
-- onde o user é participante e a categoria se aplica
```

**Configuração pelo SuperAdmin:**
- Criar/editar rankings
- Selecionar participantes (todos, grupo, individual)
- Definir período e regras
- Ativar/desativar
- Ver transações de pontos

**UI do Paciente:**
- Pódio animado (top 3 com avatar dourado/prata/bronze)
- Lista scrollável com posição, avatar, nome de exibição, pontos
- "Minha posição" destacada com seta dourada
- Tabs para alternar entre rankings ativos
- Timeline de pontos ganhos recentes
- Animação de celebração ao subir posição

---

### 4.10 COMUNICAÇÃO ⭐

#### Chat (Melhorar)
- Chat 1:1 entre profissional ↔ paciente
- **SuperAdmin também pode conversar com pacientes** (Leonardo/Marinella)
- **SuperAdmin pode acompanhar chats dos profissionais** (somente leitura ou participar)
- Interface tipo WhatsApp (bolhas, timestamps, status leitura: enviado, entregue, lido)
- Enviar fotos/imagens
- Push notification de nova mensagem
- Badge de não-lido
- **Moderação:** SuperAdmin + Admin podem ver e intervir

#### Mensagens em Massa 🆕
- Painel Admin/SuperAdmin
- **Canais:** Push notification + in-app inbox + **Email**
- Selecionar destinatários com filtros:
  - Todos os pacientes ativos
  - Por profissional (pacientes do Dr. X)
  - Por ranking/grupo
  - Por status (ativos, inativos, últimos 30 dias)
  - Por aderência (< 50%, > 80%, etc.)
  - Seleção manual individual
- Tipos: aviso, lembrete, motivacional, evento
- Templates reutilizáveis
- Agendar envio (agora ou data/hora futura)
- Relatório: quantos receberam, quantos leram

**Envio por email:**
- Usar serviço de email transacional: **Resend** (simples, bom free tier) ou Amazon SES
- Template HTML bonito com branding Felice
- Email remetente: noreply@complexofelice.com.br (ou similar)
- Paciente precisa ter email cadastrado no perfil

**Modelo de dados:**
```sql
CREATE TABLE fitness_broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('announcement','reminder','motivational','event')),
  target_filter JSONB,
  recipient_count INTEGER DEFAULT 0,
  channels TEXT[] DEFAULT ARRAY['push','inbox'],  -- push, inbox, email
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fitness_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES fitness_broadcast_messages NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fitness_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('broadcast','system','professional')),
  source_id UUID,
  title TEXT NOT NULL,
  preview TEXT,
  content TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4.11 BIOIMPEDÂNCIA / CORPO 🔄

**Manter:**
- Suporte completo a InBody/bioimpedância (50+ campos)
- Medições, evolução, gráficos de tendência, comparação antes/depois
- Profissional (nutri ou personal) registra dados após avaliação

**Adaptar:**
- Melhora na bioimpedância → pontuação no ranking (20-50 pts, manual pelo Leonardo/Marinella)
- Dados visíveis para nutri e personal (linkados)

---

### 4.12 FEATURES REMOVIDAS

| Feature | Motivo |
|---|---|
| Revolade | Pessoal do Leonardo |
| Alerta de laticínios | Pessoal |
| Coach IA (chat GPT) | Profissionais reais substituem; custo |
| Insights IA / predições | Profissionais fazem isso |
| Reports IA | Simplificar |
| Meditação guiada | Fora do escopo |
| Exercícios respiratórios | Fora do escopo |
| Diário de gratidão | Coach cobre isso pessoalmente |
| Mapa de dor complexo | Simplificar para check-in básico |
| Recovery score avançado | Simplificar |

---

## 5. NAVEGAÇÃO

### Bottom Navigation do Paciente (5 tabs)

```
┌──────────────────────────────────────────────────────────┐
│   🏠 Home    📅 Agenda    🌐 Feed    🏆 Ranking    👤 Eu   │
└──────────────────────────────────────────────────────────┘
```

1. **Home** — Dashboard com resumo do dia, próxima consulta, progresso, quick actions
2. **Agenda** — Calendário de consultas, confirmar, solicitar reagendamento
3. **Feed** — Feed social da comunidade (posição central = destaque)
4. **Ranking** — Rankings, pontos, conquistas, pódio
5. **Eu** — Perfil, configurações, chat, progresso, metas

### Acesso via Dashboard/Perfil
- Alimentação → card no dashboard + seção em "Eu"
- Treino → card no dashboard + seção em "Eu"
- Água → quick action no dashboard
- Sono → seção em "Eu"
- Mensagens/Chat → ícone no header com badge
- Bioimpedância → dentro de "Meu Progresso" em "Eu"
- Inbox → ícone de sino no header

### Header
```
┌─────────────────────────────────────┐
│  FELICE     [🔔 3]  [💬 2]  [🔍]   │
│  WELLNESS                            │
└─────────────────────────────────────┘
```
- Logo Felice Wellness (Butler font, dourado)
- Sino = inbox/notificações (com badge)
- Chat = mensagens (com badge)
- Busca (opcional)

---

## 6. FLUXO TÍPICO DO PACIENTE

```
MANHÃ
1. Abre app → Dashboard
   "Bom dia, Maria! Você está em 3º no ranking 🏆
    Consulta com Dra. Ana (Nutri) amanhã às 14h"

2. Quick action → Registra água (+200ml) → +1pt se bater meta

3. Formulário pré-consulta → Push recebido ontem à noite
   "Preencha seu formulário para a consulta com Dra. Ana"
   → Preenche no wizard → +5pts

TREINO
4. Abre treino do dia (prescrito pelo personal)
   → Não lembra como faz remada curvada → toca → vê vídeo
   → Completa treino → +15pts
   → "Compartilhar na comunidade?" → Posta foto → +2pts

ALMOÇO
5. Registra refeição → tira foto → IA analisa macros (3/15 do mês)
   → Aderência ao plano: 85% ✅

TARDE
6. Abre Feed → Vê que João postou treino de perna → reage 🔥 → +1pt
   → Comenta "Bora!" → +1pt

NOITE
7. Registra sono + última água do dia
8. Confere ranking → subiu para 2º lugar 🎉

TOTAL DO DIA: ~27 pontos
```

---

## 7. STACK TÉCNICO

### Mantém (já funciona bem)
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix)
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Framer Motion
- Vercel
- PWA (next-pwa) + Web Push (VAPID)
- React Hook Form + Zod
- Recharts, Lucide React, date-fns

### Adiciona
- **React Query (TanStack Query)** — cache, deduplication, invalidation
- **Supabase Realtime** — chat em tempo real, feed updates live
- **lite-youtube-embed** — player leve para vídeos de exercícios
- **Resend** — envio de emails transacionais (mensagens em massa)
- **ics** (npm package) — gerar arquivos .ics para sincronizar calendário
- **Butler + Sarabun** — fontes da marca (Google Fonts ou self-hosted)

### Refatora
- Service layer entre hooks e Supabase
- React Query substituindo fetch manual nos hooks
- Middleware de permissões por role
- Design tokens atualizados para paleta Complexo Felice
- Remover: módulos de Revolade, Coach IA, Insights IA, meditação, respiração, gratidão

### Substitui
- Inter → **Butler** (headings) + **Sarabun** (body)
- Purple/Cyan → **Dourado/Vinho/Café** (paleta Complexo Felice)

---

## 8. BANCO DE DADOS — RESUMO DE MUDANÇAS

### Novas tabelas (11)
1. `appointments` — Agenda de consultas
2. `fitness_professional_notes` — Prontuário/notas de profissionais
3. `fitness_community_posts` — Feed social
4. `fitness_community_reactions` — Reações nos posts
5. `fitness_community_comments` — Comentários nos posts
6. `fitness_rankings` — Configuração de rankings
7. `fitness_ranking_participants` — Participantes por ranking
8. `fitness_point_transactions` — Histórico de pontuação
9. `fitness_broadcast_messages` — Mensagens em massa
10. `fitness_broadcast_recipients` — Destinatários de broadcasts
11. `fitness_inbox_messages` — Inbox do paciente

### Tabelas alteradas
- `exercises_library` → +video_url, +video_thumbnail, +instructions, +muscle_groups, +difficulty
- `fitness_profiles` → +display_name, +avatar_url
- `professionals` → +specialty_type (nutritionist | trainer | coach)
- `form_templates` → +auto_send_type (first_visit | follow_up), +professional_id

### Tabelas/colunas a remover
- Campos de Revolade em `fitness_profiles`
- Tabelas/dados relacionados a coach IA (`coach_conversations`, `coach_messages`)
- Tabelas de insights IA (`fitness_insights`, `fitness_ai_reports`) — ou manter vazio

### RLS novas
- `professional_notes`: somente professional_id OU role = 'super_admin'
- `community_posts/reactions/comments`: SELECT para autenticados, INSERT para próprio user
- `appointments`: paciente vê suas, profissional vê seus pacientes, admin/superadmin vê todas
- `fitness_point_transactions`: paciente vê próprios, profissional INSERT para linkados
- `broadcast_*`: somente admin/superadmin

---

## 9. FASES DE IMPLEMENTAÇÃO

### Fase 1 — Fundação e Rebranding (2-3 semanas)

**Objetivo:** Infraestrutura sólida e nova cara do app

- [ ] Atualizar paleta de cores para Complexo Felice (café/vinho/dourado/nude/fendi/seda)
- [ ] Trocar fontes: Inter → Butler (headings) + Sarabun (body)
- [ ] Atualizar design tokens em `lib/design-system.ts`
- [ ] Atualizar `tailwind.config.ts` com novas cores e fontes
- [ ] Renomear app para "Felice Wellness" (manifest, meta tags, textos)
- [ ] Refatorar sistema de roles: adicionar 'coach', separar admin de super_admin
- [ ] Atualizar middleware de autenticação/roteamento por role
- [ ] Instalar e configurar React Query
- [ ] Criar service layer básica (primeiras queries migradas)
- [ ] Criar migrações SQL para todas as novas tabelas
- [ ] Remover: Revolade, Coach IA, Insights IA, meditação, respiração, gratidão
- [ ] Refazer Dashboard do paciente com novo design e widgets
- [ ] Nova bottom navigation (5 tabs: Home, Agenda, Feed, Ranking, Eu)
- [ ] Header com logo Felice Wellness + badges de notificação

### Fase 2 — Agenda + Formulários Automáticos (2-3 semanas)

**Objetivo:** Sistema de consultas funcionando**

- [ ] CRUD de agendamentos (admin/superadmin)
- [ ] UI de agenda para paciente (calendário + lista)
- [ ] Botão "Solicitar Reagendamento" + fluxo de notificação para admin
- [ ] Geração de arquivo .ics + botão "Adicionar ao Calendário"
- [ ] Status de consulta (scheduled → confirmed → completed)
- [ ] Notificações push: 24h, 1h, 15min antes
- [ ] Sistema de formulários pré-consulta por profissional
- [ ] Auto-envio 24h antes (cron/scheduled function)
- [ ] Lógica 1ª consulta vs retorno
- [ ] Painel admin (secretária): agenda completa + gestão de agendamentos

### Fase 3 — Comunicação Completa (2 semanas)

**Objetivo:** Chat + mensagens em massa + email

- [ ] Melhorar chat (Supabase Realtime, status de leitura, fotos)
- [ ] SuperAdmin pode conversar com pacientes diretamente
- [ ] SuperAdmin pode ver chats de profissionais
- [ ] Moderação de chats (admin + superadmin)
- [ ] Sistema de mensagens em massa (push + inbox + email)
- [ ] Integração com Resend para envio de email
- [ ] Template HTML de email com branding Felice
- [ ] Filtros de seleção de destinatários
- [ ] Agendamento de envio
- [ ] Inbox do paciente (sino no header)

### Fase 4 — Alimentação + Treino Adaptados (2-3 semanas)

**Objetivo:** Core do programa wellness multi-paciente

- [ ] Adaptar alimentação para multi-paciente (service layer + RLS)
- [ ] Portal da nutricionista (dashboard + prescrição + acompanhamento + aderência)
- [ ] IA de análise de refeição com limite de 15/mês + contador
- [ ] Adaptar treinos para multi-paciente
- [ ] Adicionar vídeos na exercises_library
- [ ] Player de vídeo inline na execução de treino
- [ ] Portal do personal (dashboard + prescrição + acompanhamento)
- [ ] Prontuário/notas para nutricionista e personal

### Fase 5 — Coach Alta Performance (1-2 semanas)

**Objetivo:** Completar equipe multidisciplinar

- [ ] Portal da Coach com dashboard
- [ ] Prontuário privado (notas de consulta)
- [ ] RLS rigoroso (somente coach + superadmin)
- [ ] Templates de formulário da coach
- [ ] Chat coach ↔ paciente
- [ ] Atribuição de pontos pela coach

### Fase 6 — Gamificação & Ranking (2-3 semanas)

**Objetivo:** Motor de engajamento

- [ ] Motor de pontuação automática (triggers no Supabase + API)
- [ ] Rankings: geral, semestral, mensal, desafio, por categoria
- [ ] Interface de ranking para paciente (pódio, lista, minha posição)
- [ ] Painel de configuração para superadmin
- [ ] Pontuação manual por profissionais
- [ ] Pontuação manual de bioimpedância (Leonardo/Marinella)
- [ ] Presença em consulta → pontos automáticos
- [ ] Integração com todas as ações do app
- [ ] Streaks e bônus
- [ ] Animações de celebração com design dourado

### Fase 7 — Feed Social / Comunidade (2 semanas)

**Objetivo:** Senso de comunidade

- [ ] Feed com posts, fotos, reações, comentários
- [ ] Nome de exibição + avatar
- [ ] Auto-post sugerido após conquistas
- [ ] Moderação (superadmin + admin)
- [ ] Integração com pontuação do ranking
- [ ] Filtros por tipo de post

### Fase 8 — Polish e Go-Live (1-2 semanas)

**Objetivo:** Refinamento final

- [ ] Sono e hidratação ajustados para multi-paciente
- [ ] Bioimpedância integrada ao ranking
- [ ] Painel SuperAdmin completo (tudo acessível)
- [ ] Onboarding flow para novos pacientes (1ª abertura do app)
- [ ] Testes com equipe interna
- [ ] Performance e otimização
- [ ] PWA icons e splash screen com branding Felice
- [ ] Documentação para profissionais (como usar o portal)

---

## 10. ESTIMATIVA

| Fase | Descrição | Semanas |
|---|---|---|
| 1 | Fundação e Rebranding | 2-3 |
| 2 | Agenda + Formulários | 2-3 |
| 3 | Comunicação | 2 |
| 4 | Alimentação + Treino | 2-3 |
| 5 | Coach | 1-2 |
| 6 | Gamificação + Ranking | 2-3 |
| 7 | Feed Social | 2 |
| 8 | Polish + Go-Live | 1-2 |
| **Total** | | **14-20 semanas** |

**Com Claude Code intensivo:** Reduz significativamente. A maior parte do esforço está em acertar UX e modelos de dados — o código em si é mais mecânico com a IA ajudando.

---

## 11. RESUMO EXECUTIVO

### Felice Wellness é:

1. **Agenda inteligente** com consultas presenciais/online, .ics, reagendamento
2. **Acompanhamento nutricional** com prescrição, tracking, IA (15/mês), aderência
3. **Programa de exercícios** com vídeos demonstrativos, execução, PRs
4. **Coaching de alta performance** com prontuário privado
5. **Qualidade de vida** — sono e hidratação
6. **Gamificação avançada** — 4+ rankings simultâneos, por categoria, por período
7. **Comunidade social** — feed com fotos, reações, comentários
8. **Comunicação completa** — chat profissional, inbox, push, email em massa
9. **Formulários automáticos** — pré-consulta enviados 24h antes
10. **Multi-profissional** — nutri, personal, coach, cada um com portal
11. **Controle granular** — superadmin vê tudo, admin limitado, dados privados protegidos

### Diferencial
- Tudo em um só app — sem precisar de 5 ferramentas
- Gamificação que vicia — ranking, streaks, pontos, pódio
- Comunidade — não é solitário, é em grupo
- Premium — visual Complexo Felice, butler + sarabun, dourado + café
- Multi-profissional — todos no mesmo ecossistema
- Automatizado — formulários, pontos, notificações, tudo automático
