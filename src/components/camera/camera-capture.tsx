'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { analyzeImage } from '@/services/ai-service'
import { uploadImageToCloudinaryAction } from '@/app/actions/upload-image'
import { CameraIcon, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { AnalysisResult } from './analysis-result'
import { Textarea } from '../ui/textarea'
import { compressImageFromCanvas, compressImageFromFile } from '@/utils/image-compression'

export function CameraCapture() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null)
	const [additionalContext, setAdditionalContext] = useState<string>('')
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<string | null>(null)
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
	const { toast } = useToast()

	const isCameraOpen = isFullscreen && stream;

	const startCamera = useCallback(async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			})
			setStream(mediaStream);
			setIsFullscreen(true);
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
			setIsFullscreen(true);
		}
	}, [stream])

	const uploadImageToCloudinary = useCallback(async (imageData: string) => {
		setIsUploading(true)
		try {
			const url = await uploadImageToCloudinaryAction(imageData)
			setCloudinaryUrl(url)
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to upload image. You can still analyze it, but it won\'t be saved.',
				variant: 'destructive'
			})
		} finally {
			setIsUploading(false)
		}
	}, [toast])

	const captureImage = useCallback(async () => {
		if (videoRef.current) {
			const canvas = document.createElement('canvas')
			canvas.width = videoRef.current.videoWidth
			canvas.height = videoRef.current.videoHeight
			const context = canvas.getContext('2d')
			if (context) {
				context.drawImage(videoRef.current, 0, 0)
				try {
					const compressedImageData = compressImageFromCanvas(canvas)
					setCapturedImage(compressedImageData)
					stopCamera()
					await uploadImageToCloudinary(compressedImageData)
				} catch (error) {
					toast({
						title: 'Error',
						description: 'Failed to compress image',
						variant: 'destructive'
					})
				}
			}
		}
	}, [stopCamera, toast, uploadImageToCloudinary])

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

			try {
				const compressedImageData = await compressImageFromFile(file)
				setCapturedImage(compressedImageData)
				stopCamera()
				await uploadImageToCloudinary(compressedImageData)
			} catch (error) {
				toast({
					title: 'Error',
					description: 'Failed to process image',
					variant: 'destructive'
				})
			}
		}
	}

	const handleAnalyze = async () => {
		if (!capturedImage) return

		setIsAnalyzing(true)
		try {
			const result = await analyzeImage(capturedImage, additionalContext)
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
		setCloudinaryUrl(null)
		setAnalysisResult(null)
		setIsFullscreen(true)
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
				cloudinaryUrl={cloudinaryUrl || capturedImage}
				onRetake={handleRetake}
				onAnalyze={handleAnalyze}
				isAnalyzing={isAnalyzing}
			/>
		)
	}

	return (
		<div className="flex flex-col items-center gap-4">
			{
				!capturedImage && (
					<div className={`${isCameraOpen ? 'fixed inset-0 h-screen' : 'relative'} w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden`}>
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
							{isCameraOpen && (
								<div className="fixed bottom-0 left-0 right-0">
									<div className='flex justify-center items-center gap-4 mb-0 p-4'>
										<Button onClick={stopCamera} variant={'outline'} className='rounded-full px-4 py-7 bg-transparent border-white'>
											<X />
										</Button>
										<Button onClick={captureImage} className='rounded-full px-4 py-7'>
											<CameraIcon />
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				)
			}

			{capturedImage && !analysisResult && (
				<div className="flex flex-col items-center gap-4">
					<img
						src={capturedImage}
						alt="Captured"
						className="max-w-2xl w-full rounded-lg"
					/>
					<Textarea placeholder={`2 Aalu parotha with curd, Salad (1 Cucumber, 1 Tomatos, 1 Onions, 1tbs Olive Oil)...`} onChange={(e) => setAdditionalContext(e.currentTarget.value)} value={additionalContext} />
					<div className="flex gap-4">
						<Button
							variant="outline"
							onClick={handleRetake}
							disabled={isAnalyzing || isUploading}
						>
							Retake
						</Button>
						<Button
							onClick={handleAnalyze}
							disabled={isAnalyzing || isUploading}
						>
							{isAnalyzing ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Analyze Image'}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
} 