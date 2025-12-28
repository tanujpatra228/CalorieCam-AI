'use client'
import { AnalysisLog } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Camera, Utensils } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CaloriesBudgetProgress } from '@/components/calorie-budget-progress'
import { ProteinTargetProgress } from '@/components/protein-budget-progress'
import { ContributionGraph, GoalsSummary } from '@/components/goals-history'
import { getDailyGoalsData } from '@/services/goals-history-service'
import { DailyGoalData } from '@/services/goals-history-service'
import { getYearRange, type GoalView } from '@/utils/goals-history-utils'

import { getAnalysisLogsByDate } from '@/services/analysis-service'
import { roundToTwoDecimals } from '@/lib/utils'

async function getAnalysisLogs(date: string) {
  return await getAnalysisLogsByDate(date)
}

interface DailyMacros {
  calories: number
  calories_to_digest: number
  protein: number
  carbs: number
  fat: number
  sugars: number
  fiber: number
}

function calculateDailyMacros(logs: AnalysisLog[]): DailyMacros {
  const result = logs.reduce((acc, log) => ({
    calories: acc.calories + log.macros.calories_kcal,
    calories_to_digest: acc.calories_to_digest + (log.total_calories_to_digest_kcal || 0),
    protein: acc.protein + log.macros.protein_g,
    carbs: acc.carbs + log.macros.carbs_g,
    fat: acc.fat + (log.macros.fat_g + log.macros.sat_fat_g),
    sugars: acc.sugars + log.macros.sugars_g,
    fiber: acc.fiber + log.macros.fiber_g
  }), {
    calories: 0,
    calories_to_digest: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugars: 0,
    fiber: 0
  })

  return {
    calories: roundToTwoDecimals(result.calories),
    calories_to_digest: roundToTwoDecimals(result.calories_to_digest),
    protein: roundToTwoDecimals(result.protein),
    carbs: roundToTwoDecimals(result.carbs),
    fat: roundToTwoDecimals(result.fat),
    sugars: roundToTwoDecimals(result.sugars),
    fiber: roundToTwoDecimals(result.fiber)
  }
}

export default function AnalysisHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [logs, setLogs] = useState<AnalysisLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [goalsData, setGoalsData] = useState<DailyGoalData[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [goalsView, setGoalsView] = useState<GoalView>('protein')
  const [goalsYear, setGoalsYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      try {
        const data = await getAnalysisLogs(selectedDate)
        setLogs(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [selectedDate])

  useEffect(() => {
    const fetchGoalsData = async () => {
      setIsLoadingGoals(true)
      try {
        const { startDate, endDate } = getYearRange(goalsYear)
        const data = await getDailyGoalsData(startDate, endDate)
        setGoalsData(data)
      } catch (error) {
        console.error('Error fetching goals data:', error)
      } finally {
        setIsLoadingGoals(false)
      }
    }

    fetchGoalsData()
  }, [goalsYear])

  const dailyMacros = calculateDailyMacros(logs)

  return (
    <div className="container mx-auto py-4 px-4 max-w-4xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold">Analysis History</h1>
      </div>

      {isLoadingGoals ? (
        <div className="text-center py-8 text-muted-foreground mb-6">Loading goals history...</div>
      ) : goalsData.length > 0 && goalsData.some((d) => d.caloriesTarget > 0 || d.proteinTarget > 0) ? (
        <div className="mb-6 space-y-4">
          <ContributionGraph
            dailyData={goalsData}
            initialView={goalsView}
            initialYear={goalsYear}
            onViewChange={setGoalsView}
            onYearChange={setGoalsYear}
          />
          <GoalsSummary dailyData={goalsData} view={goalsView} />
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Set your daily calorie and protein targets in your profile to see your goals history.
            </p>
            <Button asChild className="mt-4">
              <Link href="/protected/profile">Go to Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl font-semibold">Daily Log</h2>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : logs.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">No meals logged for this date</p>
            <Button asChild>
              <Link href="/camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Log a Meal
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Daily Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CaloriesBudgetProgress caloriesIntake={Math.round(dailyMacros.calories - (dailyMacros?.calories_to_digest || 0))} />
                </div>
                <div className="space-y-2">
                  <ProteinTargetProgress proteinIntake={Math.round(dailyMacros.protein)} />
                </div>
                <div className="">
                  <div className="text-sm font-medium">Carbs</div>
                  <div className="text-lg font-bold">{Math.round(dailyMacros.carbs)}g</div>
                </div>
                <div className="">
                  <div className="text-sm font-medium">Fat</div>
                  <div className="text-lg font-bold">{Math.round(dailyMacros.fat)}g</div>
                </div>
                <div className="">
                  <div className="text-sm font-medium">Sugars</div>
                  <div className="text-lg font-bold">{Math.round(dailyMacros.sugars)}g</div>
                </div>
                <div className="">
                  <div className="text-sm font-medium">Fiber</div>
                  <div className="text-lg font-bold">{Math.round(dailyMacros.fiber)}g</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {logs.map((log) => {
              const kcalToDigest = log?.total_calories_to_digest_kcal || null;
              return (
                <Card key={log.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{log.dish_name}</CardTitle>
                      <div className='flex justify-between items-center gap-2 text-sm text-muted-foreground'>
                        <p>{format(new Date(log.created_at), "hh:mm a")}</p>
                        <p>{log.total_weight_g}g</p>
                      </div>
                    </div>
                    <div className='text-sm'>
                      <p>Digestion</p>
                      <div className="text-xs flex gap-2 divide-x-2">
                        <p>~{log.total_digestion_time_m} min</p>
                        {!!kcalToDigest ? (<p className='pl-2'>~{kcalToDigest || 0} kcal</p>) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <img
                          src={log.image_url}
                          alt={log.dish_name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Macronutrients</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Calories: {kcalToDigest ? Math.round((log.macros.calories_kcal - kcalToDigest) * 100) / 100 : Math.round(log.macros.calories_kcal * 100) / 100} kcal</div>
                            <div>Protein: {Math.round(log.macros.protein_g * 100) / 100}g</div>
                            <div>Carbs: {Math.round(log.macros.carbs_g * 100) / 100}g</div>
                            <div>Fat: {Math.round((log.macros.fat_g + log.macros.sat_fat_g) * 100) / 100}g</div>
                            <div>Sugars: {Math.round(log.macros.sugars_g * 100) / 100}g</div>
                            <div>Fiber: {Math.round(log.macros.fiber_g * 100) / 100}g</div>
                          </div>
                        </div>
                        {log.notes.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Notes</h3>
                            <ScrollArea className="h-24 pr-4">
                              <div className="space-y-2 text-sm">
                                {log.notes.map((note, index) => (
                                  <p key={index} className="text-muted-foreground">
                                    {note}
                                  </p>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
} 
