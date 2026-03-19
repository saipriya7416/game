const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * PDF GENERATION ENGINE
 * Creates professional Mandi Bills/Invoices
 */
exports.generatePDF = (res, title, data) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream PDF directly to the response
  doc.pipe(res);

  // --- 1. HEADER & BRANDING ---
  doc.fillColor("#0f172a").fontSize(26).text("MANDI MANAGEMENT ERP", { align: 'center', underline: true });
  doc.fillColor("#64748b").fontSize(10).text("PREMIUM LOGISTICS TERMINAL v4.1.0", { align: 'center' });
  doc.moveDown(2);

  // Bill Header info
  doc.fillColor("#000").fontSize(18).text(title, { underline: true });
  doc.fontSize(10).moveDown();
  
  if (data.billNumber || data.invoiceNumber) {
    doc.text(`DOC ID: ${data.billNumber || data.invoiceNumber}`);
    doc.text(`DATE: ${new Date(data.createdAt).toLocaleDateString()}`);
  }
  doc.moveDown(2);

  // --- 2. PARTY INFO ---
  doc.fontSize(12).text("PARTY DETAILS:", { bold: true });
  if (data.supplier) {
    doc.fontSize(10).text(`Name: ${data.supplier.name}`);
    doc.text(`Phone: ${data.supplier.phone}`);
    doc.text(`Village: ${data.supplier.address || 'N/A'}`);
  } else if (data.buyer) {
    doc.fontSize(10).text(`Buyer: ${data.buyer.name}`);
    doc.text(`Shop: ${data.buyer.shopName || 'N/A'}`);
    doc.text(`Contact: ${data.buyer.phone}`);
  }
  doc.moveDown(2);

  // --- 3. ITEMS TABLE ---
  doc.fontSize(12).fillColor("#1e293b").text("PARTICULARS", { underline: true });
  doc.moveDown();
  
  const drawRow = (col1, col2, col3, col4) => {
    const y = doc.y;
    doc.text(col1, 50, y, { width: 150 });
    doc.text(col2, 200, y, { width: 80, align: 'right' });
    doc.text(col3, 280, y, { width: 80, align: 'right' });
    doc.text(col4, 360, y, { width: 100, align: 'right' });
    doc.moveDown();
  };

  doc.fontSize(10).fillColor("#000");
  drawRow("Product/Variety", "Qty", "Rate", "Amount");
  doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
  doc.moveDown();

  if (data.items) {
    data.items.forEach(item => {
      drawRow(
        `${item.productName || item.product || 'Produce'} (${item.variety || 'N/A'})`,
        `${item.quantity}`,
        `₹${item.rate}`,
        `₹${(item.quantity * item.rate).toLocaleString()}`
      );
    });
  }

  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();

  // --- 4. SUMMARY & TOTALS ---
  const startY = doc.y + 10;
  doc.fontSize(11).text(`GROSS TOTAL: ₹${(data.grossSale || data.totalAmount).toLocaleString()}`, 350, startY, { align: 'right' });
  
  if (data.expenses) {
    doc.fillColor("#ef4444");
    doc.text(`(-) TOTAL EXPENSES: ₹${data.totalExpenses.toLocaleString()}`, { align: 'right' });
    if (data.advancePayment) {
      doc.text(`(-) ADVANCE PAID: ₹${data.advancePayment.toLocaleString()}`, { align: 'right' });
    }
  }

  doc.moveDown();
  doc.fontSize(14).fillColor("#16a34a").text(`NET PAYABLE: ₹${(data.balancePayable || data.totalAmount).toLocaleString()}`, { align: 'right', bold: true });

  // --- 5. FOOTER & SIGNATURE ---
  doc.moveDown(4);
  doc.fillColor("#64748b").fontSize(10);
  doc.text("(Manager Signature)", 50, doc.y, { width: 150, align: 'center' });
  doc.text("(Party Signature)", 350, doc.y - 12, { width: 150, align: 'center' });
  
  doc.moveDown(2);
  doc.fontSize(8).text("This is a computer-generated document secured by Mandi Management ERP.", { align: 'center' });

  doc.end();
};

/**
 * EXCEL EXPORT ENGINE
 * Creates structured datasets for Mandi audit
 */
exports.generateExcel = async (res, sheetName, columns, data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Set Columns & Styles
  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
    style: { font: { name: 'Arial', size: 10 } }
  }));

  // Force Header Style
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Add Data
  sheet.addRows(data);

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length }
  };

  // Border & Finish
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${sheetName}_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
};
