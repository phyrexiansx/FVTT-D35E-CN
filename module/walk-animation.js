// ============================================================================
// RPG Maker MV 行走图模式（Walk Animation）
// - 行走图规格：3列×4行。行=方向（1下 2左 3右 4上），每行3帧。
// - 移动时按方向行播放 12321 帧乒乓；停止时回退到中间第2帧。
// - 配置入口：角色卡「行走图」按钮（每角色单独配置，flag: D35E.walkImage / walkConditionImg）。
// - 异常行走图：陷入状态（角色卡状态页）时显示异常行走图；移动时恢复正常行走图，停下切回。
// -   状态行走图可在系统设置「状态行走图配置」中为每个状态单独设置（含优先级，高者优先显示）。
// - 缩放：动画帧挂载在 token.mesh 内部，自动继承 Foundry 的缩放/滤镜/透明度。
// - 扩展预留：方向帧序列/动作状态可扩展（攻击/施法等后续需求）。
// ============================================================================

const SETTING = { interval: "walkAnimInterval", condCfg: "walkConditionConfig" };
const HIT_IMG_DURATION = 400; // 受击图片显示时长(ms)，与受击染红特效同步

/* ---------------- 面向设置（战斗动画调用：攻击时朝向目标） ---------------- */
export function setWalkFacing(token, row) {
  try {
    const s = anims.get(token?.id);
    if (!s) return;
    s.row = Math.max(0, Math.min(3, row));
    s.frame = 1;
    _setFrame(s);
  } catch (e) {}
}

// ---------------- 设置 ----------------
Hooks.once("init", () => {
  game.settings.register("D35E", SETTING.interval, {
    name: "行走图帧间隔(ms)",
    hint: "RPG Maker MV 行走图动画每帧切换间隔，默认 180。",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 50, max: 1000, step: 10 },
    default: 180,
  });
  // 状态行走图配置（数据，world）：{ key: { img, priority } }
  game.settings.register("D35E", SETTING.condCfg, {
    name: "状态行走图配置（数据）",
    hint: "为每个状态单独设置的异常行走图与优先级。",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });
  game.settings.registerMenu("D35E", "walkConditionConfigMenu", {
    name: "状态行走图配置",
    label: "状态行走图配置",
    hint: "全局统一配置「死亡」状态的异常行走图；其余状态由各角色在角色卡行走图设置窗口中独立配置。",
    icon: "fas fa-person-walking",
    type: ConditionWalkConfig,
    restricted: true,
  });
});

// ---------------- 状态行走图配置窗口 ----------------
export class ConditionWalkConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "condition-walk-config",
      classes: ["d35e", "condition-walk-config"],
      title: "死亡状态行走图配置（全局统一）",
      template: "systems/D35E/templates/apps/condition-walk-config.html",
      width: 760,
      height: "auto",
      closeOnSubmit: true,
    });
  }
  getData() {
    const cfg = game.settings.get("D35E", SETTING.condCfg) || {};
    // 全局仅配置「死亡」状态（其余状态由各角色在行走图设置窗口中独立配置）
    return {
      conditions: [{
        key: "dead",
        label: game.i18n.localize(CONFIG.D35E.conditions.dead),
        img: cfg.dead?.img || "",
        priority: cfg.dead?.priority ?? 0,
      }],
    };
  }
  async _updateObject(event, formData) {
    const img = String(formData.img_dead || "").trim();
    const priority = Number(formData.priority_dead) || 0;
    const cfg = img ? { dead: { img, priority } } : {};
    await game.settings.set("D35E", SETTING.condCfg, cfg);
  }
}

