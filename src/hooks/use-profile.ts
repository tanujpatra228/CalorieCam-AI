import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfile } from '@/types/profile'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'

interface UseProfileReturn {
	user: User | null
	profile: UserProfile | null
	isLoading: boolean
	isLoggedIn: boolean
	error: Error | null
	refreshProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)
	const { toast } = useToast()

	const fetchProfile = async () => {
		try {
			setIsLoading(true)
			setError(null)
			
			const supabase = createClient()
			const { data: { user: authUser }, error: authError } = 
				await supabase.auth.getUser()
			
			if (authError) throw authError
			
			setUser(authUser)
			
			if (!authUser) {
				setProfile(null)
				return
			}

			const { data, error: profileError } = await supabase
				.from('user_profiles')
				.select('*')
				.eq('id', authUser.id)
				.single()

			if (profileError) {
				if (profileError.code === 'PGRST116') {
					toast({
						title: 'Note',
						description: 'Update your profile to get started.',
						variant: 'default'
					})
					setProfile(null)
					return
				}
				throw profileError
			}

			setProfile(data)
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Unknown error occurred')
			console.error('Error in useProfile:', error)
			setError(error)
			toast({
				title: 'Error',
				description: 'Failed to load profile. Please try again.',
				variant: 'destructive'
			})
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchProfile()
	}, [toast])

	return {
		user,
		profile,
		isLoading,
		isLoggedIn: !!user,
		error,
		refreshProfile: fetchProfile
	}
} 