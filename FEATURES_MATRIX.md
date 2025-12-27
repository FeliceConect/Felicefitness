# FeliceFit - Features & Data Relationships Matrix

## Feature Map with Data Dependencies

```
DASHBOARD (Home)
├── Greeting Header
├── Greeting & Daily Score
│   └── fitness_daily_notes
├── Stats Overview
│   ├── fitness_profiles (streak, points)
│   └── fitness_daily_notes (pontuacao_dia)
├── Water Card
│   └── fitness_water_logs
├── Meals Card
│   └── fitness_meals + fitness_meal_items
├── Workout Card
│   └── fitness_workouts
├── Streak Badge
│   └── fitness_profiles (streak_atual, maior_streak)
└── Quick Actions Links
    ├── Treino
    ├── Alimentacao
    ├── Agua
    └── Corpo

TREINO (Workouts)
├── Create/Edit Template
│   ├── fitness_workout_templates
│   └── fitness_workout_template_exercises
│       └── fitness_exercises_library
│
├── Execute Workout
│   ├── fitness_workouts
│   ├── fitness_workout_exercises
│   └── fitness_exercise_sets
│       ├── Updates fitness_profiles (pontos_totais on PR)
│       └── May unlock fitness_achievements_users
│
├── History View
│   └── fitness_workouts + exercises
│
├── Immersive Mode
│   ├── Real-time set tracking
│   ├── Timer functionality
│   └── RPE and personal record detection
│
└── Exercise Library
    └── fitness_exercises_library

ALIMENTACAO (Nutrition)
├── Log Meal
│   ├── fitness_meals
│   ├── fitness_meal_items
│   ├── fitness_foods (lookup)
│   └── OpenAI API (photo analysis)
│
├── Food Database
│   ├── fitness_foods (global + user)
│   └── fitness_user_foods
│
├── Meal Analysis
│   ├── OpenAI API
│   └── fitness_meals (analise_ia field)
│
├── Nutrition History
│   ├── fitness_meals
│   └── fitness_meal_items
│
└── Goals Tracking
    ├── fitness_profiles (meta_calorias, macros)
    ├── fitness_meals (daily totals)
    └── fitness_insights (recommendations)

CORPO (Body Metrics)
├── Weight Tracking
│   ├── fitness_body_compositions
│   └── fitness_profiles (peso_atual, meta_peso)
│
├── Circumference Measurements
│   └── fitness_body_compositions (campo specific fields)
│
├── InBody/Bioimpedance
│   └── fitness_body_compositions (full set of InBody fields)
│       └── fitness_insights (body composition alerts)
│
├── Evolution Graphs
│   ├── fitness_body_compositions (historical)
│   └── fitness_progress_photos (visual timeline)
│
└── History View
    ├── fitness_body_compositions
    └── fitness_progress_photos

AGUA (Water)
├── Log Water Intake
│   └── fitness_water_logs
│
├── Daily Goal Progress
│   ├── fitness_profiles (meta_agua_ml)
│   └── fitness_water_logs (daily total)
│
└── History View
    └── fitness_water_logs

SONO (Sleep)
├── Register Sleep
│   └── fitness_sleep_logs
│
├── Sleep Quality Tracking
│   ├── fitness_sleep_logs (duracao_minutos, qualidade)
│   ├── fitness_daily_notes (qualidade_sono)
│   └── fitness_insights (sleep patterns)
│
├── Sleep Insights
│   └── fitness_insights (type: sleep patterns)
│
└── History View
    └── fitness_sleep_logs

SUPLEMENTOS (Supplements)
├── Supplement Management
│   ├── suplementos (definitions)
│   └── suplemento_logs (tracking)
│
├── Stock Management
│   └── suplementos (quantidade_estoque, alerta_estoque_minimo)
│
├── Schedule & Reminders
│   ├── suplementos (horarios, dias_semana, frequencia)
│   └── fitness_push_subscriptions (notifications)
│
├── Special Medication (Revolade)
│   ├── revolade_settings (user-specific)
│   └── suplementos (restricted entries)
│
└── Intake Logs
    └── suplemento_logs (date, time, taken status)

BEM-ESTAR (Wellness)
├── Daily Check-in
│   └── fitness_daily_notes (humor, energia, estresse, qualidade_sono)
│
├── Wellness History
│   └── fitness_daily_notes (historical data)
│
├── Wellness Insights
│   └── fitness_insights (wellness category)
│
├── Meditation Support
│   └── (UI feature, no DB tracking yet)
│
├── Gratitude Journal
│   └── fitness_daily_notes (notas field)
│
├── Breathing Exercises
│   └── (UI feature, no DB tracking yet)
│
└── Recovery Tracking
    ├── fitness_daily_notes (nivel_estresse)
    └── fitness_insights (recovery recommendations)

PERFIL (Profile)
├── Profile Display
│   └── fitness_profiles (all basic data)
│
├── Body Data Summary
│   ├── fitness_profiles (altura_cm, peso_atual)
│   └── fitness_body_compositions (latest)
│
├── Objective Management
│   ├── fitness_profiles (objetivo field)
│   └── Progress calculation based on date
│
├── Recent Achievements
│   └── fitness_achievements_users (latest 3)
│
├── Photo Upload
│   └── fitness_progress_photos (foto_url)
│
└── Profile Editing
    └── fitness_profiles (update operation)

CONFIGURACOES (Settings)
├── Account Settings
│   └── fitness_profiles (nome, email, data_nascimento, etc)
│
├── Notification Preferences
│   └── fitness_notification_settings
│
├── Workout Configuration
│   ├── fitness_workout_templates (user preferences)
│   └── fitness_profiles (nivel_atividade)
│
├── Nutrition Goals
│   └── fitness_profiles (meta_calorias, macros)
│
├── Appearance/Theme
│   └── (Client-side only, localStorage)
│
├── Privacy Settings
│   └── (RLS policies in database)
│
├── Revolade Settings
│   ├── revolade_settings (user-specific)
│   └── fitness_profiles (revolade_enabled, revolade_horario, revolade_restricao_horas)
│
└── About Page
    └── (Static content)

CONQUISTAS (Achievements)
├── Achievement Display
│   ├── fitness_achievements (definitions)
│   └── fitness_achievements_users (unlock status)
│
├── Progress Tracking
│   └── fitness_achievements_users (progress field)
│
├── Categories
│   ├── Streak
│   │   └── fitness_profiles (streak tracking)
│   ├── Workout
│   │   └── fitness_workouts + fitness_exercise_sets
│   ├── Nutrition
│   │   └── fitness_meals + fitness_meal_items
│   ├── Hydration
│   │   └── fitness_water_logs
│   ├── Body
│   │   └── fitness_body_compositions + fitness_progress_photos
│   ├── Consistency
│   │   └── fitness_daily_notes (daily completion)
│   └── Special
│       └── (Custom criteria)
│
└── Tier System
    ├── Bronze
    ├── Silver
    ├── Gold
    ├── Platinum
    └── Diamond

COACH (AI Coach)
├── Chat Interface
│   ├── coach_conversations (session)
│   └── coach_messages (message history)
│
├── Context Building
│   ├── fitness_profiles (user data)
│   ├── fitness_workouts (recent workouts)
│   ├── fitness_meals (recent nutrition)
│   ├── fitness_water_logs (hydration)
│   ├── fitness_sleep_logs (sleep data)
│   ├── fitness_daily_notes (wellness)
│   └── fitness_body_compositions (metrics)
│
├── AI Integration
│   └── OpenAI API (chat completion)
│
├── Suggestions
│   ├── Workout recommendations
│   ├── Nutrition advice
│   ├── Recovery tips
│   └── Motivation messages
│
├── Feedback Collection
│   └── coach_feedback (positive/negative)
│
└── History Management
    ├── coach_conversations (listing)
    └── coach_messages (retrieval)

INSIGHTS (Analytics)
├── AI Analysis
│   ├── OpenAI API (analysis)
│   └── fitness_insights (storage)
│
├── Insight Types
│   ├── Achievement (special moments)
│   ├── Pattern (behavioral trends)
│   ├── Trend (progressive changes)
│   ├── Alert (warnings/concerns)
│   ├── Recommendation (actionable advice)
│   ├── Prediction (forecasts)
│   ├── Optimization (efficiency tips)
│   ├── Correlation (relationship analysis)
│   ├── Milestone (goal progress)
│   └── Anomaly (unusual data)
│
├── Categories
│   ├── Workout
│   ├── Nutrition
│   ├── Body
│   ├── Sleep
│   ├── Wellness
│   ├── Hydration
│   ├── Consistency
│   ├── Goals
│   └── Health
│
├── Priority Levels
│   ├── Low
│   ├── Medium
│   ├── High
│   └── Critical
│
├── Data Sources
│   ├── fitness_workouts
│   ├── fitness_meals
│   ├── fitness_water_logs
│   ├── fitness_sleep_logs
│   ├── fitness_body_compositions
│   ├── fitness_daily_notes
│   └── fitness_achievements_users
│
└── Management
    ├── fitness_insights (dismissible, expiry)
    └── Automatic cleanup of old insights

RELATORIOS (Reports)
├── Weekly Reports
│   ├── fitness_ai_reports (generation)
│   └── Source data:
│       ├── fitness_workouts (7-day summary)
│       ├── fitness_meals (nutrition summary)
│       ├── fitness_water_logs (hydration)
│       ├── fitness_sleep_logs (sleep quality)
│       └── fitness_daily_notes (overall wellness)
│
├── Monthly Reports
│   ├── fitness_ai_reports (generation)
│   └── Source data (30-day aggregates)
│
├── Evolution Reports
│   └── fitness_body_compositions (progress over time)
│
├── Custom Reports
│   └── Date range selection and generation
│
└── Report Generation
    └── OpenAI API (content creation)

FOTOS (Photos)
├── Photo Timeline
│   └── fitness_progress_photos (ordered by date)
│
├── Photo Comparison
│   ├── fitness_progress_photos (before/after)
│   └── Visual side-by-side display
│
├── Photo Metadata
│   ├── Data stored with photo
│   ├── Peso no dia (weight on photo date)
│   ├── Percentual gordura (fat % on date)
│   └── Notas (user notes)
│
└── Management
    ├── Create/delete
    └── Mark favorites

COMPARTILHAR (Sharing)
├── Share Achievements
│   ├── fitness_achievements_users (selected)
│   └── Generate shareable image
│
├── Share Workouts
│   ├── fitness_workouts (selected)
│   └── Generate summary image
│
├── Share Streaks
│   ├── fitness_profiles (current streak)
│   └── Generate streak image
│
├── Share Progress
│   ├── fitness_body_compositions (before/after)
│   └── Generate progress image
│
├── Generate Images
│   └── /api/share/generate-image (uses OpenAI)
│
└── Social Integration
    ├── Image generation
    └── (Actual sharing handled by device/browser)

NOTIFICACOES (Notifications)
├── Notification History
│   └── (Push notification records)
│
├── Push Subscriptions
│   └── fitness_push_subscriptions (JSONB subscription data)
│
├── Notification Types
│   ├── Achievement unlocks
│   ├── Goal reminders
│   ├── Workout suggestions
│   ├── Meal reminders
│   └── Supplement reminders
│
└── Notification Settings
    └── fitness_notification_settings (preferences)

WIDGETS
├── Widget Customization
│   └── (Client-side configuration)
│
└── Dashboard Widgets
    ├── Daily Score Widget
    ├── Water Intake Widget
    ├── Workout Overview Widget
    ├── Meals Widget
    └── Streak Widget
```

