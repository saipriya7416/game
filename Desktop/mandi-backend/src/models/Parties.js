const mongoose = require('mongoose');

// --- 4. SUPPLIER MODEL ---
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String }, // Representing Village/Address
  govIdNumber: { type: String, required: true }, // India verification
  idType: { type: String, enum: ['Aadhaar', 'PAN', 'Voter ID'], required: true },
  bankDetails: { type: String },
  notes: { type: String },
  balance: { type: Number, default: 0 }, // Outstanding balance tracking
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

// --- 5. BUYER MODEL ---
const buyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  shopName: { type: String },
  address: { type: String },
  govIdNumber: { type: String }, // Optional
  idType: { type: String, enum: ['Aadhaar', 'PAN', 'Voter ID'] },
  creditLimit: { type: Number, default: 100000 },
  notes: { type: String },
  outstanding: { type: Number, default: 0 }, // Purchase & Payment tracking
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Buyer = mongoose.model('Buyer', buyerSchema);

module.exports = { Supplier, Buyer };
