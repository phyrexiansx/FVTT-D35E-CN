// ==================== 直觉动作（Immediate Action） ====================
// 功能1：GM 在战斗中按下宏（game.D35E.immediateActions.promptAll()），
//        检测所有在线玩家绑定角色（user.character）中
//        「激活类型=直觉动作 且 剩余次数≥1」的能力，通过 whisper+flags
//        推送给对应玩家（FVTT v11 的 game.socket 自定义事件无法跨客户端送达），
//        玩家端弹出临时窗口，点击能力即可直接使用（item.use）。
// 功能2（与 combat.js 联动）：玩家使用直觉动作后，该角色下一回合
//        动作计数器不获得迅捷动作（系统设置 immediateActionRule 控制）。
// 玩家端监听在 ready 时注册（whisper+flags 通道）；GM 端入口挂在 game.D35E.immediateActions。

/* 直觉动作提示音效设置（se/im.wav，默认音量 0.5，可在设置中关闭/调整） */
Hooks.once("init", () => {
  game.settings.register("D35E", "imSoundEnabled", {
    name: "直觉动作提示音效",
    hint: "玩家收到直觉动作推送（弹窗）时播放 se/im.wav。",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("D35E", "imSoundVolume", {
    name: "直觉动作提示音效音量",
    hint: "0 到 1 之间（默认 0.5）。",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.5,
  });
});

/* -------------------------------------------- */
/*  玩家端：直觉动作选择窗口                      */
/* -------------------------------------------- */
export class ImmediateActionPrompt extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "d35e-immediate-action-prompt",
      classes: ["d35e", "immediate-prompt"],
      title: game.i18n.localize("D35E.ActivationTypeImmediate"),
      template: "systems/D35E/templates/apps/immediate-action-prompt.html",
      width: 440,
      height: "auto",
      resizable: true,
    });
  }

  constructor(actorId, actorName, items) {
    super();
    this.actorId = actorId;
    this.actorName = actorName;
    this.items = items || [];
  }

  getData() {
    return {
      actorName: this.actorName,
      items: this.items,
    };
  }

  activateListeners(html) {
    html.find(".d35e-ia-row").on("click", async (ev) => {
      const itemId = $(ev.currentTarget).data("item-id");
      const actor = game.actors.get(this.actorId) || game.user.character;
      const item = actor ? actor.items.get(itemId) : null;
      if (!item) {
        ui.notifications.warn(`找不到能力：${itemId}`);
        return;
      }
      const name = item.name;
      this.close();
      // [D35E] 点击即标记直觉动作已使用（combatant 权限继承 actor，玩家端可直接 setFlag）；
      // 放在 use 之前，避免法术弹施法对话框挂起导致标记不执行。法术不走 useAction 流程，
      // 这里对所有类型统一标记，追踪器直觉图标随即变灰
      const combat = game.combats.active;
      const combatant = combat?.getCombatantByActor(actor.id);
      if (combatant && game.settings.get("D35E", "immediateActionRule") !== false && !combatant.usedImmediateAction) {
        // 直接 setFlag（权限继承 actor，玩家拥有自己角色时可写；useAction 返回 undefined 不能 .catch）
        combatant.setFlag("D35E", "usedImmediateAction", true).catch(() => {});
      }
      try {
        await item.use({});
        ui.notifications.info(`已使用直觉动作：${name}`);
      } catch (e) {
        console.error("直觉动作使用失败", e);
        ui.notifications.error(`直觉动作使用失败：${e?.message || e}`);
      }
    });
  }
}

/* -------------------------------------------- */
/*  玩家端：whisper+flags 接收（v11 socket 自定义事件不可用，
 *  服务器只转发白名单事件；改用 ChatMessage whisper 携带 flags，
 *  玩家端 createChatMessage hook 拦截 → 弹窗 → 本地移除消息）      */
/* -------------------------------------------- */
function onPromptMessage(msg) {
  const payload = msg.flags?.D35E?.immediateActionPrompt;
  if (!payload) return;
  const msgUserId = typeof msg.user === "object" ? msg.user?.id : msg.user;
  // 作者端（GM 创建推送）：真正删除该消息（广播后所有客户端都会移除，刷新不再残留）
  if (msgUserId === game.user.id) {
    msg.delete().catch(() => {});
    return;
  }
  const whisperIds = (msg.whisper || []).map((w) => (typeof w === "object" ? w.id : w));
  if (!whisperIds.includes(game.user.id)) return;
  // 先从本地聊天移除该推送消息（先删后弹窗，避免残留显示；GM 端的真删广播会随后同步清理）
  game.messages.delete(msg.id);
  $(`#chat-log .message[data-message-id="${msg.id}"]`).remove();
  // 播放直觉动作提示音效（默认 se/im.wav，音量 0.5，可在设置中关闭/调整；只对目标玩家播放）
  playImSound();
  // 关闭已打开的旧窗口（GM 重复推送时刷新）
  for (const w of Object.values(ui.windows)) {
    if (w instanceof ImmediateActionPrompt) w.close();
  }
  new ImmediateActionPrompt(payload.actorId, payload.actorName, payload.items).render(true);
}