// ---------------- 行走图设置窗口 ----------------
export class WalkImageSettings extends FormApplication {
  constructor(actor, options) {
    super(actor, options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "walk-image-settings",
      classes: ["d35e", "walk-image-settings"],
      title: "行走图设置（RPG Maker MV）",
      template: "systems/D35E/templates/apps/walk-image-settings.html",
      width: 520,
      height: "auto",
      closeOnSubmit: true,
    });
  }

  getData() {
    const condCfg = this.actor.getFlag("D35E", "walkConditionCfg") || {};
    const conditions = Object.keys(CONFIG.D35E.conditions || {}).map((key) => ({
      key,
      label: game.i18n.localize(CONFIG.D35E.conditions[key]),
      img: condCfg[key]?.img || "",
      priority: condCfg[key]?.priority ?? 0,
    }));
    return {
      walkImage: this.actor.getFlag("D35E", "walkImage") || "",
      walkConditionImg: this.actor.getFlag("D35E", "walkConditionImg") || "",
      walkHitImg: this.actor.getFlag("D35E", "walkHitImg") || "",
      walkConditionCfg: condCfg,
      conditions,
      walkImageScale: this.actor.getFlag("D35E", "walkImageScale") ?? 1,
      walkImageOffsetX: this.actor.getFlag("D35E", "walkImageOffsetX") ?? 0,
      walkImageOffsetY: this.actor.getFlag("D35E", "walkImageOffsetY") ?? 0,
      walkRows: this.actor.getFlag("D35E", "walkRows") ?? 4,
      walkCols: this.actor.getFlag("D35E", "walkCols") ?? 3,
      walkIdleFrame: this.actor.getFlag("D35E", "walkIdleFrame") ?? 2,
      walkLoop: this.actor.getFlag("D35E", "walkLoop") || "pingpong",
      walkInterval: this.actor.getFlag("D35E", "walkInterval") ?? "",
    };
  }

  async _updateObject(event, formData) {
    await this.actor.setFlag("D35E", "walkImage", formData.walkImage || "");
    await this.actor.setFlag("D35E", "walkConditionImg", formData.walkConditionImg || "");
    await this.actor.setFlag("D35E", "walkHitImg", formData.walkHitImg || "");
    const condCfg = {};
    const sub = formData.walkConditionCfg || {};
    for (const key of Object.keys(CONFIG.D35E.conditions || {})) {
      const img = String(sub[key]?.img || "").trim();
      const priority = Number(sub[key]?.priority) || 0;
      if (img) condCfg[key] = { img, priority };
    }
    await this.actor.setFlag("D35E", "walkConditionCfg", condCfg);
    await this.actor.setFlag("D35E", "walkImageScale", Number(formData.walkImageScale) || 1);
    await this.actor.setFlag("D35E", "walkImageOffsetX", Number(formData.walkImageOffsetX) || 0);
    await this.actor.setFlag("D35E", "walkImageOffsetY", Number(formData.walkImageOffsetY) || 0);
    await this.actor.setFlag("D35E", "walkRows", Math.max(1, Math.floor(Number(formData.walkRows) || 4)));
    await this.actor.setFlag("D35E", "walkCols", Math.max(1, Math.floor(Number(formData.walkCols) || 3)));
    await this.actor.setFlag("D35E", "walkIdleFrame", Math.max(1, Math.floor(Number(formData.walkIdleFrame) || 2)));
    await this.actor.setFlag("D35E", "walkLoop", formData.walkLoop === "forward" ? "forward" : "pingpong");
    await this.actor.setFlag("D35E", "walkInterval", Math.max(0, Math.floor(Number(formData.walkInterval) || 0)));
  }
}

// ---------------- 帧 / 纹理缓存 ----------------
const _baseTextures = new Map(); // walkImg -> PIXI.BaseTexture
const _frameCache = new Map(); // `${walkImg}|${row}|${col}` -> PIXI.Texture

async function _getBaseTexture(walkImg) {
  if (_baseTextures.has(walkImg)) return _baseTextures.get(walkImg);
  const tex = await loadTexture(walkImg);
  _baseTextures.set(walkImg, tex.baseTexture);
  return tex.baseTexture;
}

function _getFrame(walkImg, row, col, frameW, frameH) {
  const key = `${walkImg}|${row}|${col}`;
  let tex = _frameCache.get(key);
  if (!tex) {
    const base = _baseTextures.get(walkImg);
    tex = new PIXI.Texture(base, new PIXI.Rectangle(col * frameW, row * frameH, frameW, frameH));
    _frameCache.set(key, tex);
  }
  return tex;
}

// ---------------- 动画状态 ----------------
const anims = new Map(); // tokenId -> { token, walkImg, frameW, frameH, origTex, origScale, row, frame, phase, lastX, lastY, lastTime }
let _tickerAdded = false;

// 角色行走图配置：合成 token（unlinked）优先自身 flag，其次父角色
function _getActorFlag(token, key) {
  const a = token.actor;
  if (!a) return null;
  const own = a.getFlag("D35E", key);
  if (own != null && own !== "") return own;
  if (a.isToken && a._actor) {
    const parent = a._actor.getFlag("D35E", key);
    if (parent != null && parent !== "") return parent;
  }
  return null;
}

