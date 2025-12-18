'use server'

import { createClient } from '@/utils/supabase/server'
import { UserProfile, ProfileFormData } from '@/types/profile'
import { AuthError, DatabaseError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'

/**
 * Gets the user profile for the authenticated user
 * @returns The user profile or null if not found
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If fetching fails
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to view profile')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    // Profile not found is not an error - return null
    if (error.code === 'PGRST116') {
      return null
    }

    const errorMessage = formatErrorForLogging(error)
    console.error('Error fetching profile:', errorMessage)
    throw new DatabaseError(
      'Failed to fetch profile',
      error.code,
      error,
    )
  }

  return data as UserProfile
}

/**
 * Updates or creates a user profile
 * @param profileData - The profile data to save
 * @returns The updated/created user profile
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If saving fails
 */
export async function saveUserProfile(
  profileData: ProfileFormData,
): Promise<UserProfile> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to save profile')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error('Error saving profile:', errorMessage)
    throw new DatabaseError(
      'Failed to save profile',
      error.code,
      error,
    )
  }

  return data as UserProfile
}


