import { startOfYear, endOfYear, eachDayOfInterval, getWeek, getDay, format } from 'date-fns'
import { DailyGoalData } from '@/services/goals-history-service'

export type GoalView = 'protein' | 'calories'

export interface GridDay {
  date: string
  value: number
  percentage: number
  achieved: boolean
  calories: number
  protein: number
  caloriesTarget: number
  proteinTarget: number
}

export interface WeekData {
  week: number
  days: (GridDay | null)[]
}

const ACHIEVEMENT_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
} as const

/**
 * Calculates achievement level based on percentage
 * @param percentage - Achievement percentage (0-200)
 * @returns Achievement level (0-4)
 */
export function calculateAchievementLevel(percentage: number): number {
  if (percentage === 0) return ACHIEVEMENT_LEVELS.NONE
  if (percentage < 25) return ACHIEVEMENT_LEVELS.LOW
  if (percentage < 50) return ACHIEVEMENT_LEVELS.MEDIUM
  if (percentage < 75) return ACHIEVEMENT_LEVELS.HIGH
  return ACHIEVEMENT_LEVELS.VERY_HIGH
}

/**
 * Gets color intensity class based on achievement level
 * @param level - Achievement level (0-4)
 * @returns Tailwind CSS class for color intensity
 */
export function getColorIntensity(level: number): string {
  switch (level) {
    case ACHIEVEMENT_LEVELS.NONE:
      return 'bg-muted'
    case ACHIEVEMENT_LEVELS.LOW:
      return 'bg-green-500/20'
    case ACHIEVEMENT_LEVELS.MEDIUM:
      return 'bg-green-500/40'
    case ACHIEVEMENT_LEVELS.HIGH:
      return 'bg-green-500/60'
    case ACHIEVEMENT_LEVELS.VERY_HIGH:
      return 'bg-green-500'
    default:
      return 'bg-muted'
  }
}

/**
 * Gets year range (start and end dates)
 * @param year - Year number
 * @returns Object with startDate and endDate as ISO strings
 */
export function getYearRange(year: number): { startDate: string; endDate: string } {
  const start = startOfYear(new Date(year, 0, 1))
  const end = endOfYear(new Date(year, 11, 31))
  
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * Transforms daily data into grid format (weeks × days)
 * @param dailyData - Array of daily goal data
 * @param view - Current view ('protein' or 'calories')
 * @returns Array of week data with days
 */
export function groupDaysByWeek(
  dailyData: DailyGoalData[],
  view: GoalView,
): WeekData[] {
  if (dailyData.length === 0) return []

  const dataMap = new Map(dailyData.map((d) => [d.date, d]))
  const firstDate = new Date(dailyData[0].date)
  const lastDate = new Date(dailyData[dailyData.length - 1].date)

  const allDays = eachDayOfInterval({ start: firstDate, end: lastDate })
  const weeksMap = new Map<number, (GridDay | null)[]>()

  allDays.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const weekNum = getWeek(day, { weekStartsOn: 1 })
    const dayOfWeek = getDay(day) === 0 ? 6 : getDay(day) - 1

    if (!weeksMap.has(weekNum)) {
      weeksMap.set(weekNum, new Array(7).fill(null))
    }

    const week = weeksMap.get(weekNum)!
    const dayData = dataMap.get(dateStr)

    if (dayData) {
      const percentage = view === 'protein' 
        ? dayData.proteinPercentage 
        : dayData.caloriesPercentage
      const value = view === 'protein' 
        ? dayData.protein 
        : dayData.calories
      const achieved = view === 'protein'
        ? dayData.proteinAchieved
        : dayData.caloriesAchieved

      week[dayOfWeek] = {
        date: dateStr,
        value,
        percentage,
        achieved,
        calories: dayData.calories,
        protein: dayData.protein,
        caloriesTarget: dayData.caloriesTarget,
        proteinTarget: dayData.proteinTarget,
      }
    } else {
      week[dayOfWeek] = {
        date: dateStr,
        value: 0,
        percentage: 0,
        achieved: false,
        calories: 0,
        protein: 0,
        caloriesTarget: 0,
        proteinTarget: 0,
      }
    }
  })

  return Array.from(weeksMap.entries())
    .map(([week, days]) => ({ week, days }))
    .sort((a, b) => a.week - b.week)
}

/**
 * Calculates streak statistics
 * @param dailyData - Array of daily goal data
 * @param view - Current view ('protein' or 'calories')
 * @returns Object with current streak, best streak, and total days achieved
 */
export function calculateStreaks(
  dailyData: DailyGoalData[],
  view: GoalView,
): { currentStreak: number; bestStreak: number; totalDays: number } {
  if (dailyData.length === 0) {
    return { currentStreak: 0, bestStreak: 0, totalDays: 0 }
  }

  const sortedData = [...dailyData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  let totalDays = 0

  const today = format(new Date(), 'yyyy-MM-dd')
  let isCurrentStreak = true

  for (let i = sortedData.length - 1; i >= 0; i--) {
    const day = sortedData[i]
    const achieved = view === 'protein' 
      ? day.proteinAchieved 
      : day.caloriesAchieved

    if (achieved) {
      totalDays++
      tempStreak++

      if (isCurrentStreak && day.date <= today) {
        currentStreak++
      } else {
        isCurrentStreak = false
      }

      bestStreak = Math.max(bestStreak, tempStreak)
    } else {
      if (day.date < today) {
        isCurrentStreak = false
      }
      tempStreak = 0
    }
  }

  return { currentStreak, bestStreak, totalDays }
}

/**
 * Gets month labels for the graph
 * @param year - Year number
 * @returns Array of month labels with their positions
 */
export function getMonthLabels(year: number): Array<{ month: string; week: number }> {
  const months: Array<{ month: string; week: number }> = []

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(year, i, 1)
    const week = getWeek(monthDate, { weekStartsOn: 1 })
    months.push({
      month: format(monthDate, 'MMM'),
      week,
    })
  }

  return months.filter((m, i, arr) => 
    i === 0 || m.week !== arr[i - 1].week
  )
}