// 当前应显示的异常行走图：仅当处于至少一个 active 状态时 → active 状态按优先级最高者 → 角色默认异常行走图 → null
function _getConditionWalkImg(token) {
  const a = token.actor;
  if (!a) return null;
  const conds = CONFIG.D35E.conditions || {};
  let hasCondition = false;
  for (const key of Object.keys(conds)) {
    if (getProperty(a.system, `attributes.conditions.${key}`)) { hasCondition = true; break; }
  }
  if (!hasCondition) return null; // 无任何状态 → 不使用异常行走图
  // 1) 每角色状态配置（walkConditionCfg flag，按优先级最高者）
  const actorCfg = a.getFlag("D35E", "walkConditionCfg") || {};
  let best = null;
  for (const key of Object.keys(conds)) {
    const active = getProperty(a.system, `attributes.conditions.${key}`);
    const c = actorCfg[key];
    if (active && c?.img) {
      if (!best || (c.priority ?? 0) > (best.priority ?? 0)) best = { img: c.img, priority: c.priority ?? 0 };
    }
  }
  if (best) return best.img;
  // 2) 全局统一「死亡」状态配置（角色未单独配置死亡行走图时兜底）
  const globalCfg = game.settings.get("D35E", SETTING.condCfg) || {};
  const gDead = globalCfg.dead;
  if (gDead?.img && getProperty(a.system, "attributes.conditions.dead")) return gDead.img;
  // 3) 角色默认异常行走图
  return _getActorFlag(token, "walkConditionImg");
}

function _getWalkImage(token) {
  const a = token.actor;
  if (!a) return null;
  const own = a.getFlag("D35E", "walkImage");
  if (own) return own;
  if (a.isToken && a._actor) return a._actor.getFlag("D35E", "walkImage") || null;
  return null;
}

// 行走图缩放（默认1）：合成 token 优先自身 flag，其次父角色
function _getWalkScale(token) {
  const a = token.actor;
  if (!a) return 1;
  const own = a.getFlag("D35E", "walkImageScale");
  if (own != null && !isNaN(own)) return Number(own);
  if (a.isToken && a._actor) {
    const p = a._actor.getFlag("D35E", "walkImageScale");
    if (p != null && !isNaN(p)) return Number(p);
  }
  return 1;
}

// 行走图偏移（默认0，单位像素）：合成 token 优先自身 flag，其次父角色
function _getWalkOffset(token) {
  const a = token.actor;
  if (!a) return { x: 0, y: 0 };
  const get = (act) => ({
    x: Number(act?.getFlag("D35E", "walkImageOffsetX")) || 0,
    y: Number(act?.getFlag("D35E", "walkImageOffsetY")) || 0,
  });
  const own = get(a);
  if (own.x !== 0 || own.y !== 0) return own;
  if (a.isToken && a._actor) return get(a._actor);
  return { x: 0, y: 0 };
}

// ---------------- 拆分规则（行数 / 每行帧数 / 停留帧 / 循环 / 速度） ----------------
// 数字配置：合成 token 优先自身 flag，其次父角色；无效值回退默认
function _cfgNum(token, key, def) {
  const v = _getActorFlag(token, key);
  const n = Number(v);
  return v == null || isNaN(n) ? def : n;
}

// 拆分规格：rows 行 × cols 列；停留帧（1-based 用户值 → 0-based）
function _splitCfg(token) {
  const cols = Math.max(1, Math.floor(_cfgNum(token, "walkCols", 3)));
  return {
    rows: Math.max(1, Math.floor(_cfgNum(token, "walkRows", 4))),
    cols,
    idle: Math.max(0, Math.min(Math.floor(_cfgNum(token, "walkIdleFrame", 2)) - 1, cols - 1)),
  };
}

// 循环方式：乒乓（12321）/ 正向（123123）
function _loopMode(token) {
  return _getActorFlag(token, "walkLoop") === "forward" ? "forward" : "pingpong";
}

// 角色级播放间隔（0 = 使用系统默认）
function _intervalOf(token) {
  return Math.max(0, Math.floor(_cfgNum(token, "walkInterval", 0)));
}

