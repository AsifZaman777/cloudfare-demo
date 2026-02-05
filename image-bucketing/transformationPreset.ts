export interface TransformationPreset {
  maxWidth: number;
  quality: number;
  format: string;
}

/**
 * Preset transformation configurations
 */
export const TransformationPresets: Record<string, TransformationPreset> = {
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