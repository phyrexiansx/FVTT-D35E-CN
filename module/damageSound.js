/**
 * [D35E] 受击音效 + 自然20/自然1音效
 *
 * 受击音效：
 * - Token 受到伤害（HP 减少）时播放音效；
 *   仅在伤害结算路径（ActorDamageHelper.applyDamage 传 options.hitSound 标记）播放；
 *   手动改血（角色卡输入/GM 改数据，无标记）不播放。
 * - 每个角色可单独设置（actor.flags.D35E.hitSoundFile，角色卡「通用设置」）；
 *   未设置则播放系统默认（systems/D35E/se/hit.wav，可在设置里改）。
 * - 播放范围：所有客户端（发送端本地播放 + whisper 通道通知其他客户端，防双播）。
 *
 * 自然20/自然1音效：
 * - 角色进行的 1d20 投掷掷出 20（自然20）或 1（自然1）时播放对应音效；
 *   检测消息中的 d20 骰子结果（含优势/劣势的 2d20 递归查找）。
 * - 每个角色可单独设置（actor.flags.D35E.n20SoundFile / n1SoundFile）；
 *   未设置则播放系统默认（systems/D35E/se/N20.ogg、N1.ogg）。
 * - 播放范围：所有客户端（消息本身广播到所有客户端，各端本地检测播放，无需 socket）。
 */

const KEY = {
  enable: "hitSoundEnabled",
  volume: "hitSoundVolume",
  file: "hitSoundFile",
  effect: "hitEffectEnabled",
  healEffect: "healEffectEnabled",
  natEnable: "natSoundEnabled",
  natVolume: "natSoundVolume",
  natFile20: "natSoundFile20",
  natFile1: "natSoundFile1",
};

// 受击特效参数：染红时长 / 晃动时长 / 音效相对动画的延迟
const HIT_EFFECT = {
  flashDuration: 400,
  shakeDuration: 450,
  soundDelay: 220,
};

let _lastPlayed = 0; // 全局防双播（受击：options 广播场景 + whisper 兜底）
const _hpBefore = new Map(); // actorId -> {v, t}（伤害前 HP，仅发送端 preUpdateActor 记录）
const _natPlayed = new Set(); // 会话内已播放的自然数消息 id（防重渲染重复播）

function _enabled() {
  return game.settings.get("D35E", KEY.enable);
}
function _defaultFile() {
  return game.settings.get("D35E", KEY.file);
}
function _play(src) {
  if (!src) return;
  AudioHelper.play({ src, volume: game.settings.get("D35E", KEY.volume) }, false);
  _lastPlayed = Date.now();
}

Hooks.once("init", () => {
  game.settings.register("D35E", KEY.enable, {
    name: "受击音效",
    hint: "Token 受到伤害（HP 减少）时播放音效；手动修改血量不播放。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("D35E", KEY.volume, {
    name: "受击音效音量",
    hint: "0 到 1 之间。",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 1.0,
  });
  game.settings.register("D35E", KEY.file, {
    name: "受击音效文件（默认）",
    hint: "未单独设置音效的角色使用该音频。默认 systems/D35E/se/hit.wav。",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: "systems/D35E/se/hit.wav",
  });
  game.settings.register("D35E", KEY.effect, {
    name: "受击特效（染红+晃动）",
    hint: "Token 受到伤害（HP 减少）时染红闪烁并晃动；与受击音效同一触发逻辑，音效随动画略微滞后播放。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("D35E", KEY.healEffect, {
    name: "受治疗特效（绿色染纹理+闪白光）",
    hint: "Token 恢复生命值（HP 增加，来自治疗结算）时纹理染绿并闪白光，不晃动；手动改血不触发。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("D35E", KEY.natEnable, {
    name: "自然20/自然1音效",
    hint: "角色掷出自然20（d20=20）或自然1（d20=1）时播放对应音效。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("D35E", KEY.natVolume, {
    name: "自然20/自然1音效音量",
    hint: "0 到 1 之间。",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 1.0,
  });
  game.settings.register("D35E", KEY.natFile20, {
    name: "自然20音效文件（默认）",
    hint: "未单独设置的角色掷出自然20时使用该音频。默认 systems/D35E/se/N20.ogg。",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: "systems/D35E/se/N20.ogg",
  });
  game.settings.register("D35E", KEY.natFile1, {
    name: "自然1音效文件（默认）",
    hint: "未单独设置的角色掷出自然1时使用该音频。默认 systems/D35E/se/N1.ogg。",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: "systems/D35E/se/N1.ogg",
  });
});

