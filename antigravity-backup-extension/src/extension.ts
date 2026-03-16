import * as vscode from 'vscode';
import { BackupViewProvider } from './BackupViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // 擴充套件啟動後，不需要在主控制台輸出多餘訊息，若有需要可使用 OutputChannel
    // console.log('Antigravity Backup Extension is now active!');

    const provider = new BackupViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            BackupViewProvider.viewType,
            provider
        )
    );
}

export function deactivate() { }
