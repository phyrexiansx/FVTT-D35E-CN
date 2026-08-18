import { ItemActiveHelper } from "../item/helpers/itemActiveHelper.js";
import { ItemCombatChangesHelper } from "../item/helpers/itemCombatChangesHelper.js";
import { ActorDamageHelper } from "../actor/helpers/actorDamageHelper.js";
import { actorHasIntuition, targetAutoSettle, targetAutoSettleSave, targetAutoSettleSR } from "./intuitive.js";
import { createCustomChatMessage } from "../chat.js";

export { actorHasIntuition, targetNeedsManual, targetAutoSettle } from "./intuitive.js";
export { targetNeedsManualSave, targetAutoSettleSave } from "./intuitive.js";

/**切换选中token的"阻止自动结算"状态（快捷键） */
export async function toggleIntuitiveForToken(token) {
  if (!token?.actor) return false;
  const actor = token.actor;
  const next = !actorHasIntuition(actor);
  await actor.setFlag("D35E", "intuitiveManual", next);
  //刷新token，重绘右下角状态图标（拥有者可见）
  try {
    token.draw();
  } catch (err) {
    /*忽略 */
  }
  return next;
}

/* ============================================================
 * [D35E]自动结算（R13：R12 攻击类 AC+伤害先行 + NPC unlinked 独立血量）
 * 攻击类（卡片带 data-attacktotal，即 mwak/rwak/msak/rsak）：
 *   不论是否配置豁免效果，一律先进行 AC 对抗 +伤害检定（AC 命中门判定，命中才应用全伤）；
 *   命中后：无害 →跳过法抗与豁免；否则 法抗（若有，穿透失败 →跳过豁免）→豁免（自动掷骰）；
 *   豁免/法抗均仅自动进行（可见），不再做进一步效果处理（不影响已结算的伤害、不触发特殊行动）。
 * 纯豁免类（save/spellsave）：无害 →跳过法术抗力与豁免直接全伤；
 *   否则 法抗→豁免→伤害（negates 通过不受伤 / half、partial 通过半伤 / 失败全伤）。
 * 结算对象（R13 起）：直接以 token 自身 actor（t.actor）结算，还原原生 unlinked 语义——
 *   unlinked token（NPC 多 token 场景）各持独立 HP/状态，互不共享且不写回 collection 角色卡；
 *   linked token（PC 等）t.actor 即角色卡本身，行为不变（共享）。
 * ============================================================ */

/**自动结算分步间隔（ms）：法抗→豁免→伤害 逐步触发（观察用，已按需缩短） */
const SETTLE_STEP_DELAY = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**取卡片锁定目标 token（豁免/法抗按钮的 data-target 是 DC 值，必须排除） */
function getCardTargets(card) {
  const targets = [];
  card.find("[data-target]").each((i, el) => {
    const action = el.dataset.action || "";
    if (action === "rollSave" || action === "rollSR" || action === "rollPR") return;
    const t = canvas.tokens.get(el.dataset.target);
    if (t?.actor) targets.push(t);
  });
  // [D35E]兜底：卡片未带目标标记时，用当前锁定目标（快速使用旧卡/卡片缓存）
  if (!targets.length && game.user?.targets?.size) {
    for (const t of game.user.targets) {
      if (t?.actor) targets.push(t);
    }
  }
  return targets;
}