// ==================== 统一特效状态管理器（染红/染绿/白闪共享） ====================
// [修复-2026-08-18] 染红(tint)、绿闪(tint+filters)、白闪(filters) 三种特效以前各自保存「首次原始值」，
// 触发太快（如行动白闪 + 受击染红几乎同时）时会互相把对方的临时染色当作原始值保存，
// 恢复后残留 → token 被永久染色/永久变亮。
// 现统一按 token 管理：
//  - token._d35eFx = { baseTint, baseFilters, count }：base 为无任何特效时的真实基础值（首次快照，之后不再变）
//  - 每个特效开始时 count++（并取消待恢复计时，避免提前恢复破坏进行中的特效），结束时 count--；
//  - count 归零后延迟恢复基础值并清除（多个特效重叠时只恢复一次，且永远回到真实基础值，互不污染）
export function fxBegin(token) {
  try {
    if (!token || token.destroyed || !token.mesh) return null;
    clearTimeout(token._d35eFxTimer); // 新特效开始：取消待恢复（否则会提前恢复破坏进行中的特效）
    if (!token._d35eFx) {
      token._d35eFx = {
        baseTint: token.mesh.tint ?? 0xffffff,
        baseFilters: token.mesh.filters ? [...token.mesh.filters] : null,
        count: 0,
      };
    }
    token._d35eFx.count++;
    return token._d35eFx;
  } catch (e) {
    return null;
  }
}
export function fxEnd(token, delayMs) {
  try {
    const fx = token?._d35eFx;
    if (!fx) return;
    fx.count = Math.max(0, fx.count - 1);
    if (fx.count === 0) {
      clearTimeout(token._d35eFxTimer);
      token._d35eFxTimer = setTimeout(() => {
        const f = token._d35eFx;
        // count 仍为 0 才恢复（期间若有新特效开始会先 clearTimeout 取消本次恢复）
        if (f && f.count === 0 && !token.destroyed && token.mesh) {
          token.mesh.tint = f.baseTint;
          token.mesh.filters = f.baseFilters ? [...f.baseFilters] : null;
        }
        delete token._d35eFx;
        token._d35eFxTimer = null;
      }, delayMs || 0);
    }
  } catch (e) {}
}

// ==================== 受击特效（染红 + 晃动） ====================

// 精确到受击 Token：tokenId 优先（unlinked 独立血量 token，仅受击的那个播特效）；
// 回退（无 tokenId / token 已不在场）：仅匹配 linked token（t.actor 与 actor 同一实例），
// unlinked token 的 t.actor 是 synthetic 副本（id 相同但实例不同），不应被误匹配
function _getHitTokens(actor, tokenId) {
  if (tokenId && canvas?.tokens) {
    const t = canvas.tokens.get(tokenId);
    if (t) return [t];
  }
  if (!actor) return [];
  return canvas.tokens.placeables.filter((t) => t.actor === actor);
}

// 染红：Token 纹理短暂染红后恢复。
// [修复-2026-08-18] 改用统一特效状态管理器（fxBegin/fxEnd）：与白闪/绿闪重叠时
// 恢复总是回到 token 的真实基础色调，不再互相污染（旧实现各自保存首次值，重叠时会残留染色）。
function _flashRed(token) {
  try {
    if (!token || token.destroyed || !token.mesh) return;
    const fx = fxBegin(token);
    if (!fx) return;
    token.mesh.tint = 0xff0000; // 染红 token 纹理（而非叠加红色方格）
    fxEnd(token, HIT_EFFECT.flashDuration);
  } catch (e) {
    console.error("D35E hit effect (flash):", e);
  }
}