// 帧序列推进：行走按循环设置；受击/异常图固定正向循环
function _nextFrame(s, { forceForward = false } = {}) {
  if (s.cols <= 1) { s.frame = 0; return; }
  if (forceForward || s.loop === "forward") s.frame = (s.frame + 1) % s.cols;
  else {
    s.frame += s.phase;
    if (s.frame >= s.cols - 1) s.phase = -1;
    if (s.frame <= 0) s.phase = 1;
  }
}

// 播放间隔：角色设置优先，否则系统默认
function _interval(s) {
  return s.interval > 0 ? s.interval : game.settings.get("D35E", SETTING.interval);
}

// 重置播放：正向从第1帧，乒乓从停留帧；可选强制正向（受击/异常图）
function _resetPlay(s, forceForward = false) {
  s.frame = forceForward || s.loop === "forward" ? 0 : s.idle;
  s.phase = 1;
  s.lastTime = performance.now();
  _setFrame(s);
}

async function _ensureForToken(token) {
  if (!token || !token.mesh || token.destroyed || anims.has(token.id)) return;
  const walkImg = _getWalkImage(token);
  if (!walkImg) return;
  try {
    const base = await _getBaseTexture(walkImg);
    if (!token.mesh || token.destroyed || anims.has(token.id)) return; // 加载期间 token 可能被删/已重建
    const split = _splitCfg(token);
    const frameW = Math.max(1, base.width / split.cols);
    const frameH = Math.max(1, base.height / split.rows);
    // 直接替换 mesh 纹理 = 取代原 token 图（交互/层级/缩放/受击特效全部沿用 Foundry 原生机制）
    const origTex = token.mesh.texture;
    const origScale = { x: token.mesh.scale.x, y: token.mesh.scale.y };
    // 行走图帧填满 token 网格（原图纹理尺寸 → mesh.scale 由 Foundry 按原纹理管理，这里按帧尺寸重设）× 用户缩放
    const scale = _getWalkScale(token);
    token.mesh.scale.set((token.w / frameW) * scale, (token.h / frameH) * scale);
    // 底部固定缩放：图像底部始终对齐 token 底部（mesh 中心锚点 → position 向下补偿；scale=1 时 position=token 中心）
    const off = _getWalkOffset(token);
    token.mesh.position.set(
      token.center.x + off.x,
      token.center.y + (token.h * (1 - scale)) / 2 + off.y
    );
    anims.set(token.id, {
      token,
      walkImg,
      rows: split.rows,
      cols: split.cols,
      idle: split.idle,
      loop: _loopMode(token),
      interval: _intervalOf(token),
      walkConditionImg: null, // 当前异常行走图（切换时按需加载）
      frameW,
      frameH,
      normalFrameW: frameW,
      normalFrameH: frameH,
      condFrameW: frameW,
      condFrameH: frameH,
      usingCondition: false, // 当前是否显示异常行走图
      hitMode: false, // 受击图片显示中（冻结帧/方向/异常切换）
      hitImg: null,
      hitFrameW: 0,
      hitFrameH: 0,
      _hitTimer: null,
      origTex,
      origScale,
      ready: false, // 首帧仅记录位置（避免场景加载时的网格对齐微位移被误判为移动）
      row: 0, // 0下 1左 2右 3上
      frame: split.idle, // 停留帧（0-based，默认第2帧）
      phase: 1,
      lastX: token.x,
      lastY: token.y,
      lastTime: 0,
    });
    _setFrame(anims.get(token.id)); // 应用初始帧（下行停留帧）
  } catch (e) {
    console.error("D35E walk image load failed:", walkImg, e);
  }
}

function _removeAnim(token) {
  const s = anims.get(token?.id);
  if (!s) return;
  try {
    if (s.token?.mesh) {
      s.token.mesh.texture = s.origTex || s.token.mesh.texture; // 恢复原图
      // 恢复原缩放：按原纹理尺寸重新计算（Foundry #refreshMesh 的算法，避免保存到未加载完成时的 scale=1）
      const ow = s.origTex?.width || 0;
      const oh = s.origTex?.height || 0;
      if (ow > 0 && oh > 0) {
        const texScaleX = s.token.document?.texture?.scaleX ?? 1;
        const texScaleY = s.token.document?.texture?.scaleY ?? 1;
        s.token.mesh.scale.set((texScaleX * s.token.w) / ow, (texScaleY * s.token.h) / oh);
      } else if (s.origScale) {
        s.token.mesh.scale.set(s.origScale.x, s.origScale.y);
      }
      // 恢复 position 到 token 中心（Foundry 默认定位）
      s.token.mesh.position.set(s.token.center.x, s.token.center.y);
    }
  } catch (e) {
    // 忽略清理异常
  }
  anims.delete(token.id);
}

