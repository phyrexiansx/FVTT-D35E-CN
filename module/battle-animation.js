// ==================== 战斗动画系统（RPG Maker MV 帧动画） ====================
// 分类（按 item.system.actionType）：近战(melee)=mwak/msak · 远程(ranged)=rwak/rsak · 治疗(heal)=heal · 能力(ability)=其余
// 动画文件：192×192 格，每行最多5格（多行文件默认取第1行），从左到右播完整行，每帧200ms
// 行为：近战/治疗→目标token帧动画 · 远程→光箭飞向目标+目标帧动画 · 能力→有模板在模板位置播（circle等比放大/非圆形拉伸），无模板在自己身上播
// 通用：使用者（无论哪种效果）闪一瞬白光；发送端本地播放 + whisper 同步其他客户端
// 配置：系统统一（battleAnimDefault，4类默认+音效留白）+ 物品单独（item.system.battleAnim，覆盖默认）

import { setWalkFacing } from "./walk-animation.js";
import { fxBegin, fxEnd } from "./damageSound.js";

const SETTING = { config: "battleAnimDefault" };
const FRAME = 192; // 每格像素
const FRAME_MS = 66; // 播放速率：RPG Maker MV 动画默认速度 15（60fps ÷ 15 ≈ 每帧 66ms ≈ 15帧/秒）
const FLY_MS = 300; // 远程光箭飞行时长
const WHITE_MS = 240; // 白光时长（原160，按需求延长50%）

/* ---------------- 设置 ---------------- */
Hooks.once("init", () => {
  game.settings.registerMenu("D35E", "battleAnimConfigMenu", {
    name: "战斗动画配置",
    label: "战斗动画配置",
    hint: "配置近战/远程/治疗/能力四类动画的默认文件与音效。近战/治疗/能力音效在动画开始时播放，远程音效在光箭命中时播放。攻击/专长/法术/状态等物品可在物品卡上单独覆盖。",
    icon: "fas fa-fire",
    type: BattleAnimConfig,
    restricted: true,
  });
  game.settings.register("D35E", SETTING.config, {
    name: "战斗动画默认配置（数据）",
    scope: "world",
    config: false,
    type: Object,
    default: {
      melee: "", meleeSound: "",
      ranged: "", rangedSound: "",
      heal: "", healSound: "",
      ability: "", abilitySound: "",
    },
  });
  game.settings.register("D35E", "battleAnimSoundVolume", {
    name: "战斗动画音效音量",
    hint: "战斗动画（近战/远程/治疗/能力）音效的播放音量，默认0.8。",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 2, step: 0.05 },
    default: 0.8,
  });
});

/* ---------------- 音效播放 ---------------- */
function _playSound(src) {
  try {
    if (!src) return;
    const volume = Number(game.settings.get("D35E", "battleAnimSoundVolume")) || 0.8;
    AudioHelper.play({ src: String(src), volume }, false).catch(() => {});
  } catch (e) {}
}

/* ---------------- 配置窗口 ---------------- */
export class BattleAnimConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "battle-anim-config",
      classes: ["d35e", "battle-anim-config"],
      title: "战斗动画配置",
      template: "systems/D35E/templates/apps/battle-anim-config.html",
      width: 560,
      height: "auto",
      closeOnSubmit: true,
    });
  }
  getData() {
    const d = game.settings.get("D35E", SETTING.config) || {};
    return {
      melee: d.melee || "", meleeSound: d.meleeSound || "",
      ranged: d.ranged || "", rangedSound: d.rangedSound || "",
      heal: d.heal || "", healSound: d.healSound || "",
      ability: d.ability || "", abilitySound: d.abilitySound || "",
    };
  }
  async _updateObject(event, formData) {
    const pick = (k) => String(formData[k] || "").trim();
    await game.settings.set("D35E", SETTING.config, {
      melee: pick("melee"), meleeSound: pick("meleeSound"),
      ranged: pick("ranged"), rangedSound: pick("rangedSound"),
      heal: pick("heal"), healSound: pick("healSound"),
      ability: pick("ability"), abilitySound: pick("abilitySound"),
    });
  }
}