// 晃动：Token 网格做带衰减的正弦抖动，结束后归位（不改变实际位置）
function _shakeToken(token) {
  const mesh = token.mesh;
  if (!mesh) return;
  const ox = mesh.x;
  const oy = mesh.y;
  const amp = Math.min(token.w, token.h) * 0.05 + 3;
  const dur = HIT_EFFECT.shakeDuration;
  // 标记晃动窗口：行走图模式的 position 补偿（walk-animation）在此期间跳过，避免覆盖晃动
  token._d35eShakeUntil = Date.now() + dur + 60;
  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / dur;
    if (t >= 1) {
      mesh.x = ox;
      mesh.y = oy;
      token._d35eShakeUntil = 0;
      return;
    }
    const decay = 1 - t;
    mesh.x = ox + Math.sin(t * Math.PI * 7) * amp * decay;
    mesh.y = oy + Math.cos(t * Math.PI * 5) * amp * decay * 0.6;
    requestAnimationFrame(tick);
  };
  tick();
}

// 对角色受击 Token 播放受击特效（受设置开关控制；unlinked 时精确到受击 token）
function _playHitEffect(actor, tokenId) {
  if (!game.settings.get("D35E", KEY.effect)) return;
  _getHitTokens(actor, tokenId).forEach((t) => {
    _flashRed(t);
    _shakeToken(t);
  });
}

// ==================== 受治疗特效（绿色染纹理 + 闪白光，不晃动） ====================

// 受治疗特效（绿+白同时渐变亮起，同时恢复）。
// [修复-2026-08-18] 与染红同理：统一特效状态管理器，恢复回到真实基础 tint/filters，
// 连续治疗或与白闪/染红重叠时不再残留绿色/白色。
function _flashGreen(token) {
  try {
    if (!token || token.destroyed || !token.mesh) return;
    const mesh = token.mesh;
    const fx = fxBegin(token);
    if (!fx) return;
    const origTint = fx.baseTint;
    const origFilters = fx.baseFilters;
    const fadeMs = 200; // 绿 tint 与白滤镜同时渐变时长
    const holdMs = 200; // 保持时长
    const tintRGB = (v) => ({ r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff });
    const rgbTint = (o) => ((o.r << 16) | (o.g << 8) | o.b);
    const a0 = tintRGB(origTint), a1 = tintRGB(0x00ff00);
    // 白色滤镜立即挂上（alpha=0），与绿色同步渐变
    const filter = new PIXI.ColorMatrixFilter();
    filter.saturate(0, true);
    filter.brightness(3, true);
    filter.alpha = 0;
    mesh.filters = origFilters ? [...origFilters, filter] : [filter];
    const t0 = performance.now();
    const tick = () => {
      if (token.destroyed || !token.mesh) return;
      const t = Math.min(1, (performance.now() - t0) / fadeMs);
      // 绿色渐变
      mesh.tint = rgbTint({
        r: Math.round(a0.r + (a1.r - a0.r) * t),
        g: Math.round(a0.g + (a1.g - a0.g) * t),
        b: Math.round(a0.b + (a1.b - a0.b) * t),
      });
      // 白色淡入（同步）
      filter.alpha = t;
      if (t < 1) { requestAnimationFrame(tick); return; }
      // 保持后统一恢复（fxEnd：重叠特效计数归零后才恢复基础值）
      fxEnd(token, holdMs);
    };
    requestAnimationFrame(tick);
  } catch (e) {}
}

// 对角色受治疗 Token 播放受治疗特效（受设置开关控制，不晃动；unlinked 时精确到受击 token）
function _playHealEffect(actor, tokenId) {
  if (!game.settings.get("D35E", KEY.healEffect)) return;
  _getHitTokens(actor, tokenId).forEach((t) => _flashGreen(t));
}

// ==================== 受击音效 ====================

