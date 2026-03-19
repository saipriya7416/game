const { InventoryLot, Allocation } = require('../models/Inventory');

// --- 6. INVENTORY INTAKE (LOT CREATION) ---
exports.createLot = async (req, res) => {
  try {
    const { supplier, product, variety, quantity, unit, rate } = req.body;
    
    // Auto-generate Lot ID: LOT-YYYYMMDD-XXXX
    const lotId = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newLot = new InventoryLot({
      lotId,
      supplier,
      product,
      variety,
      quantity,
      unit,
      rate,
      remaining: quantity // Initially full
    });

    await newLot.save();
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
    if (!lot) return res.status(404).json({ status: 'ERROR', message: 'Lot Not Found' });
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
