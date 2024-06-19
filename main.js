// main.js
// electron 模块可以用来控制应用的生命周期和创建原生浏览窗口
const { app, BrowserWindow ,Menu,ipcMain  } = require('electron')
const path = require('path')
const browserUtilsPath = path.join(__dirname, 'assets', 'js', 'browerUtils.js');
console.log('BrowserUtils path:', browserUtilsPath);
const { openEdgeBrowser } = require(browserUtilsPath);
const createWindow = () => {
    // 创建浏览窗口
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,  // 启用上下文隔离
            enableRemoteModule: false,  // 禁用 remote 模块
            nodeIntegration: true  // 禁用 Node.js 集成
        }
    })
    // 加载 index.html
    mainWindow.loadFile('index.html')
    // 创建自定义菜单
    const menu = Menu.buildFromTemplate([]);
    // 设置应用程序菜单
    Menu.setApplicationMenu(menu);



    // 打开开发工具
    mainWindow.webContents.openDevTools()
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    createWindow()
    if (!ipcMain._openEdgeBrowserHandlerRegistered) {
        console.log('Registering IPC handler for open-edge-browser');
        ipcMain.handle('open-edge-browser', openEdgeBrowser);
        ipcMain._openEdgeBrowserHandlerRegistered = true;
    }
    app.on('activate', () => {
        // 在 macOS 系统内, 如果没有已开启的应用窗口
        // 点击托盘图标时通常会重新创建一个新窗口
        if (process.platform === 'darwin') {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        }
    })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('file-dropped', (event, files) => {
    // 处理文件拖放事件
    event.reply('file-dropped', 'Files are not accepted here.');
});

// 在当前文件中你可以引入所有的主进程代码
// 也可以拆分成几个文件，然后用 require 导入。

// 监听渲染进程的请求
ipcMain.handle('open-edge-browser', openEdgeBrowser);

ipcMain.handle('get-file-icon', async (event, filePath) => {
    try {
        const icon = await app.getFileIcon(filePath);
        return icon.toDataURL();
    } catch (error) {
        console.error('Error getting file icon:', error);
        return null;
    }
});
