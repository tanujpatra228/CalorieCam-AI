'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { analyzeImage } from '@/lib/ai-service'
import { AnalysisResult } from './analysis-result'

export function CameraCapture() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<string | null>(null)
	const { toast } = useToast()

	const startCamera = useCallback(async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			})
			setStream(mediaStream)
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to access camera',
				variant: 'destructive'
			})
		}
	}, [toast])

	const stopCamera = useCallback(() => {
		if (stream) {
			stream.getTracks().forEach(track => track.stop())
			setStream(null)
		}
	}, [stream])

	const captureImage = useCallback(() => {
		if (videoRef.current) {
			const canvas = document.createElement('canvas')
			canvas.width = videoRef.current.videoWidth
			canvas.height = videoRef.current.videoHeight
			const ctx = canvas.getContext('2d')
			if (ctx) {
				ctx.drawImage(videoRef.current, 0, 0)
				const imageData = canvas.toDataURL('image/jpeg')
				setCapturedImage(imageData)
				stopCamera()
			}
		}
	}, [stopCamera])

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			if (!file.type.startsWith('image/')) {
				toast({
					title: 'Error',
					description: 'Please select an image file',
					variant: 'destructive'
				})
				return
			}

			const reader = new FileReader()
			reader.onload = (e) => {
				const result = e.target?.result
				if (typeof result === 'string') {
					setCapturedImage(result)
					stopCamera()
				}
			}
			reader.readAsDataURL(file)
		}
	}

	const handleAnalyze = async () => {
		if (!capturedImage) return

		setIsAnalyzing(true)
		try {
			const result = await analyzeImage(capturedImage)
			setAnalysisResult(result)
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to analyze image',
				variant: 'destructive'
			})
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleRetake = () => {
		setCapturedImage(null)
		setAnalysisResult(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
		startCamera()
	}

	if (capturedImage && analysisResult) {
		return (
			<AnalysisResult
				result={analysisResult}
				image={capturedImage}
				onRetake={handleRetake}
				onAnalyze={handleAnalyze}
				isAnalyzing={isAnalyzing}
			/>
		)
	}

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
					{!stream && (
						<div className="flex justify-center items-center gap-4">
							<Button onClick={startCamera}>Start Camera</Button>
							<div className="relative">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileSelect}
									className="hidden"
									id="image-upload"
								/>
								<Button
									variant="outline"
									onClick={() => fileInputRef.current?.click()}
								>
									Select Image
								</Button>
							</div>
						</div>
					)}
					{stream && (
						<Button onClick={captureImage}>Capture</Button>
					)}
				</div>
			</div>

			{capturedImage && !analysisResult && (
				<div className="flex flex-col items-center gap-4">
					<img
						src={capturedImage}
						alt="Captured"
						className="max-w-2xl w-full rounded-lg"
					/>
					<div className="flex gap-4">
						<Button
							variant="outline"
							onClick={handleRetake}
							disabled={isAnalyzing}
						>
							Retake
						</Button>
						<Button
							onClick={handleAnalyze}
							disabled={isAnalyzing}
						>
							{isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
} 