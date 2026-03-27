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

// --- 13. SETTLEMENT INTELLIGENCE (GET PENDING ALLOCATIONS) ---
exports.getFarmerPendingSettlements = async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // 1. Find all lots belonging to this farmer
    const lots = await InventoryLot.find({ supplier: farmerId });
    const lotIds = lots.map(l => l._id);

    // 2. Find all allocations for these lots that are NOT YET settled
    const pendingAllocations = await Allocation.find({ 
      lot: { $in: lotIds }, 
      isSettledToFarmer: false 
    }).populate('lot buyer');

    // 3. Map to the frontend's expected format
    const mapping = pendingAllocations.map(a => ({
      _id: a._id,
      lotRef: a.lot,
      lineItem: a.lot.lineItems.id(a.lineItemId), 
      buyerName: a.buyer ? (a.buyer.shopName || a.buyer.name) : 'Walk-in',
      quantity: a.quantity,
      saleRate: a.rate,
      date: a.date
    }));

    res.json({ status: 'SUCCESS', data: mapping });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 14. GENERATE FINAL FARMER SETTLEMENT BILL ---
exports.generateFarmerSettlementBill = async (req, res) => {
  try {
    const { supplier: supplierId, items, expenses, advancePayment } = req.body;
    
    const party = await Supplier.findById(supplierId);
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Supplier record not found' });

    // 1. Calculate Gross and Net
    let grossSale = 0;
    const billItems = items.map(item => {
      const amt = (item.quantity || 0) * (item.rate || 0);
      grossSale += amt;
      return { ...item, amount: amt };
    });

    const { transport, marketing, labour, packing, misc } = expenses;
    const totalExpenses = (transport || 0) + (marketing || 0) + (labour || 0) + (packing || 0) + (misc || 0);
    const netSale = grossSale - totalExpenses;
    const balancePayable = netSale - (advancePayment || 0);

    // 2. Create the Bill
    const billId = `FB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBill = new SupplierBill({
      billNumber: billId,
      supplier: supplierId,
      items: billItems,
      expenses,
      grossSale,
      totalExpenses,
      netSale,
      advancePayment,
      balancePayable,
      status: 'Final'
    });

    await newBill.save();

    // 3. MARK ALL CONTRIBUTING ALLOCATIONS AS SETTLED
    // The items in payload come with lotId
    const allocationIds = items.map(i => i.lotId); // Mapping lotId to allocationId from the frontend payload
    await Allocation.updateMany(
      { _id: { $in: allocationIds } },
      { isSettledToFarmer: true, farmerBillRef: newBill._id }
    );

    // --- AUTOMATED NOTIFICATION ---
    const msg = `🧾 SETTLEMENT FINALIZED: ${party.name}\nBill No: ${billId}\nNet Pay: ₹${balancePayable}\nThank you.`;
    sendNotification(party.phone, msg, newBill._id, 'Bill');

    res.status(201).json({ status: 'SUCCESS', data: newBill });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 15. GET FARMER INTELLIGENCE & BILL HISTORY ---
exports.getFarmerSettlementHistory = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const bills = await SupplierBill.find({ supplier: farmerId }).sort({ date: -1 });
    
    // Simple intelligence: total business, avg weight, last visit
    const totalBusiness = bills.reduce((acc, b) => acc + b.netSale, 0);
    
    res.json({ 
      status: 'SUCCESS', 
      data: { 
        bills: bills.slice(0, 5), 
        intelligence: { 
          totalBusiness, 
          lastSettlement: bills[0]?.date || 'N/A'
        } 
      } 
    });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.voidFarmerSettlementBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const bill = await SupplierBill.findById(id);
    if (!bill) return res.status(404).json({ status: 'ERROR', message: 'Bill not found' });

    // Reverse the settlement on all linked allocations
    await Allocation.updateMany(
      { farmerBillRef: id },
      { isSettledToFarmer: false, farmerBillRef: null }
    );

    // Delete or mark bill as void (deleting for simplicity in this dev phase)
    await SupplierBill.findByIdAndDelete(id);

    res.json({ status: 'SUCCESS', message: 'Bill voided and entries reversed' });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getSupplierLedger = async (req, res) => {
  const { supplierId } = req.params;
  const bills = await SupplierBill.find({ supplier: supplierId }).sort({ date: -1 });
  const payments = await Payment.find({ party: supplierId, partyType: 'Supplier' }).sort({ date: -1 });
  const ledger = [...bills.map(b => ({ date: b.date, doc: b.billNumber, qty: b.items[0]?.quantity || 0, amt: b.netSale, adv: b.advancePayment, bal: b.balancePayable, type: 'BILL' })),
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
