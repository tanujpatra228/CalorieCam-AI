'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DailyGoalData } from '@/services/goals-history-service'
import {
  GoalView,
  groupDaysByWeek,
  calculateAchievementLevel,
  getColorIntensity,
  getMonthLabels,
  GridDay,
} from '@/utils/goals-history-utils'
import { format } from 'date-fns'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContributionGraphProps {
  dailyData: DailyGoalData[]
  initialView?: GoalView
  initialYear?: number
  onViewChange?: (view: GoalView) => void
  onYearChange?: (year: number) => void
}

export function ContributionGraph({
  dailyData,
  initialView = 'protein',
  initialYear,
  onViewChange,
  onYearChange,
}: ContributionGraphProps) {
  const [view, setView] = useState<GoalView>(initialView)
  const currentYear = initialYear || new Date().getFullYear()
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null)

  const handleViewChange = (newView: GoalView) => {
    setView(newView)
    onViewChange?.(newView)
  }

  const handleYearChange = (year: number) => {
    onYearChange?.(year)
  }
  const [hoveredDay, setHoveredDay] = useState<GridDay | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hoverPosition && tooltipRef.current) {
      const tooltip = tooltipRef.current
      const tooltipRect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 10
      const offset = 10

      let left = hoverPosition.x + offset
      let top = hoverPosition.y - offset

      if (tooltipRect.right > viewportWidth - padding) {
        left = hoverPosition.x - tooltipRect.width - offset
      }

      if (left < padding) {
        left = padding
      }

      if (tooltipRect.bottom > viewportHeight - padding) {
        top = hoverPosition.y - tooltipRect.height - offset
      }

      if (top < padding) {
        top = padding
      }

      setTooltipPosition({ left, top })
    }
  }, [hoverPosition])

  const todayYear = new Date().getFullYear()
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    
    if (dailyData.length > 0) {
      dailyData.forEach((d) => {
        years.add(new Date(d.date).getFullYear())
      })
    }
    
    years.add(todayYear)
    
    return Array.from(years).sort((a, b) => b - a)
  }, [dailyData, todayYear])

  const yearData = useMemo(() => {
    return dailyData.filter((d) => new Date(d.date).getFullYear() === currentYear)
  }, [dailyData, currentYear])

  const weeks = useMemo(() => {
    return groupDaysByWeek(yearData, view)
  }, [yearData, view])

  const monthLabels = useMemo(() => {
    return getMonthLabels(currentYear)
  }, [currentYear])

  const handleSquareHover = (day: GridDay | null, event?: React.MouseEvent) => {
    setHoveredDay(day)
    if (event && day) {
      setHoverPosition({ x: event.clientX, y: event.clientY })
    } else {
      setHoverPosition(null)
    }
  }

  const viewLabel = view === 'protein' ? 'Protein' : 'Calories'
  const targetLabel = view === 'protein' ? 'g' : 'kcal'

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Goals History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === 'protein' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => handleViewChange('protein')}
              >
                Protein
              </Button>
              <Button
                variant={view === 'calories' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => handleViewChange('calories')}
              >
                Calories
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {currentYear}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {availableYears.map((year) => (
                  <DropdownMenuItem key={year} onClick={() => handleYearChange(year)}>
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {yearData.filter((d) => (view === 'protein' ? d.proteinAchieved : d.caloriesAchieved)).length}{' '}
              days achieved in {currentYear}
            </span>
          </div>

          <div className="relative overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 pt-6">
                  <div className="text-xs text-muted-foreground h-3 leading-3">Mon</div>
                  <div className="h-3"></div>
                  <div className="text-xs text-muted-foreground h-3 leading-3">Wed</div>
                  <div className="h-3"></div>
                  <div className="text-xs text-muted-foreground h-3 leading-3">Fri</div>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 mb-1 relative" style={{ width: `${weeks.length * 16}px`, height: '14px' }}>
                    {monthLabels.map(({ month, week }) => {
                      const weekIndex = weeks.findIndex((w) => w.week === week)
                      if (weekIndex === -1) return null
                      
                      return (
                        <div
                          key={`${month}-${week}`}
                          className="text-xs text-muted-foreground absolute"
                          style={{
                            left: `${weekIndex * 16}px`,
                          }}
                        >
                          {month}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-1">
                    {weeks.map((weekData) => (
                      <div key={weekData.week} className="flex flex-col gap-1">
                        {weekData.days.map((day, dayIndex) => {
                          if (!day) {
                            return <div key={dayIndex} className="w-3 h-3" />
                          }

                          const level = calculateAchievementLevel(day.percentage)
                          const colorClass = getColorIntensity(level)

                          return (
                            <div
                              key={day.date}
                              className={cn(
                                'w-3 h-3 rounded-sm cursor-pointer transition-all',
                                colorClass,
                                hoveredDay?.date === day.date && 'ring-2 ring-foreground ring-offset-1'
                              )}
                              onMouseEnter={(e) => handleSquareHover(day, e)}
                              onMouseLeave={() => handleSquareHover(null)}
                              title={`${format(new Date(day.date), 'MMM d, yyyy')}\n${viewLabel}: ${day.value}${targetLabel} / ${(view === 'protein' ? day.proteinTarget : day.caloriesTarget)}${targetLabel}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hoveredDay && hoverPosition && (
            <div
              ref={tooltipRef}
              className="fixed z-50 pointer-events-none"
              style={{
                left: tooltipPosition ? `${tooltipPosition.left}px` : `${hoverPosition.x + 10}px`,
                top: tooltipPosition ? `${tooltipPosition.top}px` : `${hoverPosition.y - 10}px`,
              }}
            >
              <div className="rounded-lg border bg-popover p-3 text-sm shadow-lg">
                <div className="font-semibold mb-2">
                  {format(new Date(hoveredDay.date), 'MMM d, yyyy')}
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Calories: </span>
                    <span className="font-medium">
                      {hoveredDay.calories} / {hoveredDay.caloriesTarget || 0} kcal
                    </span>
                    {hoveredDay.caloriesTarget > 0 && (
                      <span className="text-muted-foreground">
                        {' '}({Math.round((hoveredDay.calories / hoveredDay.caloriesTarget) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Protein: </span>
                    <span className="font-medium">
                      {hoveredDay.protein} / {hoveredDay.proteinTarget || 0}g
                    </span>
                    {hoveredDay.proteinTarget > 0 && (
                      <span className="text-muted-foreground">
                        {' '}({Math.round((hoveredDay.protein / hoveredDay.proteinTarget) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div className="pt-1 border-t">
                    <span className="text-muted-foreground">Status: </span>
                    <span className={cn(
                      'font-medium',
                      hoveredDay.achieved ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                    )}>
                      {hoveredDay.achieved ? 'Goal achieved' : 'Goal not met'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-green-500/20" />
              <div className="w-3 h-3 rounded-sm bg-green-500/40" />
              <div className="w-3 h-3 rounded-sm bg-green-500/60" />
              <div className="w-3 h-3 rounded-sm bg-green-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

