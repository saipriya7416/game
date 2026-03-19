/**
 * ELITE ADMIN SEED SCRIPT
 * Run this to ensure your 'admin' with password 'mandi123' exists in your database.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./src/models/Core');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mandi-erp';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for Admin Upgrade...');

    // Delete existing admin to reset password
    await User.deleteMany({ staffId: 'admin' });

    const hashedPassword = await bcrypt.hash('mandi123', 12);

    await User.create({
      username: 'Mandi Admin',
      password: hashedPassword,
      staffId: 'admin',
      role: 'Admin',
      name: 'System Administrator',
      isActive: true
    });

    console.log('💎 ELITE ADMIN SECURED: staffId: admin | password: mandi123');
    process.exit(0);
  } catch (err) {
    console.error('❌ UPGRADE FAILED:', err);
    process.exit(1);
  }
};

seedAdmin();
