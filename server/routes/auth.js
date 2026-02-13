import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'epargne-secret-key-change-me';

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = req.db;

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Signup (For initial setup)
router.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const db = req.db;

    try {
        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Generate ID: U-001, U-002...
        const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const userId = `U-${String(count + 1).padStart(3, '0')}`;
        const passwordHash = bcrypt.hashSync(password, 10);

        db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
            userId, email, passwordHash, name
        );

        const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ token, user: { id: userId, name, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify', (req, res) => {
    // Minimal verification endpoint
    res.json({ status: 'ok' });
});

export default router;
