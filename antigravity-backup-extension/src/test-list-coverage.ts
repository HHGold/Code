import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 模擬從 backupLogic.ts 匯出的清單 (目前版本)
const CurrentDataFolders = [
    "conversations",
    "brain",
    "implicit",
    "annotations",
    "context_state",
    "knowledge",
    "global_workflows",
    "browser_recordings",
    "code_tracker",
    "html_artifacts",
    "playground",
    "prompting"
];

const CurrentRulesFiles = [
    "GEMINI.md",
    "user_settings.pb",
    "mcp_config.json",
    "installation_id"
];

function testFolderCoverage() {
    const geminiPath = path.join(os.homedir(), '.gemini', 'antigravity');
    const existingFolders = fs.readdirSync(geminiPath).filter(f => fs.statSync(path.join(geminiPath, f)).isDirectory());

    console.log('--- Checking Folder Coverage ---');
    let missing = false;
    for (const folder of existingFolders) {
        if (!CurrentDataFolders.includes(folder)) {
            console.error(`🔴 RED: Folder "${folder}" is present in Antigravity but NOT in CurrentDataFolders list!`);
            missing = true;
        }
    }

    if (!missing) {
        console.log('🟢 GREEN: All folders covered.');
    } else {
        process.exit(1);
    }
}

testFolderCoverage();
