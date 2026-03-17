'use server'

/**
 * Server actions for analysis
 * These actions delegate to the analysis service layer
 */

import {
  logAnalysis as logAnalysisService,
  getAnalysisLogs as getAnalysisLogsService,
  getAnalysisLogsByDate as getAnalysisLogsByDateService,
} from '@/services/analysis-service'
import { getDailyGoalsData as getDailyGoalsDataService } from '@/services/goals-history-service'
import type { AnalysisData } from '@/types/database'
import type { AnalysisLog } from '@/types/database'
import type { DailyGoalData } from '@/services/goals-history-service'
import { validateInput } from '@/lib/validation'
import { logAnalysisSchema, getAnalysisLogsByDateSchema } from '@/lib/validation-schemas'

export async function logAnalysis(
  analysisData: AnalysisData,
  imageUrl: string,
): Promise<AnalysisLog> {
  validateInput(logAnalysisSchema, { analysisData, imageUrl })
  return await logAnalysisService(analysisData, imageUrl)
}

export async function getAnalysisLogs(): Promise<AnalysisLog[]> {
  return await getAnalysisLogsService()
}

export async function getAnalysisLogsByDate(
  date: string,
): Promise<AnalysisLog[]> {
  validateInput(getAnalysisLogsByDateSchema, { date })
  return await getAnalysisLogsByDateService(date)
}

export async function getDailyGoalsData(
  startDate: string,
  endDate: string,
): Promise<DailyGoalData[]> {
  return await getDailyGoalsDataService(startDate, endDate)
}