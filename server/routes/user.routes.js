import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import { auth } from '../middleware/auth.middleware.js';
import geminiService from '../services/gemini.service.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileImageDir = path.join(__dirname, '..', 'media', 'profile-image');
const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

fs.mkdirSync(profileImageDir, { recursive: true });

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImageDir);
  },
  filename: async (req, file, cb) => {
    try {
      const extension = path.extname(file.originalname || '').toLowerCase();
      const safeExtension = supportedImageExtensions.has(extension) ? extension : '.jpg';
      const userId = req.user?.id;

      if (!userId) {
        return cb(new Error('User id missing for profile image upload'));
      }

      const baseName = `${userId}${safeExtension}`;
      const files = await fs.promises.readdir(profileImageDir);
      await Promise.all(
        files
          .filter((name) => name.startsWith(`${userId}.`) && name !== baseName)
          .map((name) => fs.promises.unlink(path.join(profileImageDir, name)).catch(() => null))
      );

      cb(null, baseName);
    } catch (error) {
      cb(error);
    }
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!supportedImageExtensions.has(extension) || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only JPG, JPEG, PNG, WEBP, and GIF images are supported'));
    }
    cb(null, true);
  }
});

// Get user profile
router.get('/profile', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Complete / Update personal profile
router.put('/personal-profile', auth(), profileImageUpload.single('photoFile'), async (req, res) => {
  try {
    const { age, gender, bodyType, skinTone, photo } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const uploadedPhotoPath = req.file ? `/media/profile-image/${req.file.filename}` : '';
    const incomingPhoto = typeof photo === 'string' ? photo.trim() : '';
    const previousPhoto = user.personalProfile?.photo || '';
    const nextPhoto = uploadedPhotoPath || incomingPhoto || previousPhoto || '';

    user.personalProfile = {
      isComplete: true,
      age: age || user.personalProfile?.age,
      gender: gender || user.personalProfile?.gender || '',
      bodyType: bodyType || user.personalProfile?.bodyType || '',
      skinTone: skinTone || user.personalProfile?.skinTone || '',
      photo: nextPhoto
    };

    await user.save();

    res.json({
      success: true,
      message: 'Profile completed successfully! 🎉',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: true,
        personalProfile: user.personalProfile,
        styleProfile: user.styleProfile
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving profile',
      error: error.message
    });
  }
});

// Get personalized product recommendations based on user profile
router.get('/recommendations', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.personalProfile?.isComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile first to get personalized recommendations.'
      });
    }

    const { age, gender, bodyType, skinTone } = user.personalProfile;
    const { category, vibeTags } = req.query;

    // Determine user's age group
    let userAgeGroup = 'All Ages';
    if (age >= 13 && age <= 17) userAgeGroup = 'Teen (13-17)';
    else if (age >= 18 && age <= 25) userAgeGroup = 'Young Adult (18-25)';
    else if (age >= 26 && age <= 35) userAgeGroup = 'Adult (26-35)';
    else if (age >= 36 && age <= 50) userAgeGroup = 'Mid-Age (36-50)';
    else if (age > 50) userAgeGroup = 'Mature (50+)';

    // STRICT gender-based separation
    // Build the gender filter: only show products explicitly tagged for this gender or Unisex
    // Products tagged for a DIFFERENT specific gender are excluded entirely
    const allowedGenders = [];
    if (gender === 'Woman') allowedGenders.push('Woman', 'Unisex');
    else if (gender === 'Man') allowedGenders.push('Man', 'Unisex');
    else if (gender === 'Non-Binary') allowedGenders.push('Non-Binary', 'Unisex');
    else allowedGenders.push('Unisex', 'Woman', 'Man', 'Non-Binary');

    const bodyMatch = bodyType && bodyType !== 'Prefer not to say' 
      ? [bodyType, 'All Body Types'] 
      : [];
    const skinMatch = skinTone && skinTone !== 'Prefer not to say' 
      ? [skinTone] 
      : [];

    // Build match stage with strict gender filtering
    const matchStage = { isActive: true };
    if (category) matchStage.category = category;

    // Parse vibe tags filter
    let vibeTagsArray = [];
    if (vibeTags) {
      vibeTagsArray = typeof vibeTags === 'string' ? vibeTags.split(',').map(t => t.trim()).filter(Boolean) : vibeTags;
      if (vibeTagsArray.length > 0) {
        matchStage.vibeTags = { $in: vibeTagsArray };
      }
    }

    // STRICT setup: only explicit profile-matching items, no untagged fallback.
    matchStage['recommendedFor.gender'] = { $in: allowedGenders };
    matchStage['recommendedFor.ageGroup'] = { $in: [userAgeGroup, 'All Ages'] };
    if (bodyMatch.length > 0) {
      matchStage.$or = [
        { 'recommendedFor.bodyType': { $in: bodyMatch } },
        { 'recommendedFor.bodyType': { $exists: false } },
        { 'recommendedFor.bodyType': { $size: 0 } }
      ];
    }
    if (skinMatch.length > 0) {
      matchStage['recommendedFor.skinTone'] = { $in: skinMatch };
    }

    // We use aggregation to score products by how many fields match
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          matchScore: {
            $sum: [
              // Age group match (weight: 2)
              { $cond: [
                { $or: [
                  { $in: [userAgeGroup, { $ifNull: ['$recommendedFor.ageGroup', []] }] },
                  { $in: ['All Ages', { $ifNull: ['$recommendedFor.ageGroup', []] }] }
                ]},
                2, 0
              ]},
              // Gender match (weight: 3 - most important)
              { $cond: [
                { $gt: [
                  { $size: { $setIntersection: [allowedGenders, { $ifNull: ['$recommendedFor.gender', []] }] } },
                  0
                ]},
                3, 0
              ]},
              // Body type match (weight: 2)
              ...(bodyMatch.length > 0 ? [{ $cond: [
                { $gt: [
                  { $size: { $setIntersection: [bodyMatch, { $ifNull: ['$recommendedFor.bodyType', []] }] } },
                  0
                ]},
                2, 0
              ]}] : [{ $literal: 0 }]),
              // Skin tone match (weight: 1)
              ...(skinMatch.length > 0 ? [{ $cond: [
                { $gt: [
                  { $size: { $setIntersection: [skinMatch, { $ifNull: ['$recommendedFor.skinTone', []] }] } },
                  0
                ]},
                1, 0
              ]}] : [{ $literal: 0 }])
            ]
          }
        }
      },
      // Only show products that have some match or no targeting
      { $match: { matchScore: { $gt: 0 } } },
      { $sort: { matchScore: -1, purchaseCount: -1, 'rating.average': -1 } }
    ];

    const products = await Product.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      {
        $addFields: {
          matchScore: {
            $sum: [
              { $cond: [
                { $or: [
                  { $in: [userAgeGroup, { $ifNull: ['$recommendedFor.ageGroup', []] }] },
                  { $in: ['All Ages', { $ifNull: ['$recommendedFor.ageGroup', []] }] }
                ]},
                2, 0
              ]},
              { $cond: [
                { $gt: [
                  { $size: { $setIntersection: [allowedGenders, { $ifNull: ['$recommendedFor.gender', []] }] } },
                  0
                ]},
                3, 0
              ]},
              ...(bodyMatch.length > 0 ? [{ $cond: [
                { $gt: [
                  { $size: { $setIntersection: [bodyMatch, { $ifNull: ['$recommendedFor.bodyType', []] }] } },
                  0
                ]},
                2, 0
              ]}] : [{ $literal: 0 }]),
              ...(skinMatch.length > 0 ? [{ $cond: [
                { $gt: [
                  { $size: { $setIntersection: [skinMatch, { $ifNull: ['$recommendedFor.skinTone', []] }] } },
                  0
                ]},
                1, 0
              ]}] : [{ $literal: 0 }])
            ]
          }
        }
      },
      { $match: { matchScore: { $gt: 0 } } },
      { $count: 'total' }
    ];

    const countResult = await Product.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Also return available vibe tags for filtering
    const availableVibes = ['Casual', 'Formal', 'Party', 'Wedding', 'Cocktail', 'Professional', 'Elegant'];

    res.json({
      success: true,
      products,
      userProfile: {
        ageGroup: userAgeGroup,
        gender,
        bodyType,
        skinTone
      },
      availableVibes,
      activeVibeFilters: vibeTagsArray,
      strictMatching: true,
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// Update style profile (quiz results)
router.put('/style-profile', auth(), async (req, res) => {
  try {
    const {
      undertone,
      preferredSilhouette,
      favoriteVibes,
      seasonalPreference,
      jewelryTone,
      dressSize,
      ringSize,
      styleKeywords
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    user.styleProfile = {
      isComplete: true,
      undertone: undertone || user.styleProfile.undertone,
      preferredSilhouette: preferredSilhouette || user.styleProfile.preferredSilhouette,
      favoriteVibes: favoriteVibes || user.styleProfile.favoriteVibes,
      seasonalPreference: seasonalPreference || user.styleProfile.seasonalPreference,
      jewelryTone: jewelryTone || user.styleProfile.jewelryTone,
      dressSize: dressSize || user.styleProfile.dressSize,
      ringSize: ringSize || user.styleProfile.ringSize,
      styleKeywords: styleKeywords || user.styleProfile.styleKeywords
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Style profile updated',
      styleProfile: user.styleProfile
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating style profile',
      error: error.message
    });
  }
});

// Get color affinity data
router.get('/color-affinity', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Convert Map to object for JSON response
    const colorAffinity = Object.fromEntries(user.colorAffinity);
    
    res.json({
      success: true,
      colorAffinity
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching color affinity',
      error: error.message
    });
  }
});

