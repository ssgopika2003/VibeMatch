import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Style Profile - Inclusive terminology
  styleProfile: {
    // Quiz completed status
    isComplete: {
      type: Boolean,
      default: false
    },
    
    // Undertone instead of "Skin Color"
    undertone: {
      type: String,
      enum: ['Warm', 'Cool', 'Neutral', ''],
      default: ''
    },
    
    // Preferred Silhouette instead of "Body Type"
    preferredSilhouette: [{
      type: String,
      enum: ['A-Line', 'Relaxed', 'Fitted', 'Flowing', 'Structured', 'Oversized']
    }],
    
    // Favorite Vibes
    favoriteVibes: [{
      type: String,
      enum: ['Party', 'Wedding', 'Casual', 'Professional', 'Boho', 'Minimal', 'Glam', 'Sport']
    }],
    
    // Seasonal Palette Preference
    seasonalPreference: [{
      type: String,
      enum: ['Winter', 'Spring', 'Summer', 'Autumn']
    }],
    
    // Jewelry Tone Preference (Used to infer undertone)
    jewelryTone: {
      type: String,
      enum: ['Gold', 'Silver', 'Both', ''],
      default: ''
    },
    
    // Size preferences
    dressSize: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '']
    },
    ringSize: Number,
    
    // Style keywords
    styleKeywords: [String]
  },
  
  // Analytics - Color Affinity Tracking
  colorAffinity: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Wishlist
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Order history
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  
  // Personal Profile - Warm & inclusive fields
  personalProfile: {
    isComplete: {
      type: Boolean,
      default: false
    },
    age: {
      type: Number,
      min: 13,
      max: 120
    },
    gender: {
      type: String,
      enum: ['Woman', 'Man', 'Non-Binary', 'Prefer not to say', ''],
      default: ''
    },
    bodyType: {
      type: String,
      enum: ['Petite', 'Slim', 'Athletic', 'Curvy', 'Plus-Size', 'Tall', 'Prefer not to say', ''],
      default: ''
    },
    skinTone: {
      type: String,
      enum: ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep', 'Prefer not to say', ''],
      default: ''
    },
    photo: {
      type: String,
      default: ''
    }
  },

  // Avatar
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment color affinity
userSchema.methods.incrementColorAffinity = function(color) {
  const currentCount = this.colorAffinity.get(color) || 0;
  this.colorAffinity.set(color, currentCount + 1);
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
