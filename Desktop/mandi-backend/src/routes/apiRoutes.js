const express = require('express');
const router = express.Router();

// Controllers
const { addSupplier, getSuppliers, addBuyer, getBuyers, verifyParty } = require('../controllers/Parties');
const { createLot, allocateLot, getAllLots } = require('../controllers/Operations');
const { generateSupplierBill, generateBuyerInvoice, recordPayment, recordExpense, getSupplierLedger } = require('../controllers/Finance');
const { register, login, getMe, listUsers, deleteUser, logout } = require('../controllers/Auth');

// Middleware
const { protect, authorize } = require('../middleware/auth');

// =====================================================
// --- 3. AUTH ROUTES (Public) ---
// =====================================================
router.post('/auth/login', login);

// Registration is protected: only Admins can create new users (or do it via first-run seed)
// For initial setup, allow public registration ONLY if no admin exists yet
router.post('/auth/register', register);
router.post('/auth/logout', logout);

// Protected auth routes
router.get('/auth/me', protect, getMe);
router.get('/auth/users', protect, authorize('Admin'), listUsers);
router.delete('/auth/user/:id', protect, authorize('Admin'), deleteUser);

// =====================================================
// --- 4 & 5. PARTIES (Protected) ---
// =====================================================
// Admin and Operations Staff can add suppliers/buyers
// All roles can view
router.post('/supplier', protect, authorize('Admin', 'Operations Staff'), addSupplier);
router.get('/suppliers', protect, getSuppliers);
router.post('/buyer', protect, authorize('Admin', 'Operations Staff'), addBuyer);
router.get('/buyers', protect, getBuyers);

// =====================================================
// --- 6 & 7. OPERATIONS (Protected) ---
// =====================================================
// Admin and Operations Staff can create lots and allocate
router.post('/lot/intake', protect, authorize('Admin', 'Operations Staff'), createLot);
router.post('/lot/allocate', protect, authorize('Admin', 'Operations Staff'), allocateLot);
router.get('/lots', protect, getAllLots);

// =====================================================
// --- 8, 9, 10, 11, 12. FINANCIALS (Protected) ---
// =====================================================
// Admin and Accountant manage financial records
router.post('/bill/supplier', protect, authorize('Admin', 'Accountant'), generateSupplierBill);
router.post('/invoice/buyer', protect, authorize('Admin', 'Accountant'), generateBuyerInvoice);
router.post('/payment', protect, authorize('Admin', 'Accountant'), recordPayment);
router.post('/expense', protect, authorize('Admin', 'Accountant', 'Operations Staff'), recordExpense);
router.get('/ledger/supplier/:supplierId', protect, authorize('Admin', 'Accountant'), getSupplierLedger);

// =====================================================
// --- 13. COMPLIANCE (Protected) ---
// =====================================================
// Admin only can run KYC compliance
router.post('/compliance/verify', protect, authorize('Admin'), verifyParty);

module.exports = router;
