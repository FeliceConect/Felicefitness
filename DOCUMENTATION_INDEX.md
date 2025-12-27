# FeliceFit Documentation Index

Welcome! This documentation provides a comprehensive overview of the FeliceFit application architecture and features.

## Document Guide

### 1. **ARCHITECTURE.md** (Comprehensive - 552 lines)
   **Purpose**: Complete technical architecture documentation
   
   Contains:
   - Application structure and tech stack
   - All 18 app modules/features with descriptions
   - Complete database schema (33 tables) with field details
   - Authentication setup and flow
   - Gamification system architecture
   - Admin functionality (current limitations)
   - User profile structure and special features
   - All API routes documented
   - Type definitions inventory
   - Current features summary (tracking, AI, gamification, social, special features)
   - List of not-yet-implemented features

   **Use this when**: You need detailed information about any component, feature, or database structure.

---

### 2. **QUICK_REFERENCE.md** (Quick Lookup - 264 lines)
   **Purpose**: Fast reference guide for directory structure and feature categories
   
   Contains:
   - Visual directory map
   - Database tables grouped by category
   - Key feature breakdown by module
   - Technology stack overview
   - Migration history timeline
   - Recent git commits
   - Development notes
   - Special user features (Revolade, Ski Trip Goal)
   - Mobile and performance optimization info

   **Use this when**: You need a quick lookup of where things are located or how features are organized.

---

### 3. **FEATURES_MATRIX.md** (Data Relationships - 522 lines)
   **Purpose**: Complete mapping of features to database tables and data flow patterns
   
   Contains:
   - Feature-by-feature breakdown showing:
     - Which database tables are used
     - Data relationships and dependencies
     - Child features and sub-components
   - Comprehensive visual tree for all 18 modules
   - Data flow patterns:
     - User activity → Gamification
     - AI Coach decision making
     - Insights generation process
   - Security & access control details
   - RLS policies explained
   - Scalability considerations
   - Database optimization notes

   **Use this when**: You need to understand how features interact with data, trace data dependencies, or understand data flows.

---

## Quick Navigation

### By Topic

**Architecture & Structure**
- See ARCHITECTURE.md sections 1-2

**Database & Schema**
- See ARCHITECTURE.md section 3 and FEATURES_MATRIX.md
- See QUICK_REFERENCE.md "Database Tables" section

**Features & Modules**
- Complete list: ARCHITECTURE.md section 2
- Quick summary: QUICK_REFERENCE.md "Key Features by Module"
- Data relationships: FEATURES_MATRIX.md (entire document)

**Authentication & Security**
- See ARCHITECTURE.md section 4
- See FEATURES_MATRIX.md "Security & Access Control"

**Gamification System**
- See ARCHITECTURE.md section 5
- See QUICK_REFERENCE.md "Key Features by Module" → Gamification

**Admin Features**
- See ARCHITECTURE.md section 6
- Note: Admin functionality is currently LIMITED

**API Routes**
- See ARCHITECTURE.md section 8

**Special Features**
- Revolade (medication): QUICK_REFERENCE.md + ARCHITECTURE.md section 7
- Ski trip goal: QUICK_REFERENCE.md
- Multi-goal support: ARCHITECTURE.md section 7

---

## Key Facts at a Glance

### Application
- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **UI**: React 18 + Tailwind + Framer Motion
- **AI**: OpenAI API integration

### Database
- **Total Tables**: 33
- **Largest category**: Workouts (7 tables)
- **All tables**: Protected with Row-Level Security (RLS)
- **Public access**: Exercise library, global foods

### Modules (18 total)
- Dashboard, Workouts, Nutrition, Body Metrics, Water, Sleep
- Supplements, Wellness, Profile, Settings, Achievements
- AI Coach, Insights, Reports, Photos, Sharing, Notifications, Widgets

### Gamification
- **XP Events**: 24 types
- **Achievement Tiers**: 5 (bronze to diamond)
- **Achievement Categories**: 7 total
- **Streak Tracking**: Current + best
- **Daily Scores**: Multi-factor calculation

### Security
- Middleware-based route protection
- Row-Level Security on all user tables
- Service role key for admin operations
- Secure HTTP-only cookies

### Current Development
- Focus: Sleep fixes, gamification, service worker, OpenAI, push notifications
- Modified: lib/coach/context-builder.ts, lib/insights/analyzer.ts

---

## File Locations in Project

