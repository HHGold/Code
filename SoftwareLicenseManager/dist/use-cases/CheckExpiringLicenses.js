"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckExpiringLicenses = void 0;
class CheckExpiringLicenses {
    licenseRepo;
    notificationProvider;
    daysThreshold;
    constructor(licenseRepo, notificationProvider, daysThreshold = 7) {
        this.licenseRepo = licenseRepo;
        this.notificationProvider = notificationProvider;
        this.daysThreshold = daysThreshold;
    }
    async execute() {
        const expiringLicenses = await this.licenseRepo.getExpiringLicenses(this.daysThreshold);
        for (const license of expiringLicenses) {
            if (license.id) {
                await this.notificationProvider.notifyExpiringLicense(license);
                await this.licenseRepo.markAsNotified(license.id);
            }
        }
    }
}
exports.CheckExpiringLicenses = CheckExpiringLicenses;