/* -------------------------------------------- */
/*  直觉动作提示音效（se/im.wav）                */
/*  浏览器 autoplay 策略：AudioContext 需首次手势 */
/*  才能解锁；全局监听 pointerdown/click 提前解锁， */
/*  locked 期间的播放会由 Foundry 排队，手势后补播 */
/* -------------------------------------------- */
function playImSound() {
  if (game.settings.get("D35E", "imSoundEnabled") === false) return;
  const vol = Number(game.settings.get("D35E", "imSoundVolume"));
  const v = Number.isFinite(vol) ? vol : 0.5;
  try {
    const a = new Audio("systems/D35E/se/im.wav");
    a.volume = v;
    a.play().catch(() => {
      // 浏览器 autoplay 策略拒绝（页面尚无任何用户手势）→ 标记 pending，第一次手势时补播
      _pendingImSound = true;
    });
  } catch (e) {
    _pendingImSound = true;
  }
}
let _pendingImSound = false;
function _retryPendingImSound() {
  if (_pendingImSound) {
    _pendingImSound = false;
    playImSound();
  }
}
// 全局手势：HTMLMediaElement.play() 需要 sticky activation（页面历史上有过任何用户
// 手势即可）。模块加载时立即注册（不依赖 ready），玩家进入游戏后第一次点击即解锁，
// 之后弹窗播放直接出声；未解锁时的播放会 pending 并在第一次手势时补播。
if (!window.__d35eImAudioBound) {
  window.__d35eImAudioBound = true;
  for (const ev of ["pointerdown", "click", "mousedown", "touchstart", "keydown"]) {
    document.addEventListener(ev, _retryPendingImSound, { capture: true });
  }
}
// 预加载 im.wav（尽早开始缓存，弹窗时零延迟播放）
try {
  new Audio("systems/D35E/se/im.wav");
} catch (e) {}

/* -------------------------------------------- */
/*  法术位文本：准备施法看法术自身已准备次数；     */
/*  自发施法看整个这一级的剩余法术位              */
/* -------------------------------------------- */
function getSpellSlotText(item, actor) {
  // 法术环位：D35E 存于 system.level（0-9）；旧字段 spellLevel 兜底
  const level = item.system?.level ?? item.system?.spellLevel;
  const lvlText = Number.isFinite(Number(level)) ? String(level) : "?";
  const bookKey = item.system?.spellbook || "primary";
  const book = getProperty(actor.system, `attributes.spells.spellbooks.${bookKey}`);
  const prep = item.system?.preparation || {};
  if (book?.spontaneous) {
    // 自发施法：看整个这一级的剩余法术位（value/max）
    const slots = getProperty(book, `spells.spell${level}`);
    const v = slots?.value ?? 0;
    const m = slots?.max ?? 0;
    if (m > 0) return `法术位 ${lvlText} ${v}/${m}剩余`;
    return `法术位 ${lvlText}剩余 ${v}`;
  }
  // 准备施法：和这个法术自身的次数（已准备数量）有关
  const pa = Number(prep.preparedAmount);
  if (Number.isFinite(pa)) {
    const ma = Number(prep.maxAmount);
    if (Number.isFinite(ma) && ma > 0) return `法术位 ${lvlText} ${pa}/${ma}剩余`;
    return `法术位 ${lvlText}已准备 ${pa}`;
  }
  return `法术位 ${lvlText}`;
}

/* -------------------------------------------- */
/*  GM 端：收集在线玩家绑定角色的直觉动作能力      */
/*  监控战斗追踪器：不在战斗中/直觉动作已使用的玩家跳过 */
/* -------------------------------------------- */
export function collectPlayerImmediateActions() {
  const combat = game.combats.active;
  const results = [];
  const skipped = [];
  for (const user of game.users.contents) {
    if (!user.active || user.isGM) continue;
    const actor = user.character;
    if (!actor) {
      skipped.push({ userName: user.name, actorName: null, reason: "未绑定角色" });
      continue;
    }
    // 战斗追踪器监控：不在战斗中 → 无直觉动作可用
    const combatant = combat ? combat.getCombatantByActor(actor.id) : null;
    if (!combatant) {
      skipped.push({ userName: user.name, actorName: actor.name, reason: "不在战斗中" });
      continue;
    }
    // 战斗追踪器监控：本回合直觉动作已使用 → 不再弹窗
    if (combatant.usedImmediateAction === true) {
      skipped.push({ userName: user.name, actorName: actor.name, reason: "本回合直觉动作已使用" });
      continue;
    }
    const items = actor.items
      .filter((i) => {
        if (getProperty(i.system, "activation.type") !== "immediate") return false;
        const uses = getProperty(i.system, "uses.value");
        const usesMax = getProperty(i.system, "uses.max");
        if (i.type === "spell") {
          // 有次数限制（类法术/每日次数）需剩余≥1；无限制则看法术位
          if (Number(usesMax) > 0 && !(Number.isFinite(Number(uses)) && Number(uses) >= 1)) return false;
          // 法术位检查：自发施法看该级剩余法术位；准备施法看法术自身已准备次数
          const bookKey = i.system?.spellbook || "primary";
          const book = getProperty(actor.system, `attributes.spells.spellbooks.${bookKey}`);
          const iLevel = i.system?.level ?? i.system?.spellLevel;
          if (book?.spontaneous) {
            const slots = getProperty(book, `spells.spell${iLevel}`);
            if ((slots?.value ?? 0) < 1) return false;
          } else {
            const pa = Number(i.system?.preparation?.preparedAmount);
            if (!Number.isFinite(pa) || pa < 1) return false;
          }
          return true;
        }
        return Number.isFinite(Number(uses)) && Number(uses) >= 1;
      })
      .map((i) => {
        const uses = getProperty(i.system, "uses.value");
        const usesMax = getProperty(i.system, "uses.max");
        let usesText = String(uses ?? 0);
        if (i.type === "spell") usesText = getSpellSlotText(i, actor);
        return {
          id: i.id,
          name: i.name,
          img: i.img || CONST.DEFAULT_TOKEN,
          uses: Number.isFinite(Number(uses)) ? uses : 0,
          usesText,
        };
      });
    if (items.length) {
      results.push({
        userId: user.id,
        userName: user.name,
        actorId: actor.id,
        actorName: actor.name,
        items,
      });
    } else {
      skipped.push({ userName: user.name, actorName: actor.name, reason: "无可用的直觉动作能力" });
    }
  }
  return { results, skipped };
}

/* -------------------------------------------- */
/*  GM 端：一键推送 + 汇总窗口                   */
/* -------------------------------------------- */
export async function promptAll() {
  if (!game.user.isGM) {
    ui.notifications.warn("只有 GM 可以运行此功能");
    return;
  }
  if (!game.combats?.active) {
    ui.notifications.warn("当前没有进行中的战斗");
    return;
  }
  const { results, skipped } = collectPlayerImmediateActions();
  for (const r of results) {
    await ChatMessage.create({
      user: game.user.id,
      whisper: [r.userId],
      content: `<div style="font-size:12px;opacity:0.85;">直觉动作推送：<b>${r.actorName}</b>（${r.items.length} 个能力可用，玩家端将弹出选择窗口）</div>`,
      flags: { D35E: { immediateActionPrompt: { actorId: r.actorId, actorName: r.actorName, items: r.items } } },
    });
  }
  showGMSummary(results, skipped);
}

function showGMSummary(results, skipped = []) {
  const parts = [];
  if (!results.length) {
    parts.push(`<p style="padding:8px;font-size:13px;">没有玩家可推送直觉动作。</p>`);
  } else {
    parts.push(
      `<div style="max-height:45vh;overflow-y:auto;font-size:13px;">` +
        results
          .map(
            (r) =>
              `<div style="padding:6px 4px;border-bottom:1px solid rgba(0,0,0,0.12);">
               <b>${r.userName}</b>（${r.actorName}）— ${r.items.length} 个能力（已推送）
               <ul style="margin:4px 0 0 18px;font-size:12px;">
                 ${r.items.map((it) => `<li>${it.name}（${it.usesText}）</li>`).join("")}
               </ul>
             </div>`
          )
          .join("") +
        `</div>`
    );
  }
  if (skipped.length) {
    parts.push(
      `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(0,0,0,0.15);font-size:12px;opacity:0.85;">
        <div style="margin-bottom:4px;"><b>跳过（${skipped.length}）</b></div>
        ${skipped.map((s) => `<div>${s.userName}${s.actorName ? "（" + s.actorName + "）" : ""}：${s.reason}</div>`).join("")}
      </div>`
    );
  }
  new Dialog(
    {
      title: "直觉动作 · 已发送给玩家",
      content: parts.join(""),
      buttons: { ok: { label: "确定", callback: () => {} } },
      default: "ok",
    },
    { classes: ["dialog", "d35e", "immediate-summary"] }
  ).render(true);
}

/* -------------------------------------------- */
/*  注册                                          */
/* -------------------------------------------- */
Hooks.once("ready", () => {
  game.D35E.immediateActions = {
    promptAll,
    collectPlayerImmediateActions,
    ImmediateActionPrompt,
  };
  Hooks.on("createChatMessage", onPromptMessage);
  // 兜底：推送消息在目标玩家端一律隐藏（无论渲染时序，本地集合删除 + DOM 移除之外的双保险）
  Hooks.on("renderChatMessage", (msg, html) => {
    if (!msg.flags?.D35E?.immediateActionPrompt) return;
    const whisperIds = (msg.whisper || []).map((w) => (typeof w === "object" ? w.id : w));
    if (whisperIds.includes(game.user.id)) html.hide();
  });
});
