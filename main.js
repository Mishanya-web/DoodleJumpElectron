const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

const BACKGROUND_WIDTH = 2106;
const BACKGROUND_HEIGHT = 2026;

function createWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    const aspectRatio = BACKGROUND_WIDTH / BACKGROUND_HEIGHT;
    const windowHeight = screenHeight;
    const windowWidth = windowHeight * aspectRatio;

    const win = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        fullscreen: false,
        maximized: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});