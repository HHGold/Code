import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runBackup, runRestore } from './backupLogic';

export class BackupViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'antigravityBackupView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

<<<<<<< HEAD
        // 自動監聽設定變更，並更新 Webview
        const configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('antigravityBackup.networkPath')) {
                this.updateWebviewConfig();
            }
        });

        webviewView.onDidDispose(() => {
            configListener.dispose();
        });

        webviewView.webview.onDidReceiveMessage(data => {
=======
        webviewView.webview.onDidReceiveMessage((data: any) => {
>>>>>>> 174ef66ef81d5ed659007d02b20cff8c94d816b4
            switch (data.type) {
                case 'backup':
                    {
                        const networkPath = vscode.workspace.getConfiguration('antigravityBackup').get('networkPath') as string;
                        runBackup(networkPath, webviewView.webview);
                        break;
                    }
                case 'restore':
                    {
                        const networkPath = vscode.workspace.getConfiguration('antigravityBackup').get('networkPath') as string;
                        vscode.window.showWarningMessage('Warning: Please CLOSE the Antigravity app before restoring! Restore will overwrite your current local data. Are you sure?', 'Yes', 'No').then((selection: string | undefined) => {
                            if (selection === 'Yes') {
                                runRestore(networkPath, webviewView.webview);
                            } else {
                                webviewView.webview.postMessage({ type: 'status', message: 'Restore cancelled.' });
                            }
                        });
                        break;
                    }
                case 'refreshConfig':
                    {
                        this.updateWebviewConfig();
                        break;
                    }
            }
        });
    }

    private updateWebviewConfig() {
        if (this._view) {
            const networkPath = vscode.workspace.getConfiguration('antigravityBackup').get('networkPath') as string;
            this._view.webview.postMessage({ type: 'config', networkPath });
        }
    }

    private _escapeHtml(unsafe: string) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const networkPath = vscode.workspace.getConfiguration('antigravityBackup').get('networkPath') as string;
        const escapedPath = this._escapeHtml(networkPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Antigravity Backup</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 10px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-sideBar-background);
                    }
                    button {
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 15px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .restore-btn {
                       background-color: var(--vscode-errorForeground);
                    }
                    .restore-btn:hover {
                       background-color: #ff3333;
                    }
                    .info-box {
                        background-color: var(--vscode-input-background);
                        padding: 10px;
                        margin-bottom: 15px;
                        border: 1px solid var(--vscode-input-border);
                        word-wrap: break-word;
                    }
                    #status-area {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: #000;
                        color: #0f0;
                        font-family: monospace;
                        min-height: 100px;
                        max-height: 300px;
                        overflow-y: auto;
                        white-space: pre-wrap;
                    }
                    .title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="info-box">
                    <div class="title">Network Backup Path:</div>
                    <div id="network-path-display">${escapedPath}</div>
                    <div style="font-size: 12px; margin-top: 5px; color: var(--vscode-descriptionForeground)">
                       (Can be changed in VS Code Settings: antigravityBackup.networkPath)
                    </div>
                </div>

                <button id="backup-btn">Backup to Network</button>
                <button id="restore-btn" class="restore-btn">Restore from Network</button>
                <div style="font-size: 11px; color: var(--vscode-errorForeground); margin-top: -10px; margin-bottom: 15px; font-weight: bold; text-align: center;">
                    Important: You MUST close and re-open Antigravity after restore to apply lists.
                </div>

                <div class="title">Status / Logs:</div>
                <div id="status-area">Ready.</div>

                <script>
                    const vscode = acquireVsCodeApi();

                    document.getElementById('backup-btn').addEventListener('click', () => {
                        document.getElementById('status-area').innerText = 'Starting backup...\\n';
                        vscode.postMessage({ type: 'backup' });
                    });

                    document.getElementById('restore-btn').addEventListener('click', () => {
                        document.getElementById('status-area').innerText = 'Starting restore...\\n';
                        vscode.postMessage({ type: 'restore' });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'status':
                                const statusArea = document.getElementById('status-area');
                                statusArea.innerText += message.message + '\\n';
                                statusArea.scrollTop = statusArea.scrollHeight;
                                break;
                            case 'config':
                                document.getElementById('network-path-display').innerText = message.networkPath;
                                break;
                        }
                    });
                </script>
            </body>
            </html>`;
    }
}
