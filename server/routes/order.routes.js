import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize Razorpay lazily to avoid import-order issues with dotenv loading.
let razorpay = null;
let razorpayCacheKey = '';

function getRazorpayState() {
  const normalizedFlag = (process.env.RAZORPAY || '')
    .toLowerCase()
    .trim()
    .replace(/^['\"]|['\"]$/g, '');
  const normalizedDummyFlag = (process.env.RAZORPAY_DUMMY || '')
    .toLowerCase()
    .trim()
    .replace(/^['\"]|['\"]$/g, '');
  const enabled = ['enable', 'enabled', 'true', '1', 'yes'].includes(normalizedFlag);
  const dummyEnabled = ['enable', 'enabled', 'true', '1', 'yes'].includes(normalizedDummyFlag);
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!enabled) {
    return {
      enabled: false,
      client: null,
      message: 'Online payment is disabled. Set RAZORPAY=enable in .env and restart server.'
    };
  }

  if (!keyId || !keySecret) {
    if (dummyEnabled) {
      return {
        enabled: true,
        dummyEnabled: true,
        client: null,
        keyId: 'DUMMY_RAZORPAY_KEY',
        keySecret: '',
        message: 'Razorpay dummy mode is enabled.'
      };
    }

    return {
      enabled: true,
      dummyEnabled: false,
      client: null,
      message: 'Payment gateway is not configured properly (missing Razorpay keys).'
    };
  }

  const nextCacheKey = `${keyId}:${keySecret}`;
  if (!razorpay || razorpayCacheKey !== nextCacheKey) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    razorpayCacheKey = nextCacheKey;
  }

  return {
    enabled: true,
    dummyEnabled,
    client: razorpay,
    keyId,
    keySecret,
    message: ''
  };
}

// Create Razorpay order
router.post('/create-razorpay-order', auth(), async (req, res) => {
  try {
    const razorpayState = getRazorpayState();

    if (!razorpayState.enabled) {
      return res.status(503).json({
        success: false,
        message: razorpayState.message
      });
    }

    if (!razorpayState.client) {
      if (razorpayState.dummyEnabled) {
        return res.json({
          success: true,
          mockOrder: true,
          order: {
            id: `DUMMY_ORDER_${Date.now()}`,
            amount: (req.body.amount || 0) * 100,
            currency: req.body.currency || 'INR',
            status: 'created'
          },
          key: razorpayState.keyId,
          message: 'Dummy payment mode enabled'
        });
      }

      return res.status(503).json({
        success: false,
        message: razorpayState.message
      });
    }

    const { amount, currency = 'INR' } = req.body;
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`
    };
    
    const razorpayOrder = await razorpayState.client.orders.create(options);
    
    res.json({
      success: true,
      order: razorpayOrder,
      key: razorpayState.keyId
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating Razorpay order',
      error: error.message
    });
  }
});

// Verify payment and create order
router.post('/verify-payment', auth(), async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      isCompleteLook,
      lookName
    } = req.body;

    const razorpayState = getRazorpayState();

    if (!razorpayState.enabled || (!razorpayState.client && !razorpayState.dummyEnabled)) {
      return res.status(503).json({
        success: false,
        message: razorpayState.message
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for payment verification'
      });
    }
    
    if (!razorpayState.dummyEnabled) {
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', razorpayState.keySecret)
        .update(sign.toString())
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }
    }
    
    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      if (!item?.productId || !item?.quantity || item.quantity <= 0) {
        continue;
      }

      const product = await Product.findById(item.productId);
      if (!product) continue;
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      });
      
      // Update stock safely for both variant and non-variant products
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => {
          const sizeMatch = item.size ? v.size === item.size : true;
          const colorMatch = item.color ? v.color === item.color : !v.color || v.color === '';
          return sizeMatch && colorMatch;
        });

        if (variant && variant.stock >= item.quantity) {
          variant.stock -= item.quantity;
          product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        }
      } else if (typeof product.totalStock === 'number' && product.totalStock >= item.quantity) {
        product.totalStock -= item.quantity;
      }

      product.purchaseCount += item.quantity;
      await product.save();
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products found for this order'
      });
    }
    
    const tax = subtotal * 0.18; // 18% GST
    const shippingCharge = subtotal > 2000 ? 0 : 100;
    const discount = isCompleteLook ? subtotal * 0.1 : 0; // 10% bundle discount
    const total = subtotal + tax + shippingCharge - discount;
    
    // Create order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      isCompleteLook,
      lookName,
      shippingAddress,
      payment: {
        method: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'completed',
        paidAt: new Date()
      },
      subtotal,
      tax,
      shippingCharge,
      discount,
      total,
      status: 'placed',
      timeline: [{
        status: 'placed',
        message: razorpayState.dummyEnabled ? 'Order placed successfully (Dummy Payment)' : 'Order placed successfully',
        timestamp: new Date()
      }]
    });
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Payment verified and order created',
      orderId: order._id,
      orderNumber: order.orderNumber
    });
    
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
});

// Create Order (COD or after payment verification)
router.post('/', auth(), async (req, res) => {
  try {
    const { items, shippingAddress, payment, subtotal, tax, shippingCharge, discount = 0, total } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    if (!shippingAddress || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment method are required'
      });
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      items,
      shippingAddress,
      payment: {
        method: payment.method,
        status: payment.method === 'cod' ? 'pending' : payment.status || 'pending',
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature
      },
      subtotal,
      tax,
      shippingCharge,
      discount,
      total,
      status: 'placed',
      timeline: [{
        status: 'placed',
        message: 'Order placed successfully',
        timestamp: new Date()
      }]
    });

    await order.save();

    // Update product stock and purchase count
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.purchaseCount = (product.purchaseCount || 0) + item.quantity;
        
        // Update variant stock if applicable
        if (product.variants && product.variants.length > 0) {
          // Find matching variant
          const variant = product.variants.find(v => {
            const sizeMatch = item.size ? v.size === item.size : true;
            const colorMatch = item.color ? v.color === item.color : !v.color || v.color === '';
            return sizeMatch && colorMatch;
          });
          
          if (variant && variant.stock >= item.quantity) {
            variant.stock -= item.quantity;
            product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
          }
        } else {
          // No variants - update total stock directly
          if (product.totalStock >= item.quantity) {
            product.totalStock -= item.quantity;
          }
        }
        
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Get user orders
router.get('/', auth(), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort('-createdAt');
    
    res.json({
      success: true,
      orders
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get single order
router.get('/:id', auth(), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Cancel order
router.patch('/:id/cancel', auth(), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order - already out for delivery'
      });
    }

    if (!['placed', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      message: `Order cancelled by customer. Reason: ${reason}`,
      timestamp: new Date()
    });
    order.customerNote = `Cancellation reason: ${reason}`;

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find(v => {
            const sizeMatch = item.size ? v.size === item.size : true;
            const colorMatch = item.color ? v.color === item.color : !v.color || v.color === '';
            return sizeMatch && colorMatch;
          });
          
          if (variant) {
            variant.stock += item.quantity;
            product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
          }
        } else {
          product.totalStock += item.quantity;
        }
        
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

// Return order
router.patch('/:id/return', auth(), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    // Check if within return window (10 days)
    const deliveredDate = order.tracking?.deliveredAt 
      ? new Date(order.tracking.deliveredAt)
      : new Date(order.updatedAt);
    
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 10) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired (10 days from delivery)'
      });
    }

    // Update order status
    order.status = 'returned';
    order.timeline.push({
      status: 'returned',
      message: `Return requested by customer. Reason: ${reason}`,
      timestamp: new Date()
    });
    order.customerNote = `Return reason: ${reason}`;

    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully',
      order
    });
  } catch (error) {
    console.error('Error returning order:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting return request',
      error: error.message
    });
  }
});

export default router;
