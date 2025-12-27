'use server'

import { uploadImage as uploadImageToCloudinary } from '@/services/cloudinary-service'
import { createClient } from '@/utils/supabase/server'
import { AuthError, ValidationError } from '@/lib/errors'

/**
 * Uploads an image to Cloudinary
 * @param formData - FormData containing the image file
 * @returns Promise that resolves to the Cloudinary secure URL
 * @throws {AuthError} If user is not authenticated
 * @throws {ValidationError} If file is invalid
 * @throws {CloudinaryError} If upload fails
 */
export async function uploadImageToCloudinaryAction(
  formData: FormData,
): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to upload images')
  }

  const file = formData.get('file') as File | null

  if (!file) {
    throw new ValidationError('No file provided in FormData')
  }

  if (!file.type.startsWith('image/')) {
    throw new ValidationError('File must be an image')
  }

  // Validate file size (e.g., max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File size exceeds maximum limit of 10MB')
  }

  return await uploadImageToCloudinary(file, user.id)
}

