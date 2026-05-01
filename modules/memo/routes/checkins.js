/**
 * 打卡路由
 */
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取圈子打卡动态（分页）
router.get('/circle/:circleId', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const circleId = parseInt(req.params.circleId);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const isMember = db.prepare('SELECT id FROM circle_members WHERE circle_id = ? AND user_id = ?').get(circleId, userId);
  if (!isMember) return res.status(403).json({ success: false, message: '请先加入圈子才能查看打卡动态' });

  const checkins = db.prepare(`
    SELECT c.*,
      u.username, u.display_name, u.avatar,
      (SELECT COUNT(*) FROM checkin_likes WHERE checkin_id = c.id) as like_count,
      (SELECT COUNT(*) FROM checkin_likes WHERE checkin_id = c.id AND user_id = ?) as is_liked
    FROM checkins c
    JOIN users u ON c.user_id = u.id
    WHERE c.circle_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, circleId, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM checkins WHERE circle_id = ?').get(circleId).cnt;

  res.json({
    success: true,
    checkins: checkins.map(c => ({
      ...c,
      images: JSON.parse(c.images || '[]'),
      is_liked: c.is_liked > 0,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// 在圈子打卡
router.post('/circle/:circleId', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const circleId = parseInt(req.params.circleId);
  const { content, images, date } = req.body;

  const isMember = db.prepare('SELECT id FROM circle_members WHERE circle_id = ? AND user_id = ?').get(circleId, userId);
  if (!isMember) return res.status(403).json({ success: false, message: '请先加入圈子才能打卡' });

  const today = date || new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT id FROM checkins WHERE user_id = ? AND circle_id = ? AND date = ?').get(userId, circleId, today);
  if (existing) return res.status(409).json({ success: false, message: '今天已经打卡了 🌸' });

  const result = db.prepare(`
    INSERT INTO checkins (user_id, circle_id, date, content, images)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, circleId, today, content || '', JSON.stringify(images || []));

  const checkin = db.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar
    FROM checkins c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    message: '打卡成功！🎉',
    checkin: { ...checkin, images: JSON.parse(checkin.images || '[]') }
  });
});

// 获取我的全年打卡热力图数据
router.get('/my/year/:year', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const year = parseInt(req.params.year);

  const rows = db.prepare(`
    SELECT date, COUNT(DISTINCT circle_id) as count
    FROM checkins
    WHERE user_id = ? AND date LIKE ?
    GROUP BY date
  `).all(userId, year + '-%');

  const heatmap = {};
  rows.forEach(r => { heatmap[r.date] = r.count; });

  res.json({ success: true, year, heatmap });
});

// 获取我的打卡统计
router.get('/my/stats', (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const totalDays = db.prepare(`
    SELECT COUNT(DISTINCT date) as cnt FROM checkins WHERE user_id = ?
  `).get(userId).cnt;

  const dates = db.prepare(`
    SELECT DISTINCT date FROM checkins WHERE user_id = ? ORDER BY date DESC
  `).all(userId).map(r => r.date);

  let streak = 0;
  if (dates.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] === today || dates[0] === yesterday) {
      let current = new Date(dates[0]);
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i]);
        const diff = (current - prev) / 86400000;
        if (diff === 1) { streak++; current = prev; } else break;
      }
    }
  }

  const circleStats = db.prepare(`
    SELECT ci.id, ci.name, ci.cover,
      COUNT(DISTINCT ch.date) as my_checkin_days
    FROM circle_members cm
    JOIN circles ci ON cm.circle_id = ci.id
    LEFT JOIN checkins ch ON ch.circle_id = ci.id AND ch.user_id = ?
    WHERE cm.user_id = ?
    GROUP BY ci.id
  `).all(userId, userId);

  res.json({
    success: true,
    stats: { total_days: totalDays, streak, circles: circleStats }
  });
});

// 点赞 / 取消点赞
router.post('/:id/like', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const checkinId = parseInt(req.params.id);

  const existing = db.prepare('SELECT id FROM checkin_likes WHERE checkin_id = ? AND user_id = ?').get(checkinId, userId);

  if (existing) {
    db.prepare('DELETE FROM checkin_likes WHERE checkin_id = ? AND user_id = ?').run(checkinId, userId);
    const count = db.prepare('SELECT COUNT(*) as cnt FROM checkin_likes WHERE checkin_id = ?').get(checkinId).cnt;
    return res.json({ success: true, liked: false, like_count: count });
  } else {
    db.prepare('INSERT INTO checkin_likes (checkin_id, user_id) VALUES (?, ?)').run(checkinId, userId);
    const count = db.prepare('SELECT COUNT(*) as cnt FROM checkin_likes WHERE checkin_id = ?').get(checkinId).cnt;
    return res.json({ success: true, liked: true, like_count: count });
  }
});

module.exports = router;