/* ---------------- 工具 ---------------- */
// [D35E]多 Token 修正：解析"实际发起攻击的 Token"，避免 A 的 1 号攻击却闪 2 号
// 优先级：调用方显式指定（item._animToken，批量攻击/反击/借机等）> 当前受控的同 actor Token（角色卡攻击）> actor.token（主 Token）> 兜底第一个
function _actorToken(actor, item) {
  if (!canvas?.scene || !actor) return null;
  if (item?._animToken) {
    const t = canvas.tokens.get(item._animToken);
    if (t) return t;
  }
  const controlled = canvas.tokens.controlled.find((t) => t.actor?.id === actor.id);
  if (controlled) return controlled;
  const main = actor.token ? canvas.tokens.get(actor.token.id) : null;
  if (main) return main;
  return canvas.tokens.placeables.find((t) => t.actor === actor || t.actor?.id === actor.id) || null;
}
function _findTemplate() {
  if (!canvas?.scene) return null;
  const list = [...canvas.scene.templates.contents];
  return list.length ? list[list.length - 1] : null;
}
function _syncAnim(d) {
  const recipients = game.users.filter((u) => u.active && !u.isSelf).map((u) => u.id);
  if (!recipients.length) return;
  ChatMessage.create({
    content: "",
    whisper: recipients,
    type: CONST.CHAT_MESSAGE_TYPES.OOC,
    flags: { D35E: { battleAnim: d } },
  });
}

/* ---------------- 触发（use/rollAttack 结算时调用） ---------------- */
export function triggerBattleAnim(item, opts = {}) {
  try {
    const actor = item?.actor;
    if (!actor) return;
    const at = getProperty(item.system, "actionType") || "";
    let type = "ability";
    if (["mwak", "msak"].includes(at)) type = "melee";
    else if (["rwak", "rsak"].includes(at)) type = "ranged";
    else if (at === "heal") type = "heal";
    const cfg = item.system?.battleAnim || {};
    const defs = game.settings.get("D35E", SETTING.config) || {};
    const img = String(cfg.img || defs[type] || "").trim();
    const sound = String(cfg.sound || defs[`${type}Sound`] || "").trim();
    const from = _actorToken(actor, item);
    let target = null;
    if (["melee", "ranged", "heal"].includes(type)) {
      // 优先使用结算前快照的目标（结算过程中 game.user.targets 可能已被清空）
      const snap = (opts?.targets && opts.targets.length) ? opts.targets : [...game.user.targets];
      target = snap.length ? snap[snap.length - 1] : null; // 最后一个=最新锁定（主目标）
    }
    let template = null;
    if (type === "ability" && item.hasTemplate) template = _findTemplate();
    // 行走图转向目标（近战/远程/治疗有目标时，攻击者面向目标方向）
    if (from && target) {
      setWalkFacing(from, _facingRow(target.center.x - from.center.x, target.center.y - from.center.y));
      // [D35E]sync facing to other clients even without anim file
      if (!img && ["melee", "ranged", "heal"].includes(type)) {
        _syncAnim({ type, fromTokenId: from.id, targetTokenId: target.id });
      }
    }
    // 白光：无论有无动画文件，使用者都闪一瞬白光
    if (from) _whiteFlash(from);
    if (!img) return;
    const data = {
      type, img, sound,
      fromTokenId: from?.id || null,
      targetTokenId: target?.id || null,
      templateId: template?.id || null,
      actorId: actor.id,
    };
    _playLocal(data);
    _syncAnim(data);
  } catch (e) { /* 动画失败不影响游戏 */ }
}

/* ---------------- 方向工具（与行走图行序一致：0下1左2右3上） ---------------- */
function _facingRow(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 2 : 1;
  return dy > 0 ? 0 : 3;
}

