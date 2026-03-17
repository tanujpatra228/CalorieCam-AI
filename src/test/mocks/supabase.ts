/**
 * Shared mock factory for Supabase client
 * Returns a chainable query builder matching Supabase's fluent API
 */

interface MockSupabaseOptions {
  user?: { id: string; email?: string } | null
  authError?: Error | null
  queryData?: unknown
  queryError?: { message: string; code: string } | null
}

export function createMockQueryBuilder(
  data: unknown = null,
  error: unknown = null,
) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return builder
}

export function createMockSupabaseClient(overrides: MockSupabaseOptions = {}) {
  const user = overrides.user === undefined
    ? { id: 'test-user-id', email: 'test@example.com' }
    : overrides.user
  const authError = overrides.authError ?? null
  const queryData = overrides.queryData ?? null
  const queryError = overrides.queryError ?? null

  const queryBuilder = createMockQueryBuilder(queryData, queryError)

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authError ? null : user },
        error: authError,
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn().mockReturnValue(queryBuilder),
    _queryBuilder: queryBuilder,
  }
}
