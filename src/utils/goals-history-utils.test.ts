import {
  calculateAchievementLevel,
  getColorIntensity,
  getYearRange,
  groupDaysByWeek,
  calculateStreaks,
  getMonthLabels,
} from './goals-history-utils'
import type { DailyGoalData } from '@/services/goals-history-service'

// ---------------------------------------------------------------------------
// Helper to create DailyGoalData
// ---------------------------------------------------------------------------

function makeDayData(overrides: Partial<DailyGoalData> & { date: string }): DailyGoalData {
  return {
    calories: 0,
    protein: 0,
    caloriesTarget: 2000,
    proteinTarget: 120,
    caloriesAchieved: false,
    proteinAchieved: false,
    achieved: false,
    caloriesPercentage: 0,
    proteinPercentage: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// calculateAchievementLevel
// ---------------------------------------------------------------------------

describe('calculateAchievementLevel', () => {
  it('returns 0 for percentage 0', () => {
    expect(calculateAchievementLevel(0)).toBe(0)
  })

  it('returns 1 for percentage 1-24', () => {
    expect(calculateAchievementLevel(1)).toBe(1)
    expect(calculateAchievementLevel(24)).toBe(1)
  })

  it('returns 2 for percentage 25-49', () => {
    expect(calculateAchievementLevel(25)).toBe(2)
    expect(calculateAchievementLevel(49)).toBe(2)
  })

  it('returns 3 for percentage 50-74', () => {
    expect(calculateAchievementLevel(50)).toBe(3)
    expect(calculateAchievementLevel(74)).toBe(3)
  })

  it('returns 4 for percentage 75+', () => {
    expect(calculateAchievementLevel(75)).toBe(4)
    expect(calculateAchievementLevel(100)).toBe(4)
    expect(calculateAchievementLevel(200)).toBe(4)
  })

  it('handles boundary at exactly 25', () => {
    expect(calculateAchievementLevel(24)).toBe(1)
    expect(calculateAchievementLevel(25)).toBe(2)
  })

  it('handles boundary at exactly 50', () => {
    expect(calculateAchievementLevel(49)).toBe(2)
    expect(calculateAchievementLevel(50)).toBe(3)
  })

  it('handles boundary at exactly 75', () => {
    expect(calculateAchievementLevel(74)).toBe(3)
    expect(calculateAchievementLevel(75)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// getColorIntensity
// ---------------------------------------------------------------------------

describe('getColorIntensity', () => {
  it('returns bg-muted for level 0', () => {
    expect(getColorIntensity(0)).toBe('bg-muted')
  })

  it('returns bg-green-500/20 for level 1', () => {
    expect(getColorIntensity(1)).toBe('bg-green-500/20')
  })

  it('returns bg-green-500/40 for level 2', () => {
    expect(getColorIntensity(2)).toBe('bg-green-500/40')
  })

  it('returns bg-green-500/60 for level 3', () => {
    expect(getColorIntensity(3)).toBe('bg-green-500/60')
  })

  it('returns bg-green-500 for level 4', () => {
    expect(getColorIntensity(4)).toBe('bg-green-500')
  })

  it('returns bg-muted for unknown level', () => {
    expect(getColorIntensity(5)).toBe('bg-muted')
    expect(getColorIntensity(-1)).toBe('bg-muted')
  })
})

// ---------------------------------------------------------------------------
// getYearRange
// ---------------------------------------------------------------------------

describe('getYearRange', () => {
  it('returns ISO strings for start and end of year', () => {
    const { startDate, endDate } = getYearRange(2024)
    const start = new Date(startDate)
    const end = new Date(endDate)

    expect(start.getFullYear()).toBe(2024)
    expect(start.getMonth()).toBe(0)
    expect(start.getDate()).toBe(1)

    expect(end.getFullYear()).toBe(2024)
    expect(end.getMonth()).toBe(11)
    expect(end.getDate()).toBe(31)
  })

  it('returns valid ISO strings', () => {
    const { startDate, endDate } = getYearRange(2025)
    expect(() => new Date(startDate)).not.toThrow()
    expect(() => new Date(endDate)).not.toThrow()
    expect(new Date(startDate).toISOString()).toBe(startDate)
    expect(new Date(endDate).toISOString()).toBe(endDate)
  })
})

// ---------------------------------------------------------------------------
// groupDaysByWeek
// ---------------------------------------------------------------------------

describe('groupDaysByWeek', () => {
  it('returns empty array for empty data', () => {
    expect(groupDaysByWeek([], 'calories')).toEqual([])
  })

  it('groups a single day into one week', () => {
    const data = [makeDayData({ date: '2024-01-15', calories: 1800, caloriesPercentage: 90 })]
    const result = groupDaysByWeek(data, 'calories')

    expect(result.length).toBe(1)
    expect(result[0].days.length).toBe(7)

    const filledDays = result[0].days.filter((d) => d !== null && d.date === '2024-01-15')
    expect(filledDays.length).toBe(1)
    expect(filledDays[0]!.percentage).toBe(90)
  })

  it('uses protein view when specified', () => {
    const data = [
      makeDayData({
        date: '2024-01-15',
        protein: 100,
        proteinPercentage: 80,
        proteinAchieved: true,
        calories: 1500,
        caloriesPercentage: 60,
        caloriesAchieved: false,
      }),
    ]

    const result = groupDaysByWeek(data, 'protein')
    const day = result[0].days.find((d) => d !== null && d.date === '2024-01-15')
    expect(day!.percentage).toBe(80)
    expect(day!.value).toBe(100)
    expect(day!.achieved).toBe(true)
  })

  it('fills gaps between data points with zero values', () => {
    const data = [
      makeDayData({ date: '2024-01-15', calories: 1800, caloriesPercentage: 90 }),
      makeDayData({ date: '2024-01-17', calories: 2000, caloriesPercentage: 100 }),
    ]
    const result = groupDaysByWeek(data, 'calories')

    // Find the gap day (Jan 16)
    const allDays = result.flatMap((w) => w.days).filter(Boolean)
    const gapDay = allDays.find((d) => d!.date === '2024-01-16')
    expect(gapDay).toBeDefined()
    expect(gapDay!.value).toBe(0)
    expect(gapDay!.percentage).toBe(0)
  })

  it('sorts weeks by week number', () => {
    const data = [
      makeDayData({ date: '2024-01-01' }),
      makeDayData({ date: '2024-01-15' }),
    ]
    const result = groupDaysByWeek(data, 'calories')

    for (let i = 1; i < result.length; i++) {
      expect(result[i].week).toBeGreaterThanOrEqual(result[i - 1].week)
    }
  })
})

// ---------------------------------------------------------------------------
// calculateStreaks
// ---------------------------------------------------------------------------

describe('calculateStreaks', () => {
  it('returns zeros for empty data', () => {
    expect(calculateStreaks([], 'calories')).toEqual({
      currentStreak: 0,
      bestStreak: 0,
      totalDays: 0,
    })
  })

  it('counts total achieved days', () => {
    const data = [
      makeDayData({ date: '2024-01-01', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-02', caloriesAchieved: false }),
      makeDayData({ date: '2024-01-03', caloriesAchieved: true }),
    ]
    const result = calculateStreaks(data, 'calories')
    expect(result.totalDays).toBe(2)
  })

  it('calculates best streak from consecutive achieved days', () => {
    const data = [
      makeDayData({ date: '2024-01-01', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-02', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-03', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-04', caloriesAchieved: false }),
      makeDayData({ date: '2024-01-05', caloriesAchieved: true }),
    ]
    const result = calculateStreaks(data, 'calories')
    expect(result.bestStreak).toBe(3)
  })

  it('uses protein view when specified', () => {
    const data = [
      makeDayData({ date: '2024-01-01', proteinAchieved: true, caloriesAchieved: false }),
      makeDayData({ date: '2024-01-02', proteinAchieved: true, caloriesAchieved: false }),
    ]

    const proteinResult = calculateStreaks(data, 'protein')
    expect(proteinResult.totalDays).toBe(2)
    expect(proteinResult.bestStreak).toBe(2)

    const caloriesResult = calculateStreaks(data, 'calories')
    expect(caloriesResult.totalDays).toBe(0)
    expect(caloriesResult.bestStreak).toBe(0)
  })

  it('handles all days achieved', () => {
    const data = [
      makeDayData({ date: '2024-01-01', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-02', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-03', caloriesAchieved: true }),
    ]
    const result = calculateStreaks(data, 'calories')
    expect(result.bestStreak).toBe(3)
    expect(result.totalDays).toBe(3)
  })

  it('handles no days achieved', () => {
    const data = [
      makeDayData({ date: '2024-01-01', caloriesAchieved: false }),
      makeDayData({ date: '2024-01-02', caloriesAchieved: false }),
    ]
    const result = calculateStreaks(data, 'calories')
    expect(result.bestStreak).toBe(0)
    expect(result.totalDays).toBe(0)
    expect(result.currentStreak).toBe(0)
  })

  it('handles single day achieved', () => {
    const data = [makeDayData({ date: '2024-01-01', caloriesAchieved: true })]
    const result = calculateStreaks(data, 'calories')
    expect(result.totalDays).toBe(1)
    expect(result.bestStreak).toBe(1)
  })

  it('handles unsorted input by sorting internally', () => {
    const data = [
      makeDayData({ date: '2024-01-03', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-01', caloriesAchieved: true }),
      makeDayData({ date: '2024-01-02', caloriesAchieved: true }),
    ]
    const result = calculateStreaks(data, 'calories')
    expect(result.bestStreak).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// getMonthLabels
// ---------------------------------------------------------------------------

describe('getMonthLabels', () => {
  it('returns labels for 12 months or fewer (deduped by week)', () => {
    const labels = getMonthLabels(2024)
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.length).toBeLessThanOrEqual(12)
  })

  it('starts with January', () => {
    const labels = getMonthLabels(2024)
    expect(labels[0].month).toBe('Jan')
  })

  it('has unique week numbers for each label', () => {
    const labels = getMonthLabels(2024)
    const weeks = labels.map((l) => l.week)
    expect(new Set(weeks).size).toBe(weeks.length)
  })

  it('labels have positive week numbers', () => {
    const labels = getMonthLabels(2025)
    labels.forEach((label) => {
      expect(label.week).toBeGreaterThan(0)
    })
  })

  it('includes common month abbreviations', () => {
    const labels = getMonthLabels(2024)
    const months = labels.map((l) => l.month)
    // At minimum, most months should appear (some may be deduped if they share a week)
    expect(months).toContain('Jan')
    expect(months).toContain('Jun')
    expect(months).toContain('Dec')
  })
})
