// ./assets/js/browserUtils.js
const { shell } = require('electron');
const { exec } = require('child_process');

async function openEdgeBrowser() {
    // const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    // try {
    //     await shell.openPath(edgePath);
    //     return { success: true };
    // } catch (error) {
    //     return { success: false, error: error.message };
    // }
    exec('powershell "Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Format-Table –AutoSize"', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`Installed Applications:\n${stdout}`);
    });


}

module.exports = { openEdgeBrowser };
