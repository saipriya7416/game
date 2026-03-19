const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Accountant', 'Operations Staff'], 
    default: 'Operations Staff' 
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
