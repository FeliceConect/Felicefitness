/**
 * Regra única — quando uma atividade física conta como "treino" pra streak,
 * daily score e conquistas. Mantém paridade com a função SQL
 * `fn_activity_counts_as_workout` (supabase/migrations/20260525_streak_light_30min.sql).
 *
 * Critério:
 * - intensidade `moderado` / `intenso` / `muito_intenso` com `duracao ≥ 20min`, OU
 * - intensidade `leve` com `duracao ≥ 30min` (caminhada longa também preserva
 *   o streak — só leve curtinha é que não conta).
 *
 * Filtro PostgREST pronto pra `.or(...)` no Supabase JS client.
 */
export const QUALIFYING_ACTIVITY_OR_FILTER =
  'and(duration_minutes.gte.20,intensity.in.(moderado,intenso,muito_intenso)),' +
  'and(duration_minutes.gte.30,intensity.eq.leve)'
