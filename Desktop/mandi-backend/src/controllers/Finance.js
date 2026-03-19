const { SupplierBill, BuyerInvoice, Payment, Expense } = require('../models/Finance');
const { InventoryLot, Allocation } = require('../models/Inventory');

// --- 8. SUPPLIER BILL GENERATION (COMPLEX CALCULATIONS) ---
exports.generateSupplierBill = async (req, res) => {
  try {
    const { supplier, items, expenses, advancePayment } = req.body;
    
    // items: [{ lotId, productName, quantity, rate }]
    let grossSale = 0;
    const billItems = items.map(item => {
      const amt = item.quantity * item.rate;
      grossSale += amt;
      return { ...item, amount: amt };
    });

    const { transport, marketing, labour, packing, misc } = expenses;
    const totalExpenses = (transport || 0) + (marketing || 0) + (labour || 0) + (packing || 0) + (misc || 0);
    const netSale = grossSale - totalExpenses;
    const balancePayable = netSale - (advancePayment || 0);

    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    
    const newBill = new SupplierBill({
      billNumber: billId,
      supplier,
      items: billItems,
      expenses,
      grossSale,
      totalExpenses,
      netSale,
      advancePayment,
      balancePayable
    });

    await newBill.save();
    res.status(201).json({ status: 'SUCCESS', data: newBill });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 9. BUYER INVOICE GENERATION ---
exports.generateBuyerInvoice = async (req, res) => {
  try {
    const { buyer, items, additionalCharges } = req.body;
    
    // items: [{ allocationId, productName, quantity, rate }]
    let totalAmount = 0;
    const invoiceItems = items.map(item => {
      const amt = item.quantity * item.rate;
      totalAmount += amt;
      return { ...item, amount: amt };
    });

    const { commission, transport, handling } = additionalCharges;
    totalAmount += (commission || 0) + (transport || 0) + (handling || 0);

    const invId = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = new BuyerInvoice({
      invoiceNumber: invId,
      buyer,
      items: invoiceItems,
      additionalCharges,
      totalAmount
    });

    await newInvoice.save();
    res.status(201).json({ status: 'SUCCESS', data: newInvoice });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 10. LEDGER CONSOLIDATION (REPORTS / OVERVIEW) ---
exports.getSupplierLedger = async (req, res) => {
  const { supplierId } = req.params;
  const bills = await SupplierBill.find({ supplier: supplierId }).sort({ date: -1 });
  const payments = await Payment.find({ party: supplierId, partyType: 'Supplier' }).sort({ date: -1 });
  
  // Consolidate entries
  const ledger = [...bills.map(b => ({ date: b.date, doc: b.billNumber, qty: b.items[0].quantity, amt: b.netSale, adv: b.advancePayment, bal: b.balancePayable, type: 'BILL' })),
                  ...payments.map(p => ({ date: p.date, doc: p.referenceId, amt: p.amount, type: 'PAYMENT' }))];
                  
  res.json({ status: 'SUCCESS', data: ledger });
};

// --- 11. RECORD PAYMENTS ---
exports.recordPayment = async (req, res) => {
  try {
    const { partyId, partyType, amount, mode, type, referenceId } = req.body;
    const payment = new Payment({ party: partyId, partyType, amount, mode, type, referenceId });
    await payment.save();
    res.status(201).json({ status: 'SUCCESS', data: payment });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 12. EXPENSE LOGGING ---
exports.recordExpense = async (req, res) => {
  try {
    const { category, amount, description, relatedTrx } = req.body;
    const expense = new Expense({ category, amount, description, relatedTrx });
    await expense.save();
    res.status(201).json({ status: 'SUCCESS', data: expense });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};
