// 检查是否在Electron环境中运行

// 导入ElectronAPI接口
type ElectronAPI = {
  showOpenDialog: (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  
  getAppVersion: () => string;
};

export const isElectron = (): boolean => {
  return window.isElectron === true;
};

// 获取Electron API
export const getElectronAPI = (): ElectronAPI | null => {
  if (!isElectron()) {
    console.warn('Not running in Electron environment');
    return null;
  }
  return window.electronAPI;
};

// 打开文件对话框
export const showOpenFileDialog = async (options: {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: string[];
}): Promise<{ canceled: boolean; filePaths: string[] } | null> => {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    console.warn('Electron API not available');
    return null;
  }

  try {
    return await electronAPI.showOpenDialog(options);
  } catch (error: unknown) {
    console.error('Error showing open dialog:', error);
    return null;
  }
};

// 保存文件对话框
export const showSaveFileDialog = async (options: {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: { name: string; extensions: string[] }[];
}): Promise<{ canceled: boolean; filePath?: string } | null> => {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    console.warn('Electron API not available');
    return null;
  }

  try {
    return await electronAPI.showSaveDialog(options);
  } catch (error: unknown) {
    console.error('Error showing save dialog:', error);
    return null;
  }
};

// 获取应用版本
export const getAppVersion = (): string => {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    return '1.0.0'; // 默认版本
  }

  try {
    return electronAPI.getAppVersion() || '1.0.0';
  } catch (error: unknown) {
    console.error('Error getting app version:', error);
    return '1.0.0';
  }
};