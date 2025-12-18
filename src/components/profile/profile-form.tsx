'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserProfile, ProfileFormData, calculateDailyCaloriesBudget, calculateProteinTarget } from '@/types/profile'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const profileFormSchema = z.object({
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(300).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle']).optional(),
  daily_calories_budget: z.number().min(1000).max(5000).optional(),
  daily_protein_target_g: z.number().min(20).max(300).optional(),
})

interface ProfileFormProps {
  profile: UserProfile | null
  onSave: (data: ProfileFormData) => Promise<void>
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const { toast } = useToast()
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      height_cm: profile?.height_cm ?? undefined,
      weight_kg: profile?.weight_kg ?? undefined,
      activity_level: profile?.activity_level ?? undefined,
      goal: profile?.goal ?? undefined,
      daily_calories_budget: profile?.daily_calories_budget ?? undefined,
      daily_protein_target_g: profile?.daily_protein_target_g ?? undefined,
    },
  })

  const height = form.watch('height_cm')
  const weight = form.watch('weight_kg')
  const activityLevel = form.watch('activity_level')
  const goal = form.watch('goal')

  useEffect(() => {
    if (height && weight && activityLevel && goal) {
      const caloriesBudget = calculateDailyCaloriesBudget(
        weight,
        height,
        activityLevel,
        goal
      )
      const proteinTarget = calculateProteinTarget(weight, goal)
      
      form.setValue('daily_calories_budget', caloriesBudget, { shouldValidate: false })
      form.setValue('daily_protein_target_g', proteinTarget, { shouldValidate: false })
    } else {
      form.setValue('daily_calories_budget', undefined, { shouldValidate: false })
      form.setValue('daily_protein_target_g', undefined, { shouldValidate: false })
    }
  }, [height, weight, activityLevel, goal, form])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await onSave(data)
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Body Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="height_cm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your height"
                      {...field}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Your height in centimeters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your weight"
                      {...field}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Your weight in kilograms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity & Goals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="activity_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Lightly Active</SelectItem>
                      <SelectItem value="moderate">Moderately Active</SelectItem>
                      <SelectItem value="active">Very Active</SelectItem>
                      <SelectItem value="very_active">Extremely Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your daily activity level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lose_weight">Lose Weight</SelectItem>
                      <SelectItem value="maintain">Maintain Weight</SelectItem>
                      <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your fitness goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Targets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="daily_calories_budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Calories Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Auto-calculated"
                      {...field}
                      value={field.value ?? ''}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormDescription>
                    Automatically calculated based on your height, weight, activity level, and goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_protein_target_g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Protein Target (g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Auto-calculated"
                      {...field}
                      value={field.value ?? ''}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormDescription>
                    Automatically calculated based on your weight and goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Save Profile
        </Button>
      </form>
    </Form>
  )
} 