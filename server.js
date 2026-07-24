import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import lacrmRoutes from './src/server/lacrmRoutes.js';

// Get directory path for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', lacrmRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`LACRM API Proxy server running on http://localhost:${PORT}`);
});
