import express from 'express';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import AIRecommendationCache from '../models/AIRecommendationCache.model.js';
import { auth } from '../middleware/auth.middleware.js';
import geminiService from '../services/gemini.service.js';

const router = express.Router();

const effectivePriceExpr = {
  $cond: [
    {
      $and: [
        { $ne: ['$discountPrice', null] },
        { $gt: ['$discountPrice', 0] },
        { $lt: ['$discountPrice', '$price'] }
      ]
    },
    '$discountPrice',
    '$price'
  ]
};

const normalizeProductPrice = (productDoc) => {
  const product = productDoc?.toObject ? productDoc.toObject() : productDoc;
  const basePrice = Number(product?.price || 0);
  const discountedPrice = Number(product?.discountPrice);
  const hasDiscount = Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < basePrice;

  return {
    ...product,
    effectivePrice: hasDiscount ? discountedPrice : basePrice,
    hasDiscount
  };
};

const getAgeGroup = (age) => {
  if (!age) return 'All Ages';
  if (age >= 13 && age <= 17) return 'Teen (13-17)';
  if (age >= 18 && age <= 25) return 'Young Adult (18-25)';
  if (age >= 26 && age <= 35) return 'Adult (26-35)';
  if (age >= 36 && age <= 50) return 'Mid-Age (36-50)';
  if (age > 50) return 'Mature (50+)';
  return 'All Ages';
};

const withTimeout = async (promise, timeoutMs) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

const getGenderVisibilityFilter = (gender) => {
  // Strictly block opposite-gender products for specific genders.
  // Unisex and untagged products are always allowed.
  if (gender === 'Woman' || gender === 'Man' || gender === 'Non-Binary') {
    return {
      $or: [
        { 'recommendedFor.gender': { $in: [gender, 'Unisex'] } },
        { 'recommendedFor.gender': { $exists: false } },
        { 'recommendedFor.gender': { $exists: true, $size: 0 } },
      ],
    };
  }

  // For empty / prefer-not-to-say, show all.
  return {};
};

const buildFriendlyReason = ({ product, user, selectedProduct, baseReason = '' }) => {
  const category = product?.category;
  const skinTone = user?.personalProfile?.skinTone;
  const bodyType = user?.personalProfile?.bodyType;
  const selectedCategory = selectedProduct?.category;

  if (baseReason && baseReason.trim()) {
    const trimmed = baseReason.trim();
    const hasEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(trimmed);
    return hasEmoji ? trimmed : `✨ ${trimmed}`;
  }

  if (category === 'Cosmetic') {
    if (skinTone && skinTone !== 'Prefer not to say') {
      return `💄 According to your ${skinTone.toLowerCase()} tone, this shade pops nicely`;
    }
    return '💄 This cosmetic shade matches your style vibe';
  }

  if (category === 'Dress') {
    if (bodyType && bodyType !== 'Prefer not to say') {
      return `👗 Your ${bodyType.toLowerCase()} body type can rock this look`;
    }
    return '👗 This dress silhouette can look super cute on you';
  }

  if (category === 'Ornament') {
    if (selectedCategory === 'Dress') {
      return '✨ You selected a dress - this jewelry pairs beautifully';
    }
    return '💎 This jewelry matches your selected style nicely';
  }

  return '✨ Picked for your profile and selected product';
};

