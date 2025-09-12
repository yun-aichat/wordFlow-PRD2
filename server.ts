import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { Request, Response } from 'express';

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());

// 确保上传目录存在
const imageUploadDir = path.join(__dirname, 'public/images');
const fileUploadDir = path.join(__dirname, 'public/files');
fs.ensureDirSync(imageUploadDir);
fs.ensureDirSync(fileUploadDir);

// 存储图片哈希到文件名的映射
interface ImageHashMap {
  [hash: string]: string;
}

const imageHashMapPath = path.join(__dirname, 'image-hash-map.json');

// 加载或创建图片哈希映射表
let imageHashMap: ImageHashMap = {};
try {
  if (fs.existsSync(imageHashMapPath)) {
    imageHashMap = JSON.parse(fs.readFileSync(imageHashMapPath, 'utf8'));
    console.log('已加载图片哈希映射表');
  } else {
    fs.writeFileSync(imageHashMapPath, JSON.stringify({}), 'utf8');
    console.log('已创建新的图片哈希映射表');
  }
} catch (error) {
  console.error('加载图片哈希映射表失败:', error);
  imageHashMap = {};
}

// 计算文件的哈希值
function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// 配置 Multer 用于图片上传
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

const uploadImage = multer({ storage: imageStorage });
const uploadFile = multer({ storage: fileStorage });

// 设置静态文件目录
app.use('/images', express.static(imageUploadDir));
app.use('/files', express.static(fileUploadDir));

// 保存哈希映射表到文件
function saveHashMap() {
  try {
    fs.writeFileSync(imageHashMapPath, JSON.stringify(imageHashMap), 'utf8');
    console.log('已保存图片哈希映射表');
  } catch (error) {
    console.error('保存图片哈希映射表失败:', error);
  }
}

// 图片上传接口
app.post('/upload', uploadImage.single('image'), async (req, res) => {
  console.log('收到上传请求');
  console.log('请求体:', req.body);
  console.log('文件:', req.file);
  
  if (!req.file) {
    console.log('没有文件被上传');
    return res.status(400).send('No file uploaded.');
  }
  
  try {
    // 计算上传文件的哈希值
    const filePath = req.file.path;
    const fileHash = await calculateFileHash(filePath);
    console.log('文件哈希值:', fileHash);
    
    // 检查是否已存在相同哈希值的图片
    if (imageHashMap[fileHash]) {
      console.log('发现重复图片，使用已有图片:', imageHashMap[fileHash]);
      
      // 删除新上传的重复文件
      fs.unlinkSync(filePath);
      
      // 返回已存在的图片URL
      const existingImageUrl = `/images/${imageHashMap[fileHash]}`;
      return res.json({ imageUrl: existingImageUrl, isDuplicate: true });
    }
    
    // 如果是新图片，保存哈希映射
    imageHashMap[fileHash] = req.file.filename;
    saveHashMap();
    
    // 返回新图片的访问路径
    const imageUrl = `/images/${req.file.filename}`;
    console.log('新图片URL:', imageUrl);
    res.json({ imageUrl, isDuplicate: false });
  } catch (error) {
    console.error('处理图片时出错:', error);
    res.status(500).json({ error: '图片处理失败' });
  }
});

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