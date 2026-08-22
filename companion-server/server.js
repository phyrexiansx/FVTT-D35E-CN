// ============================================================
// D35E 本地玩家伴侣服务端（方案A：复刻原版 Player's Companion 协议）
// 依赖复用 Foundry 自带的 express / socket.io（无需 npm install）
// 启动: node server.js  （监听 0.0.0.0:30001，局域网手机可访问）
// ============================================================
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Foundry 自带依赖（绝对路径加载，避免全局安装）
const FVTT_NM = 'E:/TRPG/FVTT/Foundry Virtual Tabletop/resources/app/node_modules';
const express = require(path.join(FVTT_NM, 'express'));
const http = require('http');
const { Server } = require(path.join(FVTT_NM, 'socket.io'));

const CONFIG = require('./config.json');
const DATA_DIR = path.join(__dirname, 'data');
const CHARACTERS_DIR = path.join(DATA_DIR, 'characters');
const ACTIONS_DIR = path.join(DATA_DIR, 'actions');
for (const d of [CHARACTERS_DIR, ACTIONS_DIR]) fs.mkdirSync(d, { recursive: true });

const app = express();
app.use(express.json({ limit: '50mb' }));

// CORS（Foundry 页面 30000 → 本服务 30001 跨域）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

// 健康检查（D35E 系统 ready 时探测用）
app.get('/health', (req, res) => res.json({ ok: true }));
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'API-KEY, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API-KEY 校验 ----------
function checkKey(req, res) {
  const key = req.get('API-KEY');
  if (!CONFIG.apiKey || key !== CONFIG.apiKey) {
    res.status(401).json({ error: 'invalid api key' });
    return false;
  }
  return true;
}
const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown';

// ---------- 角色数据 ----------
// PUT  /api/character/:uuid   Foundry 推送角色 JSON
app.put('/api/character/:uuid', (req, res) => {
  if (!checkKey(req, res)) return;
  const uuid = safe(req.params.uuid);
  try {
    fs.writeFileSync(path.join(CHARACTERS_DIR, uuid + '.json'), JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET  /api/character/:uuid   手机端拉取角色 JSON
app.get('/api/character/:uuid', (req, res) => {
  if (!checkKey(req, res)) return;
  const uuid = safe(req.params.uuid);
  const file = path.join(CHARACTERS_DIR, uuid + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'character not found' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
});

// ---------- 动作队列 ----------
// POST /api/character/actions/:uuid   手机端入队动作
app.post('/api/character/actions/:uuid', (req, res) => {
  if (!checkKey(req, res)) return;
  const uuid = safe(req.params.uuid);
  const action = req.body || {};
  if (!action.action) return res.status(400).json({ error: 'action required' });
  const queueFile = path.join(ACTIONS_DIR, uuid + '.json');
  const queue = fs.existsSync(queueFile) ? JSON.parse(fs.readFileSync(queueFile, 'utf8')) : [];
  action.actionId = action.actionId || crypto.randomUUID();
  queue.push(action);
  fs.writeFileSync(queueFile, JSON.stringify(queue));
  // 实时推送（Foundry 端 socket 在线时）
  io.to('char-' + uuid).emit('foundry', action);
  res.json({ ok: true, actionId: action.actionId });
});

// GET  /api/character/actions/:uuid   Foundry 拉取队头（取后即删）
app.get('/api/character/actions/:uuid', (req, res) => {
  if (!checkKey(req, res)) return;
  const uuid = safe(req.params.uuid);
  const queueFile = path.join(ACTIONS_DIR, uuid + '.json');
  if (!fs.existsSync(queueFile)) return res.json(null);
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  if (!queue.length) return res.json(null);
  const action = queue.shift();
  fs.writeFileSync(queueFile, JSON.stringify(queue));
  res.json(action);
});

// ---------- socket.io（实时通道：Foundry 加入角色房间） ----------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  socket.on('join', (data) => {
    if (data && data.room) socket.join('char-' + data.room);
  });
  socket.on('leave', (data) => {
    if (data && data.room) socket.leave('char-' + data.room);
  });
  socket.on('processed', (data) => {
    io.to('char-' + (data.room || '')).emit('processed', data);
  });
  // 手机端实时动作（不写队列，直接转发给 Foundry 房间）
  socket.on('action', (data) => {
    if (!data || !data.room || !data.action) return;
    io.to('char-' + data.room).emit('foundry', {
      action: data.action,
      params: data.params,
      actionId: data.actionId || crypto.randomUUID(),
    });
  });
});

// ---------- 管理接口（D35E 面板用） ----------
// GET /api/info：返回端口/局域网 IP/UUID（面板显示 API 链接）
app.get('/api/info', (req, res) => {
  res.json({ ok: true, port: CONFIG.port || 30001, lanIp: lanIp(), uuid: CONFIG.uuid || '' });
});

// PUT /api/config：更新配置（端口/密钥/UUID），写入 config.json（重启后生效）
app.put('/api/config', (req, res) => {
  if (!checkKey(req, res)) return;
  const body = req.body || {};
  if (body.port !== undefined) CONFIG.port = Number(body.port) || CONFIG.port;
  if (body.apiKey !== undefined) CONFIG.apiKey = String(body.apiKey);
  if (body.uuid !== undefined) CONFIG.uuid = String(body.uuid);
  try {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(CONFIG, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/shutdown：停止服务（D35E 面板「停止」按钮）
app.post('/api/shutdown', (req, res) => {
  if (!checkKey(req, res)) return;
  res.json({ ok: true });
  setTimeout(() => { server.close(() => process.exit(0)); }, 150);
  writeStatus(false);
});

// ---------- 状态文件：服务器启动时写入、停止时删除（D35E 登录时读取一次，不再主动探测） ----------
const STATUS_FILE = path.join(__dirname, 'status.json');
function writeStatus(running) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
      running: !!running,
      port: CONFIG.port || 30001,
      lanIp: lanIp(),
      startedAt: Date.now(),
    }, null, 2));
  } catch (e) { /* 忽略 */ }
}
function clearStatus() {
  try { fs.unlinkSync(STATUS_FILE); } catch (e) { /* 忽略 */ }
}

// ---------- 启动 ----------
function lanIp() {
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const iface of ifs[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}
const PORT = CONFIG.port || 30001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[companion] 服务已启动 http://0.0.0.0:${PORT}`);
  console.log(`[companion] 手机访问: http://${lanIp()}:${PORT}  （API-KEY: ${CONFIG.apiKey}）`);
  console.log(`[companion] 数据目录: ${DATA_DIR}`);
  writeStatus(true);
});
