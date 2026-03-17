vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn((_schema, data) => data),
}))

import { getUserProfile, saveUserProfile } from './profile-service'
import { createClient } from '@/utils/supabase/server'
import { AuthError, DatabaseError } from '@/lib/errors'

const mockUser = { id: 'user-456', email: 'profile@example.com' }

const mockProfile = {
  id: mockUser.id,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  height_cm: 175,
  weight_kg: 70,
  daily_calories_budget: 2000,
  daily_protein_target_g: 140,
  activity_level: 'moderate' as const,
  goal: 'maintain' as const,
}

function createMockSupabase({
  user = mockUser as any,
} = {}) {
  const chainable: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue(chainable),
  }

  return { supabase, chainable }
}

describe('profile-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserProfile', () => {
    it('returns the user profile when found', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.single.mockResolvedValue({ data: mockProfile, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getUserProfile()

      expect(result).toEqual(mockProfile)
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      expect(chainable.eq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('returns null when profile is not found (PGRST116)', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await getUserProfile()

      expect(result).toBeNull()
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getUserProfile()).rejects.toThrow(AuthError)
      await expect(getUserProfile()).rejects.toThrow('User must be logged in to view profile')
    })

    it('throws DatabaseError for non-PGRST116 errors', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.single.mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getUserProfile()).rejects.toThrow(DatabaseError)
      await expect(getUserProfile()).rejects.toThrow('Failed to fetch profile')
    })

    it('logs the error message for non-PGRST116 database errors', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.single.mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(getUserProfile()).rejects.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching profile:',
        expect.any(String),
      )
    })

    it('queries with the authenticated user id', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.single.mockResolvedValue({ data: mockProfile, error: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await getUserProfile()

      expect(chainable.eq).toHaveBeenCalledWith('id', 'user-456')
    })
  })

  describe('saveUserProfile', () => {
    const profileFormData = {
      height_cm: 180,
      weight_kg: 75,
      activity_level: 'active' as const,
      goal: 'gain_muscle' as const,
      daily_calories_budget: 2500,
      daily_protein_target_g: 150,
    }

    it('upserts and returns the saved profile', async () => {
      const savedProfile = { ...mockProfile, ...profileFormData }
      const { supabase, chainable } = createMockSupabase()
      // upsert -> select -> single
      chainable.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: savedProfile, error: null }),
        }),
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const result = await saveUserProfile(profileFormData)

      expect(result).toEqual(savedProfile)
    })

    it('includes user id and updated_at in the upsert payload', async () => {
      const upsertFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      })
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: vi.fn().mockReturnValue({ upsert: upsertFn }),
      }
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await saveUserProfile(profileFormData)

      const upsertPayload = upsertFn.mock.calls[0][0]
      expect(upsertPayload.id).toBe(mockUser.id)
      expect(upsertPayload.updated_at).toBeDefined()
      expect(upsertPayload.height_cm).toBe(180)
    })

    it('throws AuthError when user is not authenticated', async () => {
      const { supabase } = createMockSupabase({ user: null })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(saveUserProfile(profileFormData)).rejects.toThrow(AuthError)
      await expect(saveUserProfile(profileFormData)).rejects.toThrow(
        'User must be logged in to save profile',
      )
    })

    it('throws DatabaseError when upsert fails', async () => {
      const { supabase, chainable } = createMockSupabase()
      chainable.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key' },
          }),
        }),
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await expect(saveUserProfile(profileFormData)).rejects.toThrow(DatabaseError)
      await expect(saveUserProfile(profileFormData)).rejects.toThrow('Failed to save profile')
    })

    it('passes the profile data through validation', async () => {
      const { validateInput } = await import('@/lib/validation')
      const { supabase, chainable } = createMockSupabase()
      chainable.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      })
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      await saveUserProfile(profileFormData)

      expect(validateInput).toHaveBeenCalledWith(expect.anything(), profileFormData)
    })
  })
})
