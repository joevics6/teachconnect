// ============================================================
// lib/image-compress.ts
// Client-side image resize/compression before upload.
//
// Why this exists: the avatars/logos storage buckets have a hard size
// limit, and modern phone cameras routinely produce 3-8MB photos —
// well over it. Rather than rejecting those uploads, resize + re-encode
// to JPEG in the browser before sending, so uploads are small and fast
// regardless of the original file size. Re-encoding to JPEG via canvas
// also sidesteps the buckets' MIME-type allowlist (jpeg/png/webp only)
// for any source format the browser can decode into an <img>, since the
// output is always a canonical JPEG.
// ============================================================

interface CompressOptions {
  maxDimension?: number // longest edge, px
  quality?: number      // 0-1, JPEG quality
}

export async function compressImage(
  file: File,
  { maxDimension = 1000, quality = 0.82 }: CompressOptions = {}
): Promise<File> {
  // Nothing to do for already-small files — skip the round trip through
  // canvas entirely.
  if (file.size <= 300 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob) return file

    // Only use the compressed version if it's actually smaller —
    // occasionally re-encoding a small/simple image can end up larger.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], newName, { type: "image/jpeg" })
  } catch (err) {
    // Decoding can fail for formats the browser doesn't support in
    // createImageBitmap (rare, but possible for some HEIC sources on
    // some browsers) — fall back to the original file rather than
    // blocking the upload entirely; server-side validation still applies.
    console.warn("Image compression failed, uploading original:", err)
    return file
  }
}
