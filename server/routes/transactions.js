import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { startOfWeek, format, getWeek, startOfYear, endOfYear } from 'date-fns';

const router = express.Router();

// Middleware to verify token would go here in a real app
// For now assuming req.db is available and we pass userId in header or body for simplicity in this starter
// In production, use the auth middleware to extract userId from JWT

router.use((req, res, next) => {
    // Mock Auth Middleware for starter
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        // return res.status(401).json({ error: 'Unauthorized' });
    }
    // Decode token and set req.user...
    next();
});

// GET all transactions
router.get('/', (req, res) => {
    const db = req.db;
    const { userId } = req.query; // Pass userId as query param for today

    if (!userId) return res.status(400).json({ error: 'UserId required' });

    try {
        const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD Transaction
router.post('/', (req, res) => {
    const db = req.db;
    const { user_id, date, amount, type, category, sub_category, platform, wallet, description, receipt_image } = req.body;

    if (!user_id || !date || !amount || !type || !category || !wallet) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Auto Calculations
    const dateObj = new Date(date);
    const week_number = getWeek(dateObj);
    const month_name = format(dateObj, 'MMMM');
    const financial_year = getFinancialYear(dateObj);

    const id = uuidv4();

    try {
        const stmt = db.prepare(`
            INSERT INTO transactions (
                id, user_id, date, amount, type, category, sub_category, 
                platform, wallet, description, receipt_image, 
                week_number, month_name, financial_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id, user_id, date, amount, type, category, sub_category,
            platform, wallet, description, receipt_image,
            week_number, month_name, financial_year
        );

        // Update Audit Log
        db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
            user_id, 'CREATE_TRANSACTION', `Created transaction ${id} of ${amount}`
        );

        res.json({ id, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { user_id } = req.body; // In real app, get from token

    try {
        db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, user_id);

        db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
            user_id, 'DELETE_TRANSACTION', `Deleted transaction ${id}`
        );

        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function getFinancialYear(date) {
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    // Assuming FY starts in April (Common in many regions, customizable)
    if (month >= 3) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

export default router;
