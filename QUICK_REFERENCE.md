# FeliceFit - Quick Reference Guide

## Directory Map

```
/Users/felice/FeliceFit/
├── app/(app)/                          # Protected app routes
│   ├── dashboard/                      # Home dashboard
│   ├── treino/                         # Workouts
│   ├── alimentacao/                    # Nutrition
│   ├── corpo/                          # Body metrics
│   ├── agua/                           # Water tracking
│   ├── sono/                           # Sleep logs
│   ├── suplementos/                    # Supplements
│   ├── bem-estar/                      # Wellness check-in
│   ├── perfil/                         # User profile
│   ├── configuracoes/                  # Settings
│   ├── conquistas/                     # Achievements
│   ├── coach/                          # AI Coach
│   ├── insights/                       # Analytics
│   ├── relatorios/                     # Reports
│   ├── fotos/                          # Progress photos
│   ├── compartilhar/                   # Sharing
│   ├── notificacoes/                   # Notifications
│   └── widgets/                        # Dashboard widgets
│
├── app/(auth)/                         # Public auth routes
│   ├── login/
│   └── registro/
│
├── app/api/                            # API endpoints
│   ├── auth/
│   ├── coach/
│   ├── insights/
│   ├── notifications/
│   ├── analyze-meal/
│   ├── analyze-food/
│   └── ...
│
├── lib/                                # Core logic
│   ├── gamification/                   # XP, achievements, streaks
│   ├── coach/                          # AI coach logic
│   ├── insights/                       # Analytics & prediction
│   ├── supabase/                       # DB & auth clients
│   ├── notifications/                  # Push notifications
│   ├── openai/                         # OpenAI integration
│   ├── nutrition/                      # Nutrition calculations
│   ├── reports/                        # Report generation
│   └── ...
│
├── components/                         # Reusable UI components
├── hooks/                              # Custom React hooks
├── types/                              # TypeScript types
├── styles/                             # Global CSS
├── public/                             # PWA assets & icons
├── supabase/migrations/                # Database migrations
└── middleware.ts                       # Auth routing
```

## Database Tables (33 total)

### User Management (1)
- fitness_profiles

### Workouts (7)
- fitness_exercises_library
- fitness_workout_templates
- fitness_workout_template_exercises
- fitness_workouts
- fitness_workout_exercises
- fitness_exercise_sets
- fitness_personal_records

### Nutrition (4)
- fitness_foods
- fitness_user_foods
- fitness_meals
- fitness_meal_items

### Body (2)
- fitness_body_compositions
- fitness_progress_photos

### Health (3)
- fitness_water_logs
- fitness_sleep_logs
- fitness_daily_notes

### Supplements (3)
- suplementos
- suplemento_logs
- revolade_settings

### Coach (3)
- coach_conversations
- coach_messages
- coach_feedback

### Insights (2)
- fitness_insights
- fitness_ai_reports

### Gamification (4)
- fitness_goals
- fitness_achievements
- fitness_achievements_users
- (XP/streak data stored in fitness_profiles)

### Settings (2)
- fitness_notification_settings
- fitness_push_subscriptions

### Legacy (1)
- fitness_supplements (older, see suplementos)

## Key Features by Module

### Gamification (lib/gamification/)
Files: achievements.ts, challenges.ts, level-system.ts, score-calculator.ts, streak-calculator.ts, xp-calculator.ts

Key Components:
- XP Events: 24 types (workout_completed, personal_record, meal_logged, etc.)
- Levels: Progression system with color coding
- Streaks: Daily tracking with reset logic
- Achievements: 5 tiers (bronze to diamond), 7 categories
- Challenges: Time & goal-based with rewards
- Scores: Daily calculation system

### Coach (lib/coach/)
Files: context-builder.ts, prompts.ts, actions.ts

Key Features:
- Context-aware suggestions based on user data
- Personalized workout recommendations
- Nutrition coaching
- Motivation and accountability
- Message history management
- Feedback collection

### Insights (lib/insights/)
Files: analyzer.ts, alerts.ts, patterns.ts, predictions.ts, recommendations.ts, prompts.ts

Key Features:
- Trend analysis
- Pattern detection
- Predictive analytics
- Alert generation
- Anomaly detection
- Performance recommendations

### Notifications
PWA push notifications:
- Subscription management
- History tracking
- Preference settings
- Scheduled notifications

## Authentication & Security

- Supabase Auth (email/password)
- Row-Level Security (RLS) on all tables
- Service role key for admin operations
- Middleware-based route protection
- Auto-redirect logic

## API Integration

### OpenAI
- Meal photo analysis
- Coach conversations
- Report generation
- Insights creation

### Supabase
- All CRUD operations
- Real-time subscriptions
- File storage (photos, documents)
- Auth management

## Migration History

Latest migrations (in chronological order):
1. 001_create_tables.sql - Core tables (989 lines)
2. 002_seed_data.sql - Initial data (204 lines)
3. 003_functions.sql - DB functions (459 lines)
4. 20241225160000_coach_tables.sql - Coach feature
5. 20241225190000_insights_tables.sql - Insights feature
6. 20241225_create_push_subscriptions.sql - Push notifications
7. 20241225_suplementos.sql - Supplements & Revolade
8. 20241226_create_workout_templates.sql - Workout templates
9. 20241226_add_circumference_fields.sql - Body measurements
10. 20241226_update_sleep_logs.sql - Sleep improvements
11. 20241227_user_foods.sql - User food entries

## Recent Changes (from git log)

Latest commits:
1. fix: correcoes de sono, gamificacao, SW e OpenAI
2. fix: refresh automático, treino do dia e notificações push
3. fix: melhorias no sistema de notificações push
4. fix: timer iOS e persistência de treino em andamento
5. fix: timeout para verificação de service worker em notificações

## Development Notes

### Modified Files (Current Changes)
- lib/coach/context-builder.ts
- lib/insights/analyzer.ts

### Technology Stack
- Next.js 14.2
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (PostgreSQL)
- OpenAI API

### Custom Hooks
Located in `/hooks/` directory (auto-imported)
- useProfile
- useWorkout
- useNutrition
- useGamification
- And many more...

## Special User Features

### Revolade Support
Special medication tracking for (presumably) the app owner:
- Specific times and restrictions
- Fasting period tracking
- Dairy restriction windows
- Special settings table with 1:1 relationship

### Ski Trip Goal
Pre-configured goal (Swiss ski trip March 2026):
- Stored in fitness_profiles as special objective
- Date-based progress tracking

### Multi-Goal Support
Users can set custom objectives with:
- Goal types (predefined)
- Custom titles
- Target dates
- Progress calculation
- Data stored as "id|title|date" format

## Mobile Optimization

- PWA with offline support
- Service worker integration
- Mobile-first UI
- Touch-optimized components
- Push notifications

## Performance Features

- Image optimization
- Code splitting
- Database indexing
- RLS for security
- Query optimization in migrations

