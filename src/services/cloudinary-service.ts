'use server'

import { v2 as cloudinary } from 'cloudinary'
import {
  getCloudinaryCloudName,
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
} from '@/lib/config'
import { CloudinaryError, formatErrorForLogging } from '@/lib/errors'

/**
 * Configure Cloudinary with credentials
 */
cloudinary.config({
  cloud_name: getCloudinaryCloudName(),
  api_key: getCloudinaryApiKey(),
  api_secret: getCloudinaryApiSecret(),
})

/**
 * Uploads an image to Cloudinary
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param userId - User ID for folder organization
 * @returns Promise that resolves to the Cloudinary secure URL
 * @throws {CloudinaryError} If upload fails
 */
export async function uploadImage(
  base64Data: string,
  userId: string,
): Promise<string> {
  // Validate Cloudinary configuration
  const cloudName = getCloudinaryCloudName()
  const apiKey = getCloudinaryApiKey()
  const apiSecret = getCloudinaryApiSecret()

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryError(
      'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
    )
  }

  try {
    // Extract base64 data (remove data URL prefix if present)
    const base64Image = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const publicId = `${timestamp}-${random}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      {
        folder: `caloriecam-ai/${userId}`,
        public_id: publicId,
        resource_type: 'image',
        fetch_format: 'auto',
        quality: 'auto:good',
      },
    )

    if (!result.secure_url) {
      throw new CloudinaryError('Cloudinary upload succeeded but no URL returned')
    }

    return result.secure_url
  } catch (error) {
    let errorMessage = 'Unknown error occurred'

    if (error instanceof CloudinaryError) {
      throw error
    }

    // Extract error message from Cloudinary error object
    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message
      } else if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const cloudinaryError = error.error as { message?: string; http_code?: number }
        if (cloudinaryError.message) {
          errorMessage = cloudinaryError.message
        } else if (cloudinaryError.http_code) {
          errorMessage = `Cloudinary API error (HTTP ${cloudinaryError.http_code})`
        }
      } else if ('http_code' in error) {
        errorMessage = `Cloudinary API error (HTTP ${error.http_code})`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    const formattedError = formatErrorForLogging(error)
    console.error('Error uploading image to Cloudinary:', formattedError)

    throw new CloudinaryError(
      `Failed to upload image to Cloudinary: ${errorMessage}`,
      undefined,
      error,
    )
  }
}