/* ---------------- 本地播放 ---------------- */
function _playLocal(d) {
  if (!canvas?.scene) return;
  const from = d.fromTokenId ? canvas.tokens.get(d.fromTokenId) : null;
  const target = d.targetTokenId ? canvas.tokens.get(d.targetTokenId) : null;
  const template = d.templateId ? canvas.scene?.templates?.get(d.templateId) : null;
  // 行走图转向目标（接收端与其他客户端同样转向，保持视觉一致）
  if (d.type !== "ability" && from && target) {
    setWalkFacing(from, _facingRow(target.center.x - from.center.x, target.center.y - from.center.y));
  }
  if (d.type === "ranged" && from && target && d.img) {
    // 远程：光箭飞向目标 → 命中时播放音效 + 目标身上帧动画（相对中心随机偏移）
    _shootArrow(from, target, () => {
      _playSound(d.sound);
      if (target && !target.destroyed) {
        const r = Math.min(target.w, target.h) * 0.18;
        _playFramesOnToken(target, d.img, { ox: (Math.random() * 2 - 1) * r, oy: (Math.random() * 2 - 1) * r });
      }
    });
    return;
  }
  if (d.type === "ability" && template) {
    // 能力有模板：在模板位置播放（circle 等比放大 / 非圆形拉伸）
    _playSound(d.sound);
    _playFramesOnTemplate(template, d.img);
    return;
  }
  const host = target || from;
  if (host && d.img) {
    // 近战/治疗/无模板能力：动画开始时播放音效
    _playSound(d.sound);
    _playFramesOnToken(host, d.img);
  }
}

/* ---------------- 帧动画（token 上，缩放铺满、跟随目标） ---------------- */
async function _playFramesOnToken(token, img, opts = {}) {
  try {
    const base = (await loadTexture(img)).baseTexture;
    if (!base?.valid || token.destroyed || !token.mesh) return;
    const cols = Math.max(1, Math.floor(base.width / FRAME));
    const spr = new PIXI.Sprite(new PIXI.Texture(base, new PIXI.Rectangle(0, 0, FRAME, FRAME)));
    spr.anchor.set(0.5, 0.5);
    spr.position.set(token.w / 2 + (opts.ox || 0), token.h / 2 + (opts.oy || 0));
    spr.scale.set(1, 1); // 固定 192px（不铺平）
    token.addChild(spr);
    _playFrames(base, cols, 0, spr, () => {
      if (spr.parent) token.removeChild(spr);
      spr.destroy();
    });
  } catch (e) {}
}

/* ---------------- 帧动画（模板上：circle 等比 / 非圆拉伸） ---------------- */
async function _playFramesOnTemplate(template, img) {
  try {
    const base = (await loadTexture(img)).baseTexture;
    if (!base?.valid || !canvas.primary) return;
    const cols = Math.max(1, Math.floor(base.width / FRAME));
    const spr = new PIXI.Sprite(new PIXI.Texture(base, new PIXI.Rectangle(0, 0, FRAME, FRAME)));
    spr.anchor.set(0.5, 0.5);
    const distPx = Math.max(0, Number(template.distance) || 0) * (canvas.scene.grid.size || 100);
    let w = FRAME, h = FRAME;
    if (template.t === "circle") { w = distPx * 2; h = distPx * 2; }
    else if (template.t === "cone") { w = distPx; h = distPx; }
    else if (template.t === "ray") { w = distPx; h = FRAME; }
    else if (template.t === "cube") { w = distPx; h = distPx; }
    spr.position.set(template.x, template.y);
    if (template.direction) spr.rotation = Math.toRadians(template.direction);
    spr.scale.set(w / FRAME, h / FRAME);
    canvas.primary.addChild(spr);
    _playFrames(base, cols, 0, spr, () => {
      if (spr.parent) canvas.primary.removeChild(spr);
      spr.destroy();
    });
  } catch (e) {}
}

