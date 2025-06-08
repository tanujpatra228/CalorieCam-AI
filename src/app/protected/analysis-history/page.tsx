'use client'

import { createClient } from '@/lib/client'
import { redirect } from 'next/navigation'
import { AnalysisLog } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, startOfDay, endOfDay, parseISO } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Camera, Utensils } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { useProfile } from '@/hooks/use-profile'
import { CaloriesBudgetProgress } from '@/components/calorie-budget-progress'
import { ProteinTargetProgress } from '@/components/protein-budget-progress'

async function getAnalysisLogs(date: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/sign-in')
  }

  const startDate = startOfDay(parseISO(date))
  const endDate = endOfDay(parseISO(date))
  
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching analysis logs:', error)
    throw new Error('Failed to fetch analysis logs')
  }
  
  return data as AnalysisLog[]
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
  return logs.reduce((acc, log) => ({
    calories: acc.calories + log.macros.calories_kcal,
    calories_to_digest: acc.calories_to_digest + log.total_calories_to_digest_kcal,
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
}

export default function AnalysisHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [logs, setLogs] = useState<AnalysisLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isLoggedIn, profile } = useProfile();

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

  const dailyMacros = calculateDailyMacros(logs)

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold">Analysis History</h1>
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
                    <CaloriesBudgetProgress caloriesIntake={dailyMacros.calories  - (dailyMacros?.calories_to_digest || 0)} />
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
                            <div>Calories: {kcalToDigest ? (log.macros.calories_kcal - kcalToDigest) : log.macros.calories_kcal} kcal</div>
                            <div>Protein: {log.macros.protein_g}g</div>
                            <div>Carbs: {log.macros.carbs_g}g</div>
                            <div>Fat: {(log.macros.fat_g + log.macros.sat_fat_g).toFixed(2)}g</div>
                            <div>Sugars: {log.macros.sugars_g}g</div>
                            <div>Fiber: {log.macros.fiber_g}g</div>
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