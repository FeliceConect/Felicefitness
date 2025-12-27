# FeliceFit - Application Architecture & Current Features

## 1. APPLICATION STRUCTURE

### Tech Stack
- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS)
- **Authentication**: Supabase Auth
- **UI Framework**: React 18 with Radix UI components
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **PWA**: next-pwa (Progressive Web App support)
- **OpenAI Integration**: OpenAI API for AI Coach and meal analysis

### Folder Structure
```
FeliceFit/
├── app/
│   ├── (auth)/ - Authentication pages (login, signup)
│   ├── (app)/ - Protected routes requiring authentication
│   ├── api/ - API endpoints (serverless functions)
│   ├── offline/ - Offline page
│   └── layout.tsx, globals.css
├── lib/ - Core business logic and utilities
│   ├── coach/ - AI Coach functionality
│   ├── gamification/ - Gamification system
│   ├── insights/ - Analytics and insights generation
│   ├── supabase/ - Database and auth clients
│   ├── notifications/ - Push notifications
│   ├── openai/ - OpenAI integration
│   ├── nutrition/ - Nutrition calculations
│   ├── body/ - Body metrics analysis
│   ├── sleep/ - Sleep analytics
│   ├── reports/ - Report generation
│   ├── wellness/ - Wellness features
│   └── [other feature modules]/
├── hooks/ - Custom React hooks (auto-imported)
├── components/ - Reusable UI components
├── types/ - TypeScript type definitions
├── styles/ - Global styles
├── public/ - Static assets, PWA icons
├── supabase/
│   └── migrations/ - Database schema migrations
└── middleware.ts - Authentication and routing middleware
```

---

## 2. APP MODULES & FEATURES (app/(app)/)

### Core Modules:

1. **Dashboard** (`/dashboard`)
   - Home page with daily overview
   - Components: greeting, stats overview, water card, meals card, workout card, daily score, streak badge
   - Quick access to main features

2. **Workouts** (`/treino`)
   - Workout templates and execution
   - Exercise library
   - Workout history
   - Immersive mode for workout execution (`/treino/[id]/imersivo`)
   - Resume functionality

3. **Nutrition** (`/alimentacao`)
   - Meal logging and tracking
   - Food library (personal + global)
   - Meal photos analysis via AI
   - Nutrition history
   - Food item creation and management

4. **Body Metrics** (`/corpo`)
   - Weight tracking
   - Circumference measurements
   - Body composition (bioimpedance/InBody)
   - Evolution graphs
   - Measurement history

5. **Water Tracking** (`/agua`)
   - Daily water intake logging
   - Hydration goals
   - History view

6. **Sleep Management** (`/sono`)
   - Sleep log registration
   - Sleep duration and quality tracking
   - Sleep insights
   - Sleep history

7. **Supplements** (`/suplementos`)
   - Supplement management
   - Dosage tracking
   - Stock management
   - Schedule and reminders
   - Special medication support (Revolade)

8. **Wellness** (`/bem-estar`)
   - Daily check-in (mood, energy, stress)
   - Meditation support
   - Gratitude journal
   - Breathing exercises
   - Recovery tracking
   - Wellness history and insights

9. **Profile** (`/perfil`)
   - User profile display
   - Body data summary
   - Objective management (with date targets)
   - Recent achievements
   - Profile editing
   - Photo upload

10. **Settings** (`/configuracoes`)
    - Account settings
    - Notification preferences
    - Workout configuration
    - Nutrition goals
    - Appearance/theme settings
    - Privacy settings
    - About page
    - Revolade (special medication) settings

11. **Achievements/Conquistas** (`/conquistas`)
    - Achievement badges and unlocks
    - Achievement categories (streak, workout, nutrition, hydration, body, consistency, special)
    - Achievement progress tracking

12. **Coach** (`/coach`)
    - AI-powered fitness coach (FeliceCoach)
    - Chat-based interaction
    - Personalized suggestions
    - Historical conversations
    - Insights from coach

13. **Insights** (`/insights`)
    - AI-generated analytics
    - Trend analysis
    - Patterns detection
    - Predictions
    - Alerts and recommendations
    - Wellness recommendations
    - Multiple insight views (analysis, forecasts, alerts)

14. **Reports** (`/relatorios`)
    - Weekly reports
    - Monthly reports
    - Evolution reports
    - Custom reports
    - Progress visualization

15. **Photos** (`/fotos`)
    - Progress photo timeline
    - Photo comparison tool
    - Photo management
    - Before/after comparison

