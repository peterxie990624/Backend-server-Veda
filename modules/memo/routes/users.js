/**
 * 用户资料路由
 * GET  /api/users/me          - 获取我的资料
 * PUT  /api/users/me          - 更新资料
 * GET  /api/users/:id/profile - 获取他人资料
 */
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取我的资料
router.get('/me', (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const user = db.prepare('SELECT id, username, display_name, avatar, bio, created_at FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

  // 打卡统计
  const totalDays = db.prepare('SELECT COUNT(DISTINCT date) as cnt FROM checkins WHERE user_id = ?').get(userId).cnt;
  const dates = db.prepare('SELECT DISTINCT date FROM checkins WHERE user_id = ? ORDER BY date DESC').all(userId).map(r => r.date);
  let streak = 0;
  if (dates.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] === today || dates[0] === yesterday) {
      let current = new Date(dates[0]);
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i]);
        if ((current - prev) / 86400000 === 1) { streak++; current = prev; } else break;
      }
    }
  }

  // 加入的圈子
  const circles = db.prepare(`
    SELECT ci.id, ci.name, ci.cover, cm.role, cm.joined_at,
      COUNT(DISTINCT ch.date) as my_checkin_days
    FROM circle_members cm
    JOIN circles ci ON cm.circle_id = ci.id
    LEFT JOIN checkins ch ON ch.circle_id = ci.id AND ch.user_id = ?
    WHERE cm.user_id = ?
    GROUP BY ci.id
  `).all(userId, userId);

  res.json({
    success: true,
    user: { ...user, total_days: totalDays, streak, circles }
  });
});

// 更新我的资料
router.put('/me', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { display_name, bio, avatar } = req.body;

  db.prepare('UPDATE users SET display_name = ?, bio = ?, avatar = ? WHERE id = ?')
    .run(display_name || '', bio || '', avatar || null, userId);

  const user = db.prepare('SELECT id, username, display_name, avatar, bio FROM users WHERE id = ?').get(userId);
  res.json({ success: true, message: '资料已更新', user });
});

// 获取他人资料（公开信息）
router.get('/:id/profile', (req, res) => {
  const db = getDb();
  const targetId = parseInt(req.params.id);

  const user = db.prepare('SELECT id, username, display_name, avatar, bio, created_at FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

  const totalDays = db.prepare('SELECT COUNT(DISTINCT date) as cnt FROM checkins WHERE user_id = ?').get(targetId).cnt;

  res.json({ success: true, user: { ...user, total_days: totalDays } });
});

module.exports = router;
