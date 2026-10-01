'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('foundryDesktop', {
  isDesktop: true,
  pickFolder: () => ipcRenderer.invoke('foundry:pick-folder'),
  openExternal: (url) => ipcRenderer.invoke('foundry:open-external', url),
});
