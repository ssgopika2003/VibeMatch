/**
 * Site Image Configuration
 * Centralized image management with fallback support
 * Admin can update these paths through settings in the future
 */

// Default Brand Images (for UI/Branding - NOT products)
export const SITE_IMAGES = {
  // Hero Section Images
  hero: {
    main: '/assets/images/hero/hero-main-banner.jpg',
    woman: '/assets/images/hero/hero-woman-fashion.jpg',
    accessories: '/assets/images/hero/hero-accessories.jpg',
    lifestyle: '/assets/images/hero/hero-lifestyle.jpg',
    featured: '/assets/images/hero/hero-featured-square.png',
  },
  
  // Vibe Category Showcase Images (E-commerce Optimized - 8 Core Categories)
  vibes: {
    // Core 8 Categories for E-commerce Fashion Platform
    casual: '/assets/images/vibes/vibe-casual-1.jpg',
    formal: '/assets/images/vibes/vibe-mens-fashion-2.jpg',
    party: '/assets/images/vibes/vibe-fashion-1.jpg',
    wedding: '/assets/images/vibes/vibe-wedding-elegant.jpg',
    cocktail: '/assets/images/vibes/vibe-cocktail.jpg',
    professional: '/assets/images/vibes/vibe-professional-1.jpg',
    elegant: '/assets/images/vibes/vibe-elegant-2.jpg',         // Using elegant-2 for better quality
    chic: '/assets/images/vibes/vibe-chic-1.jpg',               // Featured in main 8
    
    // Additional options (can be enabled by admin)
    glam: '/assets/images/vibes/vibe-glam-1.jpg',
    'date-night': '/assets/images/vibes/vibe-elegant-1.jpg',
    festival: '/assets/images/vibes/vibe-party-1.jpg',
    brunch: '/assets/images/vibes/vibe-casual-1.jpg',
    fashion: '/assets/images/vibes/vibe-fashion-1.jpg',
    
    // Men's Collection
    mens: {
      casual: '/assets/images/vibes/vibe-mens-casual.jpg',
      formal: '/assets/images/vibes/vibe-mens-fashion.jpg',
      party: '/assets/images/vibes/vibe-mens-fashion-1.jpg',
      wedding: '/assets/images/vibes/vibe-mens-fashion-2.jpg',
      cocktail: '/assets/images/vibes/vibe-mens-fashion-3.jpg',
      elegant: '/assets/images/vibes/vibe-mens-fashion-4.jpg',
      professional: '/assets/images/vibes/vibe-mens-fashion-5.jpg',
      dateNight: '/assets/images/vibes/vibe-mens-fashion-6.jpg',
    }
  },
  
  // Fallback/Placeholder
  placeholder: {
    hero: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&fit=crop',
    vibe: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop',
  }
};

/**
 * Get site image with fallback
 * @param {string} category - Image category (hero, vibe)
 * @param {string} name - Image name
 * @returns {string} Image URL
 */
export const getSiteImage = (category, name = 'main') => {
  try {
    if (category === 'hero') {
      return SITE_IMAGES.hero[name] || SITE_IMAGES.hero.main;
    }
    
    if (category === 'vibe') {
      const vibeName = name.toLowerCase().replace(/\s+/g, '-');
      return SITE_IMAGES.vibes[vibeName] || SITE_IMAGES.placeholder.vibe;
    }
    
    return SITE_IMAGES.placeholder[category] || '';
  } catch (error) {
    console.warn(`Image not found: ${category}/${name}`);
    return SITE_IMAGES.placeholder[category] || '';
  }
};

/**
 * Get men's fashion image
 * @param {string} vibe - Vibe type
 * @returns {string} Image URL
 */
export const getMensImage = (vibe = 'casual') => {
  const vibeKey = vibe.toLowerCase().replace(/\s+/g, '-').replace('-', '');
  return SITE_IMAGES.vibes.mens[vibeKey] || SITE_IMAGES.vibes.mens.casual;
};

/**
 * Vibe to Image Mapping - 8 Core E-commerce Categories (can be updated by admin)
 */
export const VIBE_IMAGE_MAP = {
  // Default 8 Categories
  'Casual': SITE_IMAGES.vibes.casual,
  'Formal': SITE_IMAGES.vibes.formal,
  'Party': SITE_IMAGES.vibes.party,
  'Wedding': SITE_IMAGES.vibes.wedding,
  'Cocktail': SITE_IMAGES.vibes.cocktail,
  'Professional': SITE_IMAGES.vibes.professional,
  'Elegant': SITE_IMAGES.vibes.elegant,
  'Chic': SITE_IMAGES.vibes.chic,
  
  // Additional (hidden by default, admin can enable)
  'Glam': SITE_IMAGES.vibes.glam,
  'Date Night': SITE_IMAGES.vibes['date-night'],
  'Festival': SITE_IMAGES.vibes.festival,
  'Brunch': SITE_IMAGES.vibes.brunch,
  'Fashion': SITE_IMAGES.vibes.fashion,
};

/**
 * Image preloader for performance
 * @param {string[]} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * Preload all site images on app load
 */
export const preloadSiteImages = () => {
  const heroImages = Object.values(SITE_IMAGES.hero);
  const vibeImages = Object.values(SITE_IMAGES.vibes).filter(v => typeof v === 'string');
  preloadImages([...heroImages, ...vibeImages]);
};

export default {
  SITE_IMAGES,
  getSiteImage,
  getMensImage,
  VIBE_IMAGE_MAP,
  preloadImages,
  preloadSiteImages
};