16. **Sharing** (`/compartilhar`)
    - Share achievements
    - Share workouts
    - Share streaks
    - Share weekly summaries
    - Share progress

17. **Notifications** (`/notificacoes`)
    - Notification history
    - Notification management

18. **Widgets** (`/widgets`)
    - Widget customization and display
    - Dashboard widgets

---

## 3. DATABASE STRUCTURE (Supabase/PostgreSQL)

### Core Tables (33 total):

#### User & Profile Tables:
- **fitness_profiles** - User profile with goals, measurements, streaks, gamification data
  - Fields: nome, email, data_nascimento, sexo, altura_cm, peso_atual, objetivo, nivel_atividade
  - Medication support: medicamento fields for Revolade and other meds
  - Gamification: streak_atual, maior_streak, pontos_totais
  - Goals: meta_calorias_diarias, meta_proteina_g, meta_carboidrato_g, meta_gordura_g, meta_agua_ml

#### Workout Tables:
- **fitness_exercises_library** - Global exercise database
  - Fields: nome, nome_en, grupo_muscular, musculos_secundarios, equipamento, tipo, video_url
- **fitness_workout_templates** - User workout templates
  - Fields: user_id, nome, descricao, tipo, fase, dia_semana, duracao_estimada_min
- **fitness_workout_template_exercises** - Exercises in templates
  - Fields: template_id, exercise_id, series, repeticoes, descanso_segundos, carga_sugerida
- **fitness_workouts** - Completed workouts
  - Fields: user_id, template_id, data, hora_inicio, hora_fim, duracao_minutos, status
- **fitness_workout_exercises** - Exercises in completed workouts
  - Fields: workout_id, exercise_id, ordem, status
- **fitness_exercise_sets** - Individual sets/reps tracking
  - Fields: workout_exercise_id, numero_serie, repeticoes_realizadas, carga, is_pr, rpe
- **fitness_personal_records** - Personal records/PRs tracking

#### Nutrition Tables:
- **fitness_foods** - Food database (global + user-created)
  - Fields: nome, marca, porcao_padrao, calorias, proteinas, carboidratos, gorduras, fibras
- **fitness_user_foods** - User's personal food entries
- **fitness_meals** - Meal entries
  - Fields: user_id, data, tipo_refeicao, horario, status, calorias_total, analise_ia, foto_url
- **fitness_meal_items** - Food items in meals
  - Fields: meal_id, food_id, quantidade, unidade, macro values

#### Body Metrics Tables:
- **fitness_body_compositions** - Bioimpedance/InBody data
  - Fields: peso, altura_cm, agua_corporal_l, proteina_kg, minerais_kg, massa_gordura_kg
  - Segmental analysis: massa_magra/gordura by body part
  - InBody specific: imc, percentual_gordura, taxa_metabolica_basal, gordura_visceral
- **fitness_progress_photos** - Progress photos

#### Health & Wellness Tables:
- **fitness_water_logs** - Water intake tracking
  - Fields: user_id, data, horario, quantidade_ml
- **fitness_sleep_logs** - Sleep tracking
  - Fields: user_id, data, hora_dormir, hora_acordar, duracao_minutos, qualidade, fatores
- **fitness_daily_notes** - Daily check-in and wellness notes
  - Fields: humor, nivel_energia, nivel_estresse, qualidade_sono, dores, pontuacao_dia
- **fitness_supplements** - Supplement definitions
- **fitness_supplements_logs** - Supplement intake tracking

#### Supplements/Medication Tables (special support for Revolade):
- **suplementos** - Supplement management
  - Fields: nome, tipo, dosagem, frequencia, horarios, dias_semana, com_refeicao, prioridade, cor
  - Stock: quantidade_estoque, alerta_estoque_minimo
- **suplemento_logs** - Supplement intake logs
  - Fields: date, scheduled_time, taken, taken_at
- **revolade_settings** - Special medication support (Revolade)
  - Fields: jejum_inicio, revolade_horario, restricao_laticinios_fim, ativo
  - Unique per user

#### Coach Tables:
- **coach_conversations** - AI coach chat conversations
  - Fields: user_id, title, created_at, updated_at
- **coach_messages** - Messages in conversations
  - Fields: conversation_id, role (user/assistant/system), content, actions (JSONB), feedback
- **coach_feedback** - User feedback on coach responses
  - Fields: user_id, message_id, feedback_type, feedback_text

