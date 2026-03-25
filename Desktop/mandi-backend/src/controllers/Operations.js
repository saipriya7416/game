const { InventoryLot, Allocation } = require('../models/Inventory');
const { Supplier, Buyer } = require('../models/Parties');
const { sendNotification } = require('../services/Communication');

// --- 6. INVENTORY INTAKE (LOT CREATION) ---
exports.createLot = async (req, res) => {
  try {
    const { 
      supplier: supplierId, 
      entryDate, 
      vehicleNumber, 
      driverName, 
      origin, 
      notes, 
      lineItems,
      billPhoto 
    } = req.body;
    
    const party = await Supplier.findById(supplierId);
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Supplier not found' });

    // 1. Generate Sequential Lot ID: LOT-YYYYMMDD-001
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today.setHours(0,0,0,0));
    const endOfDay = new Date(today.setHours(23,59,59,999));

    const lotCount = await InventoryLot.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequence = (lotCount + 1).toString().padStart(3, '0');
    const lotId = `LOT-${dateStr}-${sequence}`;
    
    // 2. Process Line Items
    const processedItems = lineItems.map(item => {
      const net = (Number(item.grossWeight) || 0) - (Number(item.deductions) || 0);
      return {
        ...item,
        netWeight: net,
        remainingQuantity: net,
        status: 'Pending Auction'
      };
    });

    const newLot = new InventoryLot({
      lotId,
      supplier: supplierId,
      entryDate: entryDate || new Date(),
      vehicleNumber,
      driverName,
      origin,
      notes,
      billPhoto,
      lineItems: processedItems,
      status: 'Pending Auction',
      createdBy: req.user?._id // If auth is available
    });

    await newLot.save();

    // --- NOTIFICATION ---
    const msg = `📥 INTAKE CONFIRMED: ${party.name}\nLot ID: ${lotId}\nItems: ${processedItems.length}\nVerified at Mandi Entry.`;
    sendNotification(party.phone, msg, newLot._id, 'Lot');

    res.status(201).json({ status: 'SUCCESS', data: newLot });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 7. INVENTORY ALLOCATION (LINE ITEM LEVEL) ---
exports.allocateLot = async (req, res) => {
  try {
    const { lotId, lineItemId, buyerId, quantity, rate, invoiceNumber } = req.body;
    
    const lot = await InventoryLot.findById(lotId);
    const party = await Buyer.findById(buyerId);
    if (!lot) return res.status(404).json({ status: 'ERROR', message: 'Lot Not Found' });
    if (!party) return res.status(404).json({ status: 'ERROR', message: 'Buyer Not Found' });

    // Find the specific line item
    const itemIndex = lot.lineItems.findIndex(item => item._id.toString() === lineItemId);
    if (itemIndex === -1) return res.status(404).json({ status: 'ERROR', message: 'Line Item Not Found' });
    
    const item = lot.lineItems[itemIndex];
    if (item.remainingQuantity < quantity) return res.status(400).json({ status: 'ERROR', message: 'Insufficient Stock' });

    // 1. Create Allocation record
    const allocation = new Allocation({
      lot: lotId,
      lineItemId: lineItemId,
      buyer: buyerId,
      quantity,
      rate,
      invoiceNumber,
      date: new Date(),
      createdBy: req.user?._id
    });

    // 2. Update Line Item Quantities & Status
    item.soldQuantity += Number(quantity);
    item.remainingQuantity -= Number(quantity);
    
    if (item.soldQuantity === 0) {
      item.status = 'Pending Auction';
    } else if (item.remainingQuantity > 0) {
      item.status = 'Partially Sold';
    } else {
      item.status = 'Fully Sold';
    }

    // 3. Update Overall Lot Status
    const allSold = lot.lineItems.every(i => i.status === 'Fully Sold' || i.status === 'Delivered');
    const someSold = lot.lineItems.some(i => i.soldQuantity > 0);
    
    if (allSold) {
      lot.status = 'Fully Sold';
    } else if (someSold) {
      lot.status = 'Partially Sold';
    }

    await allocation.save();
    await lot.save();

    // --- NOTIFICATION ---
    const msg = `📤 ALLOCATION SUCCESS: ${party.name}\nItem: ${item.product}\nQty: ${quantity} KG\nRate: ₹${rate}/KG\nLot: ${lot.lotId}`;
    sendNotification(party.phone, msg, allocation._id, 'Other');

    res.status(201).json({ 
      status: 'SUCCESS', 
      message: 'Inventory Allocated Successfully',
      allocation,
      itemStatus: item.status
    });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getAllLots = async (req, res) => {
  try {
    const lots = await InventoryLot.find()
      .populate('supplier')
      .sort({ createdAt: -1 });
    res.json({ status: 'SUCCESS', data: lots });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

exports.getInventoryDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));
    
    const lotsToday = await InventoryLot.find({ createdAt: { $gte: startOfDay } });
    const allLots = await InventoryLot.find();
    
    const stats = {
      totalLotsToday: lotsToday.length,
      incomingKgToday: lotsToday.reduce((acc, lot) => acc + lot.lineItems.reduce((s, i) => s + i.netWeight, 0), 0),
      totalSoldKg: allLots.reduce((acc, lot) => acc + lot.lineItems.reduce((s, i) => s + i.soldQuantity, 0), 0),
      remainingStockKg: allLots.reduce((acc, lot) => acc + lot.lineItems.reduce((s, i) => s + i.remainingQuantity, 0), 0),
      pendingDeliveryKg: allLots.reduce((acc, lot) => acc + lot.lineItems.reduce((s, i) => s + (i.soldQuantity - i.deliveredQuantity), 0), 0)
    };
    
    res.json({ status: 'SUCCESS', data: stats });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 18. ADVANCED TRACEABILITY ENGINE (FARMER BILL VIEW) ---
exports.getLotTraceability = async (req, res) => {
  try {
    const { lotId } = req.params;
    const allocations = await Allocation.find({ lot: lotId })
      .populate('buyer', 'name shopName phone')
      .sort({ date: -1 });
    
    res.json({ status: 'SUCCESS', data: allocations });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 19. ADVANCED TRACEABILITY ENGINE (BUYER INVOICE VIEW) ---
exports.getBuyerTraceability = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const allocation = await Allocation.findById(allocationId)
      .populate({
        path: 'lot',
        populate: { path: 'supplier', select: 'name phone address' }
      });
    
    if (!allocation) return res.status(404).json({ status: 'ERROR', message: 'Allocation not found' });
    
    res.json({ status: 'SUCCESS', data: allocation });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};

// --- 20. PRODUCT INTELLIGENCE SCREEN ---
exports.getProductIntelligence = async (req, res) => {
  try {
    const { query } = req.query; // product name or variety
    
    // Find lots that contain this product
    const lots = await InventoryLot.find({
      'lineItems.product': { $regex: query || '', $options: 'i' }
    }).populate('supplier', 'name');

    // Find allocations for these lots
    const lotIds = lots.map(l => l._id);
    const allocations = await Allocation.find({ lot: { $in: lotIds } })
      .populate('buyer', 'name')
      .populate('lot', 'lotId supplier entryDate');

    // Combine into a flat traceability report
    const report = allocations.map(a => ({
      farmerName: a.lot.supplier?.name,
      lotId: a.lot.lotId,
      buyerName: a.buyer?.name,
      quantity: a.quantity,
      rate: a.rate,
      date: a.date,
      arrivalDate: a.lot.entryDate
    }));

    res.json({ status: 'SUCCESS', data: report });
  } catch (err) {
    res.status(400).json({ status: 'ERROR', message: err.message });
  }
};
