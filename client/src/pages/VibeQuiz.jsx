import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Check, Circle, Sparkles, 
  PartyPopper, Church, Shirt, Briefcase, Flower2, 
  Minus, Zap, User 
} from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const VibeQuiz = () => {
  const navigate = useNavigate();
  const { setStyleProfile, token } = useStore();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    jewelryTone: '',
    favoriteVibes: [],
    preferredSilhouette: [],
    seasonalPreference: [],
    dressSize: '',
  });

  const totalSteps = 5;

  const questions = [
    {
      id: 1,
      question: 'Which jewelry tone makes you glow?',
      subtitle: 'This helps us determine your undertone',
      type: 'single',
      field: 'jewelryTone',
      options: [
        { value: 'Gold', label: 'Gold', icon: <Circle className="w-5 h-5 fill-yellow-400 text-yellow-400" />, color: 'from-yellow-400 to-orange-500' },
        { value: 'Silver', label: 'Silver', icon: <Circle className="w-5 h-5 fill-gray-300 text-gray-300" />, color: 'from-gray-300 to-gray-500' },
        { value: 'Both', label: 'Both look great!', icon: <Sparkles className="w-5 h-5" />, color: 'from-purple-400 to-pink-400' },
      ],
    },
    {
      id: 2,
      question: 'What vibes do you love?',
      subtitle: 'Select all that apply',
      type: 'multiple',
      field: 'favoriteVibes',
      options: [
        { value: 'Party', label: 'Party', icon: <PartyPopper className="w-5 h-5" /> },
        { value: 'Wedding', label: 'Wedding', icon: <Church className="w-5 h-5" /> },
        { value: 'Casual', label: 'Casual', icon: <Shirt className="w-5 h-5" /> },
        { value: 'Professional', label: 'Professional', icon: <Briefcase className="w-5 h-5" /> },
        { value: 'Boho', label: 'Boho', icon: <Flower2 className="w-5 h-5" /> },
        { value: 'Minimal', label: 'Minimal', icon: <Minus className="w-5 h-5" /> },
        { value: 'Glam', label: 'Glam', icon: <Sparkles className="w-5 h-5" /> },
        { value: 'Sport', label: 'Sport', icon: <Zap className="w-5 h-5" /> },
      ],
    },
    {
      id: 3,
      question: 'What silhouette do you prefer?',
      subtitle: 'Choose your favorite fits',
      type: 'multiple',
      field: 'preferredSilhouette',
      options: [
        { value: 'A-Line', label: 'A-Line', icon: <User className="w-5 h-5" /> },
        { value: 'Relaxed', label: 'Relaxed', icon: <Shirt className="w-5 h-5" /> },
        { value: 'Fitted', label: 'Fitted', icon: <User className="w-5 h-5" /> },
        { value: 'Flowing', label: 'Flowing', icon: <Sparkles className="w-5 h-5" /> },
        { value: 'Structured', label: 'Structured', icon: <Briefcase className="w-5 h-5" /> },
        { value: 'Oversized', label: 'Oversized', icon: <Shirt className="w-5 h-5" /> },
      ],
    },
    {
      id: 4,
      question: 'Which seasons resonate with you?',
      subtitle: 'This helps us match colors to your palette',
      type: 'multiple',
      field: 'seasonalPreference',
      options: [
        { value: 'Winter', label: 'Winter', icon: <Sparkles className="w-5 h-5 text-blue-400" />, color: 'from-blue-200 to-blue-400' },
        { value: 'Spring', label: 'Spring', icon: <Flower2 className="w-5 h-5 text-pink-400" />, color: 'from-pink-200 to-green-300' },
        { value: 'Summer', label: 'Summer', icon: <Circle className="w-5 h-5 text-yellow-400 fill-yellow-400" />, color: 'from-yellow-200 to-orange-300' },
        { value: 'Autumn', label: 'Autumn', icon: <Flower2 className="w-5 h-5 text-orange-400" />, color: 'from-orange-300 to-red-400' },
      ],
    },
    {
      id: 5,
      question: 'What\'s your dress size?',
      subtitle: 'We\'ll show you perfectly sized recommendations',
      type: 'single',
      field: 'dressSize',
      options: [
        { value: 'XS', label: 'XS' },
        { value: 'S', label: 'S' },
        { value: 'M', label: 'M' },
        { value: 'L', label: 'L' },
        { value: 'XL', label: 'XL' },
        { value: 'XXL', label: 'XXL' },
      ],
    },
  ];

  const currentQuestion = questions[step - 1];

  const handleAnswer = (value) => {
    const field = currentQuestion.field;
    
    if (currentQuestion.type === 'single') {
      setAnswers({ ...answers, [field]: value });
    } else {
      const current = answers[field] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [field]: updated });
    }
  };

  const canProceed = () => {
    const field = currentQuestion.field;
    const value = answers[field];
    
    if (currentQuestion.type === 'single') {
      return value !== '';
    } else {
      return value && value.length > 0;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      // Determine undertone from jewelry preference
      let undertone = 'Neutral';
      if (answers.jewelryTone === 'Gold') undertone = 'Warm';
      else if (answers.jewelryTone === 'Silver') undertone = 'Cool';

      const styleProfile = {
        undertone,
        ...answers,
      };

      // Save to backend if authenticated
      if (token) {
        await axios.put(
          'http://localhost:5000/api/user/style-profile',
          styleProfile,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Save to local state
      setStyleProfile({ ...styleProfile, isComplete: true });

      // Navigate to recommendations
      navigate('/recommendations');
    } catch (error) {
      console.error('Error saving style profile:', error);
      // Still navigate even if save fails
      navigate('/recommendations');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-3xl w-full">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              className="h-full accent-bg"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {currentQuestion.question}
            </h2>
            <p className="text-gray-400 mb-8">{currentQuestion.subtitle}</p>

            {/* Options */}
            <div className={`grid ${
              currentQuestion.options.length > 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'
            } gap-4`}>
              {currentQuestion.options.map((option) => {
                const isSelected =
                  currentQuestion.type === 'single'
                    ? answers[currentQuestion.field] === option.value
                    : answers[currentQuestion.field]?.includes(option.value);

                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(option.value)}
                    className={`relative p-6 rounded-2xl transition-all ${
                      isSelected
                        ? 'accent-border border-2 glass-strong'
                        : 'border-2 border-transparent glass hover:glass-strong'
                    } ${option.color ? `bg-gradient-to-br ${option.color}` : ''}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 accent-bg rounded-full flex items-center justify-center">
                        <Check className="text-white w-4 h-4" />
                      </div>
                    )}
                    {option.icon && (
                      <div className="mb-3 flex items-center justify-center">{option.icon}</div>
                    )}
                    <div className={`font-semibold ${option.color ? 'text-white' : ''}`}>
                      {option.label}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className={`px-6 py-3 rounded-full glass flex items-center space-x-2 ${
                  step === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:glass-strong'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-full flex items-center space-x-2 ${
                  canProceed()
                    ? 'accent-bg text-white btn-glow'
                    : 'glass opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{step === totalSteps ? 'Get Recommendations' : 'Next'}</span>
                {step === totalSteps ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VibeQuiz;
