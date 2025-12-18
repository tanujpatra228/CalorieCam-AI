'use server'

import { createClient } from '@/utils/supabase/server'
import { AnalysisData, AnalysisLog } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { ROUTES } from '@/lib/constants'
import { AuthError, DatabaseError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'

/**
 * Logs an analysis result to the database
 * @param analysisData - The analysis data to log
 * @param imageUrl - The URL of the analyzed image
 * @returns The created analysis log entry
 * @throws {AuthError} If user is not authenticated
 * @throws {AnalysisError} If logging fails
 */
export async function logAnalysis(
  analysisData: AnalysisData,
  imageUrl: string,
): Promise<AnalysisLog> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to log analysis')
  }

  const { data, error } = await supabase
    .from('analysis_logs')
    .insert({
      user_id: user.id,
      dish_name: analysisData.dish_name,
      total_weight_g: analysisData.total_weight_g,
      total_digestion_time_m: analysisData.total_digestion_time_m,
      total_calories_to_digest_kcal: analysisData.total_calories_to_digest_kcal,
      image_url: imageUrl,
      macros: analysisData.macros,
      micros: analysisData.micros,
      notes: analysisData.notes,
    })
    .select()
    .single()

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error('Error logging analysis:', errorMessage)
    throw new DatabaseError(
      `Failed to log analysis: ${error.message}`,
      error.code,
      error,
    )
  }

  // Revalidate the analysis history page
  revalidatePath(ROUTES.PROTECTED_ANALYSIS_HISTORY)

  return data as AnalysisLog
}

/**
 * Gets all analysis logs for the authenticated user
 * @returns Array of analysis logs
 * @throws {AuthError} If user is not authenticated
 * @throws {AnalysisError} If fetching fails
 */
export async function getAnalysisLogs(): Promise<AnalysisLog[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to view analysis logs')
  }

  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error('Error fetching analysis logs:', errorMessage)
    throw new DatabaseError(
      'Failed to fetch analysis logs',
      error.code,
      error,
    )
  }

  return (data || []) as AnalysisLog[]
}

/**
 * Gets analysis logs for a specific date
 * @param date - ISO date string
 * @returns Array of analysis logs for the specified date
 * @throws {AuthError} If user is not authenticated
 * @throws {AnalysisError} If fetching fails
 */
export async function getAnalysisLogsByDate(
  date: string,
): Promise<AnalysisLog[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to view analysis logs')
  }

  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error('Error fetching analysis logs:', errorMessage)
    throw new DatabaseError(
      'Failed to fetch analysis logs',
      error.code,
      error,
    )
  }

  return (data || []) as AnalysisLog[]
}

