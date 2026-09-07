import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import SearchLog from '../models/SearchLog.model.js';
import ProductView from '../models/ProductView.model.js';

// =====================
// DASHBOARD ANALYTICS
// =====================

export const getDashboardStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Total Stats
    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    // Revenue stats
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          'payment.status': 'completed',
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Previous period for comparison
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - parseInt(period));
    
    const previousRevenue = await Order.aggregate([
      { 
        $match: { 
          'payment.status': 'completed',
          createdAt: { $gte: previousStart, $lt: startDate }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const currentRevenue = revenueData[0]?.totalRevenue || 0;
    const prevRevenue = previousRevenue[0]?.totalRevenue || 0;
    const revenueGrowth = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
      : 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    // Top products
    const topProducts = await Product.find()
      .sort('-purchaseCount')
      .limit(5)
      .select('name images price purchaseCount rating');

    // Low stock products
    const lowStockProducts = await Product.find({ totalStock: { $lte: 10, $gt: 0 } })
      .sort('totalStock')
      .limit(10)
      .select('name totalStock images');

    // Out of stock
    const outOfStockCount = await Product.countDocuments({ totalStock: 0 });

    res.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          outOfStockCount,
          revenue: revenueData[0] || { 
            totalRevenue: 0, 
            totalOrders: 0, 
            averageOrderValue: 0 
          },
          revenueGrowth: parseFloat(revenueGrowth)
        },
        ordersByStatus,
        recentOrders,
        topProducts,
        lowStockProducts
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// =====================
// ADVANCED ANALYTICS
// =====================

export const getAdvancedAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Most searched keywords
    const topSearches = await SearchLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $toLower: '$searchQuery' },
          count: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Most viewed products
    const topViewedProducts = await ProductView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$product',
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          addedToCart: { $sum: { $cond: ['$addedToCart', 1, 0] } },
          addedToWishlist: { $sum: { $cond: ['$addedToWishlist', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images', 0] },
          price: '$product.price',
          views: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          addedToCart: 1,
          addedToWishlist: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$addedToCart', '$views'] },
              100
            ]
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $match: { 'payment.status': 'completed', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemsSold: { $sum: '$items.quantity' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Sales by vibe
    const salesByVibe = await Order.aggregate([
      { $match: { 'payment.status': 'completed', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $unwind: '$productInfo.vibeTags' },
      {
        $group: {
          _id: '$productInfo.vibeTags',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Revenue over time (daily for last 30 days)
    const revenueTimeline = await Order.aggregate([
      { $match: { 'payment.status': 'completed', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // User growth
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate }, role: 'user' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Color popularity
    const colorPopularity = await User.aggregate([
      { $project: { colorAffinityArray: { $objectToArray: '$colorAffinity' } } },
      { $unwind: '$colorAffinityArray' },
      {
        $group: {
          _id: '$colorAffinityArray.k',
          totalClicks: { $sum: '$colorAffinityArray.v' }
        }
      },
      { $sort: { totalClicks: -1 } },
      { $limit: 15 }
    ]);

    res.json({
      success: true,
      analytics: {
        topSearches,
        topViewedProducts,
        salesByCategory,
        salesByVibe,
        revenueTimeline,
        userGrowth,
        colorPopularity
      }
    });

  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advanced analytics',
      error: error.message
    });
  }
};

// =====================
// USER MANAGEMENT
// =====================

export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('orders');

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('orders')
      .populate('wishlist');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order stats
    const orderStats = await Order.aggregate([
      { $match: { user: user._id, 'payment.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      user,
      stats: orderStats[0] || { totalSpent: 0, totalOrders: 0 }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    const authenticatedUserId = req.user?.id || req.user?._id;
    if (authenticatedUserId && user._id.toString() === authenticatedUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// =====================
// PRODUCT MANAGEMENT
// =====================

export const getAllProductsAdmin = async (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      stock = '' // 'low', 'out', 'all'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    if (stock === 'low') {
      query.totalStock = { $lte: 10, $gt: 0 };
    } else if (stock === 'out') {
      query.totalStock = 0;
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(query)
      .sort(sortOptions);

    const totalProducts = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts,
        limit: totalProducts
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Calculate total stock from variants
    if (productData.variants && productData.variants.length > 0) {
      productData.totalStock = productData.variants.reduce(
        (sum, variant) => sum + (variant.stock || 0), 
        0
      );
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Recalculate total stock if variants are updated
    if (productData.variants && productData.variants.length > 0) {
      productData.totalStock = productData.variants.reduce(
        (sum, variant) => sum + (variant.stock || 0), 
        0
      );
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// =====================
// ORDER MANAGEMENT
// =====================

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      search = '',
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const orders = await Order.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price');

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
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    
    if (trackingNumber) {
      order.tracking.trackingNumber = trackingNumber;
    }
    
    if (courier) {
      order.tracking.courier = courier;
    }

    // Add status update to history
    order.statusHistory.push({
      status,
      updatedBy: req.user?.id || req.user?._id,
      notes: notes || `Order status updated to ${status}`
    });

    // Set shipped date
    if (status === 'shipped' && !order.tracking.shippedAt) {
      order.tracking.shippedAt = new Date();
    }

    // Set delivered date
    if (status === 'delivered' && !order.tracking.deliveredAt) {
      order.tracking.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deleting cancelled or failed orders
    if (!['cancelled', 'failed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete cancelled or failed orders'
      });
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};
