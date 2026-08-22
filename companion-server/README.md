# D35E 本地玩家伴侣（Player's Companion 本地复刻版）

复刻原版 [Player's Companion](https://companion.legaciesofthedragon.com/) 的本地版：
手机/平板浏览器打开角色卡页面，掷骰（属性/豁免/技能/使用物品）、修改 HP 等，
结果通过 socket 实时传回 Foundry 执行。

## 启动服务（每次开团前）

双击 `start.bat`（或用命令行 `node server.js`）。
看到 `手机访问: http://192.168.x.x:30001` 即为成功。

## Foundry 侧配置（一次性）

1. 世界设置 → 找到 `伴侣服务地址（本地）`，保持默认 `http://127.0.0.1:30001/`
2. 世界设置 → `世界玩家默认密码` 填 `d35e-local-companion-key`（与 `config.json` 一致）
3. 角色卡 → 配置页（齿轮）→ 巨龙遗产玩家伴侣：
   - Companion UUID 填任意唯一 ID（如 `my-owner-001`），用于标识角色
   - 点 **Sync to Companion** 把角色同步到服务端

## 手机使用

1. 手机连与 Foundry 同一 Wi-Fi
2. 浏览器访问 `http://<电脑局域网IP>:30001`（IP 在启动时打印）
3. 填 角色 UUID + API 密钥，点连接
4. 操作：
   - 点属性/豁免/技能 → Foundry 自动掷骰（免弹窗）
   - 点物品 → 使用物品
   - HP 加减 / 输入 → 修改生命值
   - 休息 → 弹出休息对话框（GM 端确认）

## 技术说明

- 服务端：`server.js`（Express + socket.io，复用 Foundry 自带依赖，无需 npm install）
- 存储：`data/characters/<uuid>.json`（角色快照）、`data/actions/<uuid>.json`（动作队列兜底）
- 通信：
  - 实时：手机页 socket.io `action` 事件 → 服务端转发 → Foundry `foundry` 事件 → `executeRemoteAction`
  - 兜底：`POST/GET /api/character/actions/:uuid`（Foundry 每 3 秒轮询）
- 动作类型：`ability` / `save` / `rollSkill` / `useItem` / `rest` / `updateActor`（改任意字段）
- 修改的文件：`systems/D35E/module/actor/entity.js`（API_URI 参数化 + v11 修复 + 免弹窗 + updateActor）、`module/settings.js`（companionServerUrl）、`module/actor/sheets/base.js`（头部链接参数化）、lang（cn/en）

## 安全

- API 密钥默认 `d35e-local-companion-key`，改 `config.json` 后重启服务
- 局域网使用；如需公网访问请自行加反向代理 + HTTPS + 强密钥
