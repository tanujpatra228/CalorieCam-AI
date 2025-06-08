"use client"
import { useProfile } from "@/hooks/use-profile";
import { Progress } from '@/components/ui/progress'

export function CaloriesBudgetProgress ({ caloriesIntake }: {caloriesIntake: number}) {
    const { isLoggedIn, profile } = useProfile();

    const isCalorieDeficit = (caloriesIntake && profile?.daily_calories_budget) && (profile?.daily_calories_budget > caloriesIntake);

    if (!isLoggedIn) return null;

    return (
        <div>
            <div className="text-sm font-medium">Calories</div>
            <div className="flex justify-between items-end">
                <p className="text-lg font-bold">{caloriesIntake}<span className="text-xs">kcal</span></p>
                <p className="text-xs">/{profile?.daily_calories_budget}kcal</p>
            </div>
            <Progress 
                value={(profile?.daily_calories_budget && caloriesIntake) ? 
                Math.min((caloriesIntake / profile?.daily_calories_budget) * 100, 100) : 0} 
                className={!isCalorieDeficit ? "[&>div]:bg-red-800" : ""}
            />
        </div>
    )
}