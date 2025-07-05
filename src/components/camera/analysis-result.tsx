'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useMemo } from 'react'
import { useAnalysis } from '@/contexts/analysis-context'
import { AnalysisData } from '@/types/database'
import { useRouter } from 'next/navigation'
import { LogsIcon } from 'lucide-react'

interface MacroData {
	calories_kcal: number
	carbs_g: number
	protein_g: number
	fat_g: number
	sugars_g: number
	sat_fat_g: number
	fiber_g: number
}

interface AnalysisResultProps {
	result: string
	image: string
	onRetake: () => void
	onAnalyze: () => void
	isAnalyzing: boolean
}

const chartConfig = {
	protein: {
		label: 'Protein',
		color: 'hsl(var(--chart-1))'
	},
	fat: {
		label: 'Fat',
		color: 'hsl(var(--chart-2))'
	},
	carbs: {
		label: 'Carbs',
		color: 'hsl(var(--chart-3))'
	}
} satisfies ChartConfig

const macrosChartConfig = {
	macros: {
		label: 'Macros',
		color: 'hsl(var(--primary))'
	},
	label: {
		color: 'hsl(var(--background))'
	}
} satisfies ChartConfig

export function AnalysisResult({
	result,
	image,
	onRetake,
	onAnalyze,
	isAnalyzing
}: AnalysisResultProps) {
	const { isLoggedIn, isLogging, logCurrentAnalysis } = useAnalysis();
	const router = useRouter();
	
	const jsonResult = useMemo(() => {
		try {
			const cleanJson = result.replace(/^```json\n/, '').replace(/```$/, '')
			return JSON.parse(cleanJson) as AnalysisData
		} catch (error) {
			console.error('Failed to parse analysis result:', error)
			return null
		}
	}, [result])

	const chartData = useMemo(() => {
		if (!jsonResult) return []
		const { macros } = jsonResult
		return [
			{ name: 'protein', value: macros.protein_g, fill: 'hsl(var(--protein))' },
			{ name: 'fat', value: macros.fat_g + macros.sat_fat_g, fill: 'hsl(var(--fat))' },
			{ name: 'carbs', value: macros.carbs_g, fill: 'hsl(var(--carbs))' }
		]
	}, [jsonResult])

	const macrosBarData = useMemo(() => {
		if (!jsonResult) return []
		const { macros } = jsonResult
		const { fat_g, sat_fat_g, ...otherMacros } = macros
		const totalFat = fat_g + sat_fat_g

		return Object.entries({ ...otherMacros, total_fat: totalFat })
			.filter(([key]) => key !== 'calories_kcal')
			.map(([key, value]) => ({
				name: key.replace('_g', '').replace(/_/g, ' '),
				value: typeof value === 'string' ? parseFloat(value) : Number(value)
			}))
			.sort((a, b) => b.value - a.value)
	}, [jsonResult])

	const handleLogAnalysis = async () => {
		if (!jsonResult) return
		await logCurrentAnalysis(jsonResult, image)
	}

	if (!jsonResult) {
		return (
			<div className="flex flex-col items-center gap-4">
				<p className="text-destructive">Failed to parse analysis result</p>
				<Button onClick={onRetake}>Retake</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center gap-6 w-full max-w-4xl">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
				{/* Image Preview */}
				<Card className="overflow-hidden">
					<CardHeader>
						<CardTitle className='pb-2'>{jsonResult.dish_name}</CardTitle>
						<div className='flex gap-2'>
							<span>~{jsonResult.total_digestion_time_m} min</span>
							{isLoggedIn && jsonResult?.total_calories_to_digest_kcal ? <span>~{jsonResult.total_calories_to_digest_kcal} kcal</span> : null}
						</div>
					</CardHeader>
					<CardContent>
						<img
							src={image}
							alt="Captured"
							className="w-full max-h-96 rounded-lg object-cover"
						/>
					</CardContent>
				</Card>

				{/* Macros Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Macronutrients</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="mx-auto aspect-square max-h-[300px]"
						>
							<PieChart>
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent />}
								/>
								<Pie
									data={chartData}
									dataKey="value"
									nameKey="name"
									innerRadius={60}
									strokeWidth={5}
								>
									<Label
										content={(props: any) => {
											const { viewBox } = props
											if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
												return (
													<text
														x={viewBox.cx}
														y={viewBox.cy}
														textAnchor="middle"
														dominantBaseline="middle"
													>
														<tspan
															x={viewBox.cx}
															y={viewBox.cy}
															className="fill-foreground text-3xl font-bold"
														>
															{jsonResult.macros.calories_kcal}
														</tspan>
														<tspan
															x={viewBox.cx}
															y={(viewBox.cy || 0) + 24}
															className="fill-muted-foreground"
														>
															kcal
														</tspan>
													</text>
												)
											}
										}}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>
						<CardFooter className='p-0 flex justify-between items-stretch text-xs'>
							<span className='flex gap-1 justify-start items-center'>
								<span className='block h-3 w-3 rounded-full bg-[hsl(var(--protein))]' />
								Protein {(jsonResult.macros.protein_g).toFixed(2)} g
							</span>
							<span className='flex gap-1 justify-start items-center'>
								<span className='block h-3 w-3 rounded-full bg-[hsl(var(--fat))]' />
								Fat {(jsonResult.macros.fat_g + jsonResult.macros.sat_fat_g).toFixed(2)} g
							</span>
							<span className='flex gap-1 justify-start items-center'>
								<span className='block h-3 w-3 rounded-full bg-[hsl(var(--carbs))]' />
								Carbs {(jsonResult.macros.carbs_g).toFixed(2)} g
							</span>
						</CardFooter>
					</CardContent>
				</Card>

				{/* Detailed Macros Bar Chart */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Macronutrients Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={macrosChartConfig}>
							<BarChart
								data={macrosBarData}
								layout="vertical"
								margin={{
									right: 40,
									left: 0,
									top: 8,
									bottom: 8
								}}
								barSize={26}
								compact
								height={500}
							>
								<CartesianGrid horizontal={false} />
								<YAxis
									dataKey="name"
									type="category"
									tickLine={false}
									tickMargin={5}
									axisLine={false}
									className='capitalize'
								/>
								<XAxis
									dataKey="value"
									type="number"
									domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
								/>
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent indicator="line" />}
								/>
								<Bar
									dataKey="value"
									fill="hsl(var(--primary))"
									radius={4}
								>
									<LabelList
										dataKey="value"
										position="right"
										offset={8}
										className="fill-foreground"
										fontSize={12}
										formatter={(value: number) => `${value}g`}
									/>
								</Bar>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Analysis Notes */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Analysis Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[200px] pr-4">
							<div className="space-y-4">
								{jsonResult.notes.map((note, index) => (
									<p
										key={index}
										className="text-sm leading-relaxed"
									>
										{note}
									</p>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			
			<div className="w-full">
				{isLoggedIn ? (
					<Button
						onClick={handleLogAnalysis}
						disabled={isAnalyzing || isLogging}
						variant='secondary'
						className='w-full flex gap-2 bg-green-800 text-white'
					>
						<LogsIcon /> {isLogging ? 'Logging...' : 'Log Analysis'}
					</Button>
				) : (
					<Button
						onClick={() => router.push('/sign-in')}
						variant='secondary'
						className='w-full flex gap-2 bg-green-800 text-white'
					>
						<LogsIcon />{' '}Sign-in to Log
					</Button>
				)
				}
			</div>
			{/* Action Buttons */}
			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onRetake}
					disabled={isAnalyzing || isLogging}
				>
					Retake
				</Button>
				<Button
					onClick={onAnalyze}
					disabled={isAnalyzing || isLogging}
				>
					{isAnalyzing ? 'Analyzing...' : 'Analyze Again'}
				</Button>
			</div>
		</div>
	)
} 