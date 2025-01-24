const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Размеры бэкграунда
const BACKGROUND_WIDTH = 2106;
const BACKGROUND_HEIGHT = 2026;

function createWindow() {
    // Получаем размеры основного экрана
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // Рассчитываем размеры окна на основе пропорций бэкграунда
    const aspectRatio = BACKGROUND_WIDTH / BACKGROUND_HEIGHT;
    const windowHeight = screenHeight; // Высота окна равна высоте экрана
    const windowWidth = windowHeight * aspectRatio;

    const win = new BrowserWindow({
        width: windowWidth, // Ширина окна
        height: windowHeight, // Высота окна
        fullscreen: false, // Окно не в полноэкранном режиме
        maximized: true, // Окно развернуто на весь экран
        resizable: true, // Разрешаем изменение размеров окна
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Загружаем index.html
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