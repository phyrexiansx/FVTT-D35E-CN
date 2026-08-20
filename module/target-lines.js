// ==================== 锁定连线特效（目标连线：账号颜色、全员可见、向目标流动光效） ====================
// GM：选中的 Token（可多个）与锁定的目标连线；没有选中 Token 则不渲染。
// 玩家：绑定的角色 Token 与锁定的目标连线。
// 颜色使用发起账号的颜色；发送端本地渲染 + whisper 广播同步其他客户端（所有人可见）。
// 光效：线段上光点从发起端向目标端循环流动。

const SETTING = { enabled: "targetLinesEnabled" };
const LINE_WIDTH = 3; // 线宽
const LINE_ALPHA = 0.5; // 线段透明度
const TARGET_DOT = 4; // 目标端小圆点半径
const FX_MS = 1600; // 光点从发起端到目标端的时长（循环）

let _lineLayer = null; // 线段层（每帧重画，跟随 token 位置）
let _fxLayer = null; // 光点层
let _fxCb = null;
const _lines = new Map(); // userId -> { fromIds: [], toIds: [] }
const _colors = new Map(); // userId -> 颜色 int

function _enabled() {
  try {
    return !!game.settings.get("D35E", SETTING.enabled);
  } catch (e) {
    return true;
  }
}