const buildProfileFallbackSuggestions = async (user, selectedProduct) => {
  const selectedProductId = selectedProduct?._id;
  const profile = user?.personalProfile || {};
  const ageGroup = getAgeGroup(profile.age);
  const gender = profile.gender;
  const bodyType = profile.bodyType;
  const skinTone = profile.skinTone;

  const allowedGenders = [];
  if (gender === 'Woman') allowedGenders.push('Woman', 'Unisex');
  else if (gender === 'Man') allowedGenders.push('Man', 'Unisex');
  else if (gender === 'Non-Binary') allowedGenders.push('Non-Binary', 'Unisex');
  else allowedGenders.push('Unisex', 'Woman', 'Man', 'Non-Binary');

  const bodyMatch = bodyType && bodyType !== 'Prefer not to say'
    ? [bodyType, 'All Body Types']
    : [];
  const skinMatch = skinTone && skinTone !== 'Prefer not to say'
    ? [skinTone, 'All Skin Tones']
    : [];

  const pipeline = [
    {
      $match: {
        isActive: true,
        _id: { $ne: selectedProductId },
        ...getGenderVisibilityFilter(gender),
      },
    },
    {
      $addFields: {
        matchScore: {
          $sum: [
            {
              $cond: [
                {
                  $or: [
                    { $in: [ageGroup, { $ifNull: ['$recommendedFor.ageGroup', []] }] },
                    { $in: ['All Ages', { $ifNull: ['$recommendedFor.ageGroup', []] }] },
                  ],
                },
                2,
                0,
              ],
            },
            {
              $cond: [
                {
                  $gt: [
                    { $size: { $setIntersection: [allowedGenders, { $ifNull: ['$recommendedFor.gender', []] }] } },
                    0,
                  ],
                },
                3,
                0,
              ],
            },
            ...(bodyMatch.length > 0
              ? [
                  {
                    $cond: [
                      {
                        $gt: [
                          { $size: { $setIntersection: [bodyMatch, { $ifNull: ['$recommendedFor.bodyType', []] }] } },
                          0,
                        ],
                      },
                      2,
                      0,
                    ],
                  },
                ]
              : [{ $literal: 0 }]),
            ...(skinMatch.length > 0
              ? [
                  {
                    $cond: [
                      {
                        $gt: [
                          { $size: { $setIntersection: [skinMatch, { $ifNull: ['$recommendedFor.skinTone', []] }] } },
                          0,
                        ],
                      },
                      2,
                      0,
                    ],
                  },
                ]
              : [{ $literal: 0 }]),
          ],
        },
      },
    },
    { $sort: { matchScore: -1, purchaseCount: -1, 'rating.average': -1 } },
    { $limit: 80 },
  ];

  const matched = await Product.aggregate(pipeline);
  const byCategory = {
    Dress: [],
    Cosmetic: [],
    Ornament: [],
  };

  matched.forEach((p) => {
    if (byCategory[p.category]) byCategory[p.category].push(p);
  });

  const selected = [
    ...byCategory.Dress.slice(0, 2),
    ...byCategory.Cosmetic.slice(0, 2),
    ...byCategory.Ornament.slice(0, 2),
  ];

  // If we still have fewer than 6, fill from high-score remainder.
  if (selected.length < 6) {
    const selectedIds = new Set(selected.map((p) => p._id.toString()));
    for (const p of matched) {
      if (!selectedIds.has(p._id.toString())) {
        selected.push(p);
        selectedIds.add(p._id.toString());
      }
      if (selected.length >= 6) break;
    }
  }

  return selected.slice(0, 6).map((p) => ({
    ...p,
    matchReason: buildFriendlyReason({
      product: p,
      user,
      selectedProduct,
      baseReason: 'Profile-priority fallback suggestion',
    }),
  }));
};

