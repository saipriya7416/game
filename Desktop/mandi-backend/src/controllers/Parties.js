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
