'use server'

/**
 * Server actions for analysis
 * These actions delegate to the analysis service layer
 */

import { logAnalysis as logAnalysisService, getAnalysisLogs as getAnalysisLogsService } from '@/services/analysis-service'
import type { AnalysisData } from '@/types/database'
import type { AnalysisLog } from '@/types/database'

export async function logAnalysis(
  analysisData: AnalysisData,
  imageUrl: string,
): Promise<AnalysisLog> {
  return await logAnalysisService(analysisData, imageUrl)
}

export async function getAnalysisLogs(): Promise<AnalysisLog[]> {
  return await getAnalysisLogsService()
} 