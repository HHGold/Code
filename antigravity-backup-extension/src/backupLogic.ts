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

function getAppDataPath(): string {
    return path.join(process.env.APPDATA || '', 'Antigravity', 'User', 'globalStorage');
}

async function runRobocopy(source: string, dest: string, webview: vscode.Webview, specificFile?: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
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

        child.on('close', (code) => {
            // Robocopy code < 8 代表成功 (0-7 都是正常的複製成功狀態)
            if (code !== null && code <= 7) {
                webview.postMessage({ type: 'status', message: `✓ ${specificFile || path.basename(source)} sync finished.` });
                resolve(true);
            } else {
                webview.postMessage({ type: 'status', message: `! Check: ${specificFile || path.basename(source)} partial or skipped (Code ${code})` });
                resolve(false);
            }
        });

        child.on('error', (err) => {
            webview.postMessage({ type: 'status', message: '✗ Error running robocopy: ' + err.message });
            resolve(false);
        });
    });
}

export async function runBackup(networkPath: string, webview: vscode.Webview) {
    webview.postMessage({ type: 'status', message: 'Checking network path: ' + networkPath });

    if (!fs.existsSync(networkPath)) {
        try {
            fs.mkdirSync(networkPath, { recursive: true });
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
                fs.copyFileSync(src, dst);
                webview.postMessage({ type: 'status', message: `✓ ${file}` });
                successCount++;
            } catch (e) { }
        }
    }

    // 3. 備份索引資料夾 (從 AppData 搬移最近列表與歷史)
    const appDataUserPath = path.dirname(appDataPath); // ...\Antigravity\User
    const foldersToBackupFromAppData = ["workspaceStorage", "History"];

    webview.postMessage({ type: 'status', message: '\n--- Backing up UI Context & History ---' });
    for (const folder of foldersToBackupFromAppData) {
        const src = path.join(appDataUserPath, folder);
        const dst = path.join(networkPath, 'AppData', folder);
        if (fs.existsSync(src)) {
            if (await runRobocopy(src, dst, webview)) successCount++;
        }
    }

    // 4. 備份 Rules
    for (const file of RulesFiles) {
        const src = path.join(localRoot, file);
        const dst = path.join(networkPath, file);
        if (fs.existsSync(src)) {
            try {
                fs.copyFileSync(src, dst);
                successCount++;
            } catch (e) { }
        }
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

    webview.postMessage({ type: 'status', message: 'Starting Direct Restore...' });

    let successCount = 0;

    // 1. 還原目錄
    for (const folder of DataFolders) {
        const src = path.join(networkPath, folder);
        const dst = path.join(localPath, folder);
        if (fs.existsSync(src)) {
            const ok = await runRobocopy(src, dst, webview);
            if (ok) successCount++;
        }
    }

    // 2. 還原 Identity (部分還原)
    webview.postMessage({ type: 'status', message: '\n--- Restoring Identity (Selective) ---' });
    for (const file of CoreSettingFiles) {
        // 1.1.13 核心修正：還原時跳過 installation_id
        // 理由：覆蓋此 ID 會導致新電腦的插件加密金鑰錯位，造成 GitHub 等插件被強制登出
        if (file === 'installation_id') {
            webview.postMessage({ type: 'status', message: `- Skipped ${file} to protect machine identity.` });
            continue;
        }

        const src = path.join(networkPath, file);
        const dst = path.join(localPath, file);
        if (fs.existsSync(src)) {
            try {
                fs.copyFileSync(src, dst);
                webview.postMessage({ type: 'status', message: `✓ ${file}` });
                successCount++;
            } catch (e) { }
        }
    }

    // 3. 還原 UI 索引與最近列表 (安全模式：跳過 globalStorage 以免 GitHub 登出)
    const appDataUserPath = path.dirname(appDataPath); // ...\Antigravity\User
    const srcAppDataRoot = path.join(networkPath, 'AppData');

    if (fs.existsSync(srcAppDataRoot)) {
        webview.postMessage({ type: 'status', message: '\n--- Restoring UI Index (Safe Mode) ---' });
        webview.postMessage({ type: 'status', message: `! Security: Skipping globalStorage to keep GitHub logged in.` });
        
        const foldersToRestore = ["workspaceStorage", "History"];
        for (const folder of foldersToRestore) {
            const src = path.join(srcAppDataRoot, folder);
            const dst = path.join(appDataUserPath, folder);
            
            if (fs.existsSync(src)) {
                // 還原專案級資料夾
                if (await runRobocopy(src, dst, webview)) successCount++;
            }
        }
    }

    webview.postMessage({ type: 'status', message: '\n==============================' });
    webview.postMessage({ type: 'status', message: '✓ Restore Finished!' });
    webview.postMessage({ type: 'status', message: '==============================\n' });

    vscode.window.showInformationMessage(
        'Restore successful! Please CLOSE and RE-OPEN Antigravity to apply the list index.',
        'OK'
    );
}
