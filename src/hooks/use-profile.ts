import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { UserProfile } from '@/types/profile'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'
import { TOAST_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'

const PROFILE_QUERY_KEY = ['user-profile'] as const

interface ProfileData {
	user: User | null
	profile: UserProfile | null
}

async function fetchProfile(): Promise<ProfileData> {
	const supabase = createClient()
	const { data: { user: authUser }, error: authError } =
		await supabase.auth.getUser()

	if (authError) throw authError

	if (!authUser) {
		return { user: null, profile: null }
	}

	const { data, error: profileError } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('id', authUser.id)
		.single()

	if (profileError) {
		if (profileError.code === 'PGRST116') {
			return { user: authUser, profile: null }
		}
		throw profileError
	}

	return { user: authUser, profile: data }
}

interface UseProfileReturn {
	user: User | null
	profile: UserProfile | null
	isLoading: boolean
	isLoggedIn: boolean
	error: Error | null
	refreshProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
	const { toast } = useToast()

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: PROFILE_QUERY_KEY,
		queryFn: fetchProfile,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	})

	useEffect(() => {
		if (error) {
			toast({
				title: TOAST_TITLES.ERROR,
				description: ERROR_MESSAGES.AUTH.FAILED_TO_LOAD_PROFILE,
				variant: 'destructive'
			})
		}
	}, [error, toast])

	useEffect(() => {
		if (data?.user && !data?.profile) {
			toast({
				title: TOAST_TITLES.NOTE,
				description: SUCCESS_MESSAGES.PROFILE.UPDATE_TO_GET_STARTED,
				variant: 'default'
			})
		}
	}, [data?.user, data?.profile, toast])

	return {
		user: data?.user ?? null,
		profile: data?.profile ?? null,
		isLoading,
		isLoggedIn: !!data?.user,
		error: error as Error | null,
		refreshProfile: async () => { await refetch() }
	}
}
