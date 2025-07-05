'use client'

import { createContext, useContext, useState } from 'react'
import { AnalysisData } from '@/types/database'
import { logAnalysis } from '@/app/actions/analysis'
import { useToast } from '@/components/ui/use-toast'
import * as Sentry from '@sentry/nextjs'

interface AnalysisContextType {
  isLoggedIn: boolean
  isLogging: boolean
  logCurrentAnalysis: (data: AnalysisData, imageUrl: string) => Promise<void>
}

const AnalysisContext = createContext<AnalysisContextType | null>(null)

export function AnalysisProvider({ 
  children,
  isLoggedIn 
}: { 
  children: React.ReactNode
  isLoggedIn: boolean 
}) {
  const [isLogging, setIsLogging] = useState(false)
  const { toast } = useToast()
  
  const logCurrentAnalysis = async (data: AnalysisData, imageUrl: string) => {
    if (!isLoggedIn) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to log your analysis.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLogging(true)
      await logAnalysis(data, imageUrl)
      toast({
        title: 'Success',
        description: 'Analysis logged successfully!',
      })
    } catch (error) {
      Sentry.captureException(error)
      console.error('Error logging analysis:', error)
      toast({
        title: 'Error',
        description: 'Failed to log analysis. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLogging(false)
    }
  }
  
  return (
    <AnalysisContext.Provider value={{ 
      isLoggedIn, 
      isLogging, 
      logCurrentAnalysis 
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export const useAnalysis = () => {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider')
  }
  return context
} 