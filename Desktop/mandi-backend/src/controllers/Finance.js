const { SupplierBill, BuyerInvoice, Payment, Expense } = require('../models/Finance');
const { InventoryLot, Allocation } = require('../models/Inventory');
const { Supplier, Buyer } = require('../models/Parties');
const { sendNotification } = require('../services/Communication');

// --- 8. SUPPLIER BILL GENERATION (COMPLEX CALCULATIONS) ---
exports.generateSupplierBill = async (req, res) => {
  try {
    const { supplier: supplierId, items, expenses, advancePayment } = req.body;
    
    // Fetch supplier for contact info
    const party = await Supplier.findById(supplierId);
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Supplier record not found' });

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
      supplier: supplierId,
      items: billItems,
      expenses,
      grossSale,
      totalExpenses,
      netSale,
      advancePayment,
      balancePayable
    });

    await newBill.save();

    // --- AUTOMATED NOTIFICATION ---
    const msg = `📦 MANDI BILL: ${party.name}\nID: ${billId}\nNet Sale: ₹${netSale}\nAdv: ₹${advancePayment || 0}\nPayable: ₹${balancePayable}\nThank you for choosing our Mandi!`;
    sendNotification(party.phone, msg, newBill._id, 'Bill');

    res.status(201).json({ status: 'SUCCESS', data: newBill });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 9. BUYER INVOICE GENERATION ---
exports.generateBuyerInvoice = async (req, res) => {
  try {
    const { buyer: buyerId, items, additionalCharges } = req.body;
    
    const party = await Buyer.findById(buyerId);
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Buyer record not found' });

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
      buyer: buyerId,
      items: invoiceItems,
      additionalCharges,
      totalAmount
    });

    await newInvoice.save();

    // --- AUTOMATED NOTIFICATION ---
    const msg = `📑 INVOICE ISSUED: ${party.shopName || party.name}\nINV: ${invId}\nTotal: ₹${totalAmount}\nPlease settle your outstanding balance.\n- Mandi Logistics`;
    sendNotification(party.phone, msg, newInvoice._id, 'Invoice');

    res.status(201).json({ status: 'SUCCESS', data: newInvoice });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 11. RECORD PAYMENTS ---
exports.recordPayment = async (req, res) => {
  try {
    const { partyId, partyType, amount, mode, type, referenceId, againstBillNo, againstInvoiceNo } = req.body;
    
    const party = partyType === 'Supplier' 
      ? await Supplier.findById(partyId) 
      : await Buyer.findById(partyId);

    const payment = new Payment({ party: partyId, partyType, amount, mode, type, referenceId });
    await payment.save();

    // Link payment to the specific document if provided
    if (partyType === 'Supplier' && againstBillNo) {
      await SupplierBill.findOneAndUpdate(
        { billNumber: againstBillNo },
        { status: 'Paid', amountPaid: amount, balanceRemaining: 0 }
      );
    } else if (partyType === 'Buyer' && againstInvoiceNo) {
      await BuyerInvoice.findOneAndUpdate(
        { invoiceNumber: againstInvoiceNo },
        { paymentStatus: 'Paid' }
      );
    }

    // --- AUTOMATED NOTIFICATION ---
    if (party) {
      const msg = `💰 PAYMENT CONFIRMED\nAmt: ₹${amount}\nMode: ${mode}\nRef: ${referenceId || 'N/A'}\nYour ledger has been updated.\nThank you.`;
      sendNotification(party.phone, msg, payment._id, 'Payment');
    }

    res.status(201).json({ status: 'SUCCESS', data: payment });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// (Remaining ledger and expense functions stay the same)
exports.getSupplierLedger = async (req, res) => {
  const { supplierId } = req.params;
  const bills = await SupplierBill.find({ supplier: supplierId }).sort({ date: -1 });
  const payments = await Payment.find({ party: supplierId, partyType: 'Supplier' }).sort({ date: -1 });
  const ledger = [...bills.map(b => ({ date: b.date, doc: b.billNumber, qty: b.items[0].quantity, amt: b.netSale, adv: b.advancePayment, bal: b.balancePayable, type: 'BILL' })),
                  ...payments.map(p => ({ date: p.date, doc: p.referenceId, amt: p.amount, type: 'PAYMENT' }))];
  res.json({ status: 'SUCCESS', data: ledger });
};

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
