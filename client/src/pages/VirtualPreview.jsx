import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiRotateCw } from 'react-icons/fi';

/**
 * VIRTUAL PREVIEW COMPONENT
 * Uses CSS layering (z-index) for the free, open-source approach
 * No paid 3D tools - just beautiful CSS and transparency
 */

const VirtualPreview = () => {
  const { lookId } = useParams();
  const [look, setLook] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [layersVisible, setLayersVisible] = useState({
    dress: true,
    ornament: true,
    cosmetic: true,
  });

  useEffect(() => {
    // In real app, fetch look details from API
    // For now, using mock data
    fetchLookDetails();
  }, [lookId]);

  const fetchLookDetails = async () => {
    // Mock data - replace with actual API call
    const mockLook = {
      lookId,
      name: 'The Midnight Glam Look',
      items: {
        dress: {
          name: 'Floral Maxi Dress',
          colors: [
            { name: 'Blue', hex: '#4A90E2', image: '/dress-blue.png' },
            { name: 'Pink', hex: '#FF6B9D', image: '/dress-pink.png' },
            { name: 'Black', hex: '#1A1A1A', image: '/dress-black.png' },
          ],
        },
        ornament: {
          name: 'Silver Hoop Earrings',
          image: '/ornament.png',
        },
        cosmetic: {
          name: 'Coral Lipstick',
          image: '/lipstick.png',
        },
      },
    };

    setLook(mockLook);
    setSelectedColor(mockLook.items.dress.colors[0]);
  };

  if (!look) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
        >
          {look.name} <span className="gradient-text">Preview</span>
        </motion.h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Virtual Preview Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="relative aspect-[3/4] bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden">
              {/* Base Layer - Mannequin outline (artistic, inclusive) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 400"
                  className="w-full h-full opacity-20"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}
                >
                  {/* Simple, artistic mannequin outline */}
                  <ellipse cx="100" cy="50" rx="30" ry="35" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="100" y1="85" x2="100" y2="250" stroke="white" strokeWidth="2" />
                  <path d="M 100 120 Q 80 180 70 250" fill="none" stroke="white" strokeWidth="2" />
                  <path d="M 100 120 Q 120 180 130 250" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="100" y1="250" x2="85" y2="380" stroke="white" strokeWidth="2" />
                  <line x1="100" y1="250" x2="115" y2="380" stroke="white" strokeWidth="2" />
                </svg>
              </div>

              {/* Layer 1: Dress */}
              {layersVisible.dress && selectedColor && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  {selectedColor.image ? (
                    <img
                      src={selectedColor.image}
                      alt="Dress"
                      className="max-h-full object-contain"
                      style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }}
                    />
                  ) : (
                    <div
                      className="w-48 h-80 rounded-t-full"
                      style={{
                        background: `linear-gradient(135deg, ${selectedColor.hex}, ${selectedColor.hex}dd)`,
                        clipPath: 'polygon(30% 20%, 70% 20%, 90% 100%, 10% 100%)',
                      }}
                    />
                  )}
                </motion.div>
              )}

              {/* Layer 2: Ornament */}
              {layersVisible.ornament && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20"
                >
                  {look.items.ornament.image ? (
                    <img
                      src={look.items.ornament.image}
                      alt="Ornament"
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="text-6xl animate-float">💎</div>
                  )}
                </motion.div>
              )}

              {/* Layer 3: Cosmetic visualization (optional) */}
              {layersVisible.cosmetic && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-20 right-8 z-20"
                >
                  <div className="text-4xl">💄</div>
                </motion.div>
              )}

              {/* Rotate instruction */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-full flex items-center space-x-2">
                <FiRotateCw className="animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-sm">Interactive Preview</span>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="mt-6 flex justify-center gap-3">
              {Object.keys(layersVisible).map((layer) => (
                <motion.button
                  key={layer}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setLayersVisible({ ...layersVisible, [layer]: !layersVisible[layer] })
                  }
                  className={`px-4 py-2 rounded-lg capitalize ${
                    layersVisible[layer] ? 'accent-bg text-white' : 'glass'
                  }`}
                >
                  {layer}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Customization Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Color Selector */}
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4">Choose Dress Color</h3>
              <div className="grid grid-cols-3 gap-3">
                {look.items.dress.colors.map((color) => (
                  <motion.button
                    key={color.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedColor(color)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center space-y-2 transition-all ${
                      selectedColor?.name === color.name
                        ? 'accent-border border-4'
                        : 'border-2 border-white/20'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-white font-medium drop-shadow-lg">
                      {color.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4">What's Included</h3>
              <div className="space-y-3">
                {Object.entries(look.items).map(([type, item]) => (
                  <div key={type} className="glass p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase mb-1">{type}</p>
                    <p className="font-medium">
                      {type === 'dress' ? selectedColor?.name + ' ' : ''}
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 accent-bg rounded-2xl text-white text-lg font-bold flex items-center justify-center space-x-2 btn-glow"
            >
              <FiShoppingCart />
              <span>Buy Complete Look</span>
            </motion.button>

            <p className="text-center text-sm text-gray-400">
              Free shipping on orders above ₹2000
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPreview;
