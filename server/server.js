import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname fix - Need this BEFORE dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Load environment variables FIRST before any other imports
// The .env file is in the root folder (parent of server folder)
const envPath = path.join(__dirname, '..', '.env');
console.log('🔍 Loading .env from:', envPath);
console.log('🔍 __dirname is:', __dirname);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error('❌ Error loading .env:', envResult.error);
} else {
  console.log('✅ .env loaded successfully');
}

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes (AFTER dotenv.config())
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import vibeRoutes from './routes/vibe.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();
const mediaDir = path.join(__dirname, 'media');
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(path.join(mediaDir, 'profile-image'), { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/media', express.static(mediaDir));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vibes', vibeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VibeMatch API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
