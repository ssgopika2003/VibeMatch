import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { Heart, ShoppingCart, Star, ArrowLeft, Truck, Shield, RotateCcw, Package, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getDiscountPercent, getEffectivePrice, hasValidDiscount } from '../utils/priceUtils';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, favorites, toggleFavorite, addToCart } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [aiSuggestionSource, setAiSuggestionSource] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    setImageLoaded(false);
  }, [selectedImage]);

  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(response.data.product);
      
      // Auto-select variant with highest stock
      if (response.data.product.variants?.length > 0) {
        // Sort variants by stock (highest first)
        const sortedVariants = [...response.data.product.variants].sort((a, b) => b.stock - a.stock);
        const bestVariant = sortedVariants[0];
        
        setSelectedSize(bestVariant.size || '');
        setSelectedColor(bestVariant.color || '');
      }

      // Fetch reviews
      const reviewsResponse = await axios.get(`http://localhost:5000/api/products/${id}/reviews`);
      setReviews(reviewsResponse.data.reviews || []);

      // Fetch similar products + personalized AI suggestions (non-blocking)
      fetchSimilarProducts();
      fetchAiSuggestions();
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      setLoadingSimilar(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.get(`http://localhost:5000/api/products/${id}/similar`, { headers });
      setSimilarProducts(res.data.products || []);
    } catch (err) {
      // Similar products are optional; silently ignore errors
      console.warn('Could not load similar products:', err.message);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const fetchAiSuggestions = async () => {
    if (!token) {
      setAiSuggestions([]);
      return;
    }

    try {
      setLoadingAiSuggestions(true);
      const res = await axios.get(`http://localhost:5000/api/products/${id}/ai-suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAiSuggestions(res.data.products || []);
      setAiSuggestionSource(res.data.source || '');
    } catch (err) {
      // AI suggestions are optional and only for logged-in users.
      console.warn('Could not load AI suggestions:', err.message);
      setAiSuggestions([]);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      const isFavorite = favorites.includes(product._id);
      
      if (isFavorite) {
        await axios.delete(
          `http://localhost:5000/api/user/wishlist/${product._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Removed from favorites');
      } else {
        await axios.post(
          `http://localhost:5000/api/user/wishlist/${product._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Added to favorites');
      }
      
      toggleFavorite(product._id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleAddToCart = () => {
    // Check what's required based on available variants
    const availableSizes = getAvailableSizes();
    const availableColors = getAvailableColors();
    
    // Build error message based on what's actually required
    const missing = [];
    if (availableSizes.length > 0 && !selectedSize) {
      missing.push('size');
    }
    if (availableColors.length > 0 && availableColors.some(c => c && c.trim()) && !selectedColor) {
      missing.push('color');
    }
    
    if (missing.length > 0) {
      toast.error(`Please select ${missing.join(' and ')}`);
      return;
    }

    // Check stock availability
    if (product.variants?.length > 0) {
      const variant = product.variants.find(
        v => v.size === selectedSize && (v.color === selectedColor || !v.color) 
      );
      if (!variant || variant.stock < quantity) {
        toast.error('Selected variant is out of stock');
        return;
      }
    } else if (product.totalStock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    addToCart({
      id: product._id,
      name: product.name,
      price: getEffectivePrice(product),
      image: product.images?.[selectedImage]?.url || product.images?.[0]?.url,
      size: selectedSize,
      color: selectedColor,
      quantity
    });
    
    toast.success('Added to cart!');
  };

  const getAvailableSizes = () => {
    if (!product?.variants || product.variants.length === 0) return [];
    const sizes = [...new Set(product.variants.map(v => v.size).filter(s => s))];
    return sizes;
  };

  const getAvailableColors = () => {
    if (!product?.variants || product.variants.length === 0) return [];
    
    // Get colors based on selected size
    let colors;
    if (selectedSize) {
      colors = product.variants
        .filter(v => v.size === selectedSize && v.color)
        .map(v => v.color);
    } else {
      colors = product.variants
        .map(v => v.color)
        .filter(c => c);
    }
    
    return [...new Set(colors)];
  };
  
  const hasColors = () => {
    if (!product?.variants || product.variants.length === 0) return false;
    return product.variants.some(v => v.color && v.color.trim());
  };
  
  // Helper to check if color is hex code
  const isHexColor = (color) => {
    return color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const getStock = () => {
    if (!product) return 0;
    if (product.variants?.length === 0) return product.totalStock;
    
    if (selectedSize) {
      // If colors exist and one is selected
      if (hasColors() && selectedColor) {
        const variant = product.variants.find(
          v => v.size === selectedSize && v.color === selectedColor
        );
        return variant?.stock || 0;
      }
      // If no colors exist, just match size
      else if (!hasColors()) {
        const variant = product.variants.find(v => v.size === selectedSize);
        return variant?.stock || 0;
      }
    }
    
    return product.totalStock;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
            <div>
              <div className="bg-gray-700 rounded-xl aspect-square mb-4"></div>
              <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg aspect-square"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-10 bg-gray-700 rounded w-3/4"></div>
              <div className="h-6 bg-gray-700 rounded w-1/2"></div>
              <div className="h-12 bg-gray-700 rounded w-1/3"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Product not found</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = getEffectivePrice(product);
  const discount = hasValidDiscount(product) ? getDiscountPercent(product) : 0;
  const stock = getStock();

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden mb-4 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <img
                src={product.images?.[selectedImage]?.url || '/assets/images/placeholders/product-placeholder.jpg'}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`w-full aspect-square object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
            
            {/* Image Thumbnails */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`border-2 rounded-lg overflow-hidden transition ${
                      selectedImage === index
                        ? 'border-violet-500'
                        : 'border-violet-500/30 hover:border-violet-500/50'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      loading="lazy"
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{product.name}</h1>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-violet-600/20 text-violet-400 text-sm rounded border border-violet-500/30">
                    {product.category}
                  </span>
                  {product.vibeTags?.map((vibe, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-600/20 text-pink-400 text-sm rounded border border-pink-500/30"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleToggleFavorite}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                  favorites.includes(product._id)
                    ? 'bg-red-500 text-white'
                    : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${favorites.includes(product._id) ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Rating */}
            {product.rating?.count > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(product.rating.average)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">{product.rating.average.toFixed(1)}</span>
                <span className="text-gray-400">
                  ({product.rating.count} {product.rating.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-white">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-2xl text-gray-400 line-through">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-400">Inclusive of all taxes</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">{product.description}</p>
            </div>

            {/* Material */}
            {product.material && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Material</h3>
                <p className="text-gray-300">{product.material}</p>
              </div>
            )}

            {/* Size Selection */}
            {getAvailableSizes().length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Select Size
                  {selectedSize && (
                    <span className="text-sm font-normal text-violet-400 ml-2">
                      (Currently: {selectedSize})
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {getAvailableSizes().map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-lg font-semibold transition ${
                        selectedSize === size
                          ? 'bg-violet-600 text-white'
                          : 'bg-midnight border border-violet-500/30 text-white hover:border-violet-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection - Only show if colors exist */}
            {hasColors() && getAvailableColors().length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Select Color
                  {selectedColor && (
                    <span className="text-sm font-normal text-violet-400 ml-2">
                      (Currently: {isHexColor(selectedColor) ? 'Selected' : selectedColor})
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {getAvailableColors().map((color) => {
                    const isHex = isHexColor(color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative rounded-lg font-semibold transition overflow-hidden ${
                          selectedColor === color
                            ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-midnight'
                            : 'hover:ring-2 hover:ring-violet-500/50 hover:ring-offset-2 hover:ring-offset-midnight'
                        }`}
                        title={color}
                      >
                        {isHex ? (
                          // Show color swatch for hex codes
                          <div className="flex items-center gap-2 px-4 py-3 bg-midnight border border-violet-500/30">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-white/20"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-white text-sm uppercase">{color}</span>
                          </div>
                        ) : (
                          // Show text for color names
                          <div className={`px-6 py-3 ${
                            selectedColor === color
                              ? 'bg-violet-600 text-white'
                              : 'bg-midnight border border-violet-500/30 text-white'
                          }`}>
                            {color}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-midnight border border-violet-500/30 text-white rounded-lg hover:bg-violet-500/10 transition"
                >
                  -
                </button>
                <span className="text-xl font-semibold text-white w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                  className="w-10 h-10 bg-midnight border border-violet-500/30 text-white rounded-lg hover:bg-violet-500/10 transition disabled:opacity-50"
                >
                  +
                </button>
                <span className="text-gray-400">
                  {stock > 0 ? `${stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <ShoppingCart className="w-6 h-6" />
              {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-violet-500/30">
              <div className="text-center">
                <Truck className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Free Shipping</p>
                <p className="text-xs text-gray-500">Above ₹1000</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Easy Returns</p>
                <p className="text-xs text-gray-500">7 Days</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Secure Payment</p>
                <p className="text-xs text-gray-500">100% Safe</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Suggestions For You ── */}
        {(loadingAiSuggestions || aiSuggestions.length > 0) && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">AI Suggestions For You</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  Personalized using your profile and this product
                  {aiSuggestionSource ? ` • source: ${aiSuggestionSource}` : ''}
                </p>
              </div>
            </div>

            {loadingAiSuggestions ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-700 rounded-xl aspect-[3/4] mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {aiSuggestions.map((sp) => {
                  const spImg = sp.images?.[0]?.url || (typeof sp.images?.[0] === 'string' ? sp.images[0] : null);
                  return (
                    <Link key={sp._id} to={`/products/${sp._id}`} className="group block">
                      <div className="bg-midnight border border-pink-500/30 rounded-xl overflow-hidden hover:border-pink-500/60 transition-all duration-300">
                        <div className="aspect-[3/4] overflow-hidden bg-white/5">
                          {spImg ? (
                            <img
                              src={spImg}
                              alt={sp.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-white text-xs font-medium truncate group-hover:text-pink-400 transition">
                            {sp.name}
                          </p>
                          {sp.matchReason && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-pink-300 bg-pink-500/10 rounded px-1.5 py-0.5 truncate">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{sp.matchReason}</span>
                            </div>
                          )}
                          <p className="text-pink-400 text-xs font-bold mt-1">
                            ₹{(sp.discountPrice && sp.discountPrice < sp.price ? sp.discountPrice : sp.price)?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-white mb-8">Customer Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-midnight border border-violet-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-semibold mb-1">
                        {review.user?.name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── You May Also Like ── */}
        {(loadingSimilar || similarProducts.length > 0) && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">You May Also Like</h2>
                <p className="text-gray-400 text-sm mt-0.5">AI-matched similar products</p>
              </div>
            </div>

            {loadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-700 rounded-xl aspect-[3/4] mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similarProducts.map((sp) => {
                  const spImg = sp.images?.[0]?.url || (typeof sp.images?.[0] === 'string' ? sp.images[0] : null);
                  return (
                    <Link
                      key={sp._id}
                      to={`/products/${sp._id}`}
                      className="group block"
                    >
                      <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden hover:border-violet-500/60 transition-all duration-300">
                        <div className="aspect-[3/4] overflow-hidden bg-white/5">
                          {spImg ? (
                            <img
                              src={spImg}
                              alt={sp.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-white text-xs font-medium truncate group-hover:text-violet-400 transition">
                            {sp.name}
                          </p>
                          {sp.matchReason && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-purple-300 bg-purple-500/10 rounded px-1.5 py-0.5 truncate">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{sp.matchReason}</span>
                            </div>
                          )}
                          <p className="text-violet-400 text-xs font-bold mt-1">
                            ₹{(sp.discountPrice && sp.discountPrice < sp.price ? sp.discountPrice : sp.price)?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    );
};

export default ProductDetail;

