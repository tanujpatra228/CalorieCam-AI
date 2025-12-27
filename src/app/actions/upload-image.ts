'use server'

import { uploadImage as uploadImageToCloudinary } from '@/services/cloudinary-service'
import { createClient } from '@/utils/supabase/server'
import { AuthError } from '@/lib/errors'
import { validateInput } from '@/lib/validation'
import { uploadImageSchema } from '@/lib/validation-schemas'

/**
 * Uploads an image to Cloudinary
 * @param imageData - Base64 encoded image data (with or without data URL prefix)
 * @returns Promise that resolves to the Cloudinary secure URL
 * @throws {AuthError} If user is not authenticated
 * @throws {ValidationError} If image data is invalid
 * @throws {CloudinaryError} If upload fails
 */
export async function uploadImageToCloudinaryAction(
  imageData: string,
): Promise<string> {
  validateInput(uploadImageSchema, { imageData })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('User must be logged in to upload images')
  }

  return await uploadImageToCloudinary(imageData, user.id)
}

