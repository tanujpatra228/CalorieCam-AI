'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyGoalData } from '@/services/goals-history-service'
import { GoalView, calculateStreaks } from '@/utils/goals-history-utils'
import { Target, TrendingUp, Award } from 'lucide-react'

interface GoalsSummaryProps {
  dailyData: DailyGoalData[]
  view: GoalView
}

export function GoalsSummary({ dailyData, view }: GoalsSummaryProps) {
  const { currentStreak, bestStreak, totalDays } = calculateStreaks(dailyData, view)
  
  const totalDaysInRange = dailyData.length
  const achievementPercentage = totalDaysInRange > 0 
    ? Math.round((totalDays / totalDaysInRange) * 100)
    : 0

  const viewLabel = view === 'protein' ? 'Protein' : 'Calories'

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-lg">{viewLabel} Goals Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Days Achieved</div>
            <div className="text-2xl font-bold">{totalDays}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {achievementPercentage}% of days
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Current Streak
            </div>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">days in a row</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Best Streak
            </div>
            <div className="text-2xl font-bold">{bestStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">longest streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

