const { InventoryLot, Allocation } = require('../models/Inventory');
const { Supplier, Buyer } = require('../models/Parties');
const { sendNotification } = require('../services/Communication');

// --- 6. INVENTORY INTAKE (LOT CREATION) ---
exports.createLot = async (req, res) => {
  try {
    const { supplier: supplierId, product, variety, quantity, unit, rate } = req.body;
    
    const party = await Supplier.findById(supplierId);
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Supplier not found' });

    // Auto-generate Lot ID: LOT-YYYYMMDD-XXXX
    const lotId = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newLot = new InventoryLot({
      lotId,
      supplier: supplierId,
      product,
      variety,
      quantity,
      unit,
      rate,
      remaining: quantity // Initially full
    });

    await newLot.save();

    // --- NOTIFICATION ---
    const msg = `📥 INTAKE CONFIRMED: ${party.name}\nLot ID: ${lotId}\nItem: ${product} (${variety})\nQty: ${quantity} ${unit}\nVerified at Mandi Entry.`;
    sendNotification(party.phone, msg, newLot._id, 'Other');

    res.status(201).json({ status: 'SUCCESS', data: newLot });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 7. INVENTORY ALLOCATION (SPLIT LOT LOGIC) ---
exports.allocateLot = async (req, res) => {
  try {
    const { lotId, buyerId, quantity, rate } = req.body;
    
    const lot = await InventoryLot.findById(lotId);
    const party = await Buyer.findById(buyerId);
    if (!lot) return res.status(404).json({ status: 'ERROR', message: 'Lot Not Found' });
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Buyer Not Found' });
    if (lot.remaining < quantity) return res.status(400).json({ status: 'ERROR', message: 'Insufficient Stock' });

    // 1. Create Allocation record
    const allocation = new Allocation({
      lot: lotId,
      buyer: buyerId,
      quantity,
      rate,
      date: new Date()
    });

    // 2. Update Lot remaining quantity
    lot.remaining -= quantity;
    if (lot.remaining === 0) lot.isCompleted = true;
    
    await allocation.save();
    await lot.save();

    // --- NOTIFICATION ---
    const msg = `📤 DELIVERY OUTFAST: ${party.shopName || party.name}\nItem: ${lot.product}\nQty: ${quantity} ${lot.unit}\nRate: ₹${rate}/unit\nTotal: ₹${quantity * rate}\nThank you for your purchase!`;
    sendNotification(party.phone, msg, allocation._id, 'Other');

    res.status(201).json({ 
      status: 'SUCCESS', 
      message: 'Lot Allocated Successfully',
      allocation,
      lotRemaining: lot.remaining
    });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getAllLots = async (req, res) => {
  const lots = await InventoryLot.find().populate('supplier').sort({ createdAt: -1 });
  res.json({ status: 'SUCCESS', data: lots });
};
