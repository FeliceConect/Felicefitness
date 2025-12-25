// FeliceFit Gamification System
// Exporta todos os módulos de gamificação

// Level System
export {
  LEVELS,
  getLevelFromXP,
  getLevelByNumber,
  getXPToNextLevel,
  getLevelProgress,
  checkLevelUp,
  getLevelInfo,
  formatXP,
  getLevelGradient,
  getLevelEmoji
} from './level-system'

// XP Calculator
export {
  XP_VALUES,
  calculateStreakBonus,
  calculateDailyXP,
  createXPEvent,
  getXPTypeIcon,
  getMaxDailyXP,
  type DailyXPBreakdown
} from './xp-calculator'

// Achievements
export {
  ACHIEVEMENTS,
  TIER_XP,
  TIER_COLORS,
  TIER_GRADIENTS,
  getAchievementsByCategory,
  getAchievementsByTier,
  getAchievementById,
  getVisibleAchievements,
  checkUnlockedAchievements,
  getAchievementProgress,
  countAchievementsByCategory,
  getNextAchievement
} from './achievements'

// Streak Calculator
export {
  areConsecutiveDays,
  formatDateString,
  isSameDay,
  getYesterdayString,
  getTodayString,
  calculateCurrentStreak,
  calculateBestStreak,
  updateStreakData,
  isStreakLost,
  getDaysUntilStreakExpires,
  isComeback,
  getInitialStreakData,
  getStreakColor,
  getStreakMessage,
  getFlameIntensity,
  getStreakCalendar
} from './streak-calculator'

// Score Calculator
export {
  SCORE_WEIGHTS,
  calculateWorkoutScore,
  calculateNutritionScore,
  calculateHydrationScore,
  calculateExtrasScore,
  calculateDailyScore,
  getScoreColor,
  getScoreGradient,
  getScoreMessage,
  getScoreEmoji,
  calculateAverageScore,
  calculateCategoryAverages,
  getWeakestCategory,
  isPerfectDay,
  getEmptyBreakdown,
  formatScore,
  getCategoryProgress
} from './score-calculator'

// Challenges
export {
  DAILY_CHALLENGES,
  WEEKLY_CHALLENGES,
  SPECIAL_CHALLENGES,
  ALL_CHALLENGES,
  getChallengesByType,
  getChallengeById,
  selectDailyChallenges,
  selectWeeklyChallenges,
  getActiveSpecialChallenges,
  activateChallenge,
  updateChallengeProgress,
  isChallengeExpired,
  getChallengeTimeRemaining,
  getDailyExpirationDate,
  getWeeklyExpirationDate,
  generateDailyChallenges,
  generateWeeklyChallenges,
  getChallengeTypeColor,
  getChallengeTypeLabel,
  getChallengeProgressPercentage
} from './challenges'
