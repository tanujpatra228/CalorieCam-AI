'use server'

import { createClient } from '@/utils/supabase/server'
import { AnalysisData } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function logAnalysis(
  analysisData: AnalysisData,
  imageUrl: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to log analysis')
  }
  
  const { data, error } = await supabase
    .from('analysis_logs')
    .insert({
      user_id: user.id,
      dish_name: analysisData.dish_name,
      total_weight_g: analysisData.total_weight_g,
      total_digestion_time_m: analysisData.total_digestion_time_m,
      image_url: imageUrl,
      macros: analysisData.macros,
      micros: analysisData.micros,
      notes: analysisData.notes
    })
    .select()
    .single()
    
  if (error) {
    console.error('Error logging analysis:', error)
    throw new Error('Failed to log analysis')
  }

  // Revalidate the analysis history page
  revalidatePath('/protected/analysis-history')
  
  return data
}

export async function getAnalysisLogs() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to view analysis logs')
  }
  
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching analysis logs:', error)
    throw new Error('Failed to fetch analysis logs')
  }
  
  return data
} 