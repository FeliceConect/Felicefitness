export { getProfile, updateProfile } from './profile'
export type { Profile } from './profile'

export { getWaterLogs, addWaterLog, deleteWaterLog } from './water'
export type { WaterLog } from './water'

export { getWorkouts, getWorkoutById } from './workouts'
export type { Workout } from './workouts'

export { getDailyMeals } from './meals'
export type { Meal } from './meals'

export {
  getPatientAppointments,
  getNextAppointment,
  getProfessionalAppointments,
  confirmAppointment,
  requestReschedule,
} from './appointments'

export { ServiceError, getCurrentUserId } from './base'

export {
  awardPoints,
  awardWorkoutPoints,
  awardMealsPoints,
  awardWaterGoalPoints,
  awardSleepPoints,
  awardWellnessCheckinPoints,
  awardPRPoints,
  awardFormCompletedPoints,
  awardStreak7Points,
  awardStreak30Points,
} from './points'
export type { PointAction, AwardPointsResult } from './points'
