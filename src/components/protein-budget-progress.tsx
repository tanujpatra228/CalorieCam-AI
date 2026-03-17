"use client"
import { useProfile } from "@/hooks/use-profile";
import { BudgetProgress } from './budget-progress'

export function ProteinTargetProgress ({ proteinIntake }: {proteinIntake: number}) {
    const { isLoggedIn, profile } = useProfile();

    if (!isLoggedIn) return null;

    return (
        <BudgetProgress
            label="Protein"
            unit="g"
            intake={proteinIntake}
            target={profile?.daily_protein_target_g}
            excessIsBad={false}
        />
    )
}
