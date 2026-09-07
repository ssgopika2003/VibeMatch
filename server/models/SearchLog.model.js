import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  clickedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  filters: {
    category: String,
    vibe: String,
    priceRange: String
  }
}, {
  timestamps: true
});

// Index for analytics queries
searchLogSchema.index({ query: 1, createdAt: -1 });
searchLogSchema.index({ userId: 1 });

const SearchLog = mongoose.model('SearchLog', searchLogSchema);

export default SearchLog;
