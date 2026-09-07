import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

/**
 * THE VIBE MATCHING ENGINE
 * Logic-based algorithm (no external AI APIs)
 * 
 * Algorithm:
 * 1. Get user's style profile (vibe, undertone, silhouette preference)
 * 2. Filter Dresses by vibe + silhouette
 * 3. Filter Ornaments by compatibility with selected dress
 * 4. Filter Cosmetics by undertone compatibility
 * 5. Create coordinated "Look" bundles
 */

export const matchVibeController = async (req, res) => {
  try {
    const { vibe, undertone, silhouette } = req.query;
    const userId = req.user?.id;
    
    // Get user profile if authenticated
    let userProfile = null;
    if (userId) {
      const user = await User.findById(userId);
      userProfile = user?.styleProfile;
    }
    
    // Use query params or fallback to user profile
    const targetVibe = vibe || userProfile?.favoriteVibes?.[0] || 'Party';
    const targetUndertone = undertone || userProfile?.undertone || 'Neutral';
    const targetSilhouette = silhouette || userProfile?.preferredSilhouette?.[0];
    
    // STEP 1: Find matching Dresses
    const dressQuery = {
      category: 'Dress',
      vibeTags: targetVibe,
      isActive: true
    };
    
    if (targetSilhouette) {
      dressQuery.silhouette = targetSilhouette;
    }
    
    const dresses = await Product.find(dressQuery).limit(10);
    
    if (dresses.length === 0) {
      return res.json({
        success: true,
        looks: [],
        message: 'No matching dresses found. Try different preferences.'
      });
    }
    
    // STEP 2 & 3: For each dress, find matching ornaments and cosmetics
    const looks = [];
    
    for (const dress of dresses.slice(0, 5)) { // Limit to 5 complete looks
      // Find matching ornaments based on compatibility tags
      const ornamentQuery = {
        category: 'Ornament',
        vibeTags: targetVibe,
        isActive: true
      };
      
      // Match ornaments with dress compatibility
      if (dress.compatibilityTags && dress.compatibilityTags.length > 0) {
        ornamentQuery.compatibilityTags = { $in: dress.compatibilityTags };
      }
      
      const ornaments = await Product.find(ornamentQuery).limit(3);
      
      // Find matching cosmetics by undertone
      const cosmeticQuery = {
        category: 'Cosmetic',
        vibeTags: targetVibe,
        undertoneCompatibility: targetUndertone,
        isActive: true
      };
      
      const cosmetics = await Product.find(cosmeticQuery).limit(3);
      
      // Create look bundle if we have all three items
      if (ornaments.length > 0 && cosmetics.length > 0) {
        const ornament = ornaments[0]; // Pick best match
        const cosmetic = cosmetics[0]; // Pick best match
        
        // Calculate bundle price
        const bundlePrice = dress.price + ornament.price + cosmetic.price;
        const bundleDiscount = Math.round(bundlePrice * 0.1); // 10% bundle discount
        const finalPrice = bundlePrice - bundleDiscount;
        
        looks.push({
          lookId: `${dress._id}_${ornament._id}_${cosmetic._id}`,
          name: generateLookName(targetVibe, dress.name),
          vibe: targetVibe,
          description: `${dress.name} paired with elegant ${ornament.subcategory} and ${cosmetic.subcategory}`,
          items: {
            dress: {
              id: dress._id,
              name: dress.name,
              price: dress.price,
              image: dress.images[0]?.url || '',
              color: dress.colors[0]?.name || '',
              silhouette: dress.silhouette
            },
            ornament: {
              id: ornament._id,
              name: ornament.name,
              price: ornament.price,
              image: ornament.images[0]?.url || '',
              type: ornament.subcategory
            },
            cosmetic: {
              id: cosmetic._id,
              name: cosmetic.name,
              price: cosmetic.price,
              image: cosmetic.images[0]?.url || '',
              type: cosmetic.subcategory
            }
          },
          pricing: {
            original: bundlePrice,
            discount: bundleDiscount,
            final: finalPrice
          },
          compatibilityScore: calculateCompatibilityScore(dress, ornament, cosmetic, targetUndertone)
        });
      }
    }
    
    // Sort by compatibility score
    looks.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    res.json({
      success: true,
      vibe: targetVibe,
      undertone: targetUndertone,
      looks: looks,
      count: looks.length
    });
    
  } catch (error) {
    console.error('Vibe matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
};

// Helper function to generate creative look names
function generateLookName(vibe, dressName) {
  const prefixes = {
    'Party': ['The Midnight', 'The Electric', 'The Sparkle'],
    'Wedding': ['The Elegant', 'The Royal', 'The Timeless'],
    'Casual': ['The Breezy', 'The Easy', 'The Relaxed'],
    'Professional': ['The Power', 'The Polished', 'The Executive'],
    'Boho': ['The Free Spirit', 'The Wanderer', 'The Artisan'],
    'Minimal': ['The Essential', 'The Pure', 'The Classic'],
    'Glam': ['The Dazzle', 'The Statement', 'The Icon'],
    'Sport': ['The Active', 'The Dynamic', 'The Energetic']
  };
  
  const suffixes = ['Look', 'Ensemble', 'Vibe', 'Collection'];
  
  const prefix = prefixes[vibe]?.[Math.floor(Math.random() * 3)] || 'The Perfect';
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix} ${vibe} ${suffix}`;
}

// Calculate compatibility score (0-100)
function calculateCompatibilityScore(dress, ornament, cosmetic, undertone) {
  let score = 70; // Base score
  
  // Check seasonal palette alignment
  const dressSeasons = dress.seasonalPalette || [];
  const ornamentSeasons = ornament.seasonalPalette || [];
  const cosmeticSeasons = cosmetic.seasonalPalette || [];
  
  const commonSeasons = dressSeasons.filter(s => 
    ornamentSeasons.includes(s) && cosmeticSeasons.includes(s)
  );
  
  score += commonSeasons.length * 5; // +5 for each matching season
  
  // Check undertone compatibility
  if (cosmetic.undertoneCompatibility?.includes(undertone)) {
    score += 10;
  }
  
  // Check compatibility tags overlap
  const dressCompat = dress.compatibilityTags || [];
  const ornamentCompat = ornament.compatibilityTags || [];
  
  const compatOverlap = dressCompat.filter(tag => ornamentCompat.includes(tag));
  score += compatOverlap.length * 3;
  
  return Math.min(score, 100); // Cap at 100
}

// Get popular vibes
export const getPopularVibes = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$vibeTags' },
      { 
        $group: {
          _id: '$vibeTags',
          count: { $sum: 1 },
          totalPurchases: { $sum: '$purchaseCount' }
        }
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: 8 }
    ];
    
    const vibes = await Product.aggregate(pipeline);
    
    res.json({
      success: true,
      vibes: vibes.map(v => ({
        name: v._id,
        productCount: v.count,
        popularity: v.totalPurchases
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular vibes',
      error: error.message
    });
  }
};

export default {
  matchVibeController,
  getPopularVibes
};
