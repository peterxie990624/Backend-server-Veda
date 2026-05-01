// ============================================================
// Memo 模块路由聚合
// 数字化学习空间功能模块
// ============================================================
const express = require('express');
const router = express.Router();

// 导入各个子路由
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const circlesRoutes = require('./routes/circles');
const checkinsRoutes = require('./routes/checkins');
const memosRoutes = require('./routes/memos');

// ============================================================
// 模块健康检查
// ============================================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Memo 模块（数字化学习空间）正常运行',
    features: {
      auth: '身份认证',
      users: '用户管理',
      circles: '打卡圈子',
      checkins: '打卡记录',
      memos: '备忘录',
      upload: '文件上传'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 子模块路由
// ============================================================
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/upload', uploadRoutes);
router.use('/circles', circlesRoutes);
router.use('/checkins', checkinsRoutes);
router.use('/memos', memosRoutes);

module.exports = router;