// ---------------- 帧应用：mesh 纹理 = 当前帧 ----------------
function _setFrame(s) {
  if (!s.token?.mesh) return;
  if (s.hitMode && s.hitImg) {
    // 受击图片：按当前方向行 + 当前帧（正向循环）
    s.token.mesh.texture = _getFrame(s.hitImg, s.row, s.frame, s.frameW, s.frameH);
    return;
  }
  const img = s.usingCondition && s.walkConditionImg ? s.walkConditionImg : s.walkImg;
  s.token.mesh.texture = _getFrame(img, s.row, s.frame, s.frameW, s.frameH);
}

// ---------------- 受击图片：受击瞬间切换 → 定时恢复 ----------------
function _triggerHitImage(token) {
  const s = anims.get(token?.id);
  if (!s || !s.token?.mesh) return;
  const hitImg = _getActorFlag(token, "walkHitImg");
  if (!hitImg) return;
  s.hitMode = true;
  s.hitImg = hitImg;
  s.frame = 0;
  s.phase = 1;
  s.lastTime = performance.now();
  _loadHitImage(s, hitImg);
  clearTimeout(s._hitTimer);
  s._hitTimer = setTimeout(() => {
    const st = anims.get(token?.id);
    if (st && st.hitMode) {
      // 恢复：根据当前模式（异常行走图/正常行走图）应用帧
      st.hitMode = false;
      st.hitImg = null;
      st.frameW = st.usingCondition ? st.condFrameW : st.normalFrameW;
      st.frameH = st.usingCondition ? st.condFrameH : st.normalFrameH;
      _resetPlay(st);
    }
  }, HIT_IMG_DURATION);
}

async function _loadHitImage(s, img) {
  try {
    const base = await _getBaseTexture(img);
    const st = anims.get(s.token?.id);
    if (!st || !st.hitMode || st.hitImg !== img) return; // 期间已恢复/换图
    // 按当前角色的拆分规则（行数/每行帧数）
    st.hitFrameW = Math.max(1, base.width / st.cols);
    st.hitFrameH = Math.max(1, base.height / st.rows);
    st.frameW = st.hitFrameW;
    st.frameH = st.hitFrameH;
    _setFrame(st);
  } catch (e) {
    const st = anims.get(s.token?.id);
    if (st && st.hitMode) { st.hitMode = false; st.hitImg = null; _setFrame(st); }
  }
}

// 切换到异常行走图（异步加载纹理 → 更新帧尺寸 → 应用当前方向中间帧）
async function _switchToConditionImg(s, img) {
  try {
    const base = await _getBaseTexture(img);
    const st = anims.get(s.token?.id);
    if (!st || !st.usingCondition) return; // 期间已清理 / 已切回正常图
    st.condFrameW = Math.max(1, base.width / st.cols);
    st.condFrameH = Math.max(1, base.height / st.rows);
    st.frameW = st.condFrameW;
    st.frameH = st.condFrameH;
    _setFrame(st);
  } catch (e) {
    const st = anims.get(s.token?.id);
    if (st) {
      // 加载失败：回退正常行走图
      st.usingCondition = false;
      st.frameW = st.normalFrameW;
      st.frameH = st.normalFrameH;
      _setFrame(st);
    }
  }
}

