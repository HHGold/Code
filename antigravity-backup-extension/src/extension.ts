import * as vscode from 'vscode';
import { BackupViewProvider } from './BackupViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Backup Extension is now active!');

    const provider = new BackupViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            BackupViewProvider.viewType,
            provider
        )
    );
}

export function deactivate() { }
