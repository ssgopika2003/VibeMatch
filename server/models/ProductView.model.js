import mongoose from 'mongoose';

const productViewModel = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // seconds spent on page
    default: 0
  },
  source: {
    type: String,
    enum: ['search', 'recommendation', 'direct', 'category', 'related'],
    default: 'direct'
  },
  addedToCart: {
    type: Boolean,
    default: false
  },
  addedToWishlist: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for analytics
productViewModel.index({ productId: 1, createdAt: -1 });
productViewModel.index({ userId: 1 });
productViewModel.index({ sessionId: 1 });

const ProductView = mongoose.model('ProductView', productViewModel);

export default ProductView;
