const mongoose = require('mongoose');

// --- 8. SUPPLIER BILL GENERATION ---
const supplierBillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [{
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryLot' },
    productName: { type: String },
    quantity: { type: Number },
    rate: { type: Number },
    amount: { type: Number } // Qty * Rate
  }],
  expenses: {
    transport: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    labour: { type: Number, default: 0 },
    packing: { type: Number, default: 0 },
    misc: { type: Number, default: 0 }
  },
  grossSale: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  netSale: { type: Number, required: true }, // Gross - TotalExp
  advancePayment: { type: Number, default: 0 },
  balancePayable: { type: Number, required: true }, // Initial Net - Advance
  amountPaid: { type: Number, default: 0 }, // Total actually paid till now
  balanceRemaining: { type: Number, default: 0 }, // balancePayable - amountPaid
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank', 'None'], default: 'None' },
  status: { type: String, enum: ['Draft', 'Final', 'Paid', 'Partial'], default: 'Draft' }, // Track settlement status
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const SupplierBill = mongoose.model('SupplierBill', supplierBillSchema);

// --- 9. BUYER INVOICE GENERATION ---
const buyerInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  items: [{
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Allocation' },
    productName: { type: String },
    quantity: { type: Number },
    rate: { type: Number },
    amount: { type: Number }
  }],
  additionalCharges: {
    commission: { type: Number, default: 0 }, // Often percentage or fixed
    transport: { type: Number, default: 0 },
    handling: { type: Number, default: 0 }
  },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Unpaid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const BuyerInvoice = mongoose.model('BuyerInvoice', buyerInvoiceSchema);

// --- 11. PAYMENT MANAGEMENT & 12. EXPENSE MANAGEMENT ---
const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  partyType: { type: String, enum: ['Supplier', 'Buyer'], required: true },
  party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyType' }, // Dynamic ref
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['Cash', 'UPI', 'Bank'], required: true },
  type: { type: String, enum: ['Partial', 'Advance', 'Full Settlement'], required: true },
  referenceId: { type: String }, // Transaction ID link
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

const expenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  category: { type: String, enum: ['Labour', 'Transport', 'Marketing', 'Packing', 'Miscellaneous'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  relatedTrx: { type: String }, // For linking to specific Lot or Bill
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { SupplierBill, BuyerInvoice, Payment, Expense };
