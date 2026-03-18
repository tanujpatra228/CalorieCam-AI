'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { UserProfile, ProfileFormData } from '@/types/profile'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Activity, Target, User } from 'lucide-react'
import { AnalysisLog } from '@/types/database'
import { format } from 'date-fns'
import { getDateRange } from '@/utils/date-utils'
import { roundToTwoDecimals } from '@/lib/utils'
import { TOAST_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'

function calculateDailyMacros(logs: AnalysisLog[]): { calories: number; protein: number } {
  const result = logs.reduce((acc, log) => ({
    calories: acc.calories + log.macros.calories_kcal - (log.total_calories_to_digest_kcal || 0),
    protein: acc.protein + log.macros.protein_g,
  }), {
    calories: 0,
    protein: 0,
  })

  return {
    calories: roundToTwoDecimals(result.calories),
    protein: roundToTwoDecimals(result.protein),
  }
}

interface ProfilePageData {
  profile: UserProfile | null
  todayLogs: AnalysisLog[]
  profileNotFound: boolean
}

async function fetchProfilePageData(): Promise<ProfilePageData> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const { startDate, endDate } = getDateRange(today)

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('analysis_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false }),
  ])

  if (logsResult.error) {
    throw logsResult.error
  }

  if (profileResult.error) {
    if (profileResult.error.code === 'PGRST116') {
      return { profile: null, todayLogs: (logsResult.data || []) as AnalysisLog[], profileNotFound: true }
    }
    throw profileResult.error
  }

  return {
    profile: profileResult.data as UserProfile,
    todayLogs: (logsResult.data || []) as AnalysisLog[],
    profileNotFound: false,
  }
}

export default function ProfilePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile-page'],
    queryFn: fetchProfilePageData,
    retry: 1,
  })

  useEffect(() => {
    if (error) {
      toast({
        title: TOAST_TITLES.ERROR,
        description: ERROR_MESSAGES.AUTH.FAILED_TO_LOAD_PROFILE,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  useEffect(() => {
    if (data?.profileNotFound) {
      toast({
        title: TOAST_TITLES.NOTE,
        description: SUCCESS_MESSAGES.PROFILE.UPDATE_TO_GET_STARTED,
        variant: 'default',
      })
    }
  }, [data?.profileNotFound, toast])

  const profile = data?.profile ?? null
  const todayLogs = data?.todayLogs ?? []

  const handleSaveProfile = async (formData: ProfileFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error: saveError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      })

    if (saveError) {
      throw saveError
    }

    await queryClient.invalidateQueries({ queryKey: ['profile-page'] })
    await queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-4 max-w-2xl">
        <div className="text-center py-8 text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  const dailyMacros = calculateDailyMacros(todayLogs)
  const consumedCalories = Math.round(dailyMacros.calories)
  const consumedProtein = Math.round(dailyMacros.protein)
  const caloriesTarget = profile?.daily_calories_budget ?? 0
  const proteinTarget = profile?.daily_protein_target_g ?? 0
  const caloriesProgress = caloriesTarget > 0 ? Math.min((consumedCalories / caloriesTarget) * 100, 100) : 0
  const proteinProgress = proteinTarget > 0 ? Math.min((consumedProtein / proteinTarget) * 100, 100) : 0

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Daily Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Calories</span>
                      <span className="font-medium">
                        {caloriesTarget > 0 ? `${consumedCalories} / ${caloriesTarget} kcal` : `${caloriesTarget} kcal`}
                      </span>
                    </div>
                    <Progress value={caloriesProgress} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Protein</span>
                      <span className="font-medium">
                        {proteinTarget > 0 ? `${consumedProtein} / ${proteinTarget}g` : `${proteinTarget}g`}
                      </span>
                    </div>
                    <Progress value={proteinProgress} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Body Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Height</div>
                    <div className="text-2xl font-bold">
                      {profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Weight</div>
                    <div className="text-2xl font-bold">
                      {profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Activity & Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Activity Level</div>
                    <div className="text-lg font-medium">
                      {profile?.activity_level ?
                        profile.activity_level.charAt(0).toUpperCase() +
                        profile.activity_level.slice(1).replace('_', ' ') :
                        'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Goal</div>
                    <div className="text-lg font-medium">
                      {profile?.goal ?
                        profile.goal.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ') :
                        'Not set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <ProfileForm
            profile={profile}
            onSave={handleSaveProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
