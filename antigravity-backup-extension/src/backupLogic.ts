import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
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

const RulesFiles = [
    "GEMINI.md"
];

function getLocalGeminiPath(): string {
    const userProfile = os.homedir();
    return path.join(userProfile, '.gemini', 'antigravity');
}

function getLocalGeminiRoot(): string {
    const userProfile = os.homedir();
    return path.join(userProfile, '.gemini');
}

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
        }

        const args = [source, dest, '/MIR', '/NP', '/NFL', '/NDL', '/NJH', '/NJS'];

        webview.postMessage({ type: 'status', message: 'Running robocopy for ' + path.basename(source) + '...' });

        const child = spawn('robocopy', args);

        child.on('close', (code: number | null) => {
            if (code !== null && code < 8) {
                webview.postMessage({ type: 'status', message: '✓ ' + path.basename(source) + ' completed.' });
                resolve(true);
            } else {
                webview.postMessage({ type: 'status', message: '✗ ' + path.basename(source) + ' failed with code ' + code + '.' });
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

    webview.postMessage({ type: 'status', message: 'Local Data Path: ' + localPath });

    if (!fs.existsSync(localPath)) {
        webview.postMessage({ type: 'status', message: '✗ Local Antigravity data directory not found.' });
        return;
    }

    let successCount = 0;

    webview.postMessage({ type: 'status', message: '\n--- Backing up folders ---' });
    for (const folder of DataFolders) {
        const sourcePath = path.join(localPath, folder);
        // 修正：如果網路路徑最後一個資料夾已經是該 folder 名稱，則不再拼接
        const destPath = networkPath.toLowerCase().endsWith(folder.toLowerCase()) 
            ? networkPath 
            : path.join(networkPath, folder);

        if (fs.existsSync(sourcePath)) {
            const success = await runRobocopy(sourcePath, destPath, webview);
            if (success) successCount++;
        } else {
            webview.postMessage({ type: 'status', message: 'Skipping ' + folder + ' (does not exist).' });
        }
    }

    webview.postMessage({ type: 'status', message: '\n--- Backing up Rules ---' });
    for (const file of RulesFiles) {
        const sourcePath = path.join(localRoot, file);
        const destPath = path.join(networkPath, file);

        if (fs.existsSync(sourcePath)) {
            try {
                webview.postMessage({ type: 'status', message: 'Copying ' + file + '...' });
                await fs.promises.copyFile(sourcePath, destPath);
                webview.postMessage({ type: 'status', message: '✓ ' + file + ' completed.' });
                successCount++;
            } catch (err: any) {
                webview.postMessage({ type: 'status', message: '✗ Failed to copy ' + file + ': ' + err.message });
            }
        } else {
            webview.postMessage({ type: 'status', message: 'Skipping ' + file + ' (does not exist).' });
        }
    }

    const infoPath = path.join(networkPath, "backup_info.txt");
    const infoContent = 'Last Backup Time: ' + new Date().toLocaleString() + '\nBackup Computer: ' + os.hostname() + '\nBackup User: ' + os.userInfo().username + '\nBackup Content: Extension backup';

    try {
        await fs.promises.writeFile(infoPath, infoContent, 'utf-8');
    } catch (e: any) {
        console.error('Failed to write backup info:', e);
        webview.postMessage({ type: 'status', message: '! Warning: Could not write backup_info.txt - ' + e.message });
    }

    webview.postMessage({ type: 'status', message: '\n==============================' });
    webview.postMessage({ type: 'status', message: '✓ Backup Finished! ' + successCount + ' items processed.' });
    webview.postMessage({ type: 'status', message: '==============================\n' });
    vscode.window.showInformationMessage('Antigravity Backup to network completed successfully!');
}

export async function runRestore(networkPath: string, webview: vscode.Webview) {
    webview.postMessage({ type: 'status', message: 'Checking network path: ' + networkPath });

    if (!fs.existsSync(networkPath)) {
        webview.postMessage({ type: 'status', message: '✗ Cannot access network path. Ensure backup exists. ' + networkPath });
        return;
    }

    const localPath = getLocalGeminiPath();
    const localRoot = getLocalGeminiRoot();

    if (!fs.existsSync(localPath)) {
        try {
            await fs.promises.mkdir(localPath, { recursive: true });
        } catch (e: any) {
            webview.postMessage({ type: 'status', message: '✗ Error creating local directory: ' + e.message });
            return;
        }
    }

    let successCount = 0;

    webview.postMessage({ type: 'status', message: '\n--- Restoring folders ---' });
    for (const folder of DataFolders) {
        const sourcePath = networkPath.toLowerCase().endsWith(folder.toLowerCase()) 
            ? networkPath 
            : path.join(networkPath, folder);
        const destPath = path.join(localPath, folder);

        if (fs.existsSync(sourcePath)) {
            const success = await runRobocopy(sourcePath, destPath, webview);
            if (success) successCount++;
        } else {
            webview.postMessage({ type: 'status', message: 'Skipping ' + folder + ' (not in backup).' });
        }
    }

    webview.postMessage({ type: 'status', message: '\n--- Restoring Rules ---' });
    for (const file of RulesFiles) {
        const sourcePath = path.join(networkPath, file);
        const destPath = path.join(localRoot, file);

        if (fs.existsSync(sourcePath)) {
            try {
                webview.postMessage({ type: 'status', message: 'Copying ' + file + '...' });
                await fs.promises.copyFile(sourcePath, destPath);
                webview.postMessage({ type: 'status', message: '✓ ' + file + ' completed.' });
                successCount++;
            } catch (err: any) {
                webview.postMessage({ type: 'status', message: '✗ Failed to copy ' + file + ': ' + err.message });
            }
        } else {
            webview.postMessage({ type: 'status', message: 'Skipping ' + file + ' (not in backup).' });
        }
    }

    webview.postMessage({ type: 'status', message: '\n==============================' });
    webview.postMessage({ type: 'status', message: '✓ Restore Finished! ' + successCount + ' items processed.' });
    webview.postMessage({ type: 'status', message: '==============================\n' });
    vscode.window.showInformationMessage('Antigravity Restore from network completed successfully!');
}
