"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteLicenseRepository = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
class SQLiteLicenseRepository {
    db;
    dbPath;
    constructor(dbPath = './database.sqlite') {
        this.dbPath = dbPath;
    }
    async init() {
        this.db = await (0, sqlite_1.open)({
            filename: this.dbPath,
            driver: sqlite3_1.default.Database
        });
        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT NOT NULL,
        softwareName TEXT NOT NULL,
        purchaseDate TEXT NOT NULL,
        expiryDate TEXT NOT NULL,
        notified BOOLEAN NOT NULL DEFAULT 0
      )
    `);
    }
    async addLicense(license) {
        const result = await this.db.run(`INSERT INTO licenses (customerName, softwareName, purchaseDate, expiryDate, notified)
       VALUES (?, ?, ?, ?, ?)`, [license.customerName, license.softwareName, license.purchaseDate, license.expiryDate, license.notified ? 1 : 0]);
        return result.lastID;
    }
    async getAllLicenses() {
        const rows = await this.db.all('SELECT * FROM licenses');
        return rows.map(this.mapRowToLicense);
    }
    async getExpiringLicenses(days) {
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const rows = await this.db.all(`
      SELECT * FROM licenses 
      WHERE expiryDate <= ? AND notified = 0
    `, [targetDateStr]);
        return rows.map(this.mapRowToLicense);
    }
    async markAsNotified(id) {
        await this.db.run('UPDATE licenses SET notified = 1 WHERE id = ?', [id]);
    }
    async updateLicense(id, license) {
        const sets = [];
        const params = [];
        if (license.customerName !== undefined) {
            sets.push('customerName = ?');
            params.push(license.customerName);
        }
        if (license.softwareName !== undefined) {
            sets.push('softwareName = ?');
            params.push(license.softwareName);
        }
        if (license.purchaseDate !== undefined) {
            sets.push('purchaseDate = ?');
            params.push(license.purchaseDate);
        }
        if (license.expiryDate !== undefined) {
            sets.push('expiryDate = ?');
            params.push(license.expiryDate);
        }
        if (license.notified !== undefined) {
            sets.push('notified = ?');
            params.push(license.notified ? 1 : 0);
        }
        if (sets.length === 0)
            return;
        params.push(id);
        await this.db.run(`UPDATE licenses SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    async deleteLicense(id) {
        await this.db.run('DELETE FROM licenses WHERE id = ?', [id]);
    }
    mapRowToLicense(row) {
        return {
            id: row.id,
            customerName: row.customerName,
            softwareName: row.softwareName,
            purchaseDate: row.purchaseDate,
            expiryDate: row.expiryDate,
            notified: Boolean(row.notified)
        };
    }
}
exports.SQLiteLicenseRepository = SQLiteLicenseRepository;
