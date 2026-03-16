import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, exec } from 'child_process';
import * as os from 'os';

const DataFolders = [
    "conversations",
    "brain",
    "implicit",
    "annotations",
    "context_state",
    "knowledge",
    "global_workflows"
];

// 需要備份的核心設定檔 (位於 .gemini/antigravity 下)
const CoreSettingFiles = [
    "installation_id",
    "user_settings.pb"
];

const RulesFiles = [
    "GEMINI.md"
];

function getLocalGeminiPath(): string {
    return path.join(os.homedir(), '.gemini', 'antigravity');
}

function getLocalGeminiRoot(): string {
    return path.join(os.homedir(), '.gemini');
}

<<<<<<< HEAD
function getAppDataPath(): string {
    return path.join(process.env.APPDATA || '', 'Antigravity', 'User', 'globalStorage');
}

async function runRobocopy(source: string, dest: string, webview: vscode.Webview, specificFile?: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
=======
/**
 * 執行 robocopy 命令進行增量備份或還原
 * @param source 來源路徑
 * @param dest 目標路徑
 * @param webview 用於回傳狀態的 Webview
 */
async function runRobocopy(source: string, dest: string, webview: vscode.Webview): Promise<boolean> {
    return new Promise(async (resolve) => {
        try {
            if (!fs.existsSync(dest)) {
                await fs.promises.mkdir(dest, { recursive: true });
            }
        } catch (err: any) {
            webview.postMessage({ type: 'status', message: '✗ Error creating directory: ' + err.message });
            return resolve(false);
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
        }

        // 優化參數：
        // /R:0 /W:0 = 不重試 (不卡住)
        // /NP /NFL /NDL /NJH /NJS = 靜默模式，不輸出大量文字以免緩衝區溢位
        let args = specificFile 
            ? [source, dest, specificFile, '/R:0', '/W:0', '/NP', '/NFL', '/NDL', '/NJH', '/NJS']
            : [source, dest, '/MIR', '/R:0', '/W:0', '/NP', '/NFL', '/NDL', '/NJH', '/NJS'];

        const command = `robocopy ${args.map(a => `"${a}"`).join(' ')}`;
        webview.postMessage({ type: 'status', message: `Syncing ${specificFile || path.basename(source)}...` });

        const child = spawn('robocopy', args);

<<<<<<< HEAD
        child.on('close', (code) => {
            // Robocopy code < 8 代表成功 (0-7 都是正常的複製成功狀態)
            if (code !== null && code <= 7) {
=======
        child.on('close', (code: number | null) => {
            if (code !== null && code < 8) {
                webview.postMessage({ type: 'status', message: '✓ ' + path.basename(source) + ' completed.' });
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
                resolve(true);
            } else {
                webview.postMessage({ type: 'status', message: `! Check: ${specificFile || path.basename(source)} partial or skipped (Code ${code})` });
                resolve(false);
            }
        });

        child.on('error', (err: Error) => {
            webview.postMessage({ type: 'status', message: '✗ Error running robocopy: ' + err.message });
            resolve(false);
        });
    });
}

export async function runBackup(networkPath: string, webview: vscode.Webview) {
    webview.postMessage({ type: 'status', message: 'Checking network path: ' + networkPath });

    if (!fs.existsSync(networkPath)) {
        try {
            await fs.promises.mkdir(networkPath, { recursive: true });
        } catch (e: any) {
            webview.postMessage({ type: 'status', message: '✗ Cannot access or create network path. Error: ' + e.message });
            return;
        }
    }

    const localPath = getLocalGeminiPath();
    const localRoot = getLocalGeminiRoot();
    const appDataPath = getAppDataPath();

    webview.postMessage({ type: 'status', message: 'Starting Direct Backup (No ZIP)...' });

    let successCount = 0;

    // 1. 備份 7 個核心目錄
    webview.postMessage({ type: 'status', message: '\n--- Backing up Content ---' });
    for (const folder of DataFolders) {
        const src = path.join(localPath, folder);
        const dst = path.join(networkPath, folder);
        if (fs.existsSync(src)) {
            if (await runRobocopy(src, dst, webview)) successCount++;
        }
    }

    // 2. 備份身份證明與設定
    webview.postMessage({ type: 'status', message: '\n--- Backing up Identity ---' });
    for (const file of CoreSettingFiles) {
        const src = path.join(localPath, file);
        const dst = path.join(networkPath, file);
        if (fs.existsSync(src)) {
            try {
<<<<<<< HEAD
                fs.copyFileSync(src, dst);
                webview.postMessage({ type: 'status', message: `✓ ${file}` });
=======
                webview.postMessage({ type: 'status', message: 'Copying ' + file + '...' });
                await fs.promises.copyFile(sourcePath, destPath);
                webview.postMessage({ type: 'status', message: '✓ ' + file + ' completed.' });
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
                successCount++;
            } catch (e) {}
        }
    }

    // 3. 備份索引資料夾 (從 AppData 搬移核心索引與最近列表)
    const appDataUserPath = path.dirname(appDataPath); // ...\Antigravity\User
    const foldersToBackupFromAppData = ["globalStorage", "workspaceStorage", "History"];
    
    webview.postMessage({ type: 'status', message: '\n--- Backing up UI Index & Recents ---' });
    for (const folder of foldersToBackupFromAppData) {
        const src = path.join(appDataUserPath, folder);
        const dst = path.join(networkPath, 'AppData', folder);
        if (fs.existsSync(src)) {
            if (await runRobocopy(src, dst, webview)) successCount++;
        }
    }

<<<<<<< HEAD
    // 4. 備份 Rules
    for (const file of RulesFiles) {
        const src = path.join(localRoot, file);
        const dst = path.join(networkPath, file);
        if (fs.existsSync(src)) {
            try {
                fs.copyFileSync(src, dst);
                successCount++;
            } catch (e) {}
        }
=======
    try {
        await fs.promises.writeFile(infoPath, infoContent, 'utf-8');
    } catch (e: any) {
        console.error('Failed to write backup info:', e);
        webview.postMessage({ type: 'status', message: '! Warning: Could not write backup_info.txt - ' + e.message });
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
    }

    webview.postMessage({ type: 'status', message: '\n==============================' });
    webview.postMessage({ type: 'status', message: `✓ Backup Completed!` });
    webview.postMessage({ type: 'status', message: '==============================\n' });
    vscode.window.showInformationMessage('Antigravity Full Backup completed!');
}

export async function runRestore(networkPath: string, webview: vscode.Webview) {
    const localPath = getLocalGeminiPath();
    const localRoot = getLocalGeminiRoot();
    const appDataPath = getAppDataPath();

<<<<<<< HEAD
    webview.postMessage({ type: 'status', message: 'Starting Direct Restore...' });
=======
    if (!fs.existsSync(localPath)) {
        try {
            await fs.promises.mkdir(localPath, { recursive: true });
        } catch (e: any) {
            webview.postMessage({ type: 'status', message: '✗ Error creating local directory: ' + e.message });
            return;
        }
    }
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4

    let successCount = 0;

    // 1. 還原目錄
    for (const folder of DataFolders) {
        const src = path.join(networkPath, folder);
        const dst = path.join(localPath, folder);
        if (fs.existsSync(src)) {
            if (await runRobocopy(src, dst, webview)) successCount++;
        }
    }

    // 2. 還原 Identity
    for (const file of CoreSettingFiles) {
        const src = path.join(networkPath, file);
        const dst = path.join(localPath, file);
        if (fs.existsSync(src)) {
            try {
<<<<<<< HEAD
                fs.copyFileSync(src, dst);
=======
                webview.postMessage({ type: 'status', message: 'Copying ' + file + '...' });
                await fs.promises.copyFile(sourcePath, destPath);
                webview.postMessage({ type: 'status', message: '✓ ' + file + ' completed.' });
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
                successCount++;
            } catch (e) {}
        }
    }

    // 3. 還原 UI 索引與最近列表
    const appDataUserPath = path.dirname(appDataPath);
    const srcAppData = path.join(networkPath, 'AppData');
    if (fs.existsSync(srcAppData)) {
        webview.postMessage({ type: 'status', message: '\n--- Restoring UI Index & Recents ---' });
        if (await runRobocopy(srcAppData, appDataUserPath, webview)) successCount++;
    }

    webview.postMessage({ type: 'status', message: '\n==============================' });
    webview.postMessage({ type: 'status', message: '✓ Restore Finished!' });
    webview.postMessage({ type: 'status', message: '==============================\n' });

    vscode.window.showInformationMessage(
        'Restore successful! Please CLOSE and RE-OPEN Antigravity to apply the list index.', 
        'OK'
    );
}
