import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'epargne.db');

export function initializeDatabase() {
    const db = new Database(DB_PATH);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Encryption helper (Note: better-sqlite3 doesn't support full AES-256 out of box without custom build)
    // implementing application-level encryption hook if needed later.

    // Create Users Table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      theme TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Create Transactions Table
    db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      platform TEXT,
      wallet TEXT NOT NULL,
      description TEXT,
      receipt_image TEXT,
      week_number INTEGER,
      month_name TEXT,
      financial_year TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

    // Create Masters Table (Categories, Wallets, etc.)
    db.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'category', 'wallet', 'platform'
      name TEXT NOT NULL,
      parent_id TEXT, -- For sub-categories
      color TEXT,
      icon TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

    // Create Audit Log
    db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('Database initialized successfully');
    return db;
}
