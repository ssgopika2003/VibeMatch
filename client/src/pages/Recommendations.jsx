import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Heart, PartyPopper, Church, Shirt,
  Briefcase, Flower2, Sparkles, Zap
} from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';
import { getEffectivePrice, hasValidDiscount } from '../utils/priceUtils';

const Recommendations = () => {
  const [searchParams] = useSearchParams();
  const { styleProfile, setCurrentVibe, addToCart } = useStore();
  
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState(
    searchParams.get('vibe') || styleProfile.favoriteVibes?.[0] || 'Party'
  );

  useEffect(() => {
    fetchProductsBySelection();
  }, [selectedVibe]);

  useEffect(() => {
    setCurrentVibe(selectedVibe);
  }, [selectedVibe]);

  const fetchProductsBySelection = async () => {
    try {
      setProductLoading(true);
      const params = {
        vibe: selectedVibe,
        limit: 24,
        sort: '-purchaseCount'
      };

      const response = await axios.get('http://localhost:5000/api/products', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  };

  const vibes = [
    { name: 'Party', icon: <PartyPopper className="w-5 h-5" />, color: '#f5576c' },
    { name: 'Wedding', icon: <Church className="w-5 h-5" />, color: '#fcb69f' },
    { name: 'Casual', icon: <Shirt className="w-5 h-5" />, color: '#4facfe' },
    { name: 'Professional', icon: <Briefcase className="w-5 h-5" />, color: '#43e97b' },
    { name: 'Elegant', icon: <Sparkles className="w-5 h-5" />, color: '#fa709a' },
    { name: 'Formal', icon: <Zap className="w-5 h-5" />, color: '#667eea' },
    { name: 'Chic', icon: <Heart className="w-5 h-5" />, color: '#ffd700' },
    { name: 'Cocktail', icon: <Flower2 className="w-5 h-5" />, color: '#30cfd0' },
  ];

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            Vibe <span className="gradient-text">Products</span>
          </motion.h1>
          <p className="text-gray-300 text-lg">
            Browse products matching your selected vibe
          </p>
        </div>

        {/* Vibe Selector */}
        <div className="flex overflow-x-auto pb-4 mb-12 gap-3 scrollbar-hide p-4">
          {vibes.map((vibe) => (
            <motion.button
              key={vibe.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedVibe(vibe.name)}
              className={`flex-shrink-0 px-6 py-3 rounded-full flex items-center space-x-2 transition-all ${
                selectedVibe === vibe.name
                  ? 'accent-bg text-white shadow-lg'
                  : 'glass hover:glass-strong'
              }`}
            >
              {vibe.icon}
              <span className="font-medium">{vibe.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Vibe Products List */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Products For {selectedVibe}</h2>
          </div>

          {productLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-gray-400">
              <p className="mb-4">No products found for selected vibe.</p>
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 accent-bg rounded-full text-white font-medium"
                >
                  Browse Products
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const effectivePrice = getEffectivePrice(product);
                const showDiscount = hasValidDiscount(product);

                return (
                <motion.div
                  key={product._id}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  <Link to={`/products/${product._id}`}>
                    <div className="h-48 bg-white/5">
                      <img
                        src={product.images?.[0]?.url || '/assets/images/placeholders/product-placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-gray-400">{product.category}</p>
                    <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="accent-text font-bold">₹{effectivePrice.toLocaleString('en-IN')}</p>
                      {showDiscount && (
                        <p className="text-gray-400 text-sm line-through">₹{Number(product.price).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        addToCart({
                          id: product._id,
                          name: product.name,
                          image: product.images?.[0]?.url,
                          price: effectivePrice,
                          size: product.variants?.[0]?.size || 'Standard',
                          color: product.variants?.[0]?.color || product.colors?.[0]?.name || ''
                        });
                      }}
                      className="w-full py-2 accent-bg rounded-lg text-white font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
