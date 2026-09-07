import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ShoppingBag, Star, Loader, Wand2, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { getEffectivePrice, hasValidDiscount } from '../utils/priceUtils';

const API = 'http://localhost:5000';

const getAiNotice = (message) => {
  const text = String(message || '');
  const lowerText = text.toLowerCase();

  if (lowerText.includes('gemini quota or rate limit reached') || lowerText.includes('quota exceeded for metric')) {
    return 'AI styling insights are currently unavailable because the Gemini free-tier quota is exhausted. Recommendations are still shown using the non-AI fallback. To restore Gemini insights, upgrade the Gemini project to a paid or billing-enabled plan, or use another API key with available quota.';
  }

  return null;
};

// The three AI-powered display sections
const SECTIONS = [
  {
    key: 'Dress',
    label: 'Dresses For Your Shape',
    emoji: '👗',
    description: 'Silhouette and size-matched picks just for your body type',
  },
  {
    key: 'Cosmetic',
    label: 'Shades For Your Skin Tone',
    emoji: '💄',
    description: 'Lip, eye and blush tones that complement your complexion',
  },
  {
    key: 'Ornament',
    label: 'Jewelry For Your Vibe',
    emoji: '💎',
    description: 'Pieces that match your personal style energy',
  },
];

// ─── Product Card (shared) ────────────────────────────────────────────────────
const ProductCard = ({ product, index, isFav, onFavorite, imageUrl }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    className="group glass-strong rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all duration-300 flex flex-col"
  >
    {/* Image */}
    <Link to={`/products/${product._id}`} className="block relative">
      <div className="aspect-[3/4] bg-white/5 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-600" />
          </div>
        )}
      </div>

      {/* Match badge */}
      {product.matchScore >= 4 && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {product.matchScore >= 6 ? 'Perfect' : 'Great'} Match
        </div>
      )}

      {/* Favourite */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => onFavorite(e, product._id)}
          className="w-8 h-8 rounded-full glass flex items-center justify-center hover:scale-110 transition"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>
    </Link>

    {/* Info */}
    <div className="p-3 flex flex-col gap-1.5 flex-1">
      <Link to={`/products/${product._id}`}>
        <h3 className="text-white font-medium text-sm truncate group-hover:text-purple-400 transition">
          {product.name}
        </h3>
      </Link>

      {/* AI Reason chip */}
      {product.aiReason && (
        <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
          <Sparkles className="w-3 h-3 shrink-0 text-purple-400" />
          <span className="truncate">{product.aiReason}</span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div>
          {hasValidDiscount(product) ? (
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400 font-bold text-sm">
                ₹{getEffectivePrice(product).toLocaleString('en-IN')}
              </span>
              <span className="text-gray-500 text-xs line-through">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <span className="text-purple-400 font-bold text-sm">
              ₹{getEffectivePrice(product).toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {product.rating?.average > 0 && (
          <div className="flex items-center gap-1 text-xs text-yellow-400">
            <Star className="w-3 h-3 fill-yellow-400" />
            {product.rating.average.toFixed(1)}
          </div>
        )}
      </div>

      {/* Vibe tags */}
      <div className="flex flex-wrap gap-1">
        {product.vibeTags?.slice(0, 2).map((tag) => (
          <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const PersonalRecommendations = () => {
  const { token, toggleFavorite, favorites } = useStore();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [personalMessage, setPersonalMessage] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setAiNotice(null);

      // Try the new AI-powered endpoint first
      try {
        const res = await axios.get(`${API}/api/user/ai-for-you`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllProducts(res.data.products || []);
        setUserProfile(res.data.userProfile);
        setPersonalMessage(res.data.personalMessage || null);
        setAiEnabled(res.data.aiEnabled || false);
        return;
      } catch (aiErr) {
        // Profile not complete — surface the error
        if (aiErr.response?.status === 400) throw aiErr;
        const notice = getAiNotice(aiErr.response?.data?.message || aiErr.message);
        if (notice) {
          setAiNotice(notice);
        }
        // Any other error → graceful fallback to legacy endpoint
        console.warn('AI endpoint unavailable, using fallback:', aiErr.message);
      }

      // Legacy fallback
      const res = await axios.get(`${API}/api/user/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllProducts(res.data.products || []);
      setUserProfile(res.data.userProfile);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      if (error.response?.status === 400) {
        toast.error('Please complete your profile to see personalised picks!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (e, productId) => {
    e.preventDefault();
    try {
      const isFav = favorites.includes(productId);
      if (isFav) {
        await axios.delete(`${API}/api/user/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API}/api/user/wishlist/${productId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toggleFavorite(productId);
    } catch (err) {
      console.error('Favourite error:', err);
    }
  };

  const getProductImage = (product) => {
    if (!product.images?.length) return null;
    const img = product.images[0];
    return typeof img === 'string' ? img : img?.url;
  };

  // Products visible when a category pill is selected
  const filteredProducts = categoryFilter
    ? allProducts.filter((p) => p.category === categoryFilter)
    : [];

  // Section data grouped from all products
  const sections = SECTIONS.map((s) => ({
    ...s,
    products: allProducts.filter((p) => p.category === s.key),
  }));

  const categoryPills = [
    { value: '', label: 'All', emoji: '✨' },
    { value: 'Dress', label: 'Dresses', emoji: '👗' },
    { value: 'Cosmetic', label: 'Cosmetics', emoji: '💄' },
    { value: 'Ornament', label: 'Jewelry', emoji: '💎' },
  ];

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Picked Just <span className="gradient-text">For You</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              AI-matched to your profile — skin tone, body shape, vibe, and more ✨
            </p>
          </motion.div>

          {/* Profile chips */}
          {userProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 mt-4 px-5 py-2 glass rounded-full border border-white/10"
            >
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                Matching:&nbsp;
                <span className="text-white font-medium">{userProfile.gender}</span>
                {userProfile.ageGroup && userProfile.ageGroup !== 'All Ages' && (
                  <> · <span className="text-white font-medium">{userProfile.ageGroup}</span></>
                )}
                {userProfile.bodyType && userProfile.bodyType !== 'Prefer not to say' && (
                  <> · <span className="text-white font-medium">{userProfile.bodyType}</span></>
                )}
                {userProfile.skinTone && userProfile.skinTone !== 'Prefer not to say' && (
                  <> · <span className="text-white font-medium">{userProfile.skinTone}</span></>
                )}
                {userProfile.dressSize && (
                  <> · Size <span className="text-white font-medium">{userProfile.dressSize}</span></>
                )}
              </span>
            </motion.div>
          )}
        </div>

        {aiNotice && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-100"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-200 mb-1">Gemini AI quota exhausted</p>
                <p className="text-sm leading-relaxed">{aiNotice}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Gemini Personal Message Banner ── */}
        {personalMessage && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 to-pink-900/50 border border-purple-500/30 backdrop-blur-sm relative overflow-hidden"
          >
            {/* glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                  ✦ AI Stylist · Powered by Gemini
                </p>
                <p className="text-white text-base leading-relaxed">{personalMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Category Filter Pills ── */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {categoryPills.map((cat) => (
            <motion.button
              key={cat.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-5 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                categoryFilter === cat.value
                  ? 'accent-bg text-white shadow-lg'
                  : 'glass hover:glass-strong border border-white/10'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400 mt-4">
              {aiEnabled ? '✨ Gemini is styling your picks…' : 'Finding your perfect matches…'}
            </p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && allProducts.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No matches yet!</h3>
            <p className="text-gray-400 mb-6">
              We haven't tagged products for your profile yet. Check back soon or browse all products!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse All Products
            </Link>
          </div>
        )}

        {/* ── ALL view: Three AI Sections ── */}
        {!loading && allProducts.length > 0 && !categoryFilter && (
          <div className="space-y-16">
            {sections.map((section) =>
              section.products.length > 0 ? (
                <motion.section
                  key={section.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Section header */}
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-3xl">{section.emoji}</span>
                        {section.label}
                      </h2>
                      <p className="text-gray-400 text-sm mt-0.5">{section.description}</p>
                    </div>
                    {section.products.length > 5 && (
                      <button
                        onClick={() => setCategoryFilter(section.key)}
                        className="flex items-center gap-1 text-purple-400 text-sm hover:text-purple-300 transition shrink-0"
                      >
                        See all <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Product grid (max 5 in all-view) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {section.products.slice(0, 5).map((product, index) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        index={index}
                        isFav={favorites.includes(product._id)}
                        onFavorite={handleFavorite}
                        imageUrl={getProductImage(product)}
                      />
                    ))}
                  </div>
                </motion.section>
              ) : null
            )}
          </div>
        )}

        {/* ── Category-filtered view: full grid ── */}
        {!loading && allProducts.length > 0 && categoryFilter && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">No {categoryFilter.toLowerCase()} products matched your profile yet.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={index}
                    isFav={favorites.includes(product._id)}
                    onFavorite={handleFavorite}
                    imageUrl={getProductImage(product)}
                  />
                ))}
              </motion.div>
            )}

            <div className="text-center mt-10">
              <button
                onClick={() => setCategoryFilter('')}
                className="px-6 py-2 glass rounded-xl text-gray-300 hover:text-white transition text-sm"
              >
                ← Back to All Sections
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PersonalRecommendations;
