"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineNotificationProvider = void 0;
const bot_sdk_1 = require("@line/bot-sdk");
class LineNotificationProvider {
    client;
    toUserId;
    constructor(channelAccessToken, toUserId) {
        this.client = new bot_sdk_1.Client({
            channelAccessToken: channelAccessToken.replace(/\s/g, '')
        });
        this.toUserId = toUserId.trim();
    }
    async notifyExpiringLicense(license) {
        try {
            const clientName = license.clientName || license.customerName || '未指定客戶';
            const softwareName = license.softwareName || '未指定軟體';
            const message = {
                type: 'text',
                text: `⚠️ 軟體授權即將到期提醒！\n\n客戶: ${clientName}\n軟體: ${softwareName}\n購買日期: ${license.purchaseDate}\n到期日期: ${license.expiryDate}\n\n請務必於到期前進行續約。`
            };
            await this.client.pushMessage(this.toUserId, message);
            console.log(`[LINE] 已發送通知給 ${this.toUserId} - 客戶: ${clientName}`);
        }
        catch (error) {
            console.error('[LINE Error] 通知發送失敗:', error.response?.data || error.message);
            throw error; // 拋出錯誤以防止後續將其標記為「已通知」
        }
    }
}
exports.LineNotificationProvider = LineNotificationProvider;
