require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mandi-erp';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Mandi ERP Service: Database Synchronized'))
  .catch(err => console.error('❌ Database Sync Failure:', err));

// --- API ARCHITECTURE (REST) ---
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// Base route for API status
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED';
  res.send(`
    <div style="font-family: sans-serif; padding: 50px; text-align: center; background: #f8fafc;">
      <h1 style="color: #0f172a;">🚀 Mandi Management System: API Online</h1>
      <p style="color: #64748b;">Premium Backend Engine v4.1.0</p>
      <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <p>Available Endpoint: <a href="/api/health">/api/health</a></p>
        <p style="color: ${mongoose.connection.readyState === 1 ? '#16a34a' : '#ef4444'}; font-weight: 900;">
          DATABASE STATUS: ${dbStatus}
        </p>
        <p style="color: #64748b; font-size: 14px;">If connected, you can view data in <b>MongoDB Compass</b> using your local URI: mongodb://127.0.0.1:27017</p>
      </div>
    </div>
  `);
});

app.get('/api/health', (req, res) => res.json({ status: 'ELITE COMMAND ONLINE', version: 'v4.1.0' }));

// Placeholder for full routes (mapped to requirements)
// 3. User & Auth
// 4. Suppliers
// 5. Buyers
// 6. Inventory Lots (Intake)
// 7. Allocation Mapping
// 8. Financial (Bills/Invoices/Payments/Expenses)
// 9. Compliance

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'ERROR', message: 'Internal Server Fault' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mandi Backend Engine: Running on http://localhost:${PORT}`);
});
