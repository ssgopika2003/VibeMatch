import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Gem, Heart, ShoppingBag,
  Star, ArrowRight, Award,
  Shirt, Briefcase, Wine, Crown, Music, Church, Coffee
} from 'lucide-react';
import { SITE_IMAGES, getSiteImage, VIBE_IMAGE_MAP } from '../config/siteImages';

const Home = () => {
  const navigate = useNavigate();
  
  // Core 8 E-commerce Fashion Categories (Default - Admin can modify)
  const vibes = [
    { 
      name: 'Casual', 
      icon: <Shirt className="w-6 h-6" />, 
      color: '#10B981', 
      gradient: 'from-green-500 to-emerald-600',
      image: VIBE_IMAGE_MAP['Casual'],
      description: 'Everyday comfort & style'
    },
    { 
      name: 'Formal', 
      icon: <Briefcase className="w-6 h-6" />, 
      color: '#475569', 
      gradient: 'from-slate-600 to-gray-800',
      image: VIBE_IMAGE_MAP['Formal'],
      description: 'Sophisticated business wear'
    },
    { 
      name: 'Party', 
      icon: <Music className="w-6 h-6" />, 
      color: '#f5576c', 
      gradient: 'from-pink-500 to-rose-500',
      image: VIBE_IMAGE_MAP['Party'],
      description: 'Vibrant celebration outfits'
    },
    { 
      name: 'Wedding', 
      icon: <Church className="w-6 h-6" />, 
      color: '#fcb69f', 
      gradient: 'from-orange-400 to-rose-400',
      image: VIBE_IMAGE_MAP['Wedding'],
      description: 'Elegant ceremonial attire'
    },
    { 
      name: 'Cocktail', 
      icon: <Wine className="w-6 h-6" />, 
      color: '#6A0DAD', 
      gradient: 'from-violet-500 to-violet-600',
      image: VIBE_IMAGE_MAP['Cocktail'],
      description: 'Chic evening ensembles'
    },
    { 
      name: 'Professional', 
      icon: <Award className="w-6 h-6" />, 
      color: '#6366F1', 
      gradient: 'from-indigo-500 to-purple-600',
      image: VIBE_IMAGE_MAP['Professional'],
      description: 'Modern workplace fashion'
    },
    { 
      name: 'Elegant', 
      icon: <Crown className="w-6 h-6" />, 
      color: '#D4AF37', 
      gradient: 'from-purple-500 to-pink-500',
      image: VIBE_IMAGE_MAP['Elegant'],
      description: 'Refined luxury collections'
    },
    { 
      name: 'Chic', 
      icon: <Sparkles className="w-6 h-6" />, 
      color: '#EC4899', 
      gradient: 'from-pink-500 to-rose-600',
      image: VIBE_IMAGE_MAP['Chic'],
      description: 'Trendy statement pieces'
    },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Matching',
      description: 'Smart algorithm creates perfect outfit combinations'
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: 'Inclusive Color Matching',
      description: 'Explore palettes matched to your undertone and preferences'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Personalized Style',
      description: 'Recommendations tailored to your unique preferences'
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* 🎬 Cinematic Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={getSiteImage('hero', 'main')}
            alt="Fashion Hero"
            className="w-full h-full object-cover image-cinematic"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
          <div className="absolute inset-0 noise-texture" />
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
        />

        {/* Hero Content */}
        <div className="relative z-10 container-custom text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full"
            >
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="text-sm font-medium">AI-Powered Fashion Recommendations</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-none">
              Discover Your
              <br />
              <span className="gradient-text">Perfect Vibe</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
              Complete outfit bundles curated for your style.
              <br />
              Dress + Jewelry + Cosmetics—perfectly matched.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group btn btn-primary flex items-center gap-3 px-8 py-4 text-lg shadow-glow"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Browse Collections
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>

              <Link to="/recommendations">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-glass flex items-center gap-3 px-8 py-4 text-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Recommendations
                </motion.button>
              </Link>
            </div>

          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-xs uppercase tracking-wider">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ✨ Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-black/90 to-black">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Why Choose <span className="gradient-text">VibeMatch</span>?
            </h2>
            <p className="text-xl text-gray-400">
              Experience the future of personalized fashion
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="card-glass p-8 text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-accent text-white">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎨 Popular Vibes Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Explore <span className="gradient-text">Fashion Vibes</span>
            </h2>
            <p className="text-xl text-gray-400">
              Find your perfect style for every occasion
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {vibes.map((vibe, index) => (
              <motion.div
                key={vibe.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -8 }}
                onClick={() => navigate(`/products?vibe=${encodeURIComponent(vibe.name)}`)}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer"
              >
                {/* Background Image */}
                <img
                  src={vibe.image}
                  alt={vibe.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, ${vibe.color}22 50%, ${vibe.color}DD 100%)`
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  {/* Icon instead of emoji */}
                  <div className="mb-3 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                    {vibe.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{vibe.name}</h3>
                  <p className="text-sm text-white/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {vibe.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Shop Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Border Glow */}
                <div 
                  className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-colors"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${vibe.color}44`
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 💎 Showcase Section */}
      <section className="relative py-24 bg-gradient-to-b from-black to-black/90">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden image-cinematic">
                <img
                  src={getSiteImage('hero', 'woman')}
                  alt="Fashion Showcase"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent" />
              </div>
              
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Complete Looks,
                <br />
                <span className="gradient-text">Perfectly Curated</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Our AI-powered matching engine analyzes your style preferences, undertone, 
                and favorite silhouettes to create harmonious outfit combinations.
              </p>
              <ul className="space-y-4">
                {[
                  'Complete outfit bundles (Dress + Jewelry + Cosmetics)',
                  'Inclusive color matching (undertone-based)',
                  'Seasonal palette recommendations',
                  '10% bundle discount on complete looks'
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">✓</span>
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link to="/recommendations">
                <motion.button
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary flex items-center gap-2 mt-8"
                >
                  Get Your Personalized Look
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🎯 CTA Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={getSiteImage('hero', 'accessories')}
            alt="Call to Action"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/50 to-black" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-display font-bold">
              Ready to Find Your
              <br />
              <span className="gradient-text">Fashion Vibe</span>?
            </h2>
            <p className="text-xl text-gray-300">
              Chat with our AI assistant for personalized style advice and product recommendations
            </p>
            <Link to="/recommendations">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary px-12 py-6 text-xl flex items-center gap-3 mx-auto shadow-glow animate-glow"
              >
                <Sparkles className="w-6 h-6" />
                Get Style Recommendations
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
