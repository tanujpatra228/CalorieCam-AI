import { calculateDailyCaloriesBudget, calculateProteinTarget } from './profile'
import type { ActivityLevel, Goal } from './profile'

// ---------------------------------------------------------------------------
// calculateDailyCaloriesBudget
// ---------------------------------------------------------------------------

describe('calculateDailyCaloriesBudget', () => {
  // BMR = 10 * weight + 6.25 * height - 5 * 30 + 5
  // For weight=70, height=175: BMR = 700 + 1093.75 - 150 + 5 = 1648.75

  const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }

  const GOAL_ADJUSTMENTS: Record<Goal, number> = {
    lose_weight: -500,
    maintain: 0,
    gain_muscle: 300,
  }

  it.each<{ activity: ActivityLevel; goal: Goal }>([
    { activity: 'sedentary', goal: 'maintain' },
    { activity: 'light', goal: 'maintain' },
    { activity: 'moderate', goal: 'maintain' },
    { activity: 'active', goal: 'maintain' },
    { activity: 'very_active', goal: 'maintain' },
    { activity: 'moderate', goal: 'lose_weight' },
    { activity: 'moderate', goal: 'gain_muscle' },
    { activity: 'sedentary', goal: 'lose_weight' },
    { activity: 'very_active', goal: 'gain_muscle' },
  ])('returns correct value for $activity / $goal', ({ activity, goal }) => {
    const weight = 70
    const height = 175
    const bmr = 10 * weight + 6.25 * height - 5 * 30 + 5
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity])
    const expected = Math.max(1000, Math.round(tdee + GOAL_ADJUSTMENTS[goal]))

    expect(calculateDailyCaloriesBudget(weight, height, activity, goal)).toBe(expected)
  })

  it('never returns less than 1000 (floor check)', () => {
    // Use very low weight and height with lose_weight to hit the floor
    const result = calculateDailyCaloriesBudget(30, 100, 'sedentary', 'lose_weight')
    expect(result).toBe(1000)
  })

  it('returns correct BMR-based calculation for known inputs', () => {
    // BMR = 10*80 + 6.25*180 - 150 + 5 = 800 + 1125 - 150 + 5 = 1780
    // TDEE (moderate) = round(1780 * 1.55) = round(2759) = 2759
    // maintain adjustment = 0
    const result = calculateDailyCaloriesBudget(80, 180, 'moderate', 'maintain')
    expect(result).toBe(Math.round(1780 * 1.55))
  })

  it('applies lose_weight deficit of -500', () => {
    const maintain = calculateDailyCaloriesBudget(70, 175, 'moderate', 'maintain')
    const lose = calculateDailyCaloriesBudget(70, 175, 'moderate', 'lose_weight')
    // The deficit is applied before rounding, so check within a small range
    expect(maintain - lose).toBeCloseTo(500, 0)
  })

  it('applies gain_muscle surplus of +300', () => {
    const maintain = calculateDailyCaloriesBudget(70, 175, 'moderate', 'maintain')
    const gain = calculateDailyCaloriesBudget(70, 175, 'moderate', 'gain_muscle')
    expect(gain - maintain).toBeCloseTo(300, 0)
  })

  it('scales with activity level for same weight/height/goal', () => {
    const sedentary = calculateDailyCaloriesBudget(70, 175, 'sedentary', 'maintain')
    const active = calculateDailyCaloriesBudget(70, 175, 'active', 'maintain')
    const veryActive = calculateDailyCaloriesBudget(70, 175, 'very_active', 'maintain')
    expect(active).toBeGreaterThan(sedentary)
    expect(veryActive).toBeGreaterThan(active)
  })
})

// ---------------------------------------------------------------------------
// calculateProteinTarget
// ---------------------------------------------------------------------------

describe('calculateProteinTarget', () => {
  const PROTEIN_MULTIPLIERS: Record<Goal, number> = {
    lose_weight: 2.2,
    maintain: 1.6,
    gain_muscle: 2.0,
  }

  it.each<Goal>(['lose_weight', 'maintain', 'gain_muscle'])(
    'returns correct value for goal: %s',
    (goal) => {
      const weight = 70
      const expected = Math.round(weight * PROTEIN_MULTIPLIERS[goal])
      expect(calculateProteinTarget(weight, goal)).toBe(expected)
    },
  )

  it('rounds to nearest integer', () => {
    // weight=75, maintain: 75 * 1.6 = 120 (exact)
    expect(calculateProteinTarget(75, 'maintain')).toBe(120)
    // weight=73, lose_weight: 73 * 2.2 = 160.6 -> 161
    expect(calculateProteinTarget(73, 'lose_weight')).toBe(161)
  })

  it('lose_weight multiplier is highest', () => {
    const weight = 80
    const lose = calculateProteinTarget(weight, 'lose_weight')
    const gain = calculateProteinTarget(weight, 'gain_muscle')
    const maintain = calculateProteinTarget(weight, 'maintain')
    expect(lose).toBeGreaterThan(gain)
    expect(gain).toBeGreaterThan(maintain)
  })

  it('scales linearly with weight', () => {
    const target60 = calculateProteinTarget(60, 'maintain')
    const target120 = calculateProteinTarget(120, 'maintain')
    expect(target120).toBe(target60 * 2)
  })
})