/**目标是否可由本客户端自动结算（OWNER 权限；GM 端跳过有在线玩家 OWNER 的目标防双端重复） */
function canSettleActor(actor) {
  if (!actor) return false;
  if (!actor.testUserPermission(game.user, "OWNER")) return false;
  if (game.user.isGM && game.users.some((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"))) return false;
  return true;
}

/**目标 AC（触摸攻用 touch） */
function targetAC(actor, touch) {
  return getProperty(actor.system, `attributes.ac.${touch ? "touch" : "normal"}.total`) || 0;
}

/**攻击类 AC 命中门：N1 必失 / N20 必中 / attacktotal ≥ AC */
function isAttackHit(attackTotal, target, touch, natural20, fumble) {
  if (fumble) return false;
  if (natural20) return true;
  return attackTotal >= targetAC(target.actor, touch);
}

/**逐目标自动检定法术抗力：true=穿透 / false=抵抗（不伤害不豁免） / null=留GM */
async function rollSRForTarget(actor, srBtn) {
  if ((actor.system.attributes?.spellResistance?.total || 0) <= 0) return true; //目标无 SR：直接跳过
  const spellPen = srBtn.attr("data-spellpen") || "0";
  try {
    const roll = await actor.rollSpellResistance(spellPen, { skipDialog: true, rollMode: "publicroll" });
    const srTotal = actor.system.attributes?.spellResistance?.total || 0;
    return roll ? roll.total >= srTotal : false;
  } catch (err) {
    return null;
  }
}

/**逐目标自动掷豁免：true=通过 / false=失败 / null=留GM */
async function rollSaveForTarget(actor, saveBtn) {
  const type = saveBtn.attr("data-value") || "";
  const ability = saveBtn.attr("data-ability") || "";
  const dc = parseInt(saveBtn.attr("data-target") || "0", 10);
  try {
    const roll = await actor.rollSavingThrow(type, ability, dc, {
      skipDialog: true,
      rollMode: "publicroll",
    });
    return roll ? roll.total >= dc : null;
  } catch (err) {
    return null;
  }
}

/**从豁免按钮所在攻击块内找全伤按钮（半伤由 applyHalf 标记驱动） */
function getDamageButtonForSave(saveBtn) {
  const block = $(saveBtn).closest(".chat-attack");
  return block.find('[data-action="applyDamage"]').first();
}

/**
 * [D35E]未命中结算提示：攻击类（带豁免等）自动结算未命中时生成一条「未命中!」结算卡，
 * 复用 damage-description 模板（hit=false），让参与者知道发生了什么（修复：未命中被静默跳过）。
 */
async function notifyMiss(targetActor, attackTotal, card) {
  try {
    const attackerId = card.attr("data-actor-id");
    const attacker = attackerId ? game.actors.get(attackerId) : null;
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: targetActor }),
      rollMode: "publicroll",
      "flags.D35E.noRollRender": true,
    };
    const templateData = {
      name: targetActor.name,
      img: targetActor.img,
      actor: targetActor,
      roll: attackTotal,
      hit: false,
      achit: false,
      crit: false,
      damageData: {
        damage: 0,
        nonLethalDamage: 0,
        displayDamage: 0,
        isHealing: false,
        beforeDamage: 0,
        lower: false,
        higher: false,
        equal: true,
        incorporealMiss: false,
        incorporealRolled: false,
      },
      ac: {},
      actions: [],
      acModifiers: [],
      concealMiss: false,
      isSpell: false,
      applyHalf: false,
      ammoRecovered: false,
      fortifyRolled: false,
      fortifyValue: 0,
      fortifyRoll: 0,
      fortifySuccessfull: false,
      hasProperties: false,
      properties: [],
      sourceName: attacker?.name || "Unknown",
      sourceImg: attacker?.img || "systems/D35E/icons/special-abilities/imported.png",
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      rollMode: "publicroll",
    };
    await createCustomChatMessage("systems/D35E/templates/chat/damage-description.html", templateData, chatData);
  } catch (err) {
    /* 静默 */
  }
}

