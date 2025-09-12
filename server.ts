import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Request, Response } from 'express';

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());

// 确保上传目录存在
const fileUploadDir = path.join(__dirname, 'public/files');
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
app.use('/files', express.static(fileUploadDir));



// 文件上传接口
app.post('/upload-file', uploadFile.single('file'), async (req: Request, res: Response) => {
  console.log('收到文件上传请求');
  console.log('请求体:', req.body);
  console.log('文件:', req.file);
  
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

// 文件下载接口 (实际上通过静态文件服务已经可以直接访问)
app.get('/download/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(fileUploadDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});