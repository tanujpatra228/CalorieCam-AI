export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle'

export interface UserProfile {
  id: string
  created_at: string
  updated_at: string
  height_cm: number | null
  weight_kg: number | null
  daily_calories_budget: number | null
  daily_protein_target_g: number | null
  activity_level: ActivityLevel | null
  goal: Goal | null
}

export type ProfileFormData = {
  height_cm?: number
  weight_kg?: number
  daily_calories_budget?: number
  daily_protein_target_g?: number
  activity_level?: ActivityLevel
  goal?: Goal
}

// Constants for activity levels and goals
export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise, desk job'
  },
  {
    value: 'light',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week'
  },
  {
    value: 'moderate',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week'
  },
  {
    value: 'active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week'
  },
  {
    value: 'very_active',
    label: 'Extremely Active',
    description: 'Hard exercise & physical job or training twice per day'
  }
]

export const GOALS: { value: Goal; label: string; description: string }[] = [
  {
    value: 'lose_weight',
    label: 'Lose Weight',
    description: 'Reduce body fat while maintaining muscle mass'
  },
  {
    value: 'maintain',
    label: 'Maintain Weight',
    description: 'Keep current weight while improving body composition'
  },
  {
    value: 'gain_muscle',
    label: 'Gain Muscle',
    description: 'Build muscle mass while minimizing fat gain'
  }
]

// Helper functions for calculations

import { PROFILE_CALCULATION } from '@/lib/constants'

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * Assumes average age of 30 and male gender (can be adjusted later if needed)
 */
function calculateBMR(weight: number, height: number): number {
  // Mifflin-St Jeor Equation: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5 (male)
  // Using average age of 30
  return 10 * weight + 6.25 * height - 5 * PROFILE_CALCULATION.DEFAULT_AGE + 5
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on BMR and activity level
 */
function calculateTDEE(weight: number, height: number, activityLevel: ActivityLevel): number {
  const bmr = calculateBMR(weight, height)
  return Math.round(bmr * PROFILE_CALCULATION.ACTIVITY_MULTIPLIERS[activityLevel])
}

/**
 * Calculates daily calories budget based on TDEE and goal
 */
export function calculateDailyCaloriesBudget(
  weight: number,
  height: number,
  activityLevel: ActivityLevel,
  goal: Goal
): number {
  const tdee = calculateTDEE(weight, height, activityLevel)
  return Math.max(
    PROFILE_CALCULATION.MIN_CALORIES_BUDGET,
    Math.round(tdee + PROFILE_CALCULATION.GOAL_ADJUSTMENTS[goal])
  )
}

/**
 * Calculates daily protein target in grams based on weight and goal
 */
export function calculateProteinTarget(weight: number, goal: Goal): number {
  return Math.round(weight * PROFILE_CALCULATION.PROTEIN_MULTIPLIERS[goal])
} 