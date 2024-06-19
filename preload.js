// preload.js

const {contextBridge, shell, ipcRenderer} = require('electron');
window.addEventListener('DOMContentLoaded', () => {

})


contextBridge.exposeInMainWorld('electron', {
    saveConfig: async (data, callback) => {
        const result = await ipcRenderer.invoke('save-config', data);
        callback(result);
    },
    handleFile: (callback) => ipcRenderer.on('file-dropped', callback),
    sendFileDropped: (files) => ipcRenderer.send('file-dropped', files),
    getFileIcon: (filePath, callback) => ipcRenderer.invoke('get-file-icon', filePath).then(callback)
    ,
    onConfigData: (callback) => {
        ipcRenderer.on('config-data', (event, configData) => {
            callback(configData);
        });
    },
    onQRCode: (callback) => ipcRenderer.on('qr-code', (event, data) => callback(data))
});


