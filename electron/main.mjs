import { app, BrowserWindow, globalShortcut, shell } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Vite 注入的环境变量
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = join(__dirname, '..', 'dist');

// 窗口状态文件
const stateFile = join(app.getPath('userData'), 'window-state.json');

let mainWindow = null;

// 读取上次保存的窗口状态
function loadWindowState() {
  try {
    const data = JSON.parse(readFileSync(stateFile, 'utf-8'));
    return {
      x: data.x,
      y: data.y,
      width: data.width || 1400,
      height: data.height || 900,
    };
  } catch {
    return { width: 1400, height: 900 };
  }
}

// 保存窗口状态
function saveWindowState() {
  if (!mainWindow?.isDestroyed()) {
    const bounds = mainWindow.getBounds();
    writeFileSync(stateFile, JSON.stringify({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    }), 'utf-8');
  }
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 900,
    minHeight: 600,
    title: '游戏王卡片生成器',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 阻止新窗口打开，在外部浏览器中打开链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 窗口移动/缩放时保存状态
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('close', saveWindowState);

  // 快捷键：Ctrl+Shift+I 打开 DevTools（仅开发模式）
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(RENDERER_DIST, 'index.html'));
  }
}

// 注册全局快捷键
function registerShortcuts() {
  // F12 打开 DevTools
  globalShortcut.register('F12', () => {
    mainWindow?.webContents.toggleDevTools();
  });
  // Ctrl+R / F5 刷新
  globalShortcut.register('F5', () => {
    mainWindow?.webContents.reload();
  });
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
