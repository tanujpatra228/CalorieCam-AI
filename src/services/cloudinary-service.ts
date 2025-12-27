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
 * Uploads an image to Cloudinary with incoming transformations
 * Applies transformations during upload, so only the transformed version is stored
 * @param file - File or Buffer to upload
 * @param userId - User ID for folder organization
 * @returns Promise that resolves to the Cloudinary secure URL of the compressed version
 * @throws {CloudinaryError} If upload fails
 */
export async function uploadImage(
  file: File | Buffer,
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
    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const publicId = `${timestamp}-${random}`

    // Convert File to Buffer if needed
    let fileBuffer: Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
    } else {
      fileBuffer = file
    }

    // Upload to Cloudinary with incoming transformations using upload_stream
    // Incoming transformations apply during upload, so only transformed version is stored
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `caloriecam-ai/${userId}`,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            {
              width: 600,
              crop: 'limit',
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error)
          } else {
            resolve(uploadResult)
          }
        },
      )
      uploadStream.end(fileBuffer)
    })

    if (!result) {
      throw new CloudinaryError('Cloudinary upload succeeded but no result returned')
    }

    // With incoming transformations, result.secure_url is the transformed version
    // The original file was never stored - only the transformed version exists
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

