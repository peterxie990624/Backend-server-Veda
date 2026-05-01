// ============================================================
// Backend-server-Veda 主服务器
// 模块化架构：支持 Memo（数字化学习空间）和 Veda（韦达书库）模块
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const app = express();

// 中间件
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// 全局健康检查
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend-server-Veda 运行正常',
    version: '1.0.0',
    modules: {
      memo: '数字化学习空间',
      veda: '韦达书库'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 模块注册
// ============================================================

// Memo 模块（数字化学习空间）
const memoRoutes = require('./modules/memo/routes');
app.use('/api/memo', memoRoutes);

// Veda 模块（韦达书库）
const vedaRoutes = require('./modules/veda/routes');
app.use('/api/veda', vedaRoutes);

// ============================================================
// 错误处理
// ============================================================

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: '图片不能超过 5MB' });
  }
  res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

// ============================================================
// 启动服务
// ============================================================
app.listen(config.PORT, '127.0.0.1', () => {
  console.log('[API] 服务已启动，监听 127.0.0.1:' + config.PORT);
  console.log('[API] 健康检查: http://127.0.0.1:' + config.PORT + '/api/health');
  console.log('[API] 模块列表:');
  console.log('     - Memo: http://127.0.0.1:' + config.PORT + '/api/memo/health');
  console.log('     - Veda: http://127.0.0.1:' + config.PORT + '/api/veda/health');
});
