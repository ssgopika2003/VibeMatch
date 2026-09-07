import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import colors from 'colors';

// Load environment variables from .env file
dotenv.config();

// Create Admin User
const createAdminUser = async () => {
  try {
    // Connect to MongoDB using your existing .env configuration
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected'.green);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@vibematch.com' });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!'.yellow.bold);
      console.log('📧 Email: admin@vibematch.com'.cyan);
      return;
    }

    // Create new admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@vibematch.com',
      password: 'admin123456', // Will be hashed automatically
      role: 'admin',
      styleProfile: {
        isComplete: true,
        undertone: 'Neutral',
        preferredSilhouette: ['Structured'],
        favoriteVibes: ['Professional'],
        seasonalPreference: ['Winter'],
        jewelryTone: 'Both',
        dressSize: 'M',
        styleKeywords: ['modern', 'professional']
      },
      colorAffinity: new Map([
        ['Black', 5],
        ['White', 3]
      ])
    });

    console.log('\n✅ Admin user created successfully!'.green.bold);
    console.log('\n📧 Admin Credentials:'.cyan.bold);
    console.log('   Email:    admin@vibematch.com'.cyan);
    console.log('   Password: admin123456'.cyan);
    console.log('\n⚠️  Remember to change the password after first login!\n'.yellow);
    
  } catch (error) {
    console.error('\n❌ Error:'.red.bold, error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

// Run the script
createAdminUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