// 记录伤害前 HP（仅携带 hitSound 标记的更新——伤害结算）；
// key 用 token 维度（unlinked 多 token 的 synthetic actor 共享 actor.id，避免互相覆盖）
function _hpKey(actor) {
  return actor.isToken && actor.token ? actor.token.id : actor.id;
}
Hooks.on("preUpdateActor", (actor, change, options) => {
  if (options?.hitSound) {
    _hpBefore.set(_hpKey(actor), {
      v: actor.system.attributes.hp.value,
      t: actor.system.attributes.hp.temp,
    });
  }
});

// 数值确认减少后播放（发送端 + options 广播到其他客户端时）
Hooks.on("updateActor", (actor, change, options) => {
  if (!options?.hitSound) return;
  const before = _hpBefore.get(_hpKey(actor));
  _hpBefore.delete(_hpKey(actor));
  if (!before) return;
  const totalBefore = before.v + before.t;
  const totalAfter = actor.system.attributes.hp.value + actor.system.attributes.hp.temp;
  // [D35E]精确到受击 token（unlinked 独立血量：仅受击 token 播特效；linked 回退全部）
  const hitTokenId = actor.isToken ? actor.token?.id : undefined;
  // [D35E]受治疗特效：HP增加（恢复生命值）且来自结算（options.hitSound标记，手动改血不触发）→ 绿色染纹理+闪白光，不晃动
  if (totalAfter > totalBefore) {
    _playHealEffect(actor, hitTokenId);
    const healRecipients = game.users.filter((u) => u.active && !u.isSelf).map((u) => u.id);
    if (healRecipients.length) {
      ChatMessage.create({
        content: "",
        whisper: healRecipients,
        type: CONST.CHAT_MESSAGE_TYPES.OOC,
        flags: { D35E: { healEffect: actor.id, hitTokenId } },
      });
    }
    return;
  }
  if (totalAfter >= totalBefore) return; // 未减少（治疗/无变化）不播
  // [D35E]角色专属音效优先，未设置则用默认
  const src = actor.getFlag("D35E", "hitSoundFile") || _defaultFile();
  // 受击特效（染红+晃动），音效随动画略微滞后播放
  _playHitEffect(actor, hitTokenId);
  setTimeout(() => _play(src), HIT_EFFECT.soundDelay);
  // 通知其他客户端（options 不一定广播到远端，用 D35E whisper+flags 通道兜底；带角色ID+tokenID+攻击者ID供远端播特效/朝向）
  const recipients = game.users.filter((u) => u.active && !u.isSelf).map((u) => u.id);
  if (recipients.length) {
    ChatMessage.create({
      content: "",
      whisper: recipients,
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
      flags: {
        D35E: {
          hitSound: src,
          hitActorId: actor.id,
          hitTokenId,
        },
      },
    });
  }
});

// 其他客户端：收到 healEffect 通知 → 播放受治疗特效（绿色染纹理+闪白光）
Hooks.on("createChatMessage", (message) => {
  const healId = message.getFlag("D35E", "healEffect");
  if (!healId) return;
  if (message.user.id === game.user.id) {
    if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
    return;
  }
  const hitTokenId = message.getFlag("D35E", "hitTokenId");
  const healActor = game.actors.get(healId);
  if (healActor) _playHealEffect(healActor, hitTokenId);
  if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
});

// 其他客户端：收到 hitSound 通知 → 播特效 + 延迟播放音效（500ms 内已播过则跳过，避免与 options 广播双播）
Hooks.on("createChatMessage", (message) => {
  const src = message.getFlag("D35E", "hitSound");
  if (!src) return;
  if (message.user.id === game.user.id) {
    if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
    return;
  }
  if (Date.now() - _lastPlayed < 500) return;
  // [D35E]远端也播放受击特效（带 hitTokenId 精确到受击 token）
  const actorId = message.getFlag("D35E", "hitActorId");
  const hitTokenId = message.getFlag("D35E", "hitTokenId");
  if (actorId) {
    const actor = game.actors.get(actorId);
    if (actor) _playHitEffect(actor, hitTokenId);
  }
  setTimeout(() => _play(src), HIT_EFFECT.soundDelay);
  if (game.user.isGM) setTimeout(() => message.delete().catch(() => {}), 1000);
});

