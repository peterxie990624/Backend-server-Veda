// ============================================================
// 备忘录 CRUD 路由
// 可独立移植到其他项目
// ============================================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const config = require('../config');

// 所有备忘录路由都需要登录
router.use(authMiddleware);

// GET /api/memos - 获取当前用户的所有备忘录
router.get('/', (req, res) => {
  if (!config.FEATURES.MEMOS_ENABLED) {
    return res.status(503).json({ success: false, message: '备忘录功能已关闭' });
  }

  const db = getDb();
  const { category, date, keyword } = req.query;

  let sql = 'SELECT * FROM memos WHERE user_id = ?';
  const params = [req.user.id];

  if (category && category !== 'all') {
    if (category === 'important') {
      sql += ' AND is_important = 1';
    } else {
      sql += ' AND category = ?';
      params.push(category);
    }
  }

  if (date) {
    sql += ' AND memo_date = ?';
    params.push(date);
  }

  if (keyword) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY updated_at DESC';

  const memos = db.prepare(sql).all(...params);
  res.json({ success: true, memos });
});

// POST /api/memos - 新建备忘录
router.post('/', (req, res) => {
  if (!config.FEATURES.MEMOS_ENABLED) {
    return res.status(503).json({ success: false, message: '备忘录功能已关闭' });
  }

  const { title, content, category, is_important, memo_date } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: '标题不能为空' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO memos (user_id, title, content, category, is_important, memo_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title,
    content || '',
    category || 'life',
    is_important ? 1 : 0,
    memo_date || null
  );

  const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, message: '创建成功', memo });
});

// PUT /api/memos/:id - 编辑备忘录
router.put('/:id', (req, res) => {
  const db = getDb();
  const memo = db.prepare('SELECT * FROM memos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!memo) {
    return res.status(404).json({ success: false, message: '备忘录不存在或无权限' });
  }

  const { title, content, category, is_important, memo_date } = req.body;

  db.prepare(`
    UPDATE memos SET
      title = ?,
      content = ?,
      category = ?,
      is_important = ?,
      memo_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? memo.title,
    content ?? memo.content,
    category ?? memo.category,
    is_important !== undefined ? (is_important ? 1 : 0) : memo.is_important,
    memo_date !== undefined ? memo_date : memo.memo_date,
    req.params.id,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM memos WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: '更新成功', memo: updated });
});

// DELETE /api/memos/:id - 删除备忘录
router.delete('/:id', (req, res) => {
  const db = getDb();
  const memo = db.prepare('SELECT * FROM memos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!memo) {
    return res.status(404).json({ success: false, message: '备忘录不存在或无权限' });
  }

  db.prepare('DELETE FROM memos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
