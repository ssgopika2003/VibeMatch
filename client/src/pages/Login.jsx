import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import useStore from '../store/useStore';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setFavorites, setProfileComplete } = useStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      
      const userData = response.data.user;
      const isProfileDone = userData.isProfileComplete || userData.personalProfile?.isComplete || false;

      setToken(response.data.token);
      setUser(userData);
      setProfileComplete(isProfileDone);
      
      // Fetch user's wishlist/favorites
      try {
        const wishlistResponse = await axios.get('/api/user/wishlist', {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
        const favoriteIds = wishlistResponse.data.wishlist.map(item => 
          typeof item === 'string' ? item : item._id
        );
        setFavorites(favoriteIds);
      } catch (wishlistError) {
        console.error('Error fetching wishlist:', wishlistError);
      }
      
      // Redirect to profile completion if not done
      if (!isProfileDone && userData.role !== 'admin') {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-strong rounded-3xl p-8"
      >
        <h2 className="text-4xl font-bold text-center mb-8">
          Welcome <span className="gradient-text">Back</span>
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-electric-purple focus:outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-electric-purple focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 accent-bg rounded-xl text-white font-bold btn-glow disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="accent-text font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
