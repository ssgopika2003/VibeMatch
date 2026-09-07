import express from 'express';
import SearchLog from '../models/SearchLog.model.js';
import ProductView from '../models/ProductView.model.js';

const router = express.Router();

/**
 * @route   POST /api/analytics/product-view
 * @desc    Track a product view
 * @access  Public (with optional auth)
 */
router.post('/product-view', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if a view for this product already exists today from this session
    // To prevent duplicate counting within a short time window
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingView = await ProductView.findOne({
      product: productId,
      viewedAt: { $gte: today }
    });

    if (existingView) {
      // Just update the timestamp
      existingView.viewedAt = new Date();
      await existingView.save();
    } else {
      // Create new view record
      await ProductView.create({
        product: productId,
        user: req.user?._id, // Optional: if auth middleware is used
        viewedAt: new Date()
      });
    }

    res.status(200).json({ message: 'Product view tracked' });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({ message: 'Failed to track product view' });
  }
});

/**
 * @route   POST /api/analytics/search
 * @desc    Track a search query
 * @access  Public (with optional auth)
 */
router.post('/search', async (req, res) => {
  try {
    const { query, resultsCount } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Log the search
    await SearchLog.create({
      query: query.trim().toLowerCase(),
      user: req.user?._id, // Optional: if auth middleware is used
      resultsCount: resultsCount || 0,
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Search tracked' });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ message: 'Failed to track search' });
  }
});

/**
 * @route   POST /api/analytics/add-to-cart
 * @desc    Track add to cart event (optional - for future use)
 * @access  Public (with optional auth)
 */
router.post('/add-to-cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // For now, just acknowledge receipt
    // In future, create an AddToCart model to track cart events
    
    res.status(200).json({ message: 'Add to cart event tracked' });
  } catch (error) {
    console.error('Error tracking add to cart:', error);
    res.status(500).json({ message: 'Failed to track add to cart' });
  }
});

/**
 * @route   POST /api/analytics/page-view
 * @desc    Track page view (optional - for future use)
 * @access  Public (with optional auth)
 */
router.post('/page-view', async (req, res) => {
  try {
    const { page } = req.body;
    
    // For now, just acknowledge receipt
    // In future, create a PageView model to track page visits
    
    res.status(200).json({ message: 'Page view tracked' });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ message: 'Failed to track page view' });
  }
});

export default router;
