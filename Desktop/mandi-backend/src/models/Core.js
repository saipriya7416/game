const mongoose = require('mongoose');

// --- 3. USER ROLES ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Accountant', 'Operations Staff'], required: true, default: 'Operations Staff' },
  staffId: { type: String, required: true, unique: true }, // For "Staff Identity" login
  name: { type: String },
  refreshToken: { type: String }, // For secure long-lived sessions
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
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
  originalName: { type: String },
  fileSize: { type: Number }, // in bytes
  docType: { type: String, enum: ['Bill Scan', 'Identity', 'Produce Photo', 'Other'], required: true, default: 'Other' },
  url: { type: String, required: true }, // Storage URL
  relatedToType: { type: String, enum: ['Supplier', 'Buyer', 'Lot', 'Expense', 'Payment', 'Other'], default: 'Other' },
  relatedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedToType' }, // Dynamic link
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

// --- 30. COMMUNICATION LOGS ---
const messageLogSchema = new mongoose.Schema({
  channel: { type: String, enum: ['WhatsApp', 'SMS'], required: true },
  to: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Sent', 'Delivered', 'Failed'], default: 'Pending' },
  sid: { type: String }, // Twilio/MSG91 Message SID
  error: { type: String },
  relatedTo: { type: mongoose.Schema.Types.ObjectId },
  relatedToType: { type: String, enum: ['Bill', 'Invoice', 'Payment', 'User', 'Other'] },
}, { timestamps: true });

const MessageLog = mongoose.model('MessageLog', messageLogSchema);

module.exports = { User, Verification, Document, MessageLog };
