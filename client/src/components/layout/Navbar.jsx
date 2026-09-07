import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, User, LogOut, Menu, X,
  Sparkles, Heart, Settings, Package, Shield, Truck
} from 'lucide-react';
import { useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import { resolveProfileImageUrl } from '../../utils/profileImage';

const Navbar = () => {
  const { isAuthenticated, user, logout, cart } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const location = useLocation();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const profileImageUrl = useMemo(
    () => resolveProfileImageUrl(user?.personalProfile?.photo || user?.avatar || ''),
    [user?.avatar, user?.personalProfile?.photo]
  );

  const navLinks = [
    { name: 'Products', path: '/products', icon: <Package className="w-4 h-4" /> },
    { name: 'Recommendations', path: '/recommendations', icon: <Heart className="w-4 h-4" /> },
    { name: 'For You', path: '/for-you', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Future Dusk Navbar with Glassmorphism */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(46, 46, 94, 0.95) 0%, rgba(30, 30, 78, 0.95) 100%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-display font-bold text-white">
                  VibeMatch
                </div>
                <div className="text-xs text-purple-300 -mt-1">Fashion System</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive(link.path)
                        ? 'bg-white/10 text-white'
                        : 'text-purple-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.icon}
                    <span className="font-medium">{link.name}</span>
                  </motion.div>
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Favorites */}
              {isAuthenticated && (
                <Link to="/favorites">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Favorites"
                  >
                    <Heart className="w-5 h-5 text-white" />
                  </motion.button>
                </Link>
              )}
              
              {/* Cart */}
              <Link to="/cart">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-accent text-white text-xs flex items-center justify-center font-bold"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </motion.button>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* Admin Dashboard Button - Only for admins */}
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 transition-colors"
                        title="Admin Dashboard"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Admin</span>
                      </motion.button>
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {profileImageUrl && !profileImageFailed ? (
                          <img
                            src={profileImageUrl}
                            alt={user?.name || 'Profile'}
                            className="w-full h-full object-cover"
                            onError={() => setProfileImageFailed(true)}
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-white font-medium">{user?.name}</span>
                    </motion.button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-56 bg-midnight border border-violet-500/30 rounded-xl shadow-lg overflow-hidden"
                        >
                          <Link
                            to="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-violet-500/10 transition"
                          >
                            <User className="w-5 h-5 text-violet-400" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-violet-500/10 transition"
                          >
                            <Package className="w-5 h-5 text-violet-400" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            to="/order-tracking"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-violet-500/10 transition"
                          >
                            <Truck className="w-5 h-5 text-violet-400" />
                            <span>Track Orders</span>
                          </Link>
                          <Link
                            to="/favorites"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-violet-500/10 transition"
                          >
                            <Heart className="w-5 h-5 text-violet-400" />
                            <span>Favorites</span>
                          </Link>
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition"
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 rounded-lg glass-light text-white font-medium hover:bg-white/10 transition-colors"
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 rounded-lg bg-gradient-accent text-white font-medium shadow-glow"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              style={{ top: '80px' }}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-20 bottom-0 w-80 glass-strong border-l border-white/10 z-40 lg:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* User Section */}
                {isAuthenticated && (
                  <div className="pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-accent flex items-center justify-center">
                        {profileImageUrl && !profileImageFailed ? (
                          <img
                            src={profileImageUrl}
                            alt={user?.name || 'Profile'}
                            className="w-full h-full object-cover"
                            onError={() => setProfileImageFailed(true)}
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user?.name}</div>
                        <div className="text-sm text-purple-300">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.path)
                          ? 'bg-white/10 text-white'
                          : 'text-purple-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {link.icon}
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Cart */}
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Cart</span>
                  </div>
                  {cartItemsCount > 0 && (
                    <span className="px-2 py-1 rounded-full bg-gradient-accent text-white text-xs font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* Auth Buttons */}
                <div className="pt-6 border-t border-white/10 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Settings className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Profile Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-center rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-accent text-white font-medium shadow-glow"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
