
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


