'use server'

import { createClient } from '@/utils/supabase/server'
import { AnalysisLog } from '@/types/database'
import { UserProfile } from '@/types/profile'
import { AuthError, DatabaseError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'
import { roundToTwoDecimals } from '@/lib/utils'

export interface DailyGoalData {
  date: string
  calories: number
  protein: number
  caloriesTarget: number
  proteinTarget: number
  caloriesAchieved: boolean
  proteinAchieved: boolean
  achieved: boolean
  caloriesPercentage: number
  proteinPercentage: number
}

/**
 * Gets daily goals data for a date range
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of daily goal data
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If fetching fails
 */
export async function getDailyGoalsData(
  startDate: string,
  endDate: string,
): Promise<DailyGoalData[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to view goals history')
  }

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('daily_calories_budget, daily_protein_target_g')
      .eq('id', user.id)
      .single(),
    supabase
      .from('analysis_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true }),
  ])

  if (profileResult.error && profileResult.error.code !== 'PGRST116') {
    const errorMessage = formatErrorForLogging(profileResult.error)
    console.error('Error fetching profile:', errorMessage)
    throw new DatabaseError(
      'Failed to fetch profile',
      profileResult.error.code,
      profileResult.error,
    )
  }

  if (logsResult.error) {
    const errorMessage = formatErrorForLogging(logsResult.error)
    console.error('Error fetching analysis logs:', errorMessage)
    throw new DatabaseError(
      'Failed to fetch analysis logs',
      logsResult.error.code,
      logsResult.error,
    )
  }

  const profile = profileResult.data as UserProfile | null
  const logs = (logsResult.data || []) as AnalysisLog[]

  const caloriesTarget = profile?.daily_calories_budget ?? 0
  const proteinTarget = profile?.daily_protein_target_g ?? 0

  const dailyDataMap = new Map<string, { calories: number; protein: number }>()

  logs.forEach((log) => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    const existing = dailyDataMap.get(date) || { calories: 0, protein: 0 }

    const caloriesToAdd = roundToTwoDecimals(log.macros.calories_kcal - (log.total_calories_to_digest_kcal || 0))
    dailyDataMap.set(date, {
      calories: roundToTwoDecimals(existing.calories + caloriesToAdd),
      protein: roundToTwoDecimals(existing.protein + log.macros.protein_g),
    })
  })

  const start = new Date(startDate)
  const end = new Date(endDate)
  const result: DailyGoalData[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayData = dailyDataMap.get(dateStr) || { calories: 0, protein: 0 }

    const caloriesPercentage = caloriesTarget > 0
      ? Math.min((dayData.calories / caloriesTarget) * 100, 200)
      : 0
    const proteinPercentage = proteinTarget > 0
      ? Math.min((dayData.protein / proteinTarget) * 100, 200)
      : 0

    const caloriesAchieved = caloriesTarget > 0 && dayData.calories >= caloriesTarget
    const proteinAchieved = proteinTarget > 0 && dayData.protein >= proteinTarget
    const achieved = caloriesAchieved || proteinAchieved

    result.push({
      date: dateStr,
      calories: roundToTwoDecimals(dayData.calories),
      protein: roundToTwoDecimals(dayData.protein),
      caloriesTarget,
      proteinTarget,
      caloriesAchieved,
      proteinAchieved,
      achieved,
      caloriesPercentage,
      proteinPercentage,
    })
  }

  return result
}