#### Insights & Analytics Tables:
- **fitness_insights** - AI-generated insights
  - Fields: user_id, type, priority, category, title, description, icon, data (JSONB), action (JSONB)
  - Types: achievement, pattern, trend, alert, recommendation, prediction, optimization, correlation, milestone, anomaly
  - Categories: workout, nutrition, body, sleep, wellness, hydration, consistency, goals, health
  - Dismissible with expiry dates
- **fitness_ai_reports** - Generated reports
  - Fields: user_id, tipo (weekly/monthly/custom), periodo_inicio, periodo_fim, conteudo (JSONB)

#### Goals & Gamification Tables:
- **fitness_goals** - User goals tracking
- **fitness_achievements** - Achievement definitions
  - Fields: name, description, icon, category, tier, xpReward, criteria
- **fitness_achievements_users** - User achievement progress
  - Fields: user_id, achievementId, unlockedAt, progress

#### Settings Tables:
- **fitness_notification_settings** - Notification preferences
  - Fields: user_id, notification type settings (JSONB)
- **fitness_push_subscriptions** - PWA push notification subscriptions
  - Fields: user_id, subscription (JSONB), created_at

---

## 4. AUTHENTICATION SETUP

### Authentication Flow:
- **Supabase Auth** with email/password
- **Middleware-based protection** (middleware.ts):
  - Public routes: `/login`, `/registro`
  - Protected routes: require authentication
  - Auto-redirect unauthorized users to login
  - Auto-redirect authenticated users away from auth pages

### Client/Server Pattern:
- **Client Components**: `createBrowserClient` for browser-side operations
- **Server Components**: `createServerClient` for server-side operations
- **Admin Client**: Uses service role key for admin operations (user creation, bypass RLS)

### RLS Policies:
- All tables use Row-Level Security
- Users can only see/modify their own data
- Some public data (exercises library) available to all authenticated users
- Global foods accessible to all; user-created foods private to owner

---

## 5. GAMIFICATION FEATURES

### Components (lib/gamification/):

1. **XP & Leveling System** (`xp-calculator.ts`, `level-system.ts`)
   - XP events: workout_completed, personal_record, meal_logged, water_goal_met, etc.
   - Level progression system
   - XP requirements per level

2. **Score Calculation** (`score-calculator.ts`)
   - Daily scores based on multiple factors
   - Completion of workouts, meals, water, sleep goals

3. **Streak System** (`streak-calculator.ts`)
   - Tracks consecutive days of activity
   - Current streak vs. best streak
   - Automatic streak resets
   - Streak-based XP bonuses

4. **Achievements** (`achievements.ts`)
   - Achievement categories: streak, workout, nutrition, hydration, body, consistency, special
   - Achievement tiers: bronze, silver, gold, platinum, diamond
   - Criteria-based unlocking
   - Secret achievements
   - XP rewards

5. **Challenges** (`challenges.ts`)
   - Time-based challenges
   - Goal-based challenges
   - Difficulty levels
   - Rewards for completion

### Gamification Data in Profile:
- `streak_atual` - Current streak count
- `maior_streak` - Best streak achieved
- `pontos_totais` - Total points accumulated

### User Achievements:
- Tracked separately with unlock dates
- Progress tracking for multi-step achievements

---

## 6. ADMIN FUNCTIONALITY

### Current Admin Features:
- **User Registration Admin**: 
  - Auto-confirmation of users during registration
  - Admin API client with service role key
  - Bypass RLS for specific operations

- **User Foods Management**:
  - Admin bypass RLS to manage user food entries
  - Bulk operations support

- **No dedicated admin dashboard** currently exists
  - Admin operations handled via API routes
  - Service role key for elevated permissions

### Missing Admin Features:
- No admin panel for user management
- No admin dashboard for analytics
- No user moderation tools
- No content management system

---

## 7. USER PROFILE STRUCTURE

