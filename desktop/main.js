'use strict';

const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { fork } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
let serverProcess = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, token, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${url}/api/health`, { headers: { 'x-foundry-token': token } });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error('Foundry could not start its local service.');
}

async function startLocalService() {
  const port = await freePort();
  const token = crypto.randomBytes(32).toString('hex');
  const userData = app.getPath('userData');
  const stateDir = path.join(userData, 'state');
  const workspacesDir = path.join(userData, 'workspaces');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(workspacesDir, { recursive: true });
  const serverPath = path.join(__dirname, '..', 'server.js');
  serverProcess = fork(serverPath, [], {
    execPath: process.execPath,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      MC_PORT: String(port),
      MC_HOST: '127.0.0.1',
      MC_DESKTOP: '1',
      MC_DATA_DIR: stateDir,
      MC_PROJECT_DIR: workspacesDir,
      MC_PERMISSION_MODE: process.env.MC_PERMISSION_MODE || 'acceptEdits',
      MC_LOCAL_TOKEN: token,
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  serverProcess.stdout.on('data', (chunk) => console.log(`[foundry] ${chunk.toString().trim()}`));
  serverProcess.stderr.on('data', (chunk) => console.error(`[foundry] ${chunk.toString().trim()}`));
  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url, token);
  return `${url}/?token=${encodeURIComponent(token)}`;
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#181713',
    show: false,
    title: 'Foundry',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https:\/\//i.test(target)) shell.openExternal(target);
    return { action: 'deny' };
  });
}

function stopLocalService() {
  if (!serverProcess) return;
  try { serverProcess.kill(); } catch {}
  serverProcess = null;
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ipcMain.handle('foundry:pick-folder', async () => {
      const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
      return result.canceled ? null : result.filePaths[0];
    });
    ipcMain.handle('foundry:open-external', async (_event, url) => {
      if (/^https:\/\//i.test(url)) await shell.openExternal(url);
    });
    try {
      createWindow(await startLocalService());
    } catch (error) {
      dialog.showErrorBox('Foundry could not start', error.message);
      app.quit();
    }
  });
}

app.on('before-quit', stopLocalService);
app.on('window-all-closed', () => app.quit());
