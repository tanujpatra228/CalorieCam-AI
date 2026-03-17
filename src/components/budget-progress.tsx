"use client"

import { Progress } from '@/components/ui/progress'

interface BudgetProgressProps {
    label: string
    unit: string
    intake: number
    target: number | null | undefined
    /** Whether exceeding the target is bad (true for calories) or good (true for protein) */
    excessIsBad: boolean
}

export function BudgetProgress({ label, unit, intake, target, excessIsBad }: BudgetProgressProps) {
    const percentage = (target && intake)
        ? Math.min((intake / target) * 100, 100)
        : 0

    const isDeficit = !!(intake && target && target > intake)
    const showWarning = excessIsBad ? !isDeficit : isDeficit

    return (
        <div>
            <div className="text-sm font-medium">{label}</div>
            <div className="flex justify-between items-end">
                <p className="text-lg font-bold">{intake}<span className="text-xs">{unit}</span></p>
                <p className="text-xs">/{target}{unit}</p>
            </div>
            <Progress
                value={percentage}
                className={showWarning ? "[&>div]:bg-red-800" : ""}
            />
        </div>
    )
}
