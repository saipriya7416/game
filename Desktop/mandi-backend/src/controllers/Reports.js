const { SupplierBill, BuyerInvoice, Payment, Expense } = require('../models/Finance');
const { Supplier, Buyer } = require('../models/Parties');
const { InventoryLot } = require('../models/Inventory');
const { generatePDF, generateExcel } = require('../services/ReportService');

/**
 * GET /api/report/pdf/bill/:id
 * Generate Supplier Bill PDF
 */
exports.getBillPDF = async (req, res) => {
  try {
    const bill = await SupplierBill.findById(req.params.id).populate('supplier');
    if (!bill) return res.status(404).json({ status: 'ERROR', message: 'Bill record missing' });

    generatePDF(res, "SUPPLIER MARKET BILL", bill);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

/**
 * GET /api/report/pdf/invoice/:id
 * Generate Buyer Invoice PDF
 */
exports.getInvoicePDF = async (req, res) => {
  try {
    const invoice = await BuyerInvoice.findById(req.params.id).populate('buyer');
    if (!invoice) return res.status(404).json({ status: 'ERROR', message: 'Invoice record missing' });

    generatePDF(res, "BUYER DISPATCH INVOICE", invoice);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

/**
 * GET /api/report/excel/suppliers
 * Export Suppliers Database to Excel
 */
exports.exportSuppliersExcel = async (req, res) => {
  try {
    const data = await Supplier.find().sort({ name: 1 });
    const cols = [
      { header: 'FULL NAME', key: 'name', width: 25 },
      { header: 'PHONE', key: 'phone', width: 20 },
      { header: 'VILLAGE', key: 'address', width: 30 },
      { header: 'ID TYPE', key: 'idType', width: 15 },
      { header: 'ID NUMBER', key: 'govIdNumber', width: 20 },
      { header: 'BANK DETAILS', key: 'bankDetails', width: 30 },
      { header: 'BALANCE (₹)', key: 'balance', width: 15 }
    ];

    await generateExcel(res, "Suppliers_Record", cols, data);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

/**
 * GET /api/report/excel/buyers
 * Export Buyers Database to Excel
 */
exports.exportBuyersExcel = async (req, res) => {
  try {
    const data = await Buyer.find().sort({ name: 1 });
    const cols = [
      { header: 'NAME', key: 'name', width: 25 },
      { header: 'SHOP NAME', key: 'shopName', width: 30 },
      { header: 'CONTACT', key: 'phone', width: 20 },
      { header: 'CREDIT LIMIT', key: 'creditLimit', width: 15 },
      { header: 'OUTSTANDING (₹)', key: 'outstanding', width: 20 }
    ];

    await generateExcel(res, "Buyers_Record", cols, data);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

/**
 * GET /api/report/excel/inventory
 * Export Live Inventory Stock to Excel
 */
exports.exportInventoryExcel = async (req, res) => {
  try {
    const data = await InventoryLot.find().populate('supplier').sort({ createdAt: -1 });
    const formattedData = data.map(lot => ({
      lotId: lot.lotId,
      product: lot.product,
      variety: lot.variety,
      originalQty: `${lot.quantity} ${lot.unit}`,
      remaining: `${lot.remaining} ${lot.unit}`,
      rate: lot.rate,
      source: lot.supplier?.name || 'N/A',
      status: lot.isCompleted ? 'SOLD' : 'INSTOCK'
    }));

    const cols = [
      { header: 'LOT ID', key: 'lotId', width: 20 },
      { header: 'PRODUCT', key: 'product', width: 15 },
      { header: 'VARIETY', key: 'variety', width: 15 },
      { header: 'ORIGINAL QTY', key: 'originalQty', width: 15 },
      { header: 'CURRENT STOCK', key: 'remaining', width: 15 },
      { header: 'BASE RATE (₹)', key: 'rate', width: 15 },
      { header: 'SUPPLIER', key: 'source', width: 25 },
      { header: 'STATUS', key: 'status', width: 15 }
    ];

    await generateExcel(res, "Inventory_Audit_Report", cols, formattedData);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};