// [D35E] 受击/受治疗特效同步消息只是载体：所有客户端渲染时直接隐藏，聊天不闪现空白耳语
Hooks.on("renderChatMessage", (message, html) => {
  if (message.getFlag("D35E", "hitSound") || message.getFlag("D35E", "healEffect")) html.hide();
});

// ==================== 自然20/自然1音效 ====================

// 递归查找 d20 骰子的极点结果："n20" | "n1" | null
function _findNat(terms) {
  if (!Array.isArray(terms)) return null;
  for (const t of terms) {
    if (t instanceof Die && t.faces === 20) {
      if (t.total === 20) return "n20";
      if (t.total === 1) return "n1";
    }
    if (Array.isArray(t)) {
      // [修复] message.rolls.map(r => r.terms) 传进来的是「terms 数组的数组」，
      // 元素本身是数组而不是骰子项，必须递归进内层数组才能找到 Die
      const r = _findNat(t);
      if (r) return r;
    }
    if (Array.isArray(t.terms)) {
      const r = _findNat(t.terms);
      if (r) return r;
    }
  }
  return null;
}

// 渲染聊天消息时检测：仅处理新消息（5 秒内）+ 会话内防重
Hooks.on("renderChatMessage", (message, html) => {
  if (!game.settings.get("D35E", KEY.natEnable)) return;
  if (_natPlayed.has(message.id)) return;
  if (Date.now() - message.timestamp > 5000) return; // 只处理刚创建的消息
  const nat = _findNat(message.rolls?.map((r) => r.terms));
  if (!nat) return;
  _natPlayed.add(message.id);
  // 角色专属音效优先（未设置则用默认），音量用自然数音量
  const actor = ChatMessage.getSpeakerActor(message.speaker);
  const src =
    nat === "n20"
      ? (actor?.getFlag("D35E", "n20SoundFile") || game.settings.get("D35E", KEY.natFile20))
      : (actor?.getFlag("D35E", "n1SoundFile") || game.settings.get("D35E", KEY.natFile1));
  if (!src) return;
  AudioHelper.play({ src, volume: game.settings.get("D35E", KEY.natVolume) }, false);
});

// ==================== 角色卡「通用设置」音效选择器 ====================

Hooks.on("renderActorSheet", (app, html) => {
  // 模板的 {{flags...}} 在 D35E sheet 中读不到（getData 未提供 flags 上下文），
  // 每次渲染用 JS 直接回填，保证输入框显示已保存的路径
  const fill = (name, key) => {
    html.find('input[name="flags.D35E.' + name + '"]').val(app.actor.getFlag("D35E", key) || "");
  };
  fill("hitSoundFile", "hitSoundFile");
  fill("n20SoundFile", "n20SoundFile");
  fill("n1SoundFile", "n1SoundFile");

  const openPicker = (key, targetName) => {
    new FilePicker({
      type: "audio",
      current: app.actor.getFlag("D35E", key) || "",
      target: "flags.D35E." + targetName,
      callback: async (path) => {
        await app.actor.setFlag("D35E", key, path);
        html.find('input[name="flags.D35E.' + targetName + '"]').val(path);
      },
    }).render(true);
  };

  html.find('[data-d35e-hitfile]').on("click", (ev) => {
    ev.preventDefault();
    openPicker("hitSoundFile", "hitSoundFile");
  });
  html.find('[data-d35e-natfile]').on("click", (ev) => {
    ev.preventDefault();
    const nat = ev.currentTarget.dataset.nat; // "n20" | "n1"
    if (nat === "n20") openPicker("n20SoundFile", "n20SoundFile");
    else if (nat === "n1") openPicker("n1SoundFile", "n1SoundFile");
  });
});
