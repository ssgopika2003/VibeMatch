// Image Utility Functions for VibeMatch

/**
 * Get placeholder image URL
 * @param {string} category - Product category (dress, jewelry, cosmetic)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (category = 'product', width = 800, height = 1200) => {
  const categoryColors = {
    dress: { bg: 'E5E7EB', text: '6B7280' },
    jewelry: { bg: 'FEF3C7', text: 'D97706' },
    cosmetic: { bg: 'FECACA', text: 'DC2626' },
    product: { bg: 'E5E7EB', text: '6B7280' }
  };

  const colors = categoryColors[category.toLowerCase()] || categoryColors.product;
  const text = category.charAt(0).toUpperCase() + category.slice(1);
  
  return `https://via.placeholder.com/${width}x${height}/${colors.bg}/${colors.text}?text=${text}`;
};

/**
 * Get product image path
 * @param {string} category - Product category
 * @param {string} filename - Image filename
 * @returns {string} Full image path
 */
export const getProductImage = (category, filename) => {
  return `/assets/images/products/${category}/${filename}`;
};

/**
 * Get vibe banner image
 * @param {string} vibe - Vibe name (party, wedding, etc.)
 * @returns {string} Vibe banner image path
 */
export const getVibeImage = (vibe) => {
  const vibeLower = vibe.toLowerCase().replace(/\s+/g, '-');
  return `/assets/images/vibes/${vibeLower}-vibe.jpg`;
};

/**
 * Get hero section image
 * @param {string} page - Page name (main, quiz, recommendations)
 * @returns {string} Hero image path
 */
export const getHeroImage = (page = 'main') => {
  return `/assets/images/hero/hero-${page}.jpg`;
};

/**
 * Check if image exists, fallback to placeholder
 * @param {string} imageUrl - Image URL to check
 * @param {string} category - Category for placeholder
 * @returns {Promise<string>} Valid image URL
 */
export const getImageWithFallback = async (imageUrl, category = 'product') => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (response.ok) {
      return imageUrl;
    }
  } catch (error) {
    console.warn(`Image not found: ${imageUrl}, using placeholder`);
  }
  return getPlaceholderImage(category);
};

/**
 * Generate Unsplash random image URL (for development)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} query - Search query
 * @returns {string} Unsplash image URL
 */
export const getUnsplashImage = (width = 800, height = 1200, query = 'fashion') => {
  return `https://source.unsplash.com/${width}x${height}/?${query}`;
};

/**
 * Vibe color schemes
 */
export const vibeColors = {
  party: { primary: '#f5576c', secondary: '#ffc371', gradient: 'from-pink-500 to-orange-400' },
  wedding: { primary: '#fcb69f', secondary: '#ffecd2', gradient: 'from-pink-300 to-yellow-100' },
  glam: { primary: '#8B5CF6', secondary: '#EC4899', gradient: 'from-purple-500 to-pink-500' },
  cocktail: { primary: '#3B82F6', secondary: '#8B5CF6', gradient: 'from-blue-500 to-purple-500' },
  casual: { primary: '#10B981', secondary: '#34D399', gradient: 'from-green-500 to-green-400' },
  brunch: { primary: '#F59E0B', secondary: '#FBBF24', gradient: 'from-orange-500 to-yellow-400' },
  'date-night': { primary: '#EF4444', secondary: '#F87171', gradient: 'from-red-500 to-red-400' },
  festival: { primary: '#8B5CF6', secondary: '#EC4899', gradient: 'from-purple-500 to-pink-500' }
};

/**
 * Get vibe color scheme
 * @param {string} vibe - Vibe name
 * @returns {object} Color scheme
 */
export const getVibeColors = (vibe) => {
  const vibeLower = vibe.toLowerCase().replace(/\s+/g, '-');
  return vibeColors[vibeLower] || vibeColors.glam;
};

/**
 * Sample image URLs for different categories (using Unsplash)
 */
export const sampleImages = {
  dresses: {
    party: [
      'https://source.unsplash.com/800x1200/?party-dress,1',
      'https://source.unsplash.com/800x1200/?cocktail-dress,2',
      'https://source.unsplash.com/800x1200/?evening-dress,3'
    ],
    wedding: [
      'https://source.unsplash.com/800x1200/?wedding-dress,1',
      'https://source.unsplash.com/800x1200/?bridal-gown,2',
      'https://source.unsplash.com/800x1200/?white-dress,3'
    ],
    casual: [
      'https://source.unsplash.com/800x1200/?casual-dress,1',
      'https://source.unsplash.com/800x1200/?summer-dress,2',
      'https://source.unsplash.com/800x1200/?sundress,3'
    ]
  },
  jewelry: [
    'https://source.unsplash.com/600x600/?earrings,1',
    'https://source.unsplash.com/600x600/?necklace,2',
    'https://source.unsplash.com/600x600/?bracelet,3',
    'https://source.unsplash.com/600x600/?jewelry,4'
  ],
  cosmetics: [
    'https://source.unsplash.com/400x400/?lipstick,1',
    'https://source.unsplash.com/400x400/?makeup,2',
    'https://source.unsplash.com/400x400/?cosmetics,3',
    'https://source.unsplash.com/400x400/?beauty-products,4'
  ]
};

/**
 * Image optimization settings
 */
export const imageConfig = {
  dress: {
    width: 800,
    height: 1200,
    quality: 85,
    format: 'jpg'
  },
  jewelry: {
    width: 600,
    height: 600,
    quality: 90,
    format: 'png'
  },
  cosmetic: {
    width: 400,
    height: 400,
    quality: 90,
    format: 'png'
  },
  hero: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'jpg'
  },
  vibe: {
    width: 1200,
    height: 400,
    quality: 85,
    format: 'jpg'
  }
};

export default {
  getPlaceholderImage,
  getProductImage,
  getVibeImage,
  getHeroImage,
  getImageWithFallback,
  getUnsplashImage,
  getVibeColors,
  vibeColors,
  sampleImages,
  imageConfig
};
