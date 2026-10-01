const MAX_DIMENSION = 1600
const MAX_PASSTHROUGH_BYTES = 3 * 1024 * 1024

// Animated and vector formats would be flattened by a canvas, so they are kept as-is.
const PASSTHROUGH = { 'image/gif': 'gif', 'image/svg+xml': 'svg' }

/**
 * Shrinks a picked image to a web-friendly WebP so the repository stays small.
 * Returns { blob, extension }.
 */
export async function prepareImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image.`)
  }

  if (PASSTHROUGH[file.type]) {
    if (file.size > MAX_PASSTHROUGH_BYTES) {
      throw new Error(`"${file.name}" is larger than 3 MB. Use a smaller file.`)
    }
    return { blob: file, extension: PASSTHROUGH[file.type] }
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`"${file.name}" could not be read as an image.`)
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) throw new Error(`"${file.name}" could not be converted.`)
  // Browsers without WebP encoding silently fall back to PNG.
  return { blob, extension: blob.type === 'image/webp' ? 'webp' : 'png' }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(',') + 1))
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.readAsDataURL(blob)
  })
}