/**逐目标应用伤害（复用伤害按钮数据；half=true 走减半结算；actor 为结算对象：token.actor，unlinked 时写各 token 独立数据） */
async function applyDamageToTarget(actor, damageBtn, { half = false, hpBase = undefined } = {}) {
  if (!damageBtn || !damageBtn.length) return;
  // [D35E]防"结算期预扣血"：伤害应用前恢复进入结算时的 HP 基线（异步等待期间内部机制可能预扣一次伤害量）
  if (hpBase !== undefined && actor.system.attributes.hp.value !== hpBase) {
    try {
      await actor.update({
        "system.attributes.hp.value": hpBase,
        "system.attributes.hp.temp": actor.system.attributes.hp.temp || 0,
        "system.attributes.hp.nonlethal": actor.system.attributes.hp.nonlethal || 0,
      });
    } catch (err) {
      /*忽略 */
    }
  }
  const btn = damageBtn.get(0);
  const damage = JSON.parse(btn.dataset.json || "{}");
  const normalDamage = JSON.parse(btn.dataset.normaljson || "{}");
  const material = btn.dataset.material && btn.dataset.material !== "" ? JSON.parse(btn.dataset.material) : {};
  const alignment = btn.dataset.alignment && btn.dataset.alignment !== "" ? JSON.parse(btn.dataset.alignment) : {};
  const enh = parseInt(btn.dataset.enh || "0");
  const roll = parseInt(btn.dataset.roll || "-1337");
  const critroll = parseInt(btn.dataset.critroll || "0");
  const nonLethal = btn.dataset.nonlethal === "true";
  const natural20 = btn.dataset.natural === "true";
  const natural20Crit = btn.dataset.naturalcrit === "true";
  const fumble = btn.dataset.fumble === "true";
  const fumbleCrit = btn.dataset.fumblecrit === "true";
  const attackerToken = btn.dataset.attackertoken;
  const attacker = btn.dataset.attacker;
  const ammoId = btn.dataset.ammoid;
  const touch = btn.dataset.touch === "true";
  const incorporeal = btn.dataset.incorporeal === "true";
  await ActorDamageHelper.applyDamage(
    { currentTarget: btn, applyHalf: half },
    roll,
    critroll,
    natural20,
    natural20Crit,
    fumble,
    fumbleCrit,
    damage,
    normalDamage,
    material,
    alignment,
    enh,
    nonLethal,
    false,
    actor,
    attacker,
    attackerToken,
    ammoId,
    incorporeal,
    touch
  );
  // [D35E]R13：结算对象即 token.actor（unlinked 时写 token document 独立数据），无需再同步回 token
}

