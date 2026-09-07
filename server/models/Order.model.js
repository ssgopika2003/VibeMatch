import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  orderNumber: {
    type: String,
    unique: true
    // Remove required: true since it's auto-generated in pre-save hook
  },
  
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    image: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    color: String
  }],
  
  // If ordered as a complete look
  isCompleteLook: {
    type: Boolean,
    default: false
  },
  lookName: String, // e.g., "The Midnight Glam Look"
  
  // Shipping details
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Payment details
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },
  
  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shippingCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Order status
  status: {
    type: String,
    enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed'
  },
  
  // Timeline tracking
  timeline: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status history (for admin audit trail)
  statusHistory: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tracking details
  tracking: {
    trackingNumber: String,
    courier: String,
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date
  },
  
  // Notes
  customerNote: String,
  adminNote: String
  
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `VM${timestamp}${random}`;
  }
  next();
});

// Add to timeline on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      message: `Order ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
