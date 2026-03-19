const express = require('express');
const router = express.Router();
const { addSupplier, getSuppliers, addBuyer, getBuyers, verifyParty } = require('../controllers/Parties');
const { createLot, allocateLot, getAllLots } = require('../controllers/Operations');
const { generateSupplierBill, generateBuyerInvoice, recordPayment, recordExpense, getSupplierLedger } = require('../controllers/Finance');

// --- 4 & 5. PARTIES ---
router.post('/supplier', addSupplier);
router.get('/suppliers', getSuppliers);
router.post('/buyer', addBuyer);
router.get('/buyers', getBuyers);

// --- 6 & 7. OPERATIONS ---
router.post('/lot/intake', createLot);
router.post('/lot/allocate', allocateLot);
router.get('/lots', getAllLots);

// --- 8, 9, 10, 11, 12. FINANCIALS ---
router.post('/bill/supplier', generateSupplierBill);
router.post('/invoice/buyer', generateBuyerInvoice);
router.post('/payment', recordPayment);
router.post('/expense', recordExpense);
router.get('/ledger/supplier/:supplierId', getSupplierLedger);

// --- 13. COMPLIANCE ---
router.post('/compliance/verify', verifyParty);

module.exports = router;