/**单个豁免块（对应一次攻击/一个能力）自动结算 */
async function settleWithSave(card, saveBtn, srBtn, targets) {
  //攻击类标志：卡片带 data-attacktotal（模板仅 atk.hasAttack 时渲染）
  const hasAttackTotal = saveBtn.attr("data-attacktotal") !== undefined && saveBtn.attr("data-attacktotal") !== "";
  const attackTotal = parseInt(saveBtn.attr("data-attacktotal") || "-1337", 10);
  const touch = saveBtn.attr("data-touch") === "true";
  const natural20 = saveBtn.attr("data-natural") === "true";
  const fumble = saveBtn.attr("data-fumble") === "true";
  const harmless = saveBtn.attr("data-harmless") === "true";
  const saveType = saveBtn.attr("data-value") || "";
  const isSaveTypeHalf = saveType.includes("half") || saveType.includes("partial"); //纯豁免类：half/partial 半伤
  const damageBtn = getDamageButtonForSave(saveBtn);

  // [D35E]防"结算期预扣血"：进入结算时记录每个目标的 HP 基线（v=value 供恢复；vt=value+temp 供命中判断）
  // [D35E]R13：基线取 token 自身（t.actor）HP——unlinked 时即用户可见/可编辑的 token 端值（改血只改此端，
  // 不会出现 R12 前"用 collection 旧值做基线→改回血后下次受伤又降回去"的问题）；多个 unlinked token 的
  // t.actor.id 相同，基线必须按 token id 存储，避免互相覆盖。
  const hpBaselines = new Map();
  for (const t of targets) {
    const a = t.actor;
    const hp = a.system.attributes.hp;
    hpBaselines.set(t.id, { v: hp.value, vt: hp.value + (hp.temp || 0) });
  }

  for (const t of targets) {
    // [D35E]R13：直接以 token 自身 actor 结算——unlinked（NPC 多 token）写各自 token 独立数据；linked 即角色卡本身
    const a = t.actor;
    if (!canSettleActor(a)) continue;
    const base = hpBaselines.get(t.id);

    if (hasAttackTotal) {
      //攻击类（mwak/rwak/msak/rsak）：不论是否有豁免效果，先进行 AC 对抗 +伤害检定
      //1) AC 命中门：未命中 →不伤害、不豁免
      if (!isAttackHit(attackTotal, { actor: a }, touch, natural20, fumble)) {
        // [D35E]未命中也输出一条结算提示（让参与者知道发生了什么，而不是静默跳过）
        await notifyMiss(a, attackTotal, card);
        continue;
      }
      //2) 伤害检定：命中 →应用全伤（豁免结果不再影响伤害）
      await applyDamageToTarget(a, damageBtn, { half: false, hpBase: base.v });
      //无害：跳过法抗与豁免（豁免按钮存在但标记无害）
      if (harmless) continue;
      //3) 法术抗力（若有）：自动检定，穿透失败 →跳过豁免（伤害已先行结算，不受影响）
      if (srBtn.length && targetAutoSettleSR(a)) {
        await sleep(SETTLE_STEP_DELAY);
        const srPass = await rollSRForTarget(a, srBtn);
        if (srPass === false || srPass === null) continue;
      }
      //4) 豁免（若有）：命中后才进行，仅自动掷骰（不做进一步效果处理）
      if (targetAutoSettleSave(a)) {
        await sleep(SETTLE_STEP_DELAY);
        await rollSaveForTarget(a, saveBtn);
      }
      continue;
    }

    //纯豁免类（save/spellsave）：无害 →跳过 SR+豁免直接全伤
    if (harmless) {
      await applyDamageToTarget(a, damageBtn, { half: false, hpBase: base.v });
      continue;
    }
    //法术抗力（若存在）：抵抗成功 →不伤害、不豁免；有可选法抗/阻止自动 →留手动
    if (srBtn.length) {
      if (!targetAutoSettleSR(a)) continue;
      await sleep(SETTLE_STEP_DELAY); //分步可见：先出现法抗检定
      const srPass = await rollSRForTarget(a, srBtn);
      if (srPass === false || srPass === null) continue;
    }
    //豁免（纯豁免类：negates 通过不受伤 / half、partial 通过半伤 / 失败全伤）
    if (!targetAutoSettleSave(a)) continue; //豁免需手动 →整目标留手动
    await sleep(SETTLE_STEP_DELAY); //分步可见：法抗穿透后，再出现豁免检定
    const saveSuccess = await rollSaveForTarget(a, saveBtn);
    await sleep(SETTLE_STEP_DELAY); //分步可见：豁免结果后，再应用伤害
    if (saveSuccess === true) {
      if (isSaveTypeHalf) await applyDamageToTarget(a, damageBtn, { half: true, hpBase: base.v });
    } else if (saveSuccess === false) {
      await applyDamageToTarget(a, damageBtn, { half: false, hpBase: base.v });
    }
  }
}

/**自动结算一张攻击/法术卡（入口；导出供测试） */
export async function autoSettleCard(card) {
  const targets = getCardTargets(card);
  if (!targets.length) return;
  const saveButtons = card.find('[data-action="rollSave"]');
  const srBtn = card.find('[data-action="rollSR"]').first();

  if (saveButtons.length) {
    //逐豁免块结算（每个 rollSave 按钮对应一次攻击/一个能力）
    for (const saveBtnEl of saveButtons) {
      await settleWithSave(card, $(saveBtnEl), srBtn, targets);
    }
    return;
  }

  //无豁免：纯伤害/效果卡 →自动应用伤害（命中判定由 applyDamage 内部防御对抗完成）
  const damageButtons = card.find('[data-action="applyDamage"]');
  for (const btn of damageButtons) {
    for (const t of targets) {
      // [D35E]R13：直接以 token 自身 actor 结算（unlinked 独立 / linked 共享）
      const a = t.actor;
      if (!targetAutoSettle(a) || !canSettleActor(a)) continue;
      // [D35E]基线 = token 自身当前 HP（用户手动调整即改此值）
      const hp = a.system.attributes.hp;
      await applyDamageToTarget(a, $(btn), { half: false, hpBase: hp.value });
    }
  }
}

