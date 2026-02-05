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