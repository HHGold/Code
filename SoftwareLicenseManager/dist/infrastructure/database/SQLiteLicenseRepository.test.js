"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SQLiteLicenseRepository_1 = require("./SQLiteLicenseRepository");
describe('SQLiteLicenseRepository', () => {
    let repo;
    beforeEach(async () => {
        // 使用 memory db 進行測試
        repo = new SQLiteLicenseRepository_1.SQLiteLicenseRepository(':memory:');
        await repo.init();
    });
    it('should add a license and retrieve it', async () => {
        const license = {
            customerName: 'Test Corp',
            softwareName: 'Awesome Soft',
            purchaseDate: '2026-03-01',
            expiryDate: '2027-03-01',
            notified: false
        };
        const id = await repo.addLicense(license);
        expect(id).toBeGreaterThan(0);
        const licenses = await repo.getAllLicenses();
        expect(licenses.length).toBe(1);
        expect(licenses[0].customerName).toBe('Test Corp');
        expect(licenses[0].notified).toBe(false);
    });
    it('should get expiring licenses within given days', async () => {
        const today = new Date();
        const in5Days = new Date(today);
        in5Days.setDate(today.getDate() + 5);
        const in10Days = new Date(today);
        in10Days.setDate(today.getDate() + 10);
        await repo.addLicense({
            customerName: 'Expiring Soon',
            softwareName: 'Soft A',
            purchaseDate: '2025-01-01',
            expiryDate: in5Days.toISOString().split('T')[0],
            notified: false
        });
        await repo.addLicense({
            customerName: 'Safe',
            softwareName: 'Soft B',
            purchaseDate: '2025-01-01',
            expiryDate: in10Days.toISOString().split('T')[0],
            notified: false
        });
        const expiring = await repo.getExpiringLicenses(7);
        expect(expiring.length).toBe(1);
        expect(expiring[0].customerName).toBe('Expiring Soon');
    });
    it('should mark as notified', async () => {
        const id = await repo.addLicense({
            customerName: 'To Notify',
            softwareName: 'Soft C',
            purchaseDate: '2026-01-01',
            expiryDate: '2026-02-01',
            notified: false
        });
        await repo.markAsNotified(id);
        const licenses = await repo.getAllLicenses();
        expect(licenses[0].notified).toBe(true);
    });
    it('should delete a license', async () => {
        const id = await repo.addLicense({
            customerName: 'To Delete',
            softwareName: 'Soft D',
            purchaseDate: '2026-01-01',
            expiryDate: '2026-02-01',
            notified: false
        });
        await repo.deleteLicense(id);
        const licenses = await repo.getAllLicenses();
        expect(licenses.length).toBe(0);
    });
});