// ---------------- 每帧驱动：方向检测 + 帧乒乓 ----------------
function _tick() {
  if (!anims.size) return;
  const now = performance.now();
  for (const [id, s] of anims) {
    const token = s.token;
    if (!token.mesh || token.destroyed || token._destroyed || token._deleted) {
      _removeAnim(token);
      continue;
    }
    // 缩放同步：行走图帧填满 token 网格（跟随用户调整缩放）× 用户缩放
    const scale = _getWalkScale(token);
    const wantScaleX = (token.w / s.frameW) * scale;
    const wantScaleY = (token.h / s.frameH) * scale;
    if (Math.abs(token.mesh.scale.x - wantScaleX) > 0.001 || Math.abs(token.mesh.scale.y - wantScaleY) > 0.001) {
      token.mesh.scale.set(wantScaleX, wantScaleY);
    }
    // 底部固定缩放：图像底部始终对齐 token 底部（mesh 中心锚点 → position 向下补偿，scale=1 时 position=token 中心）＋图像偏移
    // 受击晃动窗口（token._d35eShakeUntil，damageSound 标记）期间跳过 position 补偿，避免覆盖晃动偏移
    if (!token._d35eShakeUntil || Date.now() >= token._d35eShakeUntil) {
      const off = _getWalkOffset(token);
      const wantPosX = token.center.x + off.x;
      const wantPosY = token.center.y + (token.h * (1 - scale)) / 2 + off.y;
      if (Math.abs(token.mesh.position.x - wantPosX) > 0.01 || Math.abs(token.mesh.position.y - wantPosY) > 0.01) {
        token.mesh.position.set(wantPosX, wantPosY);
      }
    }
    // 防 token.refresh 等将纹理重置回原图（尺寸≠帧尺寸时重新应用当前帧）
    if (token.mesh.texture?.width !== s.frameW || token.mesh.texture?.height !== s.frameH) _setFrame(s);

    // 受击图片显示期间：固定正向循环，冻结方向/异常切换
    if (s.hitMode) {
      if (now - s.lastTime >= _interval(s)) {
        s.lastTime = now;
        _nextFrame(s, { forceForward: true });
        _setFrame(s);
      }
      continue;
    }

    // 方向检测（绝对值大的轴优先）
    const dx = token.x - s.lastX;
    const dy = token.y - s.lastY;
    s.lastX = token.x;
    s.lastY = token.y;
    // 首帧仅记录位置基准（避免加载时网格对齐微位移误判为移动）
    if (!s.ready) {
      s.ready = true;
      continue;
    }
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      // 移动中：恢复为正常行走图（切回正常帧尺寸）
      if (s.usingCondition) {
        s.usingCondition = false;
        s.walkConditionImg = null;
        s.frameW = s.normalFrameW;
        s.frameH = s.normalFrameH;
        _resetPlay(s);
      }
      let row = s.row;
      if (Math.abs(dx) > Math.abs(dy)) row = dx > 0 ? 2 : 1; // 右/左
      else if (dy !== 0) row = dy > 0 ? 0 : 3; // 下/上
      if (row !== s.row) {
        // 转向：从起步帧重新开始
        s.row = row;
        _resetPlay(s);
      }
      // 帧推进：乒乓（12321）或正向（123123）
      if (now - s.lastTime >= _interval(s)) {
        s.lastTime = now;
        _nextFrame(s);
        _setFrame(s);
      }
    } else {
      // 停止：异常行走图切换（正常↔异常、异常A→异常B）或回退当前方向停留帧
      const condImg = _getConditionWalkImg(token);
      if (s.usingCondition) {
        // 已在异常模式
        if (!condImg || condImg === s.walkImg) {
          // 异常图消失（状态解除/配置清空）→ 恢复正常行走图
          s.usingCondition = false;
          s.walkConditionImg = null;
          s.frameW = s.normalFrameW;
          s.frameH = s.normalFrameH;
          _resetPlay(s);
        } else if (condImg !== s.walkConditionImg) {
          // 目标异常图变化（状态配置/优先级变化）→ 切换到新异常图
          s.walkConditionImg = condImg;
          s.frame = 0;
          s.phase = 1;
          _switchToConditionImg(s, condImg);
        } else {
          // 异常图固定正向循环播放
          if (now - s.lastTime >= _interval(s)) {
            s.lastTime = now;
            _nextFrame(s, { forceForward: true });
            _setFrame(s);
          }
        }
      } else {
        // 正常模式：出现异常图 → 切换
        if (condImg && condImg !== s.walkImg) {
          s.usingCondition = true;
          s.walkConditionImg = condImg;
          s.frame = 0;
          s.phase = 1;
          _switchToConditionImg(s, condImg);
        } else if (s.frame !== s.idle) {
          s.frame = s.idle;
          _setFrame(s);
        }
      }
    }
  }
}

// ---------------- 生命周期 hooks ----------------
Hooks.on("canvasReady", () => {
  // 场景切换：全量清理（恢复原图纹理）
  for (const [id, s] of [...anims]) {
    try { _removeAnim(s.token); } catch (e) { /* ignore */ }
  }
  anims.clear();
  if (!_tickerAdded) {
    canvas.app.ticker.add(_tick);
    _tickerAdded = true;
  }
  canvas.tokens.placeables.forEach((t) => _ensureForToken(t));
});