// Get wishlist
router.get('/wishlist', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    
    res.json({
      success: true,
      wishlist: user.wishlist
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
});

// Add to wishlist
router.post('/wishlist/:productId', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }
    
    user.wishlist.push(req.params.productId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Added to wishlist',
      wishlist: user.wishlist
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error.message
    });
  }
});

// Remove from wishlist
router.delete('/wishlist/:productId', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== req.params.productId
    );
    await user.save();
    
    res.json({
      success: true,
      message: 'Removed from wishlist',
      wishlist: user.wishlist
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
});

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/user/ai-for-you
  // Returns top matched products enriched with a Gemini personal message and
  // per-product AI reasons.  Falls back gracefully if Gemini is unavailable.
  // ─────────────────────────────────────────────────────────────────────────────
  router.get('/ai-for-you', auth(), async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user || !user.personalProfile?.isComplete) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your profile first to get personalized recommendations.'
        });
      }

      const { age, gender, bodyType, skinTone } = user.personalProfile;
      const dressSize = user.styleProfile?.dressSize || '';

      // Determine age group
      let userAgeGroup = 'All Ages';
      if (age >= 13 && age <= 17) userAgeGroup = 'Teen (13-17)';
      else if (age >= 18 && age <= 25) userAgeGroup = 'Young Adult (18-25)';
      else if (age >= 26 && age <= 35) userAgeGroup = 'Adult (26-35)';
      else if (age >= 36 && age <= 50) userAgeGroup = 'Mid-Age (36-50)';
      else if (age > 50) userAgeGroup = 'Mature (50+)';

      const allowedGenders = [];
      if (gender === 'Woman') allowedGenders.push('Woman', 'Unisex');
      else if (gender === 'Man') allowedGenders.push('Man', 'Unisex');
      else if (gender === 'Non-Binary') allowedGenders.push('Non-Binary', 'Unisex');
      else allowedGenders.push('Unisex', 'Woman', 'Man', 'Non-Binary');

      const bodyMatch = bodyType && bodyType !== 'Prefer not to say'
        ? [bodyType, 'All Body Types'] : [];
      const skinMatch = skinTone && skinTone !== 'Prefer not to say'
        ? [skinTone] : [];

      const matchStage = { isActive: true };
      matchStage['recommendedFor.gender'] = { $in: allowedGenders };
      matchStage['recommendedFor.ageGroup'] = { $in: [userAgeGroup, 'All Ages'] };
      if (bodyMatch.length > 0) {
        matchStage.$or = [
          { 'recommendedFor.bodyType': { $in: bodyMatch } },
          { 'recommendedFor.bodyType': { $exists: false } },
          { 'recommendedFor.bodyType': { $size: 0 } }
        ];
      }
      if (skinMatch.length > 0) {
        matchStage['recommendedFor.skinTone'] = { $in: skinMatch };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            matchScore: {
              $sum: [
                { $cond: [{ $or: [
                  { $in: [userAgeGroup, { $ifNull: ['$recommendedFor.ageGroup', []] }] },
                  { $in: ['All Ages', { $ifNull: ['$recommendedFor.ageGroup', []] }] }
                ]}, 2, 0] },
                { $cond: [{ $gt: [{ $size: { $setIntersection: [allowedGenders, { $ifNull: ['$recommendedFor.gender', []] }] } }, 0] }, 3, 0] },
                ...(bodyMatch.length > 0 ? [{ $cond: [{ $gt: [{ $size: { $setIntersection: [bodyMatch, { $ifNull: ['$recommendedFor.bodyType', []] }] } }, 0] }, 2, 0] }] : [{ $literal: 0 }]),
                ...(skinMatch.length > 0 ? [{ $cond: [{ $gt: [{ $size: { $setIntersection: [skinMatch, { $ifNull: ['$recommendedFor.skinTone', []] }] } }, 0] }, 1, 0] }] : [{ $literal: 0 }])
              ]
            }
          }
        },
        { $match: { matchScore: { $gt: 0 } } },
        { $sort: { matchScore: -1, purchaseCount: -1, 'rating.average': -1 } }
      ];

      const products = await Product.aggregate(pipeline);

      // Build condensed list for Gemini (keep payload small)
      const condensed = products.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        silhouette: p.silhouette,
        colors: p.colors?.slice(0, 3),
        undertoneCompatibility: p.undertoneCompatibility,
        vibeTags: p.vibeTags?.slice(0, 3)
      }));

      // Call Gemini for insights
      let personalMessage = null;
      let reasons = {};
      if (geminiService.isEnabled() && condensed.length > 0) {
        const insights = await geminiService.generateForYouInsights(
          { gender, skinTone, bodyType, age, dressSize, ageGroup: userAgeGroup },
          condensed
        );
        if (insights) {
          personalMessage = insights.personalMessage || null;
          reasons = insights.reasons || {};
        }
      }

      // Attach AI reason to each product
      const enrichedProducts = products.map(p => ({
        ...p,
        aiReason: reasons[p._id.toString()] || null
      }));

      res.json({
        success: true,
        personalMessage,
        products: enrichedProducts,
        userProfile: { ageGroup: userAgeGroup, gender, bodyType, skinTone, dressSize },
        aiEnabled: geminiService.isEnabled(),
        strictMatching: true
      });

    } catch (error) {
      console.error('AI For You error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating AI recommendations',
        error: error.message
      });
    }
  });

export default router;
