/**
 * Image compression utility
 * Compresses and resizes images to reduce payload size for API requests
 */

import { IMAGE_COMPRESSION } from '@/lib/constants'

const MAX_WIDTH = IMAGE_COMPRESSION.MAX_WIDTH
const MAX_HEIGHT = IMAGE_COMPRESSION.MAX_HEIGHT
const JPEG_QUALITY = IMAGE_COMPRESSION.JPEG_QUALITY
const MAX_FILE_SIZE_BYTES = IMAGE_COMPRESSION.MAX_FILE_SIZE_BYTES
const MIN_QUALITY = IMAGE_COMPRESSION.MIN_QUALITY
const QUALITY_STEP = IMAGE_COMPRESSION.QUALITY_STEP

/**
 * Compresses an image from a canvas element
 * @param canvas - The canvas element containing the image
 * @returns Base64 data URL of the compressed image
 */
export function compressImageFromCanvas(canvas: HTMLCanvasElement): string {
  const { width, height } = calculateOptimalDimensions(
    canvas.width,
    canvas.height
  )

  const compressedCanvas = document.createElement('canvas')
  compressedCanvas.width = width
  compressedCanvas.height = height

  const context = compressedCanvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  context.drawImage(canvas, 0, 0, width, height)

  let quality = JPEG_QUALITY
  let dataUrl = compressedCanvas.toDataURL('image/jpeg', quality)

  // Further reduce quality if still too large
  while (getBase64Size(dataUrl) > MAX_FILE_SIZE_BYTES && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP
    dataUrl = compressedCanvas.toDataURL('image/jpeg', quality)
  }

  return dataUrl
}

/**
 * Compresses an image from a File object
 * @param file - The image file to compress
 * @returns Promise that resolves to base64 data URL of the compressed image
 */
export function compressImageFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as data URL'))
        return
      }

      const img = new Image()
      img.onload = () => {
        const { width, height } = calculateOptimalDimensions(img.width, img.height)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        context.drawImage(img, 0, 0, width, height)

        let quality = JPEG_QUALITY
        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        // Further reduce quality if still too large
        while (getBase64Size(dataUrl) > MAX_FILE_SIZE_BYTES && quality > MIN_QUALITY) {
          quality -= QUALITY_STEP
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = result
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Calculates optimal dimensions while maintaining aspect ratio
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @returns Object with optimal width and height
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  if (originalWidth <= MAX_WIDTH && originalHeight <= MAX_HEIGHT) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  if (originalWidth > originalHeight) {
    return {
      width: MAX_WIDTH,
      height: Math.round(MAX_WIDTH / aspectRatio),
    }
  }

  return {
    width: Math.round(MAX_HEIGHT * aspectRatio),
    height: MAX_HEIGHT,
  }
}

/**
 * Estimates the size of a base64 string in bytes
 * @param base64String - Base64 encoded string
 * @returns Estimated size in bytes
 */
function getBase64Size(base64String: string): number {
  const base64Data = base64String.split(',')[1] || base64String
  const padding = (base64Data.match(/=/g) || []).length
  return (base64Data.length * 3) / 4 - padding
}

