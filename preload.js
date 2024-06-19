// preload.js

const { contextBridge, shell,ipcRenderer } = require('electron');
// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

contextBridge.exposeInMainWorld('electronAPI', {
    openEdgeBrowser: async () => {
        console.log('Invoking open-edge-browser');
        const result = await ipcRenderer.invoke('open-edge-browser');
        if (result.success) {
            console.log('Edge opened successfully');
        } else {
            console.error('Failed to open Edge:', result.error);
        }
    }
});


contextBridge.exposeInMainWorld('electron', {
    handleFile: (callback) => ipcRenderer.on('file-dropped', callback),
    sendFileDropped: (files) => ipcRenderer.send('file-dropped', files),
    getFileIcon: (filePath, callback) => ipcRenderer.invoke('get-file-icon', filePath).then(callback)
});


