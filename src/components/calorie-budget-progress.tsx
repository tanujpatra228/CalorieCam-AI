"use client"
import { useProfile } from "@/hooks/use-profile";
import { BudgetProgress } from './budget-progress'

export function CaloriesBudgetProgress ({ caloriesIntake }: {caloriesIntake: number}) {
    const { isLoggedIn, profile } = useProfile();

    if (!isLoggedIn) return null;

    return (
        <BudgetProgress
            label="Calories"
            unit="kcal"
            intake={caloriesIntake}
            target={profile?.daily_calories_budget}
            excessIsBad={true}
        />
    )
}
