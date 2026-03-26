const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { Supplier, Buyer } = require('./src/models/Parties');
const { InventoryLot, Allocation } = require('./src/models/Inventory');
const { SupplierBill, BuyerInvoice, Payment, Expense } = require('./src/models/Finance');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mandi-erp')
  .then(() => console.log('MongoDB connected.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedData() {
  try {
    console.log('Clearing existing data...');
    // We only clear the data we're seeding so we don't drop Users.
    await Supplier.deleteMany({});
    await Buyer.deleteMany({});
    await InventoryLot.deleteMany({});
    await Allocation.deleteMany({});
    await SupplierBill.deleteMany({});
    await BuyerInvoice.deleteMany({});
    await Payment.deleteMany({});
    await Expense.deleteMany({});

    console.log('Inserting Farmers...');
    const farmers = await Supplier.insertMany([
      { name: 'Ramesh Reddy', phone: '9000000001', address: 'Village A', govIdNumber: 'AADHAAR-1234', idType: 'Aadhaar' },
      { name: 'Suresh Kumar', phone: '9000000002', address: 'Village B', govIdNumber: 'AADHAAR-5678', idType: 'Aadhaar' }
    ]);

    console.log('Inserting Buyers...');
    const buyers = await Buyer.insertMany([
      { name: 'Mega Mart', shopName: 'Mega Mart Grocery', phone: '8000000001', address: 'City Center', creditLimit: 500000 },
      { name: 'Fresh Fruits Traders', shopName: 'Fresh Fruits', phone: '8000000002', address: 'Main Market', creditLimit: 200000 }
    ]);

    console.log('Inserting Lots (Procurement)...');
    const lots = await InventoryLot.insertMany([
      {
        lotId: 'LOT-20261010-001',
        supplier: farmers[0]._id,
        entryDate: new Date(),
        origin: 'Village A',
        status: 'Partially Sold',
        lineItems: [
          { product: 'Mango', variety: 'Alphonso', grade: 'A', grossWeight: 1000, netWeight: 1000, remainingQuantity: 500, soldQuantity: 500, status: 'Partially Sold' },
          { product: 'Mango', variety: 'Kesar', grade: 'B', grossWeight: 500, netWeight: 500, remainingQuantity: 500, soldQuantity: 0, status: 'Pending Auction' }
        ]
      },
      {
        lotId: 'LOT-20261010-002',
        supplier: farmers[1]._id,
        entryDate: new Date(),
        origin: 'Village B',
        status: 'Pending Auction',
        lineItems: [
          { product: 'Banana', variety: 'Yelakki', grade: 'A', grossWeight: 2000, netWeight: 2000, remainingQuantity: 2000, soldQuantity: 0, status: 'Pending Auction' }
        ]
      }
    ]);

    console.log('Inserting Allocations (Sales mapping)...');
    const allocs = await Allocation.insertMany([
      {
        lot: lots[0]._id,
        lineItemId: lots[0].lineItems[0]._id,
        buyer: buyers[0]._id,
        quantity: 500,
        rate: 80, // Price per kg
        invoiced: true,
        invoiceNumber: 'INV-2026-001'
      }
    ]);

    console.log('Inserting Buyer Invoice (Sales)...');
    const invoices = await BuyerInvoice.insertMany([
      {
        invoiceNumber: 'INV-2026-001',
        buyer: buyers[0]._id,
        items: [{
          allocation: allocs[0]._id,
          productName: 'Mango Alphonso',
          quantity: 500,
          rate: 80,
          amount: 40000
        }],
        totalAmount: 40000,
        paymentStatus: 'Unpaid'
      }
    ]);

    console.log('Inserting Supplier Bill (Settlements)...');
    await SupplierBill.insertMany([
      {
        billNumber: 'BILL-2026-001',
        supplier: farmers[0]._id,
        items: [{
          lot: lots[0]._id,
          productName: 'Mango Alphonso',
          quantity: 500,
          rate: 80,
          amount: 40000
        }],
        grossSale: 40000,
        totalExpenses: 2000,
        netSale: 38000,
        balancePayable: 38000,
        status: 'Draft' // Pending
      }
    ]);

    console.log('Inserting Expenses...');
    await Expense.insertMany([
      { category: 'Transport', amount: 1500, description: 'Truck delivery' },
      { category: 'Labour', amount: 500, description: 'Loading/Unloading' }
    ]);

    console.log('Sample Data Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
