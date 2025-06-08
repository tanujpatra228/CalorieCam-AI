"use client"
import { useProfile } from "@/hooks/use-profile";
import { Progress } from '@/components/ui/progress'

export function ProteinTargetProgress ({ proteinIntake }: {proteinIntake: number}) {
    const { isLoggedIn, profile } = useProfile();

    const isProteinDeficit = (proteinIntake && profile?.daily_protein_target_g) && (profile?.daily_protein_target_g > proteinIntake);

    if (!isLoggedIn) return null;

    return (
        <div>
            <div className="text-sm font-medium">Protein</div>
            <div className="flex justify-between items-end">
                <p className="text-lg font-bold">{proteinIntake}<span className="text-xs">g</span></p>
                <p className="text-xs">/{profile?.daily_protein_target_g}g</p>
            </div>
            <Progress 
                value={(profile?.daily_protein_target_g && proteinIntake) ? 
                Math.min((proteinIntake / profile?.daily_protein_target_g) * 100, 100) : 0} 
                className={isProteinDeficit ? "[&>div]:bg-red-800" : ""}
            />
        </div>
    )
}