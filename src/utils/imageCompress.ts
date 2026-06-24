/**
 * Client-side image compression — resize + re-encode before upload so large
 * phone photos (often 3–8 MB) become a few hundred KB. Keeps uploads fast and
 * the server light. Falls back to the original file on any error.
 */

interface CompressOptions {
  /** longest side in px (image is scaled down to fit) */
  maxDimension?: number;
  /** JPEG quality 0..1 */
  quality?: number;
  /** files already smaller than this (bytes) and within maxDimension are left as-is */
  skipUnderBytes?: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/**
 * Compress an image File. Returns a new (smaller) JPEG File, or the original
 * file unchanged if it's already small, not an image, a GIF, or on any failure.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1600, quality = 0.7, skipUnderBytes = 600 * 1024 } = opts;

  // only compress static raster images (skip gif animations, svg, non-images)
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    const { width, height } = img;

    // already small enough — don't bother
    if (file.size <= skipUnderBytes && width <= maxDimension && height <= maxDimension) {
      return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // compression didn't help

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file; // any failure -> upload the original
  }
}

export default compressImage;
