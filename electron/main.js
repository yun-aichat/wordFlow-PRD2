const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow;

// 创建Express应用
function createExpressApp() {
  const expressApp = express();
  const port = 3001;

  // 启用 CORS
  expressApp.use(cors());

  // 确保上传目录存在
  const fileUploadDir = path.join(app.getPath('userData'), 'files');
  fs.ensureDirSync(fileUploadDir);

  // 配置 Multer 用于文档文件上传
  const fileStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, fileUploadDir);
    },
    filename: (_req, file, cb) => {
      // 保留原始文件名，但添加时间戳避免冲突
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, uniqueSuffix + '-' + safeFilename);
    }
  });

  const uploadFile = multer({ storage: fileStorage });

  // 设置静态文件目录
  expressApp.use('/files', express.static(fileUploadDir));

  // 文件上传接口
  expressApp.post('/upload-file', uploadFile.single('file'), async (req, res) => {
    console.log('收到文件上传请求');
    
    if (!req.file) {
      console.log('没有文件被上传');
      return res.status(400).send('No file uploaded.');
    }
    
    try {
      // 返回文件的访问路径和原始文件名
      const fileUrl = `/files/${req.file.filename}`;
      const originalName = req.body.originalName || req.file.originalname;
      
      console.log('文件URL:', fileUrl);
      res.json({ 
        fileUrl,
        fileName: originalName,
        fileSize: req.file.size,
        fileType: req.file.mimetype
      });
    } catch (error) {
      console.error('处理文件时出错:', error);
      res.status(500).json({ error: '文件处理失败' });
    }
  });

  // 文件下载接口
  expressApp.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(fileUploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // 启动Express服务器
  expressApp.listen(port, () => {
    console.log(`Backend server is running at http://localhost:${port}`);
  });

  return expressApp;
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png')
  });

  // 根据环境加载应用
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // 开发环境：连接到Vite开发服务器
    mainWindow.loadURL('http://localhost:3000');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的应用
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createExpressApp();
  createWindow();

  app.on('activate', () => {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (mainWindow === null) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用及其菜单栏通常会保持活动状态，直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') app.quit();
});

// 在这里可以包含应用的其他特定进程代码

// 处理文件对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// 处理保存对话框
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});