// Get all products with filters (applies gender filtering for authenticated users)
router.get('/', auth(false), async (req, res) => {
  try {
    const { 
      category, 
      vibe, 
      undertone, 
      silhouette,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt'
    } = req.query;
    
    // Get user's gender for filtering (if authenticated)
    const userGender = req.user?.id 
      ? (await User.findById(req.user.id).select('personalProfile.gender').lean())?.personalProfile?.gender
      : null;
    
    // Build gender filter based on user's gender
    const genderFilter = getGenderVisibilityFilter(userGender);
    
    const query = { 
      isActive: true,
      ...genderFilter
    };
    
    if (category) query.category = category;
    if (vibe) query.vibeTags = { $in: [vibe] };
    if (undertone) query.undertoneCompatibility = undertone;
    if (silhouette) query.silhouette = silhouette;
    
    if (minPrice || maxPrice) {
      const priceConditions = [];
      if (minPrice) priceConditions.push({ $gte: [effectivePriceExpr, Number(minPrice)] });
      if (maxPrice) priceConditions.push({ $lte: [effectivePriceExpr, Number(maxPrice)] });

      if (priceConditions.length === 1) {
        query.$expr = priceConditions[0];
      } else if (priceConditions.length > 1) {
        query.$expr = { $and: priceConditions };
      }
    }
    
    // Parse sort parameter (can be string like "-createdAt" or object)
    let sortObject = sort;
    if (typeof sort === 'string') {
      // Convert string sort to object: "-createdAt" -> { createdAt: -1 }
      sortObject = {};
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortObject[sortField] = sortOrder;
    }

    const sortField = typeof sort === 'string' ? (sort.startsWith('-') ? sort.slice(1) : sort) : null;
    const sortOrder = typeof sort === 'string' && sort.startsWith('-') ? -1 : 1;
    
    // Flexible search: Try text index first, fall back to regex
    let searchSort = sortObject;
    if (search) {
      try {
        // Attempt text search for best relevance
        query.$text = { $search: search };
        // Combine text score with existing sort
        searchSort = { score: { $meta: 'textScore' }, ...sortObject };
      } catch (error) {
        // If text index fails, use regex-based search
        delete query.$text;
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { searchKeywords: { $in: [searchRegex] } },
          { category: searchRegex },
          { vibeTags: { $in: [searchRegex] } },
          { material: searchRegex }
        ];
      }
    }
    
    let products;
    if (sortField === 'price') {
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            effectivePrice: effectivePriceExpr,
            hasDiscount: { $lt: [effectivePriceExpr, '$price'] }
          }
        },
        { $sort: { effectivePrice: sortOrder } }
      ];

      products = await Product.aggregate(pipeline);
    } else if (search && query.$text) {
      // Use text search with relevance scoring
      products = await Product.find(query, { score: { $meta: 'textScore' } })
        .sort(searchSort);
    } else {
      // Standard query (use sortObject for consistency)
      products = await Product.find(query)
        .sort(sortObject);
    }

    products = products.map(normalizeProductPrice);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      products,
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Similar products section for product page (generic, non-user specific)
router.get('/:id/similar', auth(false), async (req, res) => {
  try {
    const [anchor, user] = await Promise.all([
      Product.findById(req.params.id).lean(),
      req.user?.id ? User.findById(req.user.id).select('personalProfile.gender').lean() : null,
    ]);
    if (!anchor) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const userGender = user?.personalProfile?.gender;

    const genderFilter = getGenderVisibilityFilter(userGender);
    const similarityFilter = {
      $or: [
        { category: anchor.category },
        { vibeTags: { $in: anchor.vibeTags || [] } },
        { undertoneCompatibility: { $in: anchor.undertoneCompatibility || [] } },
      ],
    };

    const query = {
      _id: { $ne: anchor._id },
      isActive: true,
      ...(Object.keys(genderFilter).length > 0
        ? { $and: [genderFilter, similarityFilter] }
        : similarityFilter),
    };

    const candidates = await Product.find(query)
      .sort({ purchaseCount: -1, 'rating.average': -1 })
      .limit(20)
      .lean();

    let products = candidates.slice(0, 6);
    if (geminiService.isEnabled() && candidates.length > 0) {
      const similar = await geminiService.findSimilarProducts(
        {
          _id: anchor._id.toString(),
          name: anchor.name,
          category: anchor.category,
          subcategory: anchor.subcategory,
          colors: anchor.colors,
          vibeTags: anchor.vibeTags,
          silhouette: anchor.silhouette,
          undertoneCompatibility: anchor.undertoneCompatibility,
        },
        candidates.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          colors: p.colors,
          vibeTags: p.vibeTags,
          silhouette: p.silhouette,
        }))
      );

      if (similar.length > 0) {
        const map = Object.fromEntries(candidates.map((p) => [p._id.toString(), p]));
        products = similar
          .filter((s) => map[s.productId])
          .map((s) => ({
            ...map[s.productId],
            matchReason: buildFriendlyReason({
              product: map[s.productId],
              user,
              selectedProduct: anchor,
              baseReason: s.matchReason,
            }),
          }))
          .slice(0, 6);
      }
    }

    products = products.map((p) => ({
      ...p,
      matchReason: buildFriendlyReason({
        product: p,
        user,
        selectedProduct: anchor,
        baseReason: p.matchReason,
      }),
    }));

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching similar products',
      error: error.message,
    });
  }
});

