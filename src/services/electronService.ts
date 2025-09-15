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
  // FIX: 添加类型断言解决window.isElectron不存在的问题
  return (window as any).isElectron === true;
};

// 获取Electron API
export const getElectronAPI = (): ElectronAPI | null => {
  if (!isElectron()) {
    console.warn('Not running in Electron environment');
    return null;
  }
  // FIX: 添加类型断言解决window.electronAPI不存在的问题
  return (window as any).electronAPI;
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
    // Web环境替代实现
    try {
      // 创建一个文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      
      // 设置接受的文件类型
      if (options.filters && options.filters.length > 0) {
        const acceptTypes = options.filters
          .flatMap(filter => filter.extensions.map(ext => `.${ext}`))
          .join(',');
        input.accept = acceptTypes;
      }
      
      // 设置多选
      if (options.properties && options.properties.includes('multiSelections')) {
        input.multiple = true;
      }
      
      // 创建Promise以处理文件选择
      return new Promise((resolve) => {
        input.onchange = (event) => {
          const files = (event.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            resolve({ canceled: true, filePaths: [] });
            return;
          }
          
          const filePaths = Array.from(files).map(file => {
            // 为每个文件创建一个临时URL
            const url = URL.createObjectURL(file);
            // 存储文件信息到sessionStorage以便后续使用
            sessionStorage.setItem(`file_${url}`, JSON.stringify({
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified
            }));
            return url;
          });
          
          resolve({ canceled: false, filePaths });
        };
        
        // 用户关闭对话框而不选择文件
        input.oncancel = () => {
          resolve({ canceled: true, filePaths: [] });
        };
        
        // 触发文件选择器
        input.click();
      });
    } catch (error: unknown) {
      console.error('Error showing web file dialog:', error);
      return null;
    }
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
    // Web环境替代实现
    try {
      // 获取默认文件名
      const defaultFileName = options.defaultPath ? 
        options.defaultPath.split(/[\\/]/).pop() || 'download' : 
        'download';
      
      // 获取文件扩展名
      let fileExtension = '';
      if (options.filters && options.filters.length > 0 && options.filters[0].extensions.length > 0) {
        fileExtension = options.filters[0].extensions[0];
      }
      
      // 组合完整文件名
      const fileName = defaultFileName.includes('.') ? 
        defaultFileName : 
        `${defaultFileName}.${fileExtension}`;
      
      // 创建一个虚拟的保存路径（实际上是一个标识符）
      const virtualPath = `web_save_${Date.now()}_${fileName}`;
      
      // 存储文件名到sessionStorage，以便后续使用
      sessionStorage.setItem(`save_path_${virtualPath}`, fileName);
      
      return Promise.resolve({
        canceled: false,
        filePath: virtualPath
      });
    } catch (error: unknown) {
      console.error('Error showing web save dialog:', error);
      return null;
    }
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

// Web环境下载文件的辅助函数
export const downloadFileInWeb = (content: string | Blob, fileName: string): void => {
  // 如果内容是字符串，转换为Blob
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/plain' }) 
    : content;
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  
  // 添加到文档中并触发点击
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// 从Web保存路径获取文件名
export const getFileNameFromWebPath = (webPath: string): string | null => {
  if (!webPath.startsWith('web_save_')) {
    return null;
  }
  
  const savedFileName = sessionStorage.getItem(`save_path_${webPath}`);
  return savedFileName || webPath.split('_').slice(2).join('_');
};