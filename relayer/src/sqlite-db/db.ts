import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Awaited<ReturnType<typeof open>>;

export async function initDb() {
  db = await open({
    filename: path.join(__dirname, '../../data.db'),
    driver: sqlite3.Database,
  });

  // Main orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT PRIMARY KEY,
      secret TEXT,
      secretHash TEXT,
      resolverAddress TEXT,
      auctionStart INTEGER,
      amount TEXT,
      status TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      maker TEXT,
      suiAsset TEXT,
      takerAsset TEXT,
      makingAmount TEXT,
      takingAmount TEXT,
      minReturnAmount TEXT,
      verified BOOLEAN
    );
  `);

  // Dutch auction metadata
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dutch_auctions (
      orderId TEXT PRIMARY KEY,
      auctionOrderId TEXT,
      amount TEXT,
      startRate TEXT,
      minReturnAmount TEXT,
      decreaseRates TEXT,
      FOREIGN KEY(orderId) REFERENCES orders(orderId) ON DELETE CASCADE
    );
  `);

  console.log('✅ Orders + Dutch auction tables initialized');
}

export async function initEscrowDb() {
  const db = getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS escrows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      escrowAddress TEXT NOT NULL,
      maker TEXT NOT NULL,
      asset TEXT NOT NULL,
      amount TEXT NOT NULL,
      hashlock TEXT NOT NULL,
      timelock INTEGER NOT NULL,
      txHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_verified (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suiAsset TEXT NOT NULL,
      crossChainRecipient TEXT NOT NULL,
      maker TEXT NOT NULL,
      takerAsset TEXT NOT NULL,
      makingAmount TEXT NOT NULL,
      takingAmount TEXT NOT NULL,
      txHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_filled (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderHash TEXT NOT NULL,
      remainingAmount TEXT NOT NULL,
      txHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  console.log('✅ Escrow, order_verified, order_filled tables initialized');
}

export function getDb() {
  if (!db) {
    throw new Error('❌ Database not initialized. Call initDb() first.');
  }
  return db;
}
