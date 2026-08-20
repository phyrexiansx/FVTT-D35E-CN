/**
 * 借机攻击（Attack of Opportunity）执行模块
 *
 * 触发：D35E.js 的 preUpdateToken hook 检测到棋子离开威胁区域 → handleAoOThreat
 * 流程：
 *  - 对每个可借机的威胁者：PC（有玩家 owner）→ 弹窗给在线 owner（不给 GM）；NPC → 弹窗给 GM
 *  - 弹窗列出该角色所有"可进行借机"的攻击（system.attackAoO !== false，仅 attack 类物品）
 *    - 点击某个攻击 → 视为借机攻击：自动锁定移动者为目标 → 打开该攻击的检定对话框
 *    - 只有一个可用攻击 → 直接打开该攻击的检定（不弹选择窗口）
 *  - 执行时 rollData 注入 aoAttack=1 / attackType="AO attack"，供 Combat Changes
 *    条件词条判断（例如 `"@attackType" == "AO attack"` 或 `@aoAttack == 1`）
 *  - 执行成功后扣减 combatant 的 usedAaoCount（失败静默，无权限时由 GM 手动管理）
 *  - 借机次数用完（usedAaoCount >= aaoCount）→ 不弹窗、不分发
 *
 * 跨用户分发：FVTT v11 中系统无法使用 FVTT socket（module.* 消息被丢弃，system.* 消息
 * 会被 core 的 handleSocketEvent 以 "unknown type" 拒绝），因此走 ChatMessage.whisper
 * + flags 通道：发送端创建 whisper 消息（对非接收方数据隐藏），接收端 createChatMessage
 * hook 检测 flags 弹窗，GM 延迟删除消息清理聊天记录。
 */
import { ItemUse } from "../item/extensions/use.js";
import { DistanceHelper } from "../canvas/distance-helper.js";

/** ready 内调用：注册消息监听 + 挂载全局接口（供 GM 宏调用） */
export function registerAoO() {
  Hooks.on("createChatMessage", onAoOChannelMessage);
  game.D35E = game.D35E || {};
  game.D35E.aoOHandlers = {
    handleAoOThreat,
    isThreatened: (t, e) => DistanceHelper.isThreatened(t, e),
  };
}

/**
 * GM 右键菜单：强制触发借机攻击。
 * 注意：getTokenContext 只在 TokenLayer 创建（场景加载）时触发一次，
 * 在 v11.315 下实测无法稳定显示，已改用宏方案（D35E-触发借机攻击.js，调用 game.D35E.aoOHandlers）。
 * 本段保留备查，不注册。
 */
/* Hooks.on("getTokenContext", (html, options) => {
    if (!game.user.isGM) return;
    options.push({
      name: game.i18n.localize("D35E.AoOForcedLabel"),
      icon: '<i class="fas fa-crosshairs"></i>',
      condition: () => true,
      callback: () => {
        if (!game.combat) {
          return ui.notifications.info(game.i18n.localize("D35E.AoOForcedNone"));
        }
        const target = canvas.tokens.controlled[0];
        if (!target?.actor) return;
        const targetDisp = target.document?.disposition ?? 0;
        const threats = canvas.tokens.placeables.filter((t) => {
          if (t.id === target.id || !t.actor) return false;
          if (t.document?.hidden) return false;
          if (t.actor.system?.attributes?.conditions?.helpless) return false;
          // 相反阵营：双方都非中立且符号相反
          const tDisp = t.document?.disposition ?? 0;
          if (!tDisp || !targetDisp || Math.sign(tDisp) === Math.sign(targetDisp)) return false;
          // 威胁该生物
          if (!DistanceHelper.isThreatened(t, target)) return false;
          // 还有借机次数
          const combatant = game.combat?.combatants.find((c) => c.tokenId === t.id);
          if (combatant) {
            const used = combatant.getFlag("D35E", "usedAaoCount") || 0;
            const max = combatant.getFlag("D35E", "aaoCount") ?? 1;
            if (used >= max) return false;
          }
          return true;
        });
        if (!threats.length) {
          return ui.notifications.info(game.i18n.localize("D35E.AoOForcedNone"));
        }
        handleAoOThreat(target, threats);
      },
    });
  });
*/

/** 借机窗口跨用户通道：whisper 消息带 flags（对非接收方隐藏数据） */
function sendAoOPrompt(payload, recipients) {
  if (!recipients?.length) return;
  ChatMessage.create({
    whisper: recipients,
    content: "",
    speaker: { alias: "" },
    flags: { D35E: { aooPrompt: payload } },
  });
}

