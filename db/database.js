// ============================================================
// 数据库模块 - SQLite
// 可独立移植，只需修改 config.js 中的 DB_PATH
// ============================================================

const Database = require('better-sqlite3');
const config = require('../config');

let db;

function getDb() {
  if (!db) {
    db = new Database(config.DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar TEXT,
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 备忘录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '无标题',
      content TEXT DEFAULT '',
      category TEXT DEFAULT 'life',
      is_important INTEGER DEFAULT 0,
      memo_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 打卡圈子表
  db.exec(`
    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover TEXT,
      password_hash TEXT,
      is_private INTEGER DEFAULT 0,
      creator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 圈子成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS circle_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(circle_id, user_id),
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 打卡记录表（关联圈子）
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      circle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, circle_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
    )
  `);

  // 打卡点赞表
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkin_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkin_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(checkin_id, user_id),
      FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('[DB] 数据库初始化完成，路径:', config.DB_PATH);
}

module.exports = { getDb };