/* ---------------- 帧循环（每帧200ms，从左到右播完整行） ---------------- */
function _playFrames(base, cols, row, spr, onEnd) {
  let i = 0;
  const timer = setInterval(() => {
    i++;
    if (i >= cols) {
      clearInterval(timer);
      onEnd();
      return;
    }
    spr.texture = new PIXI.Texture(base, new PIXI.Rectangle(i * FRAME, row * FRAME, FRAME, FRAME));
  }, FRAME_MS);
}

/* ---------------- 远程光箭（PIXI 绘制） ---------------- */
function _shootArrow(from, target, onArrive) {
  if (!canvas.primary) {
    onArrive();
    return;
  }
  const g = new PIXI.Graphics();
  canvas.primary.addChild(g);
  const x0 = from.center.x, y0 = from.center.y;
  const x1 = target.center.x, y1 = target.center.y;
  const t0 = performance.now();
  const tick = () => {
    const t = Math.min(1, (performance.now() - t0) / FLY_MS);
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    g.clear();
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;
    g.lineStyle(5, 0xffe066, 0.3);
    g.moveTo(x0, y0);
    g.lineTo(x, y);
    g.lineStyle(3, 0xfff6cf, 0.95);
    g.moveTo(x - nx * 16, y - ny * 16);
    g.lineTo(x, y);
    g.beginFill(0xffffff, 1);
    g.moveTo(x + nx * 9, y + ny * 9);
    g.lineTo(x - ny * 5, y + ny * 5);
    g.lineTo(x + ny * 5, y - ny * 5);
    g.endFill();
    if (t >= 1) {
      if (g.parent) canvas.primary.removeChild(g);
      g.destroy();
      onArrive();
      return;
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------------- 白光（使用者闪一瞬） ---------------- */
// [修复-2026-08-18] 改用统一特效状态管理器（fxBegin/fxEnd，与 damageSound 染红/绿闪共享）：
// 行动白闪与受击染红/受治疗绿闪几乎同时发生时，恢复总是回到 token 的真实基础滤镜，
// 不再互相污染（旧实现各自保存首次滤镜，重叠时会把对方的白色滤镜当作原始值 → 永久变亮）。
function _whiteFlash(token) {
  try {
    if (!token || token.destroyed || !token.mesh) return;
    const fx = fxBegin(token);
    if (!fx) return;
    // 纹理滤镜染白（去饱和 + 提亮），与受击染红(tint)一致的"染纹理"方案
    const filter = new PIXI.ColorMatrixFilter();
    filter.saturate(0, true);
    filter.brightness(3, true);
    token.mesh.filters = fx.baseFilters ? [...fx.baseFilters, filter] : [filter];
    fxEnd(token, WHITE_MS);
  } catch (e) {}
}

/* ---------------- 物品卡注入「战斗动画」字段（所有物品类型统一） ---------------- */
Hooks.on("renderItemSheet", (app, html) => {
  try {
    if (html.find(".d35e-battle-anim-box").length) return;
    const item = app.object;
    const anim = item?.system?.battleAnim || {};
    const box = $(
      `<div class="detailsbox d35e-battle-anim-box" style="flex:0">
        <div class="item-properties flexrow" style="display:flex;flex-wrap:wrap;">
          <div class="form-group" style="flex:1 1 100%">
            <label><i class="fas fa-fire"></i> 战斗动画</label>
            <input type="text" name="system.battleAnim.img" value="${anim.img || ''}" placeholder="RPG Maker MV动画图（留空=用系统默认）"/>
            <button type="button" class="file-picker" data-type="image" data-target="system.battleAnim.img" title="选择文件"><i class="fas fa-file-import"></i></button>
          </div>
        </div>
        <div class="item-properties flexrow" style="display:flex;flex-wrap:wrap;">
          <div class="form-group" style="flex:1 1 100%">
            <label><i class="fas fa-music"></i> 动画音效</label>
            <input type="text" name="system.battleAnim.sound" value="${anim.sound || ''}" placeholder="systems/D35E/se/xxx.ogg（留空=不播放）"/>
            <button type="button" class="file-picker" data-type="audio" data-target="system.battleAnim.sound" title="选择音效文件"><i class="fas fa-file-import"></i></button>
          </div>
        </div>
      </div>`
    );
    const descTab = html.find('.tab[data-tab="details"]').length
      ? html.find('.tab[data-tab="details"]')
      : html.find('.tab[data-tab="description"]');
    if (descTab.length) descTab.prepend(box);
    // 手动绑定文件选择按钮（注入时机晚于 Foundry activateListeners，需自行绑定；按 data-target 通用处理）
    box.find('.file-picker').on('click', (ev) => {
      ev.preventDefault();
      const btn = $(ev.currentTarget);
      const target = btn.data('target') || '';
      const input = box.find('input[name="' + target + '"]');
      new FilePicker({
        type: btn.data('type') || 'image',
        current: input.val() || '',
        callback: (path) => {
          input.val(path);
          item.update({ [target]: path });
        },
      }).render(true);
    });
  } catch (e) {}
});

/* ---------------- 其他客户端同步（whisper + flags 通道） ---------------- */
Hooks.on("createChatMessage", (message) => {
  const d = message.getFlag("D35E", "battleAnim");
  if (!d) return;
  if (message.user.id === game.user.id) return;
  if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
  _playLocal(d);
  // [D35E]多 Token 修正：白闪使用广播的 fromTokenId（发起者 Token 在发送端已按实际 token 解析）
  if (d.fromTokenId) {
    const from = canvas.tokens.get(d.fromTokenId);
    if (from) _whiteFlash(from);
  }
});

// [D35E] battleAnim 同步消息只是动画载体：所有客户端渲染时直接隐藏，聊天不出现空白耳语
Hooks.on("renderChatMessage", (message, html) => {
  if (message.getFlag("D35E", "battleAnim")) html.hide();
});

/* ----------------死亡骷髅标记移除（需求：角色死亡时不再显示骷髅头） ---------------- */
function _isSkullIcon(icon) {
  const s = String(icon || "");
  if (!s) return false;
  if (s === "icons/svg/skull.svg") return true;
  if (/skull/i.test(s) && /svg|png|webp|jpg|jpeg/i.test(s)) return true;
  try {
    const defeatedId = CONFIG.specialStatusEffects?.DEFEATED || "dead";
    const deadCfg = CONFIG.statusEffects?.find((c) => c.id === defeatedId);
    if (deadCfg?.icon && s === deadCfg.icon) return true;
  } catch (e) {}
  return false;
}
function _purgeSkull(doc) {
  try {
    // overlayEffect 叠加层（v11 字段，D35E 死亡骷髅就存在这里）
    if (_isSkullIcon(doc.overlayEffect)) {
      doc.update({ overlayEffect: "" });
    }
    const fx = doc.effects || [];
    if (!fx.length) return;
    const keep = fx.filter((e) => !_isSkullIcon(e));
    if (keep.length !== fx.length) doc.update({ effects: keep });
  } catch (e) {}
}
Hooks.on("createToken", (doc) => _purgeSkull(doc));
Hooks.on("updateToken", (doc) => _purgeSkull(doc));

/* ----------------战斗追踪器/defeated 骷髅标记移除（双保险） ---------------- */
Hooks.on("updateCombatant", (combatant, change) => {
  try {
    if (change.defeated !== undefined) {
      const tok = combatant.token;
      if (tok && tok.document) _purgeSkull(tok.document);
      // Foundry 标记 defeated 时只局部重绘该行，需在重绘后移除骷髅按钮
      const cid = combatant.id;
      setTimeout(() => {
        const row = document.querySelector('#combat [data-combatant-id="' + cid + '"]');
        if (row) row.querySelectorAll('.combatant-control[data-control="toggleDefeated"]').forEach((el) => el.remove());
      }, 150);
    }
  } catch (e) {}
});
Hooks.on("renderCombatTracker", (app, html) => {
  try {
    html.find('.combatant-control[data-control="toggleDefeated"]').remove();
  } catch (e) {}
});
