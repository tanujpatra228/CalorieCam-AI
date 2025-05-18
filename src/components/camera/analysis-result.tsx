'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface AnalysisResultProps {
	result: string
	image: string
	onRetake: () => void
	onAnalyze: () => void
	isAnalyzing: boolean
}

export function AnalysisResult({
	result,
	image,
	onRetake,
	onAnalyze,
	isAnalyzing
}: AnalysisResultProps) {
	// Split the result into sections if it contains multiple paragraphs
	const sections = result.split('\n').filter(Boolean)

	return (
		<div className="flex flex-col items-center gap-6 w-full max-w-4xl">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
				{/* Image Preview */}
				<Card className="overflow-hidden">
					<CardHeader>
						<CardTitle>Captured Image</CardTitle>
					</CardHeader>
					<CardContent>
						<img
							src={image}
							alt="Captured"
							className="w-full rounded-lg object-cover"
						/>
					</CardContent>
				</Card>

				{/* Analysis Result */}
				<Card>
					<CardHeader>
						<CardTitle>AI Analysis</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[300px] pr-4">
							<div className="space-y-4">
								{sections.map((section, index) => (
									<p
										key={index}
										className="text-sm leading-relaxed"
									>
										{section}
									</p>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onRetake}
					disabled={isAnalyzing}
				>
					Retake
				</Button>
				<Button
					onClick={onAnalyze}
					disabled={isAnalyzing}
				>
					{isAnalyzing ? 'Analyzing...' : 'Analyze Again'}
				</Button>
			</div>
		</div>
	)
} 