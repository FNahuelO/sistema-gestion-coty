type CloudinaryLoaderProps = {
  src: string
  width: number
  quality?: number
}

export function buildCloudinaryUrl(src: string, width: number, quality?: number) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality ?? 'auto'}`]
  return src.replace('/upload/', `/upload/${params.join(',')}/`)
}

export default function cloudinaryLoader({ src, width, quality }: CloudinaryLoaderProps) {
  if (src.startsWith('/') || !src.includes('res.cloudinary.com')) {
    return src
  }

  return buildCloudinaryUrl(src, width, quality)
}