Hooks.once("init", () => {
  game.settings.register("D35E", SETTING.enabled, {
    name: "锁定连线特效",
    hint: "锁定目标时，在发起者（GM：选中的 Token；玩家：绑定的角色 Token）与锁定目标之间渲染连线。使用账号颜色，所有人可见，并带有向目标流动的光效。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
});

function _ensureLayers() {
  try {
    if (!canvas?.scene || !canvas.controls) return false;
    if (!_lineLayer || _lineLayer.destroyed) {
      _lineLayer = new PIXI.Container();
      _lineLayer.name = "d35e-target-lines";
      _lineLayer.interactive = false;
      _lineLayer.interactiveChildren = false;
      // [D35E]渲染在 canvas.primary（token 纹理之下），避免拦截光标对 token 的选取
      canvas.primary.addChild(_lineLayer);
      _fxLayer = new PIXI.Container();
      _fxLayer.name = "d35e-target-fx";
      _fxLayer.interactive = false;
      _fxLayer.interactiveChildren = false;
      canvas.primary.addChild(_fxLayer);
      if (!_fxCb) {
        _fxCb = () => _renderFx();
        canvas.app.ticker.add(_fxCb);
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

// 每帧重画：线段（账号颜色半透明）+ 目标端圆点 + 流动光点
function _renderFx() {
  try {
    if (!_lineLayer || _lineLayer.destroyed || !_fxLayer || _fxLayer.destroyed) return;
    if (!canvas?.scene) return;
    if (!_enabled()) {
      // 开关关闭：清除已渲染内容
      _lineLayer.removeChildren().forEach((c) => c.destroy());
      _fxLayer.removeChildren().forEach((c) => c.destroy());
      _lineLayer.visible = false;
      _fxLayer.visible = false;
      return;
    }
    _lineLayer.removeChildren().forEach((c) => c.destroy());
    _fxLayer.removeChildren().forEach((c) => c.destroy());
    let any = false;
    const now = performance.now();
    for (const [userId, data] of _lines) {
      const fromIds = data?.fromIds || [];
      const toIds = data?.toIds || [];
      if (!fromIds.length || !toIds.length) continue;
      const color = _colors.get(userId) ?? 0xffffff;
      for (const f of fromIds) {
        const ft = canvas.tokens.get(f);
        if (!ft || ft.destroyed) continue;
        for (const t of toIds) {
          const tt = canvas.tokens.get(t);
          if (!tt || tt.destroyed) continue;
          any = true;
          const x1 = ft.center.x, y1 = ft.center.y;
          const x2 = tt.center.x, y2 = tt.center.y;
          // 线段 + 目标端圆点
          const g = new PIXI.Graphics();
          g.interactive = false;
          g.lineStyle(LINE_WIDTH, color, LINE_ALPHA);
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.beginFill(color, 0.9);
          g.drawCircle(x2, y2, TARGET_DOT);
          g.endFill();
          _lineLayer.addChild(g);
          // 光点：发起端 → 目标端 循环流动
          const p = (now % FX_MS) / FX_MS;
          const x = x1 + (x2 - x1) * p;
          const y = y1 + (y2 - y1) * p;
          const fg = new PIXI.Graphics();
          fg.interactive = false;
          fg.beginFill(color, 0.25);
          fg.drawCircle(x, y, 9);
          fg.endFill();
          fg.beginFill(0xffffff, 0.9);
          fg.drawCircle(x, y, 4);
          fg.endFill();
          _fxLayer.addChild(fg);
        }
      }
    }
    _lineLayer.visible = any;
    _fxLayer.visible = any;
  } catch (e) {}
}

// 本地用户刷新：计算发起端（GM 选中 / 玩家绑定 token）与锁定目标
function _refreshLocal() {
  try {
    if (!canvas?.scene || !game.user) return;
    if (!_enabled()) {
      // 关闭开关：清空自己的连线并广播空（远端同步清除）
      _lines.set(game.user.id, { fromIds: [], toIds: [] });
      _colors.delete(game.user.id);
      _sync();
      return;
    }
    let fromIds = [];
    if (game.user.isGM) {
      fromIds = canvas.tokens.controlled.map((t) => t.id);
    } else {
      const cid = game.user.character?.id;
      if (cid) fromIds = canvas.tokens.placeables.filter((t) => t.actor?.id === cid).map((t) => t.id);
    }
    const toIds = Array.from(game.user.targets || []).map((t) => t.id);
    _lines.set(game.user.id, { fromIds, toIds });
    _colors.set(game.user.id, game.user.color);
    _ensureLayers();
    _sync();
  } catch (e) {}
}

// whisper 广播到其他客户端（所有人可见）
function _sync() {
  try {
    const data = _lines.get(game.user.id);
    const recipients = game.users.filter((u) => u.active && !u.isSelf).map((u) => u.id);
    if (!recipients.length) return;
    ChatMessage.create({
      content: "",
      whisper: recipients,
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
      flags: {
        D35E: {
          targetLines: { userId: game.user.id, fromIds: data?.fromIds || [], toIds: data?.toIds || [], color: game.user.color },
        },
      },
    }).catch(() => {});
  } catch (e) {}
}

// 本地：目标锁定变化 → 刷新（v11 的 updateTokenTargets 是 client-side，不写 user 文档，
// 通过 targetToken hook（本地操作与 socket 同步都会触发）感知；只处理自己的变化）
Hooks.on("targetToken", (user, token, targeted) => {
  if (user.id !== game.user.id) return;
  setTimeout(_refreshLocal, 30);
});
// 本地：绑定角色变化 → 刷新（character 写 user 文档，updateUser 可感知）
Hooks.on("updateUser", (user, change) => {
  if (user.id !== game.user.id) return;
  if ("character" in change) setTimeout(_refreshLocal, 30);
});
// 本地：GM 选中变化 → 轮询检测（API control() 不触发 selectToken hook）
let _lastSel = "";
function _pollSelection() {
  try {
    if (!canvas?.scene || !game.user?.isGM) return;
    const sel = canvas.tokens.controlled.map((t) => t.id).join(",");
    if (sel !== _lastSel) {
      _lastSel = sel;
      _refreshLocal();
    }
  } catch (e) {}
}
setInterval(_pollSelection, 150);
// 场景切换 → 清空重算
Hooks.on("canvasReady", () => {
  _lines.delete(game.user?.id);
  _colors.delete(game.user?.id);
  _refreshLocal();
});
Hooks.on("updateScene", (scene, change) => {
  if (change.active !== undefined && scene.id === canvas?.scene?.id) setTimeout(_refreshLocal, 300);
});
// 开关（设置）变化 → 刷新（关闭时清空并广播）
Hooks.on("updateSetting", (setting, key, value) => {
  if (setting.key !== "D35E." + SETTING.enabled) return;
  setTimeout(_refreshLocal, 30);
});
// 远端：收到连线广播 → 渲染（发送端自己也会收到，覆盖相同数据无害）
Hooks.on("createChatMessage", (message) => {
  const d = message.getFlag("D35E", "targetLines");
  if (!d) return;
  if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
  if (!d.userId || !Array.isArray(d.fromIds)) return;
  _lines.set(d.userId, { fromIds: d.fromIds, toIds: d.toIds || [] });
  _colors.set(d.userId, d.color ?? 0xffffff);
  _ensureLayers();
});
// [D35E] 同步载体消息只是数据：渲染时直接隐藏，聊天不出现空白耳语
Hooks.on("renderChatMessage", (message, html) => {
  if (message.getFlag("D35E", "targetLines")) html.hide();
});
