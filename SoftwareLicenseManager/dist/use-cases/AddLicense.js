"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLicense = void 0;
class AddLicense {
    licenseRepo;
    constructor(licenseRepo) {
        this.licenseRepo = licenseRepo;
    }
    async execute(licenseData) {
        const license = {
            ...licenseData,
            notified: false
        };
        return await this.licenseRepo.addLicense(license);
    }
}
exports.AddLicense = AddLicense;
