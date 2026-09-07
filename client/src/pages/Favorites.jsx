import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Heart, ShoppingCart, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getDiscountPercent, getEffectivePrice, hasValidDiscount } from '../utils/priceUtils';

const Favorites = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, favorites, removeFromFavorites, addToCart } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [favorites]);

  const fetchFavorites = async () => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/products/batch',
        { productIds: favorites },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/user/wishlist/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      removeFromFavorites(productId);
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const handleAddToCart = (product) => {
    if (product.variants && product.variants.length > 0) {
      navigate(`/products/${product._id}`);
      toast.info('Please select size and color');
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-700 rounded mb-3"></div>
                  <div className="h-8 bg-gray-700 rounded mb-4"></div>
                  <div className="h-10 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-400 fill-red-400" />
          <h1 className="text-4xl font-bold text-white">My Favorites</h1>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-midnight border border-violet-500/30 rounded-xl max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Favorites Yet</h2>
            <p className="text-gray-400 mb-8">
              Save your favorite items here and shop them later!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition font-semibold flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden hover:border-violet-500 transition group"
              >
                {/* Product Image */}
                <div 
                  className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <img
                    src={product.images?.[0]?.url || '/assets/images/placeholders/product-placeholder.jpg'}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  
                  {/* Discount Badge */}
                  {hasValidDiscount(product) && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {getDiscountPercent(product)}% OFF
                    </div>
                  )}

                  {/* Remove from Favorites */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(product._id);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
                          ₹{getEffectivePrice(product).toFixed(2)}
                        </span>
                        <span className="text-gray-400 line-through text-sm">
                          ₹{product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        ₹{getEffectivePrice(product).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {product.rating?.count > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-semibold">
                          {product.rating.average.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        ({product.rating.count} reviews)
                      </span>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
