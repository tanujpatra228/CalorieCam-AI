vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { getDailyGoalsData } from './goals-history-service'
import { createClient } from '@/utils/supabase/server'
import { AuthError, DatabaseError } from '@/lib/errors'

const mockUser = { id: 'user-789', email: 'goals@example.com' }

const mockProfile = {
  daily_calories_budget: 2000,
  daily_protein_target_g: 150,
}

function makeMockLog(date: string, caloriesKcal: number, proteinG: number, caloriesToDigest: number | null = 0) {
  return {
    id: `log-${date}`,
    user_id: mockUser.id,
    dish_name: 'Test Dish',
    total_weight_g: 300,
    total_digestion_time_m: 120,
    total_calories_to_digest_kcal: caloriesToDigest,
    image_url: 'https://example.com/img.jpg',
    created_at: `${date}T12:00:00Z`,
    macros: {
      calories_kcal: caloriesKcal,
      carbs_g: 50,
      protein_g: proteinG,
      fat_g: 10,
      sugars_g: 5,
      sat_fat_g: 2,
      fiber_g: 3,
    },
    micros: { sodium_mg: null, vitaminC_mg: null },
    notes: [],
  }
}

function createMockSupabase({
  user = mockUser as any,
  profileData = mockProfile as any,
  profileError = null as any,
  logsData = [] as any[],
  logsError = null as any,
} = {}) {
  const profileChain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profileData, error: profileError }),
  }

  const logsChain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: logsData, error: logsError }),
  }

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') return profileChain
      if (table === 'analysis_logs') return logsChain
      return {}
    }),
  }

  return { supabase, profileChain, logsChain }
}

describe('goals-history-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getDailyGoalsData', () => {
    it('returns daily goal data for a date range with logs', async () => {
      const logs = [
        makeMockLog('2026-01-01', 800, 60, 20),
        makeMockLog('2026-01-01', 600, 40, 10),
        makeMockLog('2026-01-02', 1500, 100, 30),
      ]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-03')

      expect(result).toHaveLength(3) // 3 days: Jan 1, 2, 3
      // Jan 1: (800-20) + (600-10) = 1370 calories, 60+40 = 100 protein
      expect(result[0].date).toBe('2026-01-01')
      expect(result[0].calories).toBe(1370)
      expect(result[0].protein).toBe(100)
    })

    it('fills in days with no logs as zero values', async () => {
      const logs = [makeMockLog('2026-01-02', 500, 30, 10)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-03')

      expect(result).toHaveLength(3)
      expect(result[0].calories).toBe(0)
      expect(result[0].protein).toBe(0)
      expect(result[1].calories).toBe(490) // 500 - 10
      expect(result[2].calories).toBe(0)
    })

    it('calculates achievement percentages correctly', async () => {
      const logs = [makeMockLog('2026-01-01', 1500, 120, 0)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].caloriesPercentage).toBe(75) // 1500/2000 * 100
      expect(result[0].proteinPercentage).toBe(80) // 120/150 * 100
      expect(result[0].caloriesAchieved).toBe(false)
      expect(result[0].proteinAchieved).toBe(false)
      expect(result[0].achieved).toBe(false)
    })

    it('marks goals as achieved when targets are met', async () => {
      const logs = [makeMockLog('2026-01-01', 2100, 160, 0)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].caloriesAchieved).toBe(true)
      expect(result[0].proteinAchieved).toBe(true)
      expect(result[0].achieved).toBe(true)
    })

    it('caps percentage at 200%', async () => {
      const logs = [makeMockLog('2026-01-01', 5000, 400, 0)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].caloriesPercentage).toBe(200)
      expect(result[0].proteinPercentage).toBe(200)
    })

    it('returns zero percentages when no profile exists (targets = 0)', async () => {
      const logs = [makeMockLog('2026-01-01', 1000, 80, 0)]
      const { supabase } = createMockSupabase({
        profileData: null,
        profileError: { code: 'PGRST116', message: 'Not found' },
        logsData: logs,
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].caloriesTarget).toBe(0)
      expect(result[0].proteinTarget).toBe(0)
      expect(result[0].caloriesPercentage).toBe(0)
      expect(result[0].proteinPercentage).toBe(0)
      expect(result[0].caloriesAchieved).toBe(false)
      expect(result[0].proteinAchieved).toBe(false)
    })

    it('returns empty array for same start and end date with no logs', async () => {
      const { supabase } = createMockSupabase({ logsData: [] })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-01-01')
      expect(result[0].calories).toBe(0)
      expect(result[0].protein).toBe(0)
    })

    it('subtracts calories_to_digest from calories', async () => {
      const logs = [makeMockLog('2026-01-01', 500, 50, 50)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].calories).toBe(450) // 500 - 50
    })

    it('handles null calories_to_digest (treats as 0)', async () => {
      const logs = [makeMockLog('2026-01-01', 500, 50, null)]
      const { supabase } = createMockSupabase({ logsData: logs })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].calories).toBe(500)
    })

    it('includes caloriesTarget and proteinTarget from profile', async () => {
      const { supabase } = createMockSupabase({ logsData: [] })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getDailyGoalsData('2026-01-01', '2026-01-01')

      expect(result[0].caloriesTarget).toBe(2000)
      expect(result[0].proteinTarget).toBe(150)
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getDailyGoalsData('2026-01-01', '2026-01-03')).rejects.toThrow(AuthError)
      await expect(getDailyGoalsData('2026-01-01', '2026-01-03')).rejects.toThrow(
        'User must be logged in to view goals history',
      )
    })

    it('throws DatabaseError when profile query fails with non-PGRST116 error', async () => {
      const { supabase } = createMockSupabase({
        profileError: { code: '42P01', message: 'table not found' },
        logsData: [],
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getDailyGoalsData('2026-01-01', '2026-01-01')).rejects.toThrow(DatabaseError)
      await expect(getDailyGoalsData('2026-01-01', '2026-01-01')).rejects.toThrow(
        'Failed to fetch profile',
      )
    })

    it('throws DatabaseError when logs query fails', async () => {
      const { supabase } = createMockSupabase({
        logsError: { code: '08006', message: 'connection lost' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getDailyGoalsData('2026-01-01', '2026-01-01')).rejects.toThrow(DatabaseError)
      await expect(getDailyGoalsData('2026-01-01', '2026-01-01')).rejects.toThrow(
        'Failed to fetch analysis logs',
      )
    })
  })
})