export function registerKeybindings() {
  game.keybindings.register("D35E", "toggleIntuitive", {
    name: "D35E.ToggleIntuitiveBinding",
    hint: "D35E.ToggleIntuitiveBindingHint",
    editable: [{ key: "KeyY" }],
    onDown: () => {
      const token = canvas.tokens?.controlled?.[0];
      if (token?.actor) toggleIntuitiveForToken(token);
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

export function registerAutoApplyHooks() {
  Hooks.on("renderChatMessage", async (message, html) => {
    try {
      if (!game.settings.get("D35E", "autoApplyIntuitive")) return;
      const card = html.find(".chat-card").first();
      if (!card.length) return;
      if (card.find('[data-action="applyDamage"]').length === 0 &&
          card.find('[data-action="rollSave"]').length === 0) return;
      if (card.find("[data-target]").length === 0 && !game.user?.targets?.size) return;
      if (message.getFlag("D35E", "autoApplied")) return;
      //防重复标记：仅 GM 端写库（玩家端无权限，core 的 socket 错误 toast 无法被 catch 抑制）；玩家端用本地 Set 防重
      if (game.user.isGM) {
        try {
          await message.setFlag("D35E", "autoApplied", true);
        } catch (err) {
          /* 忽略 */
        }
      }
      //结算启动等待（卡片渲染 → 自动结算开始）：50ms 后结算受击
      setTimeout(async () => {
        try {
          let targetCard = card;
          const realCard = $(`.message[data-message-id="${message.id}"] .chat-card`).first();
          if (realCard.length) targetCard = realCard;
          game.D35E = game.D35E || {};
          game.D35E._autoSettleActive = true;
          await autoSettleCard(targetCard);
          setTimeout(() => {
            game.D35E._autoSettleActive = false;
          }, 1000);
        } catch (err) {
          game.D35E._autoSettleActive = false;
        }
      }, 50);
    } catch (err) {
      /*静默 */
    }
  });

  //token右下角"阻止自动结算"状态图标（仅拥有者可见：玩家看自己的，GM看所有）
  Hooks.on("drawToken", (token) => {
    try {
      if (!token.isOwner) return;
      if (!actorHasIntuition(token.actor)) return;
      const img = token.icon;
      if (!img || !img.parentElement) return;
      img.parentElement
        .querySelectorAll(".d35e-intuitive-marker")
        .forEach((el) => el.remove());
      const el = document.createElement("div");
      el.className = "d35e-intuitive-marker";
      el.innerHTML = '<i class="fas fa-brain"></i>';
      el.title = game.i18n.localize("D35E.AutoApplyBlockedTooltip");
      el.style.cssText =
        "position:absolute;bottom:0;right:0;font-size:14px;color:#c55;background:rgba(255,255,255,0.8);border-radius:50%;padding:1px 4px;pointer-events:none;z-index:10;";
      img.parentElement.style.position = "relative";
      img.parentElement.appendChild(el);
    } catch (err) {
      /*静默 */
    }
  });

  //战斗追踪器：给所有拥有"阻止自动结算"的combatant加标记
  Hooks.on("renderCombatTracker", (app, html) => {
    try {
      const cb = game.combat;
      if (!cb) return;
      for (const c of cb.combatants) {
        if (!c.actor || !actorHasIntuition(c.actor)) continue;
        const row = html.find(`.combatant[data-combatant-id="${c.id}"]`);
        const nameEl = row.find(".combatant-name");
        if (nameEl.length) {
          nameEl.append(
            `<i class="fas fa-brain" style="color:#c55;margin-left:4px" title="${game.i18n.localize("D35E.AutoApplyBlockedTooltip")}"></i>`
          );
        }
      }
    } catch (err) {
      /*静默 */
    }
  });
}
