import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Sparkles, Edit3, Heart, Camera } from 'lucide-react';
import useStore from '../store/useStore';
import { resolveProfileImageUrl } from '../utils/profileImage';

const Profile = () => {
  const { user, styleProfile } = useStore();
  const personalProfile = user?.personalProfile;
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const profileImageUrl = useMemo(
    () => resolveProfileImageUrl(personalProfile?.photo),
    [personalProfile?.photo]
  );

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8"
        >
          Your <span className="gradient-text">Profile</span>
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <div className="glass-strong rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Account Info
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-lg">{user?.name || 'Guest'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-lg">{user?.email || 'Not logged in'}</p>
              </div>
            </div>
          </div>

          {/* Personal Profile */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                About You
              </h2>
              <Link
                to="/complete-profile"
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </Link>
            </div>
            {personalProfile?.isComplete ? (
              <div className="space-y-3">
                {/* Photo */}
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 bg-white/5 flex items-center justify-center">
                    {profileImageUrl && !photoLoadFailed ? (
                      <img
                        src={profileImageUrl}
                        alt="You"
                        className="w-full h-full object-cover"
                        onError={() => setPhotoLoadFailed(true)}
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Age</p>
                    <p className="text-lg">{personalProfile.age || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Identity</p>
                    <p className="text-lg">{personalProfile.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Body Type</p>
                    <p className="text-lg">{personalProfile.bodyType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Skin Tone</p>
                    <p className="text-lg">{personalProfile.skinTone || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">Complete your profile for personalized recommendations!</p>
                <Link
                  to="/complete-profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Complete Profile
                </Link>
              </div>
            )}
          </div>

          {/* Style Profile */}
          <div className="glass-strong rounded-2xl p-6 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Style Profile
            </h2>
            {styleProfile?.isComplete ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Undertone</p>
                  <p className="text-lg">{styleProfile.undertone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Favorite Vibes</p>
                  <p className="text-lg">{styleProfile.favoriteVibes?.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Silhouette</p>
                  <p className="text-lg">{styleProfile.preferredSilhouette?.join(', ') || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Season</p>
                  <p className="text-lg">{styleProfile.seasonalPreference?.join(', ') || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Take the vibe quiz to discover your style preferences!</p>
            )}
          </div>

          {/* Personalized Recommendations Link */}
          {personalProfile?.isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2"
            >
              <Link
                to="/for-you"
                className="block glass-strong rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition">
                        See Products Picked For You
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Personalized recommendations based on your profile
                      </p>
                    </div>
                  </div>
                  <span className="text-purple-400 text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
