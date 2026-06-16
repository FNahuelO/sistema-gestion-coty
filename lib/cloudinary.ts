import { v2 as cloudinary } from 'cloudinary'

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error('CLOUDINARY_NOT_CONFIGURED')
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  return cloudinary
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string }
) {
  const client = getCloudinary()

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const upload = client.uploader.upload_stream(
      {
        folder: options?.folder ?? 'coty-cafe',
        public_id: options?.publicId,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('No se pudo subir la imagen'))
          return
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        })
      }
    )

    upload.end(buffer)
  })
}
