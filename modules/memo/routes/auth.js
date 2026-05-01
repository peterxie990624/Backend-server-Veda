// ============================================================
// 用户认证路由 - 注册 / 登录
// 可独立移植到其他项目
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDb } = require('../db/database');
const config = require('../config');
const filterSystem = require('./sensitive-filter');

// POST /api/auth/register - 用户注册
router.post('/register', (req, res) => {
  if (!config.FEATURES.ALLOW_REGISTER) {
    return res.status(403).json({ success: false, message: '注册功能已关闭' });
  }

  const { username, password, display_name } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ success: false, message: '用户名长度需在3-20字符之间' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
  }
  
  // 检查敏感词
  const nameToCheck = display_name || username;
  if (filterSystem.hasSensitiveWord(nameToCheck)) {
    return res.status(400).json({ success: false, message: '昵称或用户名包含敏感词，请修改' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ success: false, message: '用户名已存在' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  ).run(username, password_hash, display_name || username);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    message: '注册成功',
    token,
    user: { id: result.lastInsertRowid, username, display_name: display_name || username }
  });
});

// POST /api/auth/login - 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username, display_name: user.display_name }
  });
});

// GET /api/auth/me - 获取当前用户信息（需要认证）
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, display_name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, user });
});

module.exports = router;
