# Backend-server-Veda

模块化后端服务器，为韦达书库生态系统提供统一的 API 接口。

## 特性

- **模块化架构**：支持多个功能模块的独立开发和部署
- **Memo 模块**：数字化学习空间（用户认证、打卡圈子、备忘录等）
- **Veda 模块**：韦达书库（博伽梵歌、圣典博伽瓦谭等经典文献）
- **可扩展性**：轻松添加新模块，无需修改核心代码
- **数据隔离**：各模块的数据相对独立，避免耦合

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务器将在 `http://127.0.0.1:3000` 启动。

### 开发模式

```bash
npm run dev
```

使用 nodemon 自动重启服务器。

## API 文档

### 全局接口

- `GET /api/health` - 服务器健康检查

### Memo 模块（数字化学习空间）

- `GET /api/memo/health` - 模块健康检查
- `POST /api/memo/auth/register` - 用户注册
- `POST /api/memo/auth/login` - 用户登录
- `GET /api/memo/users/:userId` - 获取用户信息
- `GET /api/memo/circles` - 获取打卡圈子列表
- `POST /api/memo/checkins` - 打卡
- `GET /api/memo/memos` - 获取备忘录列表
- `POST /api/memo/upload` - 上传文件

详见 [Memo 模块文档](docs/MEMO.md)

### Veda 模块（韦达书库）

- `GET /api/veda/health` - 模块健康检查
- `GET /api/veda/bg` - 获取博伽梵歌
- `GET /api/veda/sb/index` - 获取圣典博伽瓦谭目录
- `GET /api/veda/sb/canto/:cantoNum` - 获取指定篇章
- `GET /api/veda/akadasi` - 获取爱卡达西
- `GET /api/veda/calendar` - 获取韦达日历
- `GET /api/veda/word-mapping` - 获取梵文单词映射

详见 [Veda 模块文档](docs/VEDA.md)

## 项目结构

```
Backend-server-Veda/
├── server.js                 # 主服务器入口
├── config.js                 # 全局配置
├── package.json              # 项目依赖
├── middleware/               # 全局中间件
├── modules/                  # 功能模块
│   ├── memo/                # 数字化学习空间模块
│   └── veda/                # 韦达书库模块
├── db/                       # 数据库
├── uploads/                  # 上传文件存储
└── docs/                     # 文档
```

详见 [架构文档](ARCHITECTURE.md)

## 模块开发

要添加新模块，请参考 [架构文档](ARCHITECTURE.md) 中的"模块开发指南"部分。

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

## 许可证

MIT

## 作者

xie-pintian

## 更新日志

### v1.0.0 (2026-05-01)

- 初始发布
- 包含 Memo 和 Veda 两个模块
- 模块化架构设计
