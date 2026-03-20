"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CheckExpiringLicenses_1 = require("./CheckExpiringLicenses");
class MockRepo {
    init() { return Promise.resolve(); }
    addLicense(license) { return Promise.resolve(1); }
    getAllLicenses() { return Promise.resolve([]); }
    getExpiringLicenses(days) {
        return Promise.resolve([
            { id: 1, customerName: 'Mock', softwareName: 'MockSoft', purchaseDate: '2020-01-01', expiryDate: '2020-01-02', notified: false }
        ]);
    }
    markAsNotified(id) {
        return Promise.resolve();
    }
    deleteLicense(id) { return Promise.resolve(); }
}
class MockNotifier {
    notifiedLicenses = [];
    async notifyExpiringLicense(license) {
        this.notifiedLicenses.push(license);
    }
}
describe('CheckExpiringLicenses', () => {
    it('should notify and mark as notified for expiring licenses', async () => {
        const mockRepo = new MockRepo();
        const mockNotifier = new MockNotifier();
        // spy on repo
        const markAsNotifiedSpy = jest.spyOn(mockRepo, 'markAsNotified');
        const useCase = new CheckExpiringLicenses_1.CheckExpiringLicenses(mockRepo, mockNotifier, 7);
        await useCase.execute();
        expect(mockNotifier.notifiedLicenses.length).toBe(1);
        expect(mockNotifier.notifiedLicenses[0].customerName).toBe('Mock');
        expect(markAsNotifiedSpy).toHaveBeenCalledWith(1);
    });
});
