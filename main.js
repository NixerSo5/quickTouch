// main.js
// electron 模块可以用来控制应用的生命周期和创建原生浏览窗口
const { app, BrowserWindow ,Menu,ipcMain,shell,Tray  ,Notification } = require('electron')
const { exec } = require('child_process'); // 引入 child_process 模块
const path = require('path')
const fs = require('fs');
const browserUtilsPath = path.join(__dirname, 'assets', 'js', 'browerUtils.js');
console.log('BrowserUtils path:', browserUtilsPath);
const { openEdgeBrowser } = require(browserUtilsPath);
const express = require('express'); // 引入 express
const bodyParser = require('body-parser'); // 引入 body-pars
const serverPort = 41234;
const QRCode = require('qrcode');
let mainWindow;
let tray;
let configData=[];
const os = require('os');
const  getLocalIP =  () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                const xname = name.toLowerCase();
                if (!xname.includes('virtual') && !xname.includes('vmnet') && !xname.includes('vethernet')&&
                    (xname.includes('eth') || xname.includes('en') || xname.includes('wlan') || xname.includes('wi-fi'))) {
                    return net.address;
                }
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost if no external IPv4 address found
}

const createServer = () =>{
    const app = express();
    app.use(bodyParser.json());

    // 定义一个简单的 GET 接口
    app.get('/status', (req, res) => {
        res.json({ status: 'running' });
    });

    app.get('/config', (req, res) => {
        res.json( {data:configData,status:1,msg:""});
    });

    // 定义一个 POST 接口来接收外部数据
    app.post('/shell', (req, res) => {
        const data = req.body;
        console.log('Received data:', data);
        // 你可以在这里处理接收到的数据
        //直接执行数据中的path
        xpath = configData[data.data].path
        fs.stat(xpath, (err, stats) => {
            if (err) {
                console.error(`获取路径信息时出错: ${err.message}`);
                return res.status(500).json({ success: false, message: err.message });
            }

            let command;
            if (stats.isDirectory()) {
                // 如果路径是目录，打开该目录
                if (process.platform === 'win32') {
                    command = `explorer "${xpath}"`;
                } else if (process.platform === 'darwin') {
                    command = `open "${xpath}"`;
                } else {
                    command = `xdg-open "${xpath}"`;
                }
            } else {
                // 如果路径是文件，直接执行文件
                command = `"${xpath}"`;
            }
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`执行命令时出错: ${error.message}`);
                }
                if (stderr) {
                    console.error(`命令标准错误: ${stderr}`);
                }
                console.log(`命令输出: ${stdout}`);
            });
            // 直接执行接收到的路径或命令
        });
        res.json({ success: true });
    });

    app.listen(serverPort, () => {
        console.log(`HTTP server is listening on port ${serverPort}`);
    });
}


const createWindow = async () => {
    // 创建浏览窗口
    const mainWindow = new BrowserWindow({
        width: 960,
        height: 540,
        resizable: false, // 禁止调整窗口大小
        fullscreenable: false, // 禁止全屏
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
    //除了关闭之外不容许全屏
    // 打开开发工具
    // mainWindow.webContents.openDevTools()


    const configFilePath = path.join(app.getPath('userData'), 'NpjQuickTouchConfig.json');
    try {
        if (fs.existsSync(configFilePath)) {
            const data = fs.readFileSync(configFilePath, 'utf8');
            configData = JSON.parse(data);
        } else {
            console.log('配置文件不存在，使用默认配置');
        }
    } catch (error) {
        console.error('读取配置文件时出错:', error);
    }

    const localIP = getLocalIP();
    const ipAddress = `http://${localIP}:${serverPort}`;
    const qrCodeText = `{
               "ip" : "${ipAddress}"
    }`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeText);

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Sending config data to renderer process');
        mainWindow.webContents.send('config-data', configData);
        mainWindow.webContents.send('qr-code', qrCodeDataURL);
    });


    tray = new Tray(path.join(__dirname, 'tray-icon.png')); // 确保你有一个 tray-icon.png 文件
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('My Electron App');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    mainWindow.on('minimize', function (event) {
        event.preventDefault();
        showTrayNotification();
        mainWindow.hide();
    });

    mainWindow.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            showTrayNotification();
            mainWindow.hide();
        }
        return false;
    });


}
const showTrayNotification = () => {
    new Notification({
        title: '系统托盘',
        body: '应用已最小化到系统托盘。点击托盘图标可以恢复。',
    }).show();
}
// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(async () => {
    const mainWindow = createWindow()
    createServer();
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


ipcMain.handle('get-file-icon', async (event, filePath) => {
    try {
        let targetPath = filePath;
        // 检查文件是否为快捷方式
        if (path.extname(filePath).toLowerCase() === '.lnk') {
            const shortcutDetails = shell.readShortcutLink(filePath);
            targetPath = shortcutDetails.target;
        }
        const icon = await app.getFileIcon(targetPath);
        return {
            icon: icon.toDataURL(),
            filePath: targetPath
        };
    } catch (error) {
        console.error('Error getting file icon:', error);
        return null;
    }
});

ipcMain.handle('save-config', async (event, data) => {
    try {
        const configFilePath = path.join(app.getPath('userData'), 'NpjQuickTouchConfig.json');
        console.log(configFilePath)
        fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2));
        return { success: true, path: configFilePath };
    } catch (error) {
        console.error('Error saving config file:', error);
        return { success: false, error: error.message };
    }
});
