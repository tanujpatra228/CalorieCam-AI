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
export function calculateBMR(weight: number, height: number, activityLevel: ActivityLevel): number {
  // Using Mifflin-St Jeor Equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * 30 + 5 // Assuming average age of 30
  
  // Activity multipliers
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  
  return Math.round(baseBMR * activityMultipliers[activityLevel])
}

export function calculateProteinTarget(weight: number, goal: Goal): number {
  // Protein multipliers based on goals (g per kg of bodyweight)
  const proteinMultipliers: Record<Goal, number> = {
    lose_weight: 2.2, // Higher protein for weight loss to preserve muscle
    maintain: 1.6,    // Moderate protein for maintenance
    gain_muscle: 2.0  // High protein for muscle gain
  }
  
  return Math.round(weight * proteinMultipliers[goal])
} 