### Documentation (You are here)
```
/ARCHITECTURE.md           - This main architecture doc
/QUICK_REFERENCE.md        - Quick lookup guide
/FEATURES_MATRIX.md        - Feature-data relationships
/DOCUMENTATION_INDEX.md    - This index (navigation guide)
```

### Source Code Structure
```
/app/(app)/                - 18 main feature modules
/lib/                      - Core business logic
  ├── gamification/        - XP, achievements, streaks
  ├── coach/              - AI coach logic
  ├── insights/           - Analytics & predictions
  ├── supabase/           - Database clients
  ├── notifications/      - Push notifications
  └── [other modules]/
/supabase/migrations/      - 11 database migration files
/types/                    - 15 TypeScript definition files
/components/               - Reusable UI components
/hooks/                    - Custom React hooks
```

---

## Common Questions

**Q: Where are the main feature modules?**
A: `/app/(app)/` directory. See QUICK_REFERENCE.md for directory map.

**Q: How many database tables are there?**
A: 33 total. See QUICK_REFERENCE.md "Database Tables" for full list by category.

**Q: How does the gamification system work?**
A: See ARCHITECTURE.md section 5 for complete details.

**Q: What tables does the workout feature use?**
A: See FEATURES_MATRIX.md under "TREINO (Workouts)" section.

**Q: Is there an admin dashboard?**
A: No, currently very limited. See ARCHITECTURE.md section 6.

**Q: How are users authenticated?**
A: Supabase Auth with middleware protection. See ARCHITECTURE.md section 4.

**Q: What special features exist?**
A: Revolade medication support, ski trip goal, multi-objectives. See ARCHITECTURE.md section 7 and QUICK_REFERENCE.md.

**Q: How is user data protected?**
A: Row-Level Security (RLS) on all tables. See FEATURES_MATRIX.md "Security & Access Control".

**Q: What AI features are implemented?**
A: AI Coach, meal photo analysis, insights generation, report writing. See ARCHITECTURE.md section 2.

**Q: What's missing from the app?**
A: Admin dashboard, leaderboards, wearable integration, email notifications, PDF export. See ARCHITECTURE.md section 11.

---

## Document Statistics

| Document | Size | Lines | Focus |
|----------|------|-------|-------|
| ARCHITECTURE.md | 18 KB | 552 | Detailed tech overview |
| QUICK_REFERENCE.md | 7.5 KB | 264 | Quick navigation |
| FEATURES_MATRIX.md | 15 KB | 522 | Data relationships |
| **Total** | **40.5 KB** | **1,338** | **Complete reference** |

---

## How to Use These Docs

### For New Contributors
1. Start with QUICK_REFERENCE.md to understand directory structure
2. Read ARCHITECTURE.md section 2 to learn about features
3. Use FEATURES_MATRIX.md to understand data relationships

### For Understanding Features
1. Find the module in ARCHITECTURE.md section 2
2. Check related tables in QUICK_REFERENCE.md
3. Trace data relationships in FEATURES_MATRIX.md

### For Understanding Database
1. See QUICK_REFERENCE.md "Database Tables" for overview
2. Find detailed table info in ARCHITECTURE.md section 3
3. Trace relationships in FEATURES_MATRIX.md

### For Implementing New Features
1. Check ARCHITECTURE.md to avoid duplicating functionality
2. Review FEATURES_MATRIX.md for similar patterns
3. Follow existing patterns for consistency

---

## Recent Changes

**Latest commits** (from git log):
1. fix: correcoes de sono, gamificacao, SW e OpenAI
2. fix: refresh automático, treino do dia e notificações push
3. fix: melhorias no sistema de notificações push
4. fix: timer iOS e persistência de treino em andamento
5. fix: timeout para verificação de service worker em notificações

**Currently modified files**:
- lib/coach/context-builder.ts
- lib/insights/analyzer.ts

---

## Technology Stack Reference

**Frontend**
- Next.js 14.2
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI

**Backend**
- Supabase (PostgreSQL)
- Supabase Auth
- OpenAI API

**Infrastructure**
- PWA (Progressive Web App)
- Service Worker
- Push Notifications

---

## Support & Maintenance

This documentation was automatically generated from a complete codebase exploration covering:
- 11 migration files (2,472 lines)
- 33 database tables
- 18 main feature modules
- Type definitions and APIs
- Authentication and security
- Gamification system
- AI integrations

All information is current as of: December 27, 2025

---

**Start with**: QUICK_REFERENCE.md for orientation, then dive into specific documents based on your needs.

Good luck with your work on FeliceFit!