// Personalized AI suggestions with timeout + cache fallback + profile fallback
router.get('/:id/ai-suggestions', auth(false), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Login required for personalized AI suggestions',
      });
    }

    const userId = req.user.id;
    const selectedProductId = req.params.id;

    const [user, selectedProduct] = await Promise.all([
      User.findById(userId).lean(),
      Product.findById(selectedProductId).lean(),
    ]);

    if (!selectedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const userGender = user?.personalProfile?.gender;

    const cached = await AIRecommendationCache.findOne({ userId, selectedProductId }).lean();

    // Pull active products once and pass all to Gemini (condensed fields)
    const allProducts = await Product.find({
      isActive: true,
      _id: { $ne: selectedProduct._id },
      ...getGenderVisibilityFilter(userGender),
    })
      .select(
        'name description category subcategory price discountPrice colors vibeTags undertoneCompatibility silhouette recommendedFor'
      )
      .lean();

    // AI path with hard 5000ms budget
    if (geminiService.isEnabled() && allProducts.length > 0) {
      const startedAt = Date.now();
      try {
        const aiResult = await withTimeout(
          geminiService.generatePersonalizedSuggestions(
            {
              gender: user?.personalProfile?.gender,
              age: user?.personalProfile?.age,
              ageGroup: getAgeGroup(user?.personalProfile?.age),
              bodyType: user?.personalProfile?.bodyType,
              skinTone: user?.personalProfile?.skinTone,
              dressSize: user?.styleProfile?.dressSize,
              undertone: user?.styleProfile?.undertone,
              favoriteVibes: user?.styleProfile?.favoriteVibes,
            },
            selectedProduct,
            allProducts.map((p) => ({ ...p, _id: p._id.toString() }))
          ),
          5000
        );

        const responseTimeMs = Date.now() - startedAt;

        if (Array.isArray(aiResult) && aiResult.length > 0) {
          const productMap = Object.fromEntries(allProducts.map((p) => [p._id.toString(), p]));
          const recommendations = aiResult
            .filter((r) => productMap[r.productId])
            .map((r, idx) => ({
              ...productMap[r.productId],
              matchReason: buildFriendlyReason({
                product: productMap[r.productId],
                user,
                selectedProduct,
                baseReason: r.matchReason || 'AI-picked for your preferences',
              }),
              rank: idx + 1,
            }))
            .slice(0, 8);

          if (recommendations.length > 0) {
            await AIRecommendationCache.findOneAndUpdate(
              { userId, selectedProductId },
              {
                userId,
                selectedProductId,
                recommendedProducts: recommendations.map((r, idx) => ({
                  productId: r._id,
                  matchReason: r.matchReason,
                  rank: idx + 1,
                })),
                source: 'ai',
                responseTimeMs,
                lastUsedAt: new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            return res.json({
              success: true,
              source: 'ai',
              responseTimeMs,
              products: recommendations,
            });
          }
        }
      } catch (aiError) {
        console.warn('AI suggestion path failed/timed out:', aiError.message);
      }
    }

    // AI failed or timed out -> use cached collection for same user+product
    if (cached?.recommendedProducts?.length) {
      const ids = cached.recommendedProducts.map((item) => item.productId);
      const products = await Product.find({
        _id: { $in: ids },
        isActive: true,
        ...getGenderVisibilityFilter(userGender),
      }).lean();
      const map = Object.fromEntries(products.map((p) => [p._id.toString(), p]));
      const merged = cached.recommendedProducts
        .map((item) => {
          const p = map[item.productId.toString()];
          if (!p) return null;
          return {
            ...p,
            matchReason: buildFriendlyReason({
              product: p,
              user,
              selectedProduct,
              baseReason: item.matchReason,
            }),
            rank: item.rank,
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a.rank || 0) - (b.rank || 0));

      if (merged.length > 0) {
        await AIRecommendationCache.updateOne(
          { _id: cached._id },
          { $set: { source: 'cache', lastUsedAt: new Date() } }
        );

        return res.json({
          success: true,
          source: 'cache',
          products: merged,
        });
      }
    }

    // No cache and AI failed -> deterministic profile-priority category-wise fallback
    const fallbackProducts = await buildProfileFallbackSuggestions(user, selectedProduct);

    if (fallbackProducts.length > 0) {
      await AIRecommendationCache.findOneAndUpdate(
        { userId, selectedProductId },
        {
          userId,
          selectedProductId,
          recommendedProducts: fallbackProducts.map((p, idx) => ({
            productId: p._id,
            matchReason: p.matchReason,
            rank: idx + 1,
          })),
          source: 'profile_fallback',
          responseTimeMs: 5000,
          lastUsedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.json({
      success: true,
      source: 'profile_fallback',
      products: fallbackProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching AI suggestions',
      error: error.message,
    });
  }
});

// Get single product with color affinity tracking
router.get('/:id', auth(false), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    await product.incrementView();
    
    // Track color affinity if user is authenticated
    if (req.user && product.colors.length > 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Track primary color
        const primaryColor = product.colors[0].name;
        await user.incrementColorAffinity(primaryColor);
      }
    }
    
    res.json({
      success: true,
      product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Add product review/rating
router.post('/:id/reviews', auth(), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user already reviewed
    const existingReview = product.reviews.find(
      r => r.user.toString() === req.user.id
    );
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      product.reviews.push({
        user: req.user.id,
        rating,
        comment,
        createdAt: new Date()
      });
    }
    
    // Recalculate average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating.average = totalRating / product.reviews.length;
    product.rating.count = product.reviews.length;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      rating: product.rating
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('reviews rating')
      .populate('reviews.user', 'name avatar');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      reviews: product.reviews,
      rating: product.rating
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// Batch get products (for wishlist)
router.post('/batch', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product IDs'
      });
    }
    
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    });
    
    res.json({
      success: true,
      products
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

export default router;
