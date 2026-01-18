const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 334,
        height: 325,
        frame: false,
        roundedCorners: false, // Force square corners on Windows 11
        thickFrame: false, // Removes the shadow/resize border which might cause rounding visual
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        backgroundColor: '#C0C0C0', // Win98 Grey
        icon: path.join(__dirname, 'icon.ico')
    });

    win.loadFile('index.html');

    // IPC handlers for window controls
    ipcMain.on('app-minimize', () => {
        win.minimize();
    });

    ipcMain.on('app-close', () => {
        win.close();
    });

    // IPC handlers for file dialogs
    ipcMain.handle('dialog-save-text', async () => {
        const { filePath } = await dialog.showSaveDialog(win, {
            title: 'Export as Text',
            filters: [{ name: 'Text Files', extensions: ['txt'] }],
            defaultPath: 'delays.txt'
        });
        return filePath;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
