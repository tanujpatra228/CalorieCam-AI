'use client'

import { createContext, useContext, useState } from 'react'
import { AnalysisData } from '@/types/database'
import { logAnalysis } from '@/app/actions/analysis'
import { useToast } from '@/components/ui/use-toast'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, TOAST_TITLES } from '@/lib/constants'
import { getUserFriendlyErrorMessage, formatErrorForLogging } from '@/lib/errors'

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
        title: TOAST_TITLES.AUTHENTICATION_REQUIRED,
        description: ERROR_MESSAGES.AUTH.AUTHENTICATION_REQUIRED,
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLogging(true)
      await logAnalysis(data, imageUrl)
      toast({
        title: TOAST_TITLES.SUCCESS,
        description: SUCCESS_MESSAGES.ANALYSIS.LOGGED_SUCCESSFULLY,
      })
    } catch (error) {
      const errorMessage = formatErrorForLogging(error)
      console.error('Error logging analysis:', errorMessage)
      toast({
        title: TOAST_TITLES.ERROR,
        description: getUserFriendlyErrorMessage(error) || ERROR_MESSAGES.ANALYSIS.FAILED_TO_LOG,
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