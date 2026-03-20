'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { AnalysisData } from '@/types/database'
import { logAnalysis } from '@/app/actions/analysis'
import { useToast } from '@/components/ui/use-toast'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, TOAST_TITLES, ROUTES } from '@/lib/constants'
import { getUserFriendlyErrorMessage, formatErrorForLogging } from '@/lib/errors'
import { ToastAction } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AnalysisContextType {
  isLoggedIn: boolean
  isLogging: boolean
  isLogged: boolean
  resetLogged: () => void
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
  const [isLogged, setIsLogged] = useState(false)
  const isLoggingRef = useRef(false)
  const { toast } = useToast()

  const resetLogged = () => setIsLogged(false)

  const logCurrentAnalysis = async (data: AnalysisData, imageUrl: string) => {
    if (isLoggingRef.current || isLogged) return

    if (!isLoggedIn) {
      toast({
        title: TOAST_TITLES.AUTHENTICATION_REQUIRED,
        description: ERROR_MESSAGES.AUTH.AUTHENTICATION_REQUIRED,
        variant: 'destructive'
      })
      return
    }

    try {
      isLoggingRef.current = true
      setIsLogging(true)
      await logAnalysis(data, imageUrl)
      setIsLogged(true)
      toast({
        title: TOAST_TITLES.SUCCESS,
        description: SUCCESS_MESSAGES.ANALYSIS.LOGGED_SUCCESSFULLY,
        action: (
          <ToastAction asChild>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.PROTECTED_ANALYSIS_HISTORY}>View History</Link>
            </Button>
          </ToastAction>
        ),
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
      isLoggingRef.current = false
      setIsLogging(false)
    }
  }
  
  return (
    <AnalysisContext.Provider value={{
      isLoggedIn,
      isLogging,
      isLogged,
      resetLogged,
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