Hooks.on("createToken", (doc) => {
  setTimeout(() => {
    const t = canvas.tokens.get(doc.id);
    if (t) _ensureForToken(t);
  }, 300); // 等待 token 绘制完成
});

Hooks.on("updateToken", (doc, change) => {
  // 惰性补漏（漏过的 token 在移动时补上）
  if (change.x !== undefined || change.y !== undefined) {
    const t = canvas.tokens.get(doc.id);
    if (t && !anims.has(doc.id)) _ensureForToken(t);
  }
});

Hooks.on("deleteToken", (doc) => {
  _removeAnim(canvas.tokens.get(doc.id) || { id: doc.id });
});

// 角色卡设置变化（updateActor 的 change 含 flag 变更；unsetFlag 为 "-=walkImage" 形式）→ 重建动画
Hooks.on("updateActor", (actor, change) => {
  const f = change.flags?.D35E;
  if (f && (f.walkImage !== undefined || f["-=walkImage"] !== undefined || f.walkImageScale !== undefined || f["-=walkImageScale"] !== undefined || f.walkImageOffsetX !== undefined || f.walkImageOffsetY !== undefined || f.walkConditionImg !== undefined || f["-=walkConditionImg"] !== undefined || f.walkConditionCfg !== undefined || f["-=walkConditionCfg"] !== undefined || f.walkHitImg !== undefined || f["-=walkHitImg"] !== undefined || f.walkRows !== undefined || f["-=walkRows"] !== undefined || f.walkCols !== undefined || f["-=walkCols"] !== undefined || f.walkIdleFrame !== undefined || f["-=walkIdleFrame"] !== undefined || f.walkLoop !== undefined || f["-=walkLoop"] !== undefined || f.walkInterval !== undefined || f["-=walkInterval"] !== undefined)) {
    canvas.tokens.placeables
      .filter((t) => t.actor === actor || t.actor?.id === actor.id || (t.actor?.isToken && t.actor._actor?.id === actor.id))
      .forEach((t) => {
        _removeAnim(t);
        _ensureForToken(t);
      });
  }
});

// 受击图片：与受击音效/特效同一触发链路
// 发送端：伤害结算（options.hitSound）→ 受击瞬间切换受击图片
// unlinked 独立血量：synthetic actor 带 token 标识，仅受击的那个 token 切换；linked 回退全部关联 token
Hooks.on("updateActor", (actor, change, options) => {
  if (!options?.hitSound) return;
  const hitTokenId = actor.isToken ? actor.token?.id : undefined;
  let tokens;
  if (hitTokenId) {
    const t = canvas.tokens.get(hitTokenId);
    tokens = t ? [t] : [];
  } else {
    // 回退：仅 linked token（t.actor 与 actor 同一实例）；unlinked 的 synthetic 副本不匹配
    tokens = canvas.tokens.placeables.filter((t) => t.actor === actor);
  }
  tokens.forEach((t) => _triggerHitImage(t));
});
// 接收端：收到 hitSound 通知（flags.D35E.hitSound + hitActorId + hitTokenId）→ 同步触发
Hooks.on("createChatMessage", (message) => {
  const src = message.getFlag("D35E", "hitSound");
  if (!src) return;
  if (message.user.id === game.user.id) return;
  const actorId = message.getFlag("D35E", "hitActorId");
  if (!actorId) return;
  const actor = game.actors.get(actorId);
  if (!actor) return;
  const hitTokenId = message.getFlag("D35E", "hitTokenId");
  let tokens;
  if (hitTokenId) {
    const t = canvas.tokens.get(hitTokenId);
    tokens = t ? [t] : [];
  } else {
    // 回退：仅 linked token（t.actor 与 actor 同一实例）；unlinked 的 synthetic 副本不匹配
    tokens = canvas.tokens.placeables.filter((t) => t.actor === actor);
  }
  tokens.forEach((t) => _triggerHitImage(t));
});

// 角色卡「行走图」按钮
Hooks.on("renderActorSheet", (app, html) => {
  html.find(".walk-image-btn").off("click").on("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    new WalkImageSettings(app.actor, { top: ev.clientY, left: ev.clientX }).render(true);
  });
});
