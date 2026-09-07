import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, ArrowRight, ArrowLeft, 
  Camera, CheckCircle, User, Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { resolveProfileImageUrl } from '../utils/profileImage';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { token, user, setUser, setProfileComplete } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    bodyType: '',
    skinTone: '',
    photo: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const fileInputRef = useRef(null);

  const totalSteps = 4;
  const displayPhoto = useMemo(() => {
    if (photoPreview) return photoPreview;
    if (formData.photo) return resolveProfileImageUrl(formData.photo);
    if (user?.personalProfile?.photo) return resolveProfileImageUrl(user.personalProfile.photo);
    return '';
  }, [formData.photo, photoPreview, user?.personalProfile?.photo]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload JPG, PNG, WEBP, or GIF image only.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile image must be under 5MB.');
      e.target.value = '';
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoLoadFailed(false);
  };

  const handleSubmit = async () => {
    if (!formData.age || !formData.gender) {
      toast.error('Please fill in at least your age and how you identify 💜');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('age', formData.age);
      payload.append('gender', formData.gender);
      payload.append('bodyType', formData.bodyType);
      payload.append('skinTone', formData.skinTone);
      payload.append('photo', formData.photo);
      if (photoFile) {
        payload.append('photoFile', photoFile);
      }

      const response = await axios.put(
        'http://localhost:5000/api/user/personal-profile',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data.user);
      setProfileComplete(true);
      toast.success('Welcome to VibeMatch! Your profile is all set! 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'Woman', label: 'Woman', emoji: '👩' },
    { value: 'Man', label: 'Man', emoji: '👨' },
    { value: 'Non-Binary', label: 'Non-Binary', emoji: '🌈' },
    { value: 'Prefer not to say', label: 'Prefer not to say', emoji: '🤍' },
  ];

  const bodyTypeOptions = [
    { value: 'Petite', label: 'Petite', desc: 'Small frame & shorter height', emoji: '🌸' },
    { value: 'Slim', label: 'Slim', desc: 'Lean & slender build', emoji: '🌿' },
    { value: 'Athletic', label: 'Athletic', desc: 'Toned & sporty frame', emoji: '⚡' },
    { value: 'Curvy', label: 'Curvy', desc: 'Beautiful curves & shape', emoji: '🌊' },
    { value: 'Plus-Size', label: 'Plus-Size', desc: 'Full-figured & fabulous', emoji: '🌺' },
    { value: 'Tall', label: 'Tall', desc: 'Long & graceful frame', emoji: '🌻' },
    { value: 'Prefer not to say', label: 'I\'d rather not say', desc: 'That\'s totally okay!', emoji: '🤍' },
  ];

  const skinToneOptions = [
    { value: 'Fair', label: 'Fair', color: '#FDEBD0' },
    { value: 'Light', label: 'Light', color: '#F5CBA7' },
    { value: 'Medium', label: 'Medium', color: '#E0AC69' },
    { value: 'Olive', label: 'Olive', color: '#C68642' },
    { value: 'Tan', label: 'Tan', color: '#A67B5B' },
    { value: 'Brown', label: 'Brown', color: '#8D5524' },
    { value: 'Deep', label: 'Deep', color: '#5C3317' },
    { value: 'Prefer not to say', label: 'Prefer not to say', color: null },
  ];

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Let's get to know <span className="gradient-text">you!</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Help us find your perfect style matches 💜
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-strong rounded-3xl p-8 border border-white/10">
          <AnimatePresence mode="wait" custom={step}>
            {/* Step 1: Age & Gender */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">👋</span>
                  <h2 className="text-2xl font-bold mb-1">The basics</h2>
                  <p className="text-gray-400">Just a couple of things to start with!</p>
                </div>

                <div className="space-y-6">
                  {/* Age */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      How young are you? ✨
                    </label>
                    <input
                      type="number"
                      min="13"
                      max="120"
                      placeholder="Your age"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">This helps us suggest age-appropriate styles 💜</p>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-white font-medium mb-3">
                      How do you identify? 🌟
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {genderOptions.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData({ ...formData, gender: opt.value })}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            formData.gender === opt.value
                              ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-2xl mb-1 block">{opt.emoji}</span>
                          <span className="text-white font-medium">{opt.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Every identity is beautiful — this helps us show you the right collections 🤗
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Body Type */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">💃</span>
                  <h2 className="text-2xl font-bold mb-1">Your beautiful shape</h2>
                  <p className="text-gray-400">
                    Every body is perfect — this just helps us find the most flattering fits for you!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bodyTypeOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, bodyType: opt.value })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.bodyType === opt.value
                          ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <span className="text-white font-medium block">{opt.label}</span>
                          <span className="text-gray-400 text-xs">{opt.desc}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  🤍 No judgment here — you're gorgeous just the way you are!
                </p>
              </motion.div>
            )}

            {/* Step 3: Skin Tone */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🎨</span>
                  <h2 className="text-2xl font-bold mb-1">Your radiant glow</h2>
                  <p className="text-gray-400">
                    This helps us suggest colors and cosmetics that will look amazing on you!
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {skinToneOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, skinTone: opt.value })}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.skinTone === opt.value
                          ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {opt.color ? (
                        <div
                          className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white/20 shadow-inner"
                          style={{ backgroundColor: opt.color }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white/20 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  ✨ Every skin tone is beautiful — we just want to match you with colors that make you shine!
                </p>
              </motion.div>
            )}

            {/* Step 4: Photo (Optional) + Review */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">📸</span>
                  <h2 className="text-2xl font-bold mb-1">Almost there!</h2>
                  <p className="text-gray-400">Add a photo (totally optional) and review your info</p>
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    Add your photo <span className="text-gray-400 text-sm">(optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                      {displayPhoto && !photoLoadFailed ? (
                        <img
                          src={displayPhoto}
                          alt="You"
                          className="w-full h-full object-cover rounded-full"
                          onError={() => setPhotoLoadFailed(true)}
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition"
                        >
                          Upload From Device
                        </button>
                        {photoFile && (
                          <span className="text-xs text-green-300 self-center truncate max-w-full">{photoFile.name}</span>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Or paste a photo URL..."
                        value={formData.photo}
                        onChange={(e) => {
                          setFormData({ ...formData, photo: e.target.value });
                          setPhotoPreview('');
                          setPhotoFile(null);
                          setPhotoLoadFailed(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, WEBP, or GIF. If upload fails to load later, the current profile placeholder UI is shown.</p>
                    </div>
                  </div>
                </div>

                {/* Review Summary */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Your Profile Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Age:</span>
                      <span className="text-white ml-2">{formData.age || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Identity:</span>
                      <span className="text-white ml-2">{formData.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Body Type:</span>
                      <span className="text-white ml-2">{formData.bodyType || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Skin Tone:</span>
                      <span className="text-white ml-2">{formData.skinTone || '—'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                step === 1
                  ? 'opacity-30 cursor-not-allowed bg-white/5 text-gray-500'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>

            {step < totalSteps ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Complete My Profile
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <p className="text-center text-gray-500 text-sm mt-4">
          All fields help us give you better recommendations. Age & identity are required 💜
        </p>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
