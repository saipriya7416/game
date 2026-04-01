require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const path = require('path');
const morgan = require('morgan');
const errorHandler = require('./middleware/errors');

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Logging in production/dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}

// Serve static files (Local storage fallback)
app.use('/uploads', express.static(path.join(__dirname, '../storage')));

// --- DATABASE CONNECTION (ROBUST) ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mandi-erp';

const connectWithRetry = (count = 0) => {
  const maxRetries = 5;
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Mandi ERP Service: Database Synchronized'))
    .catch(err => {
      console.error(`❌ Database Sync Failure [Attempt ${count + 1}/${maxRetries}]:`, err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.log('\n💡 [TROUBLESHOOTING]: Local MongoDB instance is not responding.');
        console.log(' 👉 1. Open Windows Services (services.msc)');
        console.log(' 👉 2. Find "MongoDB Server" and right-click "Start"');
        console.log(` 👉 3. Ensure your .env MONGODB_URI port at 27017 matches your config.\n`);
      }
      
      if (count < maxRetries) {
        console.log(`⏳ Retrying connection in 5 seconds...`);
        setTimeout(() => connectWithRetry(count + 1), 5000);
      } else {
        console.error('💥 CRITICAL: Could not establish database connection after multiple attempts. Application may be unstable.');
      }
    });
};

connectWithRetry();

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

// --- ERROR HANDLING (Must be after routes) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Mandi Backend Engine: Running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections (System Safety Net)
process.on('unhandledRejection', (err, promise) => {
  console.error(`💥 BOOM! UNHANDLED REJECTION: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
