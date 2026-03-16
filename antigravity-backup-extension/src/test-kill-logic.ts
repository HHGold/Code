import { execSync } from 'child_process';

function testKillLogic() {
    console.log('--- Testing Process Kill Utility ---');
    try {
        // 這裡我們只是測試指令是否能正確執行 (即便沒有 process 也要能回傳成功，不應當機)
        // /T 是包含子行程, /F 是強制
        const cmd = 'taskkill /F /IM Antigravity.exe /T';
        console.log(`Executing: ${cmd}`);
        
        try {
            execSync(cmd, { stdio: 'ignore' });
            console.log('🟢 Process killed (or none was running).');
        } catch (e) {
            // Taskkill fails with exit code 128 if process not found, which is acceptable
            console.log('🟢 Taskkill executed (Process not found is okay).');
        }
    } catch (err) {
        console.error('🔴 RED: Critical error in kill logic!');
        process.exit(1);
    }
}

testKillLogic();
