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

  await db.exec(`
  CREATE TABLE IF NOT EXISTS dutch_auctions (
    orderId TEXT PRIMARY KEY,
    amount TEXT,
    startRate TEXT,
    minReturnAmount TEXT,
    decreaseRates TEXT,
    FOREIGN KEY(orderId) REFERENCES orders(orderId) ON DELETE CASCADE
  );
`);

  console.log('✅ Tables initialized');
}

export function getDb() {
  return db;
}

