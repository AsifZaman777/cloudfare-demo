/**
 * Image Transformation Algorithm
 * Applies Cloudinary-like transformations to images client-side
 */

/**
 * Apply image transformations
 * @param {File} file - The image file to transform
 * @param {Object} options - Transformation options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1000)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.35)
 * @param {string} options.format - Output format (default: 'image/jpeg')
 * @returns {Promise<Blob>} The transformed image as a Blob
 */
export async function applyTransformations(
  file,
  options = {
    maxWidth: 1000,
    quality: 0.35,
    format: "image/jpeg",
  },
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Apply transformation: scale to maxWidth
      const maxWidth = options.maxWidth || 1000;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with specified quality
      const quality = options.quality !== undefined ? options.quality : 0.35;
      const format = options.format || "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        format,
        quality,
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Helper function to format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Calculate size reduction percentage
 * @param {number} originalSize - Original file size in bytes
 * @param {number} transformedSize - Transformed file size in bytes
 * @returns {string} Reduction percentage with 2 decimal places
 */
export function calculateSizeReduction(originalSize, transformedSize) {
  const reduction = ((originalSize - transformedSize) / originalSize) * 100;
  return reduction.toFixed(2);
}

/**
 * Preset transformation configurations
 */
export const TransformationPresets = {
  // High quality, moderate compression
  HIGH_QUALITY: {
    maxWidth: 1920,
    quality: 0.8,
    format: "image/jpeg",
  },
  // Medium quality, good compression (default)
  MEDIUM_QUALITY: {
    maxWidth: 1000,
    quality: 0.35,
    format: "image/jpeg",
  },
  // Low quality, maximum compression
  LOW_QUALITY: {
    maxWidth: 640,
    quality: 0.2,
    format: "image/jpeg",
  },
  // Thumbnail size
  THUMBNAIL: {
    maxWidth: 300,
    quality: 0.7,
    format: "image/jpeg",
  },
};
