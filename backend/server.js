const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PowerSetter backend is running' });
});

// API routes
app.get('/api/powersetter', (req, res) => {
  res.json({ message: 'PowerSetter API endpoint' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});