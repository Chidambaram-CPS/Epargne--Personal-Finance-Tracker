import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
    const db = req.db;
    const { userId, type } = req.query;

    if (!userId) return res.status(400).json({ error: 'UserId required' });

    try {
        let query = 'SELECT * FROM masters WHERE user_id = ? AND is_deleted = 0';
        const params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        const masters = db.prepare(query).all(...params);
        res.json(masters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', (req, res) => {
    const db = req.db;
    const { user_id, type, name, parent_id, color, icon } = req.body;

    if (!user_id || !type || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();

    try {
        db.prepare(`
            INSERT INTO masters (id, user_id, type, name, parent_id, color, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, user_id, type, name, parent_id, color, icon);

        res.json({ id, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Soft Delete
router.delete('/:id', (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { user_id } = req.body;

    try {
        db.prepare('UPDATE masters SET is_deleted = 1 WHERE id = ? AND user_id = ?').run(id, user_id);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
