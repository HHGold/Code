"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const JsonLicenseRepository_1 = require("./infrastructure/database/JsonLicenseRepository");
const ConsoleNotificationProvider_1 = require("./infrastructure/notification/ConsoleNotificationProvider");
const LineNotificationProvider_1 = require("./infrastructure/notification/LineNotificationProvider");
const AddLicense_1 = require("./use-cases/AddLicense");
const CheckExpiringLicenses_1 = require("./use-cases/CheckExpiringLicenses");
const LicenseController_1 = require("./interfaces/http/LicenseController");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 靜態網頁服務：將 frontend/dist 資料夾內容掛載上來
const staticPath = path_1.default.join(__dirname, '..', 'public');
app.use('/slm', express_1.default.static(staticPath));
// 依賴注入 (Dependency Injection)
const dbPath = path_1.default.join(__dirname, '..', 'data.json');
const licenseRepo = new JsonLicenseRepository_1.JsonLicenseRepository(dbPath);
const notificationProvider = process.env.LINE_TOKEN && process.env.LINE_USER_ID
    ? new LineNotificationProvider_1.LineNotificationProvider(process.env.LINE_TOKEN, process.env.LINE_USER_ID)
    : new ConsoleNotificationProvider_1.ConsoleNotificationProvider();
console.log(`[Config] Notification Provider: ${notificationProvider.constructor.name}`);
if (notificationProvider instanceof LineNotificationProvider_1.LineNotificationProvider) {
    console.log(`[Config] Line Token Length: ${process.env.LINE_TOKEN?.length}`);
}
const addLicenseUseCase = new AddLicense_1.AddLicense(licenseRepo);
const checkExpiringUseCase = new CheckExpiringLicenses_1.CheckExpiringLicenses(licenseRepo, notificationProvider, 7);
const licenseController = new LicenseController_1.LicenseController(addLicenseUseCase, licenseRepo);
// Routes (以 /slm/api 為起始路徑)
const apiRouter = express_1.default.Router();
apiRouter.post('/licenses', (req, res) => licenseController.createLicense(req, res));
apiRouter.get('/licenses', (req, res) => licenseController.getAllLicenses(req, res));
apiRouter.put('/licenses/:id', (req, res) => licenseController.updateLicense(req, res));
apiRouter.delete('/licenses/:id', (req, res) => licenseController.deleteLicense(req, res));
// 測試用：手動觸發到期檢查
apiRouter.post('/check', async (req, res) => {
    try {
        console.log('[API] 手動啟動到期檢查請求已收到...');
        const expiringLicenses = await licenseRepo.getExpiringLicenses(7);
        console.log(`[API] 發現 ${expiringLicenses.length} 筆待通知授權`);
        await checkExpiringUseCase.execute();
        res.json({ success: true, message: '到期檢查已完成' });
    }
    catch (e) {
        console.error('[API Error] 手動檢查失敗:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});
app.use('/slm/api', apiRouter);
// 根路由：返回前端主網頁
app.get('/slm', (req, res) => {
    res.sendFile(path_1.default.join(staticPath, 'index.html'));
});
// 重定向根目錄 (可選，讓 / 也能跳轉到 /slm)
app.get('/', (req, res) => {
    res.redirect('/slm');
});
// 初始化與啟動
async function bootstrap() {
    await licenseRepo.init();
    // 排程器：每天早上 9 點執行一次
    node_cron_1.default.schedule('0 9 * * *', async () => {
        console.log('[Cron] 開始檢查即將到期之軟體授權...');
        await checkExpiringUseCase.execute();
        console.log('[Cron] 檢查完畢。');
    });
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
bootstrap().catch(console.error);
