"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleNotificationProvider = void 0;
class ConsoleNotificationProvider {
    async notifyExpiringLicense(license) {
        console.log(`[ALERT] 授權即將到期提醒！\n客戶: ${license.customerName}\n軟體: ${license.softwareName}\n到期日: ${license.expiryDate}`);
    }
}
exports.ConsoleNotificationProvider = ConsoleNotificationProvider;
