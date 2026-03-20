"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLicenseRepository = void 0;
const fs = __importStar(require("fs/promises"));
class JsonLicenseRepository {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async readData() {
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return [];
        }
    }
    async writeData(data) {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    async init() {
        try {
            await fs.access(this.filePath);
        }
        catch {
            await this.writeData([]);
        }
    }
    async addLicense(license) {
        const data = await this.readData();
        const newId = data.length > 0 ? Math.max(...data.map(l => l.id || 0)) + 1 : 1;
        const newLicense = { ...license, id: newId, notified: false };
        data.push(newLicense);
        await this.writeData(data);
        return newId;
    }
    async getAllLicenses() {
        return await this.readData();
    }
    async getExpiringLicenses(days) {
        const data = await this.readData();
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);
        return data.filter(l => {
            const expiry = new Date(l.expiryDate);
            return !l.notified && expiry <= targetDate;
        });
    }
    async markAsNotified(id) {
        const data = await this.readData();
        const index = data.findIndex(l => l.id === id);
        if (index !== -1) {
            data[index].notified = true;
            await this.writeData(data);
        }
    }
    async updateLicense(id, license) {
        const data = await this.readData();
        const index = data.findIndex(l => l.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...license };
            await this.writeData(data);
        }
    }
    async deleteLicense(id) {
        const data = await this.readData();
        const filtered = data.filter(l => l.id !== id);
        await this.writeData(filtered);
    }
}
exports.JsonLicenseRepository = JsonLicenseRepository;
