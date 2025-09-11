import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());

// 确保 public/images 目录存在
const uploadDir = path.join(__dirname, 'public/images');
fs.ensureDirSync(uploadDir);

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

// 配置 Multer 用于文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 设置静态文件目录
app.use('/images', express.static(uploadDir));

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
app.post('/upload', upload.single('image'), async (req, res) => {
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

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});