const mongoose = require('mongoose');

// --- 6. INVENTORY INTAKE (LOTS) ---
const inventoryLotSchema = new mongoose.Schema({
  lotId: { type: String, required: true, unique: true }, // Auto-generated
  entryDate: { type: Date, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  product: { type: String, required: true },
  variety: { type: String }, // Grade / Variety
  quantity: { type: Number, required: true }, // KG / Ton / Box
  unit: { type: String, enum: ['KG', 'Ton', 'Box'], default: 'KG' },
  rate: { type: Number }, // Optional intake rate
  remaining: { type: Number }, // To track split-lot allocations
  photos: [{ type: String }], // File links for produce/bills
  isCompleted: { type: Boolean, default: false }, // Track fully sold lots
}, { timestamps: true });

const InventoryLot = mongoose.model('InventoryLot', inventoryLotSchema);

// --- 7. INVENTORY ALLOCATION (SALES Mapping) ---
const allocationSchema = new mongoose.Schema({
  lot: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryLot', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true }, // Sale rate
  date: { type: Date, default: Date.now },
  invoiced: { type: Boolean, default: false }, // If buyer invoice is generated
}, { timestamps: true });

// Pre-save logic to update remaining quantity in InventoryLot could be in controller
const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = { InventoryLot, Allocation };
