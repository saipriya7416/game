const { Supplier, Buyer } = require('../models/Parties');
const { Verification } = require('../models/Core');

// --- 4. SUPPLIER MANAGEMENT ---
exports.addSupplier = async (req, res) => {
  try {
    const { name, phone, address, govIdNumber, idType, bankDetails, notes } = req.body;
    const supplier = new Supplier({ name, phone, address, govIdNumber, idType, bankDetails, notes });
    await supplier.save();
    res.status(201).json({ status: 'SUCCESS', data: supplier });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  res.json({ status: 'SUCCESS', data: suppliers });
};

// --- 5. BUYER MANAGEMENT ---
exports.addBuyer = async (req, res) => {
  try {
    const { name, phone, shopName, address, govIdNumber, idType, creditLimit, notes } = req.body;
    const buyer = new Buyer({ name, phone, shopName, address, govIdNumber, idType, creditLimit, notes });
    await buyer.save();
    res.status(201).json({ status: 'SUCCESS', data: buyer });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getBuyers = async (req, res) => {
  const buyers = await Buyer.find().sort({ shopName: 1 });
  res.json({ status: 'SUCCESS', data: buyers });
};

// --- 13. VERIFICATION & KYC ---
exports.verifyParty = async (req, res) => {
  try {
    const { partyId, partyType, aadhaarNumber, panNumber, voterId, kycDocLink } = req.body;
    const verification = new Verification({ party: partyId, partyType, aadhaarNumber, panNumber, voterId, kycDocLink, status: 'Verified' });
    await verification.save();
    res.status(201).json({ status: 'SUCCESS', data: verification });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- BUYER INTELLIGENCE & HISTORY ---
exports.getBuyerIntelligence = async (req, res) => {
  try {
    const { id } = req.params;
    const { InventoryLot, Allocation } = require('../models/Inventory');
    const { BuyerInvoice, Payment } = require('../models/Finance');
    const mongoose = require('mongoose');

    // 1. Fetch all allocations for this buyer
    const allocations = await Allocation.find({ buyer: id })
      .populate({
        path: 'lot',
        populate: { path: 'supplier', select: 'name' }
      })
      .sort({ date: -1 });

    // 2. Fetch all invoices for total balance calculation
    const invoices = await BuyerInvoice.find({ buyer: id });
    const payments = await Payment.find({ party: id, partyType: 'Buyer' });

    // 3. Aggregate Metrics
    const totalInvoices = invoices.length;
    const totalPurchasedKg = allocations.reduce((acc, a) => acc + Number(a.quantity), 0);
    const totalBillAmount = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const outstandingBalance = totalBillAmount - totalPaid;

    // 4. Product Patterns
    const productFrequency = {};
    const varietyFrequency = {};
    let highestRate = 0;
    let lowestRate = Infinity;
    
    allocations.forEach(a => {
        const lot = a.lot;
        if (lot) {
            const item = lot.lineItems.find(li => li._id.toString() === a.lineItemId.toString());
            if (item) {
                productFrequency[item.product] = (productFrequency[item.product] || 0) + 1;
                varietyFrequency[item.variety] = (varietyFrequency[item.variety] || 0) + 1;
            }
        }
        if (a.rate > highestRate) highestRate = a.rate;
        if (a.rate < lowestRate) lowestRate = (a.rate < lowestRate ? a.rate : lowestRate);
    });

    const mostPurchasedProduct = Object.entries(productFrequency).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const preferredVariety = Object.entries(varietyFrequency).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // 5. Timing & Farmer Relationship
    const historicalFarmerRelationship = allocations.map(a => {
        const item = a.lot?.lineItems.find(li => li._id.toString() === a.lineItemId.toString());
        return {
            farmerName: a.lot?.supplier?.name || 'N/A',
            lotId: a.lot?.lotId || 'N/A',
            product: item?.product || 'N/A',
            variety: item?.variety || 'N/A',
            grade: item?.grade || 'N/A',
            quantity: a.quantity,
            rate: a.rate,
            invoiceNumber: a.invoiceNumber,
            date: a.date,
            day: new Date(a.date).toLocaleDateString('en-US', { weekday: 'long' }),
            time: new Date(a.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    });

    // 6. Risk Indicator
    let riskLevel = 'Green';
    if (outstandingBalance > 50000) riskLevel = 'Red';
    else if (outstandingBalance > 10000) riskLevel = 'Orange';

    const lastVisit = allocations[0] ? {
        date: allocations[0].date,
        day: new Date(allocations[0].date).toLocaleDateString('en-US', { weekday: 'long' }),
        time: new Date(allocations[0].date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } : null;

    res.json({
        status: 'SUCCESS',
        data: {
            summary: {
                totalInvoices,
                totalPurchasedKg,
                totalPaid,
                outstandingBalance,
                riskLevel,
                avgRate: (totalBillAmount / (totalPurchasedKg || 1)).toFixed(2),
                mostPurchasedProduct,
                preferredVariety,
                lastVisit
            },
            farmerRelationship: historicalFarmerRelationship,
            paymentHistory: {
                totalBillAmount,
                totalPaid,
                outstandingBalance,
                lastPaymentDate: (payments.length > 0 ? payments[0].date : 'N/A')
            }
        }
    });

  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};
