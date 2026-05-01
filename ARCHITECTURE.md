# Backend-server-Veda 模块化架构

## 项目概述

Backend-server-Veda 是一个模块化的后端服务器，为韦达书库生态系统提供统一的 API 接口。采用模块化设计，支持多个功能模块的独立开发和部署。

## 架构设计

### 核心原则

1. **模块独立性**：每个模块有独立的路由、中间件和数据处理逻辑
2. **统一入口**：所有请求通过主服务器统一处理和路由
3. **可扩展性**：新模块可以轻松添加，无需修改核心代码
4. **数据隔离**：各模块的数据存储相对独立，避免耦合

### 目录结构

```
Backend-server-Veda/
├── server.js                 # 主服务器入口
├── config.js                 # 全局配置
├── package.json              # 项目依赖
├── middleware/               # 全局中间件
│   ├── auth.js              # 身份认证
│   └── sensitive-filter.js  # 敏感词过滤
├── modules/                  # 功能模块
│   ├── memo/                # 数字化学习空间模块
│   │   ├── routes.js        # 路由定义
│   │   ├── controllers.js   # 业务逻辑
│   │   ├── models.js        # 数据模型
│   │   └── data/            # 模块数据
│   └── veda/                # 韦达书库模块
│       ├── routes.js        # 路由定义
│       ├── controllers.js   # 业务逻辑
│       ├── models.js        # 数据模型
│       └── data/            # 模块数据
├── db/                       # 数据库
│   └── database.js          # 数据库连接
├── uploads/                  # 上传文件存储
└── docs/                     # 文档
    ├── API.md               # API 文档
    └── MODULES.md           # 模块文档
```

## 模块说明

### 1. Memo 模块（数字化学习空间）

**功能**：用户认证、打卡圈子、备忘录、用户管理等

**API 前缀**：`/api/memo`

**主要接口**：
- `/api/memo/auth/*` - 身份认证
- `/api/memo/users/*` - 用户管理
- `/api/memo/circles/*` - 打卡圈子
- `/api/memo/checkins/*` - 打卡记录
- `/api/memo/memos/*` - 备忘录
- `/api/memo/upload/*` - 文件上传

### 2. Veda 模块（韦达书库）

**功能**：提供韦达经典文献数据（博伽梵歌、圣典博伽瓦谭等）

**API 前缀**：`/api/veda`

**主要接口**：
- `/api/veda/bg` - 博伽梵歌
- `/api/veda/sb/index` - 圣典博伽瓦谭目录
- `/api/veda/sb/canto/:cantoNum` - 指定篇章
- `/api/veda/akadasi` - 爱卡达西
- `/api/veda/calendar` - 韦达日历
- `/api/veda/word-mapping` - 梵文单词映射

## 模块开发指南

### 创建新模块

1. **在 `modules/` 下创建模块目录**
   ```bash
   mkdir -p modules/your-module
   ```

2. **创建模块文件**
   ```
   modules/your-module/
   ├── routes.js        # 定义路由
   ├── controllers.js   # 业务逻辑
   ├── models.js        # 数据模型
   └── data/            # 数据文件
   ```

3. **在 `server.js` 中注册模块**
   ```javascript
   app.use('/api/your-module', require('./modules/your-module/routes'));
   ```

### 模块文件模板

**routes.js**：
```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Module is running' });
});

module.exports = router;
```

**controllers.js**：
```javascript
// 业务逻辑处理

module.exports = {
  // 导出处理函数
};
```

**models.js**：
```javascript
// 数据模型定义

module.exports = {
  // 导出数据模型
};
```

## 中间件

### 全局中间件

- **CORS**：跨域资源共享
- **JSON 解析**：请求体 JSON 解析
- **身份认证**：JWT 令牌验证（可选）
- **敏感词过滤**：内容安全检查

## 数据库

- **SQLite**：本地数据库，用于用户、圈子、打卡等数据存储
- **JSON 文件**：用于静态数据（如韦达经典文献）

## 部署

### 本地运行

```bash
npm install
npm start
```

### 生产环境

```bash
NODE_ENV=production npm start
```

## API 健康检查

```bash
GET http://localhost:3000/api/health
```

## 扩展性

该架构支持以下扩展：

1. **新模块添加**：无需修改核心代码
2. **数据库升级**：可从 SQLite 迁移到 MySQL/PostgreSQL
3. **缓存层**：可添加 Redis 缓存
4. **消息队列**：可集成 RabbitMQ/Kafka
5. **日志系统**：可集成 Winston/Bunyan

## 版本历史

- **v1.0.0**（2026-05-01）：初始发布，包含 Memo 和 Veda 两个模块
