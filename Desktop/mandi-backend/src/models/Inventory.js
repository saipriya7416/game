const mongoose = require('mongoose');

// --- 6.1 LOT LINE ITEM SCHEMA ---
const lotLineItemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  variety: { type: String, required: true },
  grade: { type: String, required: true },
  grossWeight: { type: Number, required: true },
  deductions: { type: Number, default: 0 },
  netWeight: { type: Number, required: true }, // Auto-calculated in frontend/controller
  boxes: { type: Number, default: 0 },
  estimatedRate: { type: Number },
  status: { 
    type: String, 
    enum: ['Pending Auction', 'Partially Sold', 'Fully Sold', 'Delivered'], 
    default: 'Pending Auction' 
  },
  soldQuantity: { type: Number, default: 0 },
  remainingQuantity: { type: Number, required: true },
  deliveredQuantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 }
}, { timestamps: true });

// --- 6.2 INVENTORY INTAKE (LOTS) ---
const inventoryLotSchema = new mongoose.Schema({
  lotId: { type: String, required: true, unique: true }, // Auto-generated: LOT-YYYYMMDD-001
  entryDate: { type: Date, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  vehicleNumber: { type: String },
  driverName: { type: String },
  origin: { type: String }, // Village / Farm
  billPhoto: { type: String }, // Legacy field
  attached_bill_photo: { type: String }, // NEW field
  notes: { type: String },
  lineItems: [lotLineItemSchema],
  status: { 
    type: String, 
    enum: ['Pending Auction', 'Partially Sold', 'Fully Sold', 'Delivered'], 
    default: 'Pending Auction' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const InventoryLot = mongoose.model('InventoryLot', inventoryLotSchema);

// --- 7. INVENTORY ALLOCATION (SALES Mapping) ---
const allocationSchema = new mongoose.Schema({
  lot: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryLot', required: true },
  lineItemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Links to item in lot.lineItems
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true }, // Sale rate
  date: { type: Date, default: Date.now },
  invoiced: { type: Boolean, default: false },
  invoiceNumber: { type: String },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  isSettledToFarmer: { type: Boolean, default: false }, // Tracks if final bill was given to farmer
  farmerBillRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierBill' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = { InventoryLot, Allocation };
