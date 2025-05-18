'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { IMG_ANALYZE_PROMPT } from './consts'

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function analyzeImage(imageData: string): Promise<string> {
	try {
		// Convert base64 to blob
		const base64Data = imageData.split(',')[1]
		const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())

		// Initialize the model
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

		// Create image part
		const imagePart = {
			inlineData: {
				data: base64Data,
				mimeType: 'image/jpeg'
			}
		}

		// Generate content
		const result = await model.generateContent([
			IMG_ANALYZE_PROMPT,
			imagePart
		])

		const response = await result.response
		console.log({response});
		return response.text()
	} catch (error) {
		console.error('Error analyzing image:', error)
		throw new Error('Failed to analyze image')
	}
} 