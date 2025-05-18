'use client'

import { CameraCapture } from '@/components/camera/camera-capture'

export default function CameraPage() {
	return (
		<div className="container mx-auto py-10">
			<h2>AI Image Analysis</h2>
			<p>Take a picture and let AI analyze it for you</p>
			<CameraCapture />
		</div>
	)
} 