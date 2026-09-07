import mongoose from 'mongoose';

const aiRecommendationCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    selectedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    recommendedProducts: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        matchReason: {
          type: String,
          default: '',
        },
        rank: {
          type: Number,
          default: 0,
        },
      },
    ],
    source: {
      type: String,
      enum: ['ai', 'cache', 'profile_fallback'],
      default: 'ai',
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiRecommendationCacheSchema.index({ userId: 1, selectedProductId: 1 }, { unique: true });

const AIRecommendationCache = mongoose.model('AIRecommendationCache', aiRecommendationCacheSchema);

export default AIRecommendationCache;