## Data Flow Patterns

### User Activity Triggers Gamification
```
User Action (workout, meal, etc)
  ↓
Log to appropriate table (fitness_workouts, fitness_meals, etc)
  ↓
Calculate XP & score (lib/gamification)
  ↓
Update fitness_profiles (pontos_totais, streak)
  ↓
Check achievement criteria
  ↓
Unlock achievement if criteria met → fitness_achievements_users
  ↓
Generate insights from data (lib/insights)
  ↓
Store insights → fitness_insights
  ↓
Send notifications via push subscriptions
```

### AI Coach Decision Making
```
User sends message
  ↓
coach_messages INSERT
  ↓
Build context from all profile data (context-builder.ts)
  ↓
Call OpenAI API with context
  ↓
Get response from assistant
  ↓
coach_messages INSERT (assistant response)
  ↓
Update coach_conversations updated_at
  ↓
Check for actions in response
  ↓
Store feedback option for user
```

### Insights Generation
```
Daily trigger or user request
  ↓
Aggregate user data across all tables
  ↓
Run analyzer.ts functions:
  ├── Pattern detection
  ├── Prediction logic
  ├── Alert generation
  └── Recommendation logic
  ↓
Call OpenAI API for text generation
  ↓
Create fitness_insights records
  ↓
Set priority & category
  ↓
Mark for notifications if high priority
  ↓
Push notifications if enabled
```

## Security & Access Control

### Row-Level Security (RLS)
- All user data tables have RLS enabled
- Users can only access their own records
- Exceptions:
  - fitness_exercises_library: PUBLIC SELECT
  - fitness_foods: SELECT own + global (user_id IS NULL)

### Admin Operations
- Uses supabaseAdmin client with service role key
- Bypass RLS for:
  - User creation with auto-confirmation
  - Food management operations
  - System maintenance

### Protected Routes
- /login and /registro: public
- All /app/* routes: require authentication
- Middleware enforces redirection
- Token stored in secure HTTP-only cookies

## Scalability Considerations

### Database Optimizations
- Proper indexes on frequently queried columns
- Timestamp triggers for automatic updated_at
- Unique constraints where needed
- Foreign key relationships with CASCADE delete

### Performance Features
- Pagination in list views
- Lazy loading for images
- Image optimization
- Database query optimization
- RLS for data filtering at DB level

### Monitoring & Maintenance
- Automatic cleanup functions for old data
- Insight expiry mechanism
- Notification history limits
- Database function performance

