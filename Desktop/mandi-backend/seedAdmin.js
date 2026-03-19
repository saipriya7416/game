require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./src/models/Core');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mandi-erp';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const username = 'admin';
    const password = 'mandi123';
    const staffId = 'MANAGER001';
    const role = 'Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists. Updating password...');
      const salt = await bcrypt.genSalt(12);
      existingUser.password = await bcrypt.hash(password, salt);
      await existingUser.save();
      console.log('Admin user updated successfully.');
    } else {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const admin = new User({
        username,
        password: hashedPassword,
        staffId,
        role,
        name: 'System Admin'
      });

      await admin.save();
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seed();
