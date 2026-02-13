import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import masterRoutes from './routes/masters.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for receipt images
app.use(express.static(path.join(process.cwd(), 'dist')));

// Initialize Database
const db = initializeDatabase();

// Pass DB to request
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/masters', masterRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Serve frontend in production
app.get('*', (req, res) => {
    // If we had a built frontend, we would serve it here
    // For dev, Vite handles it.
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Épargne server running on port ${port}`);
});
