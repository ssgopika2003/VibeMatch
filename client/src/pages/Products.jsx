import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { Search, Filter, Heart, ShoppingCart, Star, X, Package, TrendingUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getDiscountPercent, getEffectivePrice, hasValidDiscount } from '../utils/priceUtils';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated, favorites, toggleFavorite, addToCart } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [vibeFilter, setVibeFilter] = useState(searchParams.get('vibe') || '');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('-createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({});
  const [imageLoadStates, setImageLoadStates] = useState({});

  // Update filters when URL changes (for navigation)
  useEffect(() => {
    const vibeParam = searchParams.get('vibe');
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    // Update state only if params differ to avoid unnecessary re-renders
    if (vibeParam !== vibeFilter) {
      setVibeFilter(vibeParam || '');
    }
    if (categoryParam !== categoryFilter) {
      setCategoryFilter(categoryParam || '');
    }
    if (searchParam !== searchTerm) {
      setSearchTerm(searchParam || '');
    }
  }, [searchParams]); // Only depend on searchParams, not on filter state

  // Fetch products when filters change
  useEffect(() => {
    console.log('Fetching products with filters:', {
      searchTerm,
      categoryFilter,
      vibeFilter,
      priceRange,
      sortBy
    });
    fetchProducts();
  }, [searchTerm, categoryFilter, vibeFilter, priceRange, sortBy]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 12,
        sort: sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(vibeFilter && { vibe: vibeFilter }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max })
      });

      const apiUrl = `http://localhost:5000/api/products?${params}`;
      console.log('Fetching from API:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('API Response:', {
        productsCount: response.data.products.length,
        pagination: response.data.pagination
      });
      
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      const isFavorite = favorites.includes(productId);
      
      if (isFavorite) {
        await axios.delete(
          `http://localhost:5000/api/user/wishlist/${productId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Removed from favorites');
      } else {
        await axios.post(
          `http://localhost:5000/api/user/wishlist/${productId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Added to favorites');
      }
      
      toggleFavorite(productId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleAddToCart = (product) => {
    // Check if product has any variants that require selection
    const hasVariants = product.variants && product.variants.length > 0;
    const hasSizes = hasVariants && product.variants.some(v => v.size);
    const hasColors = hasVariants && product.variants.some(v => v.color && v.color.trim());
    
    // If product has variants that need selection, redirect to product detail
    if (hasSizes || hasColors) {
      navigate(`/products/${product._id}`);
      
      // Build custom message based on what needs to be selected
      const needsSelection = [];
      if (hasSizes) needsSelection.push('size');
      if (hasColors) needsSelection.push('color');
      
      toast.info(`Please select ${needsSelection.join(' and ')}`);
      return;
    }

    // No variants or no selection needed - add directly to cart
    addToCart({
      id: product._id,
      name: product.name,
      price: getEffectivePrice(product),
      image: product.images?.[0]?.url,
      size: '',
      color: ''
    });
    toast.success('Added to cart!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setVibeFilter('');
    setPriceRange({ min: '', max: '' });
    setSortBy('-createdAt');
  };

  const handleImageLoad = (productId) => {
    setImageLoadStates(prev => ({ ...prev, [productId]: true }));
  };

  // Skeleton Loader Component
  const ProductSkeleton = () => (
    <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden animate-pulse">
      <div className="relative aspect-[3/4] bg-gray-700"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-700 rounded mb-3"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-16 bg-gray-700 rounded"></div>
          <div className="h-6 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Our Collection</h1>
          <p className="text-gray-400">Discover your perfect vibe</p>
          
          {/* Active Filters Display */}
          {(vibeFilter || categoryFilter || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-400">Active filters:</span>
              {vibeFilter && (
                <span className="px-3 py-1 bg-violet-600/20 text-violet-400 text-sm rounded-full border border-violet-500/30 flex items-center gap-2">
                  {vibeFilter}
                  <button
                    onClick={() => {
                      setVibeFilter('');
                      navigate('/products');
                    }}
                    className="hover:text-violet-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="px-3 py-1 bg-pink-600/20 text-pink-400 text-sm rounded-full border border-pink-500/30 flex items-center gap-2">
                  {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="hover:text-pink-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full border border-blue-500/30 flex items-center gap-2">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="-createdAt">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-rating.average">Top Rated</option>
            <option value="-purchaseCount">Most Popular</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-midnight border border-violet-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Category */}
              <div>
                <label className="block text-white mb-3 font-medium">Category</label>
                <div className="space-y-2">
                  {['', 'Dress', 'Ornament', 'Cosmetic'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={categoryFilter === cat}
                        onChange={() => setCategoryFilter(cat)}
                        className="w-4 h-4 text-violet-600"
                      />
                      <span>{cat || 'All Categories'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vibe */}
              <div>
                <label className="block text-white mb-3 font-medium">Vibe</label>
                <div className="space-y-2">
                  {['', 'Casual', 'Formal', 'Party', 'Wedding', 'Cocktail', 'Professional', 'Elegant', 'Chic', 'Boho', 'Minimal', 'Glam', 'Sport'].map((vibe) => (
                    <label key={vibe} className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer">
                      <input
                        type="radio"
                        name="vibe"
                        checked={vibeFilter === vibe}
                        onChange={() => setVibeFilter(vibe)}
                        className="w-4 h-4 text-violet-600"
                      />
                      <span>{vibe || 'All Vibes'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-white mb-3 font-medium">Price Range</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-white mb-3 font-medium">Quick Filters</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setPriceRange({ min: '', max: '1000' });
                    }}
                    className="w-full text-left px-3 py-2 bg-midnight border border-violet-500/30 text-gray-400 hover:text-white rounded-lg transition"
                  >
                    Under ₹1,000
                  </button>
                  <button
                    onClick={() => {
                      setPriceRange({ min: '1000', max: '3000' });
                    }}
                    className="w-full text-left px-3 py-2 bg-midnight border border-violet-500/30 text-gray-400 hover:text-white rounded-lg transition"
                  >
                    ₹1,000 - ₹3,000
                  </button>
                  <button
                    onClick={() => {
                      setPriceRange({ min: '3000', max: '' });
                    }}
                    className="w-full text-left px-3 py-2 bg-midnight border border-violet-500/30 text-gray-400 hover:text-white rounded-lg transition"
                  >
                    Above ₹3,000
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-violet-500/30">
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg hover:bg-violet-500/10 transition"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-midnight border border-violet-500/30 rounded-xl">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center">
                <Package className="w-12 h-12 text-violet-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Products Found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || categoryFilter || vibeFilter || priceRange.min || priceRange.max
                ? "We couldn't find any products matching your filters. Try adjusting your search criteria."
                : "No products available at the moment. Check back soon!"}
            </p>
            {(searchTerm || categoryFilter || vibeFilter || priceRange.min || priceRange.max) && (
              <button
                onClick={clearFilters}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition font-semibold flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Clear Filters & Browse All
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden hover:border-violet-500 transition group"
                >
                  {/* Product Image */}
                  <div
                    className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-gray-800"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    {/* Image Skeleton Loader */}
                    {!imageLoadStates[product._id] && (
                      <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    
                    <img
                      src={product.images?.[0]?.url || '/assets/images/placeholders/product-placeholder.jpg'}
                      alt={product.name}
                      loading="lazy"
                      onLoad={() => handleImageLoad(product._id)}
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
                        imageLoadStates[product._id] ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Discount Badge */}
                    {hasValidDiscount(product) && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {getDiscountPercent(product)}% OFF
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(product._id);
                      }}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition ${
                        favorites.includes(product._id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${favorites.includes(product._id) ? 'fill-current' : ''}`}
                      />
                    </button>

                    {/* Out of Stock Badge */}
                    {product.totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3
                      className="text-lg font-semibold text-white mb-2 cursor-pointer hover:text-violet-400 transition line-clamp-2"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {product.name}
                    </h3>

                    {/* Category & Vibes */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-violet-600/20 text-violet-400 text-xs rounded border border-violet-500/30">
                        {product.category}
                      </span>
                      {product.vibeTags?.[0] && (
                        <span className="px-2 py-1 bg-pink-600/20 text-pink-400 text-xs rounded border border-pink-500/30">
                          {product.vibeTags[0]}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      {hasValidDiscount(product) ? (
                        <>
                          <span className="text-2xl font-bold text-white">
                            ₹{getEffectivePrice(product).toLocaleString('en-IN')}
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          ₹{getEffectivePrice(product).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {product.rating?.count > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-semibold">
                            {product.rating.average.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-400">
                          ({product.rating.count} {product.rating.count === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.totalStock === 0}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {product.totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={pagination.currentPage === 1}
                  onClick={() => fetchProducts(pagination.currentPage - 1)}
                  className="px-6 py-3 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10 transition"
                >
                  Previous
                </button>
                <span className="px-4 text-white">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => fetchProducts(pagination.currentPage + 1)}
                  className="px-6 py-3 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