### Profile Model (fitness_profiles):
```
{
  id: UUID (auth.users.id),
  nome: string,
  email: string,
  data_nascimento: date,
  sexo: 'masculino' | 'feminino' | 'outro',
  
  // Physical data
  altura_cm: number,
  peso_atual: number,
  
  // Goals
  objetivo: string (format: "id|titulo|data"),
  nivel_atividade: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'atleta',
  meta_calorias_diarias: number,
  meta_proteina_g: number,
  meta_carboidrato_g: number,
  meta_gordura_g: number,
  meta_agua_ml: number (default 3000),
  meta_peso: number,
  meta_percentual_gordura: number,
  meta_massa_muscular: number,
  data_meta: date,
  
  // Sleep schedule
  hora_acordar: time (default '05:00'),
  hora_dormir: time (default '22:00'),
  
  // Medication (Revolade support)
  usa_medicamento_jejum: boolean,
  medicamento_nome: string,
  medicamento_horario: time,
  medicamento_jejum_antes_horas: number,
  medicamento_restricao_depois_horas: number,
  medicamento_restricao_tipo: string,
  
  // Gamification
  streak_atual: number,
  maior_streak: number,
  pontos_totais: number,
  
  // Special events
  ski_trip_date: date (for Switzerland ski trip goal),
  
  // Revolade specific
  revolade_enabled: boolean,
  revolade_horario: string (time, default '07:00'),
  revolade_restricao_horas: number (default 4),
  
  // Alert settings
  alert_settings: JSONB {
    notifyCritical: boolean,
    notifyHigh: boolean,
    dailySummary: boolean,
    summaryTime: string
  },
  
  // Metadata
  created_at: timestamp,
  updated_at: timestamp
}
```

### Special Features:
- **Multi-objective support**: Can save multiple goals with dates
- **Medication tracking**: Revolade and other medication support with restrictions
- **Gamification metrics**: Integrated at profile level
- **Customizable goals**: All nutrition, hydration, and fitness goals

---

## 8. KEY API ROUTES

### Authentication:
- `POST /api/auth/register` - User registration with auto-confirmation

### AI & Analysis:
- `POST /api/analyze-meal` - AI meal photo analysis
- `POST /api/analyze-food` - Food item analysis
- `POST /api/inbody/analyze` - InBody data analysis
- `POST /api/coach/chat` - AI coach conversation
- `POST /api/coach/suggestions` - Personalized suggestions

### Insights & Reports:
- `POST /api/insights/analyze` - Generate insights
- `POST /api/insights/generate` - Generate AI insights
- `POST /api/insights/predict` - Predict trends
- `POST /api/insights/report` - Generate reports

### Notifications:
- `POST /api/notifications/subscribe` - PWA push subscription
- `POST /api/notifications/send` - Send notifications
- `GET /api/notifications/history` - Notification history
- `POST /api/notifications/preferences` - Notification settings

### Utilities:
- `POST /api/share/generate-image` - Generate shareable images
- `GET/POST /api/user-foods` - User food management

---

## 9. TYPE DEFINITIONS (types/)

Key type files:
- **database.ts** - Complete Supabase schema types (41KB)
- **gamification.ts** - Gamification types (XP, Achievements, Streaks)
- **coach.ts** - Coach and chat types
- **insights.ts** - Insights and analytics types
- **sleep.ts** - Sleep tracking types
- **supplements.ts** - Supplement management types
- **notifications.ts** - Notification types
- **reports.ts** - Report generation types
- **widgets.ts** - Widget configuration types
- **wellness.ts** - Wellness and wellness check-in types
- **immersive.ts** - Immersive mode workout types
- **settings.ts** - Settings and preferences types
- **share.ts** - Social sharing types
- **analysis.ts** - Analysis and metrics types

---

## 10. CURRENT FEATURES SUMMARY

### Tracking & Logging:
- Workouts (templates + execution)
- Nutrition (meals + foods + macros)
- Water intake
- Sleep (duration, quality, factors)
- Body metrics (weight, circumference, bioimpedance)
- Progress photos
- Daily wellness check-ins
- Supplements & medications

### AI Features:
- AI Coach (FeliceCoach) with personalized suggestions
- Meal photo analysis via OpenAI
- Insights generation
- Trend prediction
- Anomaly detection
- Weekly/monthly report generation

### Gamification:
- XP system with levels
- Achievements with tiers
- Streak tracking
- Daily scores
- Challenges system
- Badge unlocking

### Social & Sharing:
- Share achievements
- Share workouts
- Share progress
- Generate shareable images

### Special Features:
- Revolade (special medication) support with restrictions
- Immersive workout mode
- PWA support with offline capability
- Push notifications
- Photo comparison tool
- Multiple report types

### Settings & Preferences:
- Profile customization
- Goal setting
- Medication/supplement management
- Notification preferences
- Appearance settings
- Privacy controls

---

## 11. MISSING/NOT YET IMPLEMENTED

- Admin dashboard
- User moderation tools
- Community features
- Social profiles
- Friend system
- Leaderboards
- Prescription import
- Wearable device integration
- Nutrition API integration (external food databases)
- Video library for exercises
- Workout prescription from coaches
- Email notifications (push-only currently)
- PDF report export
- Data backup/export

