// ============================================================
// Veda 模块路由
// 韦达书库功能模块
// ============================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');

// 缓存对象（避免重复读取文件）
const dataCache = {};

/**
 * 读取 JSON 数据文件
 * @param {string} filename - 文件名
 * @returns {object} 解析后的 JSON 数据
 */
function loadData(filename) {
  if (dataCache[filename]) {
    return dataCache[filename];
  }
  
  try {
    const filepath = path.join(DATA_DIR, filename);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    dataCache[filename] = data;
    return data;
  } catch (err) {
    console.error(`[VEDA] 读取文件失败: ${filename}`, err.message);
    return null;
  }
}

/**
 * GET /api/veda/bg
 * 获取博伽梵歌数据
 */
router.get('/bg', (req, res) => {
  try {
    const data = loadData('bg_data.json');
    if (!data) {
      return res.status(404).json({ success: false, message: '博伽梵歌数据不存在' });
    }
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/sb/index
 * 获取圣典博伽瓦谭目录索引
 */
router.get('/sb/index', (req, res) => {
  try {
    const data = loadData('sb_index.json');
    if (!data) {
      return res.status(404).json({ success: false, message: '圣典博伽瓦谭索引不存在' });
    }
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/sb/canto/:cantoNum
 * 获取圣典博伽瓦谭指定篇章的数据
 * @param {number} cantoNum - 篇章号（1-12）
 */
router.get('/sb/canto/:cantoNum', (req, res) => {
  try {
    const { cantoNum } = req.params;
    const filename = `sb/canto_${cantoNum}.json`;
    
    const data = loadData(filename);
    if (!data) {
      return res.status(404).json({ success: false, message: `第 ${cantoNum} 篇数据不存在` });
    }
    
    res.json({
      success: true,
      data: data,
      canto: parseInt(cantoNum),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/akadasi
 * 获取爱卡达西数据
 */
router.get('/akadasi', (req, res) => {
  try {
    const data = loadData('akadasi_data.json');
    if (!data) {
      return res.status(404).json({ success: false, message: '爱卡达西数据不存在' });
    }
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/calendar
 * 获取韦达日历数据
 */
router.get('/calendar', (req, res) => {
  try {
    const data = loadData('calendar_data.json');
    if (!data) {
      return res.status(404).json({ success: false, message: '日历数据不存在' });
    }
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/word-mapping
 * 获取梵文-中文单词映射表
 */
router.get('/word-mapping', (req, res) => {
  try {
    const data = loadData('word_mapping.json');
    if (!data) {
      return res.status(404).json({ success: false, message: '单词映射表不存在' });
    }
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/veda/health
 * 韦达书库 API 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Veda 模块（韦达书库）正常运行',
    modules: {
      bg: '博伽梵歌',
      sb: '圣典博伽瓦谭',
      akadasi: '爱卡达西',
      calendar: '韦达日历',
      wordMapping: '梵文单词映射'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
