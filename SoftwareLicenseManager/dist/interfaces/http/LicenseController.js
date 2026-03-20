"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseController = void 0;
class LicenseController {
    addLicenseUseCase;
    licenseRepo;
    constructor(addLicenseUseCase, licenseRepo) {
        this.addLicenseUseCase = addLicenseUseCase;
        this.licenseRepo = licenseRepo;
    }
    async createLicense(req, res) {
        try {
            const id = await this.addLicenseUseCase.execute(req.body);
            res.status(201).json({ success: true, id });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getAllLicenses(req, res) {
        try {
            const licenses = await this.licenseRepo.getAllLicenses();
            res.status(200).json({ success: true, data: licenses });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async updateLicense(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            await this.licenseRepo.updateLicense(id, req.body);
            res.status(200).json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async deleteLicense(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            await this.licenseRepo.deleteLicense(id);
            res.status(200).json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.LicenseController = LicenseController;
