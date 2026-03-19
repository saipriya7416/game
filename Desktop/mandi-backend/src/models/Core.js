const mongoose = require('mongoose');

// --- 3. USER ROLES ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Accountant', 'Operations'], required: true },
  staffId: { type: String, required: true, unique: true }, // For "Staff Identity" login
  name: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// --- 13. VERIFICATION & COMPLIANCE ---
const verificationSchema = new mongoose.Schema({
  partyType: { type: String, enum: ['Supplier', 'Buyer'], required: true },
  party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyType' },
  aadhaarNumber: { type: String },
  panNumber: { type: String },
  voterId: { type: String },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  kycDocLink: { type: String }, // Link to document management
}, { timestamps: true });

const Verification = mongoose.model('Verification', verificationSchema);

// --- 17. DOCUMENT MANAGEMENT ---
const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  docType: { type: String, enum: ['Bill Scan', 'Identity', 'Produce Photo', 'Other'], required: true },
  url: { type: String, required: true }, // Storage URL
  relatedTo: { type: mongoose.Schema.Types.Mixed }, // Dynamic object ID
  uploadedDate: { type: Date, default: Date.now },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = { User, Verification, Document };
