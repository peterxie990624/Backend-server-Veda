/**
 * 图片上传路由
 * POST /api/upload/image - 上传图片，返回 URL
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).substr(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('只支持 jpg/png/gif/webp 格式'));
  }
});

router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请选择图片' });
  const url = '/uploads/' + req.file.filename;
  res.json({ success: true, url });
});

module.exports = router;
