export interface MacroData {
  calories_kcal: number
  carbs_g: number
  protein_g: number
  fat_g: number
  sugars_g: number
  sat_fat_g: number
  fiber_g: number
}

export interface MicroData {
  sodium_mg: number | null
  vitaminC_mg: number | null
}

export interface AnalysisData {
  dish_name: string
  total_weight_g: number
  total_digestion_time_m: number
  macros: MacroData
  micros: MicroData
  notes: string[]
}

export interface AnalysisLog extends AnalysisData {
  id: string
  user_id: string
  image_url: string
  created_at: string
}

// Database schema types for Supabase
export type Database = {
  public: {
    Tables: {
      analysis_logs: {
        Row: AnalysisLog
        Insert: Omit<AnalysisLog, 'id' | 'created_at'>
        Update: Partial<Omit<AnalysisLog, 'id' | 'created_at'>>
      }
    }
  }
} 