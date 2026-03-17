vi.mock('cloudinary', () => {
  const mockUploadStream = vi.fn()
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: mockUploadStream,
      },
    },
  }
})

vi.mock('@/lib/config', () => ({
  getCloudinaryCloudName: vi.fn(),
  getCloudinaryApiKey: vi.fn(),
  getCloudinaryApiSecret: vi.fn(),
}))

import { uploadImage } from './cloudinary-service'
import { v2 as cloudinary } from 'cloudinary'
import {
  getCloudinaryCloudName,
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
} from '@/lib/config'
import { CloudinaryError } from '@/lib/errors'

describe('cloudinary-service', () => {
  const mockSecureUrl = 'https://res.cloudinary.com/test/image/upload/v1/caloriecam-ai/user-1/test.jpg'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(getCloudinaryCloudName).mockReturnValue('test-cloud')
    vi.mocked(getCloudinaryApiKey).mockReturnValue('test-api-key')
    vi.mocked(getCloudinaryApiSecret).mockReturnValue('test-api-secret')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupUploadStream(result: any, error: any = null) {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
      (_options: any, callback: any) => {
        // Simulate async callback
        Promise.resolve().then(() => callback(error, result))
        return { end: vi.fn() } as any
      },
    )
  }

  describe('uploadImage', () => {
    it('uploads a Buffer and returns the secure URL', async () => {
      setupUploadStream({ secure_url: mockSecureUrl })

      const buffer = Buffer.from('fake image data')
      const result = await uploadImage(buffer, 'user-1')

      expect(result).toBe(mockSecureUrl)
    })

    it('uploads a File and returns the secure URL', async () => {
      setupUploadStream({ secure_url: mockSecureUrl })

      const file = new File(['fake image data'], 'photo.jpg', { type: 'image/jpeg' })
      const result = await uploadImage(file, 'user-1')

      expect(result).toBe(mockSecureUrl)
    })

    it('calls upload_stream with correct options including folder and transformations', async () => {
      setupUploadStream({ secure_url: mockSecureUrl })

      const buffer = Buffer.from('test')
      await uploadImage(buffer, 'user-42')

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'caloriecam-ai/user-42',
          resource_type: 'image',
          transformation: expect.arrayContaining([
            expect.objectContaining({ width: 600, crop: 'limit' }),
          ]),
        }),
        expect.any(Function),
      )
    })

    it('calls end on the upload stream with the file buffer', async () => {
      const endFn = vi.fn()
      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => {
          Promise.resolve().then(() => callback(null, { secure_url: mockSecureUrl }))
          return { end: endFn } as any
        },
      )

      const buffer = Buffer.from('image bytes')
      await uploadImage(buffer, 'user-1')

      expect(endFn).toHaveBeenCalledWith(buffer)
    })

    it('throws CloudinaryError when credentials are missing (cloud name)', async () => {
      vi.mocked(getCloudinaryCloudName).mockReturnValue('')

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(
        'Cloudinary credentials are not configured',
      )
    })

    it('throws CloudinaryError when API key is missing', async () => {
      vi.mocked(getCloudinaryApiKey).mockReturnValue('')

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
    })

    it('throws CloudinaryError when API secret is missing', async () => {
      vi.mocked(getCloudinaryApiSecret).mockReturnValue('')

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
    })

    it('throws CloudinaryError when upload_stream returns an error', async () => {
      setupUploadStream(null, { message: 'Upload failed', http_code: 400 })

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(
        'Failed to upload image to Cloudinary',
      )
    })

    it('throws CloudinaryError when result is null', async () => {
      setupUploadStream(null)

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(
        'no result returned',
      )
    })

    it('throws CloudinaryError when secure_url is missing from result', async () => {
      setupUploadStream({ public_id: 'test-id' }) // no secure_url

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow(CloudinaryError)
      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow('no URL returned')
    })

    it('logs the error to console on upload failure', async () => {
      setupUploadStream(null, { message: 'Server error' })

      const buffer = Buffer.from('data')

      await expect(uploadImage(buffer, 'user-1')).rejects.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error uploading image to Cloudinary:',
        expect.any(String),
      )
    })

    it('re-throws CloudinaryError instances without wrapping', async () => {
      // When the result is null, the code throws a CloudinaryError directly.
      // Then the catch block re-throws it without wrapping.
      setupUploadStream(null)

      const buffer = Buffer.from('data')

      try {
        await uploadImage(buffer, 'user-1')
        expect.unreachable('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(CloudinaryError)
        expect((error as CloudinaryError).message).toBe(
          'Cloudinary upload succeeded but no result returned',
        )
      }
    })
  })
})
