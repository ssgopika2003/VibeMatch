import axios from 'axios';

/**
 * Track a product view
 * @param {string} productId - The ID of the product being viewed
 * @param {string} token - User authentication token (optional)
 */
export const trackProductView = async (productId, token = null) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post('/api/analytics/product-view', { productId }, config);
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Failed to track product view:', error.message);
  }
};

/**
 * Track a search query
 * @param {string} query - The search query text
 * @param {number} resultsCount - Number of results returned
 * @param {string} token - User authentication token (optional)
 */
export const trackSearch = async (query, resultsCount = 0, token = null) => {
  try {
    if (!query || query.trim() === '') return;
    
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post('/api/analytics/search', { 
      query: query.trim(), 
      resultsCount 
    }, config);
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Failed to track search:', error.message);
  }
};

/**
 * Debounced search tracking - prevents excessive logging
 * @param {string} query - The search query text
 * @param {number} resultsCount - Number of results returned
 * @param {string} token - User authentication token (optional)
 * @param {number} delay - Debounce delay in ms (default: 1000)
 */
let searchDebounceTimer = null;
export const trackSearchDebounced = (query, resultsCount = 0, token = null, delay = 1000) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    trackSearch(query, resultsCount, token);
  }, delay);
};

/**
 * Track add to cart event
 * @param {string} productId - The ID of the product added to cart
 * @param {number} quantity - Quantity added
 * @param {string} token - User authentication token (optional)
 */
export const trackAddToCart = async (productId, quantity = 1, token = null) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post('/api/analytics/add-to-cart', { 
      productId, 
      quantity 
    }, config);
  } catch (error) {
    console.debug('Failed to track add to cart:', error.message);
  }
};

/**
 * Track page view
 * @param {string} page - Page name/path
 * @param {string} token - User authentication token (optional)
 */
export const trackPageView = async (page, token = null) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post('/api/analytics/page-view', { page }, config);
  } catch (error) {
    console.debug('Failed to track page view:', error.message);
  }
};
