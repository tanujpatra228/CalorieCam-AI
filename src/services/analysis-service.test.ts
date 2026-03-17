vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn((_schema, data) => data),
}))

import { logAnalysis, getAnalysisLogs, getAnalysisLogsByDate } from './analysis-service'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { AuthError, DatabaseError } from '@/lib/errors'
import { ROUTES } from '@/lib/constants'

const mockUser = { id: 'user-123', email: 'test@example.com' }

const mockAnalysisData = {
  dish_name: 'Test Pasta',
  total_weight_g: 350.567,
  total_digestion_time_m: 120.7,
  total_calories_to_digest_kcal: 45.89,
  macros: {
    calories_kcal: 500.456,
    carbs_g: 60.123,
    protein_g: 25.789,
    fat_g: 15.999,
    sugars_g: 8.111,
    sat_fat_g: 5.222,
    fiber_g: 3.333,
  },
  micros: {
    sodium_mg: 400.555,
    vitaminC_mg: null,
  },
  notes: ['Assumed medium portion'],
}

const mockInsertedLog = {
  id: 'log-1',
  user_id: mockUser.id,
  ...mockAnalysisData,
  image_url: 'https://example.com/image.jpg',
  created_at: '2026-01-01T00:00:00Z',
}

function createMockSupabase({
  user = mockUser as any,
  selectData = null as any,
  selectError = null as any,
  insertData = null as any,
  insertError = null as any,
} = {}) {
  const chainable: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  // Default: select chain returns selectData
  chainable.order.mockReturnValue({ data: selectData, error: selectError })
  chainable.single.mockReturnValue({ data: insertData, error: insertError })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue(chainable),
  }

  return { supabase, chainable }
}

describe('analysis-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logAnalysis', () => {
    it('inserts analysis data and returns the created log', async () => {
      const { supabase, chainable } = createMockSupabase({ insertData: mockInsertedLog })
      // For logAnalysis: insert -> select -> single
      chainable.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockInsertedLog, error: null }) }) })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg')

      expect(result).toEqual(mockInsertedLog)
    })

    it('rounds macro values before inserting', async () => {
      const insertFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertedLog, error: null }),
        }),
      })
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: vi.fn().mockReturnValue({ insert: insertFn }),
      }
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg')

      const insertedData = insertFn.mock.calls[0][0]
      expect(insertedData.macros.calories_kcal).toBe(500.46)
      expect(insertedData.macros.carbs_g).toBe(60.12)
      expect(insertedData.macros.protein_g).toBe(25.79)
      expect(insertedData.macros.fat_g).toBe(16)
      expect(insertedData.total_weight_g).toBe(350.57)
    })

    it('rounds micro values and preserves nulls', async () => {
      const insertFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertedLog, error: null }),
        }),
      })
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: vi.fn().mockReturnValue({ insert: insertFn }),
      }
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg')

      const insertedData = insertFn.mock.calls[0][0]
      expect(insertedData.micros.sodium_mg).toBe(400.56)
      expect(insertedData.micros.vitaminC_mg).toBeNull()
    })

    it('converts digestion time to integer', async () => {
      const insertFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertedLog, error: null }),
        }),
      })
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: vi.fn().mockReturnValue({ insert: insertFn }),
      }
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg')

      const insertedData = insertFn.mock.calls[0][0]
      expect(insertedData.total_digestion_time_m).toBe(121)
      expect(insertedData.total_calories_to_digest_kcal).toBe(46)
    })

    it('revalidates the analysis history path on success', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertedLog, error: null }),
        }),
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg')

      expect(revalidatePath).toHaveBeenCalledWith(ROUTES.PROTECTED_ANALYSIS_HISTORY)
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(
        logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg'),
      ).rejects.toThrow(AuthError)
    })

    it('throws DatabaseError when insert fails', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'insert failed', code: '23505' },
          }),
        }),
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(
        logAnalysis(mockAnalysisData as any, 'https://example.com/image.jpg'),
      ).rejects.toThrow(DatabaseError)
    })
  })

  describe('getAnalysisLogs', () => {
    const mockLogs = [
      { id: 'log-1', dish_name: 'Pasta', created_at: '2026-01-02T00:00:00Z' },
      { id: 'log-2', dish_name: 'Salad', created_at: '2026-01-01T00:00:00Z' },
    ]

    it('returns all analysis logs ordered by created_at desc', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({ data: mockLogs, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getAnalysisLogs()

      expect(result).toEqual(mockLogs)
      expect(supabase.from).toHaveBeenCalledWith('analysis_logs')
    })

    it('returns empty array when no logs exist', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({ data: null, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getAnalysisLogs()

      expect(result).toEqual([])
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getAnalysisLogs()).rejects.toThrow(AuthError)
    })

    it('throws DatabaseError on query failure', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({
        data: null,
        error: { message: 'connection lost', code: '08006' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getAnalysisLogs()).rejects.toThrow(DatabaseError)
    })
  })

  describe('getAnalysisLogsByDate', () => {
    const mockLogs = [
      { id: 'log-1', dish_name: 'Breakfast', created_at: '2026-01-15T08:00:00Z' },
    ]

    it('returns logs filtered by date range', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({ data: mockLogs, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getAnalysisLogsByDate('2026-01-15')

      expect(result).toEqual(mockLogs)
      expect(chainable.gte).toHaveBeenCalled()
      expect(chainable.lte).toHaveBeenCalled()
    })

    it('returns empty array when no logs for date', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({ data: null, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getAnalysisLogsByDate('2026-01-15')

      expect(result).toEqual([])
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getAnalysisLogsByDate('2026-01-15')).rejects.toThrow(AuthError)
    })

    it('throws DatabaseError on query failure', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.order.mockReturnValue({
        data: null,
        error: { message: 'query failed', code: '42P01' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getAnalysisLogsByDate('2026-01-15')).rejects.toThrow(DatabaseError)
    })
  })
})
