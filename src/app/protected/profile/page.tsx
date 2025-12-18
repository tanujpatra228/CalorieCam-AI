'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfile, ProfileFormData } from '@/types/profile'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Activity, Target, User } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred')
        console.error('Error fetching profile:', err);
        if (err && typeof err === 'object' && 'code' in err && err.code === "PGRST116") {
          toast({
            title: 'Note',
            description: 'Update your profile to get started.',
            variant: 'default'
          })
          return
        }
        toast({
          title: 'Error',
          description: 'Failed to load profile. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      setProfile(prev => prev ? { ...prev, ...data } : null)
    } catch (error) {
      console.error('Error saving profile:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-4 max-w-2xl">
        <div className="text-center py-8 text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

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
                        {profile?.daily_calories_budget ?? 0} kcal
                      </span>
                    </div>
                    <Progress 
                      value={profile?.daily_calories_budget ? 
                        Math.min((profile.daily_calories_budget / 2000) * 100, 100) : 0} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Protein</span>
                      <span className="font-medium">
                        {profile?.daily_protein_target_g ?? 0}g
                      </span>
                    </div>
                    <Progress 
                      value={profile?.daily_protein_target_g ? 
                        Math.min((profile.daily_protein_target_g / 200) * 100, 100) : 0} 
                    />
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