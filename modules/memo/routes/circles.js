/**
 * 打卡圈子路由
 * GET    /api/circles              - 获取所有公开圈子（含我加入的）
 * POST   /api/circles              - 创建圈子
 * GET    /api/circles/:id          - 获取圈子详情
 * POST   /api/circles/:id/join     - 加入圈子（带密码验证）
 * POST   /api/circles/:id/leave    - 退出圈子
 * GET    /api/circles/:id/members  - 获取圈子成员列表
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取所有圈子（公开 + 我加入的私密）
router.get('/', (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const circles = db.prepare(`
    SELECT c.*,
      u.display_name as creator_name,
      u.username as creator_username,
      (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id) as member_count,
      (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id AND user_id = ?) as is_joined
    FROM circles c
    JOIN users u ON c.creator_id = u.id
    WHERE c.is_private = 0
       OR c.creator_id = ?
       OR EXISTS (SELECT 1 FROM circle_members WHERE circle_id = c.id AND user_id = ?)
    ORDER BY c.created_at DESC
  `).all(userId, userId, userId);

  res.json({ success: true, circles: circles.map(c => ({
    ...c,
    is_joined: c.is_joined > 0,
    has_password: !!c.password_hash,
    password_hash: undefined,
  }))});
});

// 创建圈子
router.post('/', async (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { name, description, is_private, password } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: '圈子名称至少2个字符' });
  }

  let passwordHash = null;
  if (is_private && password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const result = db.prepare(`
    INSERT INTO circles (name, description, is_private, password_hash, creator_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), description || '', is_private ? 1 : 0, passwordHash, userId);

  // 创建者自动加入圈子，角色为 owner
  db.prepare(`
    INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, 'owner')
  `).run(result.lastInsertRowid, userId);

  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    success: true,
    message: '圈子创建成功！',
    circle: { ...circle, password_hash: undefined, has_password: !!circle.password_hash }
  });
});

// 获取圈子详情
router.get('/:id', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const circleId = parseInt(req.params.id);

  const circle = db.prepare(`
    SELECT c.*,
      u.display_name as creator_name,
      (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id) as member_count,
      (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id AND user_id = ?) as is_joined
    FROM circles c
    JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
  `).get(userId, circleId);

  if (!circle) return res.status(404).json({ success: false, message: '圈子不存在' });

  res.json({ success: true, circle: {
    ...circle,
    is_joined: circle.is_joined > 0,
    has_password: !!circle.password_hash,
    password_hash: undefined,
  }});
});

// 加入圈子
router.post('/:id/join', async (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const circleId = parseInt(req.params.id);
  const { password } = req.body;

  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(circleId);
  if (!circle) return res.status(404).json({ success: false, message: '圈子不存在' });

  // 检查是否已加入
  const existing = db.prepare('SELECT id FROM circle_members WHERE circle_id = ? AND user_id = ?').get(circleId, userId);
  if (existing) return res.status(409).json({ success: false, message: '您已经在这个圈子里了' });

  // 验证密码
  if (circle.password_hash) {
    if (!password) return res.status(403).json({ success: false, message: '该圈子需要密码才能加入', need_password: true });
    const valid = await bcrypt.compare(password, circle.password_hash);
    if (!valid) return res.status(403).json({ success: false, message: '密码错误' });
  }

  db.prepare('INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, ?)').run(circleId, userId, 'member');
  res.json({ success: true, message: `成功加入「${circle.name}」🎉` });
});

// 退出圈子
router.post('/:id/leave', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const circleId = parseInt(req.params.id);

  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(circleId);
  if (!circle) return res.status(404).json({ success: false, message: '圈子不存在' });
  if (circle.creator_id === userId) return res.status(400).json({ success: false, message: '创建者不能退出圈子，可以解散圈子' });

  db.prepare('DELETE FROM circle_members WHERE circle_id = ? AND user_id = ?').run(circleId, userId);
  res.json({ success: true, message: '已退出圈子' });
});

// 获取圈子成员
router.get('/:id/members', (req, res) => {
  const db = getDb();
  const circleId = parseInt(req.params.id);

  const members = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar, cm.role, cm.joined_at,
      (SELECT COUNT(*) FROM checkins WHERE user_id = u.id AND circle_id = ?) as checkin_count,
      (SELECT MAX(date) FROM checkins WHERE user_id = u.id AND circle_id = ?) as last_checkin
    FROM circle_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.circle_id = ?
    ORDER BY cm.role DESC, cm.joined_at ASC
  `).all(circleId, circleId, circleId);

  res.json({ success: true, members });
});

module.exports = router;
