import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['Dress', 'Ornament', 'Cosmetic']
  },
  subcategory: {
    type: String,
    // For Dress: Maxi, Mini, Midi, etc.
    // For Ornament: Necklace, Earrings, Ring, Bracelet
    // For Cosmetic: Lipstick, Eyeshadow, Blush
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  
  // Images - Support multiple variants
  images: [{
    url: String,
    color: String, // The color variant this image represents
    isPrimary: Boolean
  }],
  
  // Vibe Tags for matching
  vibeTags: [{
    type: String,
    enum: ['Party', 'Wedding', 'Casual', 'Professional', 'Formal', 'Cocktail', 'Elegant', 'Chic']
  }],
  
  // Undertone Compatibility (Inclusive approach)
  undertoneCompatibility: [{
    type: String,
    enum: ['Warm', 'Cool', 'Neutral']
  }],
  
  // Seasonal Palette - Instead of skin-tone tags
  seasonalPalette: [{
    type: String,
    enum: ['Winter', 'Spring', 'Summer', 'Autumn']
  }],
  
  // Silhouette (for Dresses)
  silhouette: {
    type: String,
    enum: ['A-Line', 'Relaxed', 'Fitted', 'Flowing', 'Structured', 'Oversized', '']
  },
  
  // Color variants
  colors: [{
    name: String,
    hex: String,
    stock: Number
  }],
  
  // Material
  material: String,
  
  // Compatibility Tags (for matching logic)
  compatibilityTags: [String], // e.g., 'Oxidized Silver', 'Minimalist', 'Bold'
  
  // Size Chart (Different schemas for different categories)
  sizeChart: {
    type: mongoose.Schema.Types.Mixed,
    // For Dress: { XS: { chest, waist, hip, length }, S: {...}, ... }
    // For Ornament: { ringSize: [5,6,7,8], chainLength: '16-20 inches' }
  },
  
  // Stock and variants
  variants: [{
    size: String,
    color: String,
    stock: Number,
    sku: String
  }],
  
  totalStock: {
    type: Number,
    default: 0
  },
  
  // Ratings
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Admin fields
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  searchKeywords: [{
    type: String,
    lowercase: true
  }],
  lastViewed: {
    type: Date
  },
  wishlistCount: {
    type: Number,
    default: 0
  },

  // Recommendation Targeting - "Who is this product best for?"
  recommendedFor: {
    ageGroup: [{
      type: String,
      enum: ['Teen (13-17)', 'Young Adult (18-25)', 'Adult (26-35)', 'Mid-Age (36-50)', 'Mature (50+)', 'All Ages']
    }],
    gender: [{
      type: String,
      enum: ['Woman', 'Man', 'Non-Binary', 'Unisex']
    }],
    bodyType: [{
      type: String,
      enum: ['Petite', 'Slim', 'Athletic', 'Curvy', 'Plus-Size', 'Tall', 'All Body Types']
    }],
    skinTone: [{
      type: String,
      enum: ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep', 'All Skin Tones']
    }]
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ category: 1, vibeTags: 1 });
productSchema.index({ undertoneCompatibility: 1 });
productSchema.index({ 'colors.name': 1 });
// Separate indexes for recommendedFor (cannot compound two array fields in MongoDB)
productSchema.index({ 'recommendedFor.gender': 1 });
productSchema.index({ 'recommendedFor.ageGroup': 1 });

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text', searchKeywords: 'text' });

// Method to update stock
productSchema.methods.updateStock = function(size, color, quantity) {
  const variant = this.variants.find(v => v.size === size && v.color === color);
  if (variant) {
    variant.stock -= quantity;
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return this.save();
};

// Method to increment view count
productSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
