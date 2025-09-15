const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件系统操作
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // 应用信息
  getAppVersion: () => process.env.npm_package_version,
  
  // 可以根据需要添加更多API
});

// 注入一个标识，表明应用运行在Electron环境中
contextBridge.exposeInMainWorld('isElectron', true);