/** createChatMessage hook：接收方弹窗，GM 延迟清理 */
function onAoOChannelMessage(message) {
  const payload = message.getFlag("D35E", "aooPrompt");
  if (!payload) return;
  const recipients = message.whisper || [];
  const isRecipient = recipients.includes(game.userId);
  const isAuthor = message.author?.id === game.userId;
  // 仅接收方（且非作者）弹窗
  if (isRecipient && !isAuthor) {
    aoAttackPrompt(payload).catch((e) => console.error("D35E | AoO prompt failed", e));
  }
  // ⚠️ v11.315 服务端删除"空内容+flags 的 whisper 消息"会触发 ServerDatabaseBackend
  // _deleteDocuments 读取 invalid 崩溃（核心 bug），且错误经 socket 回调走 _handleError 显示，
  // delete() 的 catch 无法拦截。因此不再自动删除：提示消息 content 为空，聊天记录中不可见，
  // 数据无害保留（待 Foundry 修复后可恢复自动清理）。
}

// [D35E]借机提示载体消息只是数据：渲染时直接隐藏，聊天不出现空耳语（GM 与接收方均不显示）
Hooks.on("renderChatMessage", (message, html) => {
  if (message.getFlag("D35E", "aooPrompt")) html.hide();
});

/**
 * 借机触发后：为可借机的威胁者分发借机窗口。
 * @param {object} moverToken 移动者（离开威胁区域的 token）
 * @param {Array} threateningTokens 可借机的威胁者列表
 */
export function handleAoOThreat(moverToken, threateningTokens) {
  // 借机攻击只在战斗时生效（探索阶段静默，不弹窗不提示）
  if (!game.combat) return;
  if (!threateningTokens?.length) return;
  const sceneId = canvas.scene?.id;
  if (!sceneId) return;
  for (const t of threateningTokens) {
    if (!t.actor) continue;
    // 右键隐藏 / 无助（helpless）角色不参与借机攻击
    if (t.document?.hidden) continue;
    if (t.actor.system?.attributes?.conditions?.helpless) continue;
    // [D35E]没有可用借机攻击的角色不出现在借机分发与提示中
    if (!getAoOAttacks(t.actor).length) continue;
    // 借机次数已用完 → 跳过（发送端预检，避免无谓分发）
    const combatant = game.combat?.combatants.find((c) => c.tokenId === t.id);
    if (combatant) {
      const used = combatant.getFlag("D35E", "usedAaoCount") || 0;
      const max = combatant.getFlag("D35E", "aaoCount") ?? 1;
      if (used >= max) continue;
    }
    // v11 兼容：无 getOwnerUsers（v12+），用 testUserPermission 过滤在线 owner；
    // 注意排除 GM：GM 对所有 actor 都有 OWNER 权限，PC 借机应只弹给玩家 owner
    const ownerUsers =
      typeof t.actor.getOwnerUsers === "function"
        ? t.actor.getOwnerUsers().filter((u) => u.active && !u.isGM)
        : game.users.filter(
            (u) => u.active && !u.isGM && t.actor.testUserPermission(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
          );
    if (ownerUsers.length > 0) {
      // PC（有玩家 owner）：只弹给在线 owner（不给 GM）
      for (const u of ownerUsers) {
        if (u.id === game.userId) {
          openAoOAttackDialog(t, moverToken);
        } else {
          sendAoOPrompt(makePayload(t, moverToken), [u.id]);
        }
      }
    } else if (game.user.isGM) {
      // NPC：本地（GM）直接弹
      openAoOAttackDialog(t, moverToken);
    } else {
      // NPC：whisper 发给 GM
      const gms = game.users.filter((u) => u.isGM && u.active).map((u) => u.id);
      sendAoOPrompt(makePayload(t, moverToken), gms);
    }
  }
}

function makePayload(threatToken, moverToken) {
  return {
    sceneId: canvas.scene.id,
    tokenId: threatToken.id,
    actorId: threatToken.actor.id,
    actorName: threatToken.document.name,
    actorImg: threatToken.document.texture.src,
    moverId: moverToken?.id ?? null,
    moverName: moverToken?.document?.name ?? "",
    moverImg: moverToken?.document?.texture?.src ?? "",
  };
}

/** 接收端：渲染借机窗口（PC owner / GM 端） */
async function aoAttackPrompt(payload) {
  if (!payload || canvas.scene?.id !== payload.sceneId) return;
  const token = canvas.tokens.get(payload.tokenId);
  const actor = token?.actor || game.actors.get(payload.actorId);
  if (!actor) return;
  const moverToken = payload.moverId ? canvas.tokens.get(payload.moverId) : null;
  // 构造轻量对象：接收端不一定能看到移动者/威胁者 placeable
  const threatToken = token || {
    id: payload.tokenId,
    actor,
    document: { name: payload.actorName, texture: { src: payload.actorImg } },
  };
  const fakeMover = moverToken || {
    id: payload.moverId,
    document: { name: payload.moverName, texture: { src: payload.moverImg } },
  };
  openAoOAttackDialog(threatToken, fakeMover);
}

/** 可用借机攻击筛选：只列出 attack 类（天生武器/徒手等），开关未关 */
export function getAoOAttacks(actor) {
  if (!actor) return [];
  return actor.items.filter((i) => i.type === "attack" && i.system.attackAoO !== false);
}

/** 打开借机攻击选择窗口；只有一个可用攻击则直接打开检定 */
export function openAoOAttackDialog(threatToken, moverToken) {
  // 借机只在战斗时生效（接收端兑底：whisper 到达时战斗可能已结束）
  if (!game.combat) return;
  const actor = threatToken.actor;
  if (!actor) return;
  // 借机次数已用完 → 不弹（接收端兜底）
  const combatant = game.combat?.combatants.find((c) => c.tokenId === threatToken.id);
  if (combatant) {
    const used = combatant.getFlag("D35E", "usedAaoCount") || 0;
    const max = combatant.getFlag("D35E", "aaoCount") ?? 1;
    if (used >= max) return;
  }
  const attacks = getAoOAttacks(actor);
  if (!attacks.length) return;

  const moverName = moverToken?.document?.name || "";
  const threatName = threatToken.document?.name || actor.name || "";

  if (attacks.length === 1) {
    executeAoOAttack(attacks[0], threatToken, moverToken);
    return;
  }

  const listHtml = attacks
    .map(
      (i) => `
    <button class="aoo-attack-btn" data-item-id="${i.id}" style="display:flex;align-items:center;gap:8px;width:100%;margin:4px 0;padding:6px 10px;text-align:left;">
      <img src="${i.img}" width="28" height="28" style="border:none;flex:0 0 28px;"/>
      <span>${i.name}</span>
    </button>`
    )
    .join("");

  const dialog = new Dialog(
    {
      title: game.i18n.format("D35E.AoOAttackDialogTitle", { name: threatName }),
      content: `
        <p style="margin:4px 0 8px;">${game.i18n.format("D35E.AoOAttackDialogHint", { mover: moverName })}</p>
        <div class="aoo-attack-list">${listHtml}</div>`,
      buttons: {},
      default: "close",
      close: () => {},
    },
    { width: 360 }
  );
  dialog.render(true);

  // 绑定攻击按钮（渲染完成后）
  setTimeout(() => {
    const app = dialog.element?.[0];
    if (!app) return;
    app.querySelectorAll(".aoo-attack-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = actor.items.get(btn.dataset.itemId);
        if (app.classList.contains("dialog")) app.remove();
        else dialog.close();
        if (item) executeAoOAttack(item, threatToken, moverToken);
      });
    });
  }, 50);
}

/**
 * 执行借机攻击：锁定目标 → 标记 item._pendingAoO → 打开攻击检定对话框。
 * useAttack 内检测 _pendingAoO 并向 rollData 注入 aoAttack / attackType。
 */
async function executeAoOAttack(item, threatToken, moverToken) {
  try {
    // 自动锁定移动者为目标（保留已有目标）
    if (moverToken?.id) {
      const current = Array.from(game.user.targets || []);
      if (!current.some((t) => t.id === moverToken.id)) {
        const ids = [...current.map((t) => t.id), moverToken.id];
        await game.user.updateTokenTargets(ids);
      }
    }
    // 标记本次攻击为借机攻击（useAttack 内注入 rollData）
    item._pendingAoO = true;
    let wasRolled = false;
    try {
      const result = await new ItemUse(item).useAttack({ skipDialog: false });
      // [D35E]借机次数在"实际发起攻击"（掷骰完成）后才消耗；取消掷骰不扣减
      wasRolled = result?.wasRolled === true;
    } finally {
      // 兜底清理（useAttack 因权限/数量检查提前 return 时避免标记残留影响下次攻击）
      if (item._pendingAoO) delete item._pendingAoO;
    }
    // [D35E]攻击发起后扣减借机次数（GM/owner 权限；失败静默）
    if (wasRolled) {
      const tokenId = threatToken?.id || item.actor?.token?.id;
      const combatant = game.combat?.combatants.find((c) => c.tokenId === tokenId);
      if (combatant) {
        const used = combatant.getFlag("D35E", "usedAaoCount") || 0;
        combatant.update({ "flags.D35E.usedAaoCount": used + 1 }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("D35E | AoO attack failed", e);
  }
}
