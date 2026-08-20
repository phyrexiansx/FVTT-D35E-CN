import { ItemActiveHelper } from "../item/helpers/itemActiveHelper.js";
import { ItemCombatChangesHelper } from "../item/helpers/itemCombatChangesHelper.js";

/**角色是否拥有"阻止自动结算"能力：手动设置优先，未设置时跟随生效物品 */
export function actorHasIntuition(actor) {
  if (!actor) return false;
  const manual = actor.getFlag("D35E", "intuitiveManual");
  if (manual === true) return true;
  if (manual === false) return false;
  try {
    return (actor.items || []).some(
      (i) => i.system?.changeFlags?.intuitive === true && ItemActiveHelper.isActive(i)
    );
  } catch (err) {
    return false;
  }
}

/**角色是否拥有"不会被借机"能力：手动设置优先，未设置时跟随生效物品（专长/装备/状态能力 changeFlags.noAoO） */
export function actorHasNoAoO(actor) {
  if (!actor) return false;
  const manual = actor.getFlag("D35E", "noAoO");
  if (manual === true) return true;
  if (manual === false) return false;
  try {
    return (actor.items || []).some(
      (i) => i.system?.changeFlags?.noAoO === true && ItemActiveHelper.isActive(i)
    );
  } catch (err) {
    return false;
  }
}

/**目标是否因存在"可选型高级战斗行动选项"而需要人工介入（action: defenseOptional / savingThrowOptional 等） */
export function targetNeedsManualFor(targetActor, optionalAction) {
  if (!targetActor) return true;
  if (actorHasIntuition(targetActor)) return true;
  try {
    const rollData = targetActor.getRollData(null, true);
    return (targetActor.combatChangeItems || []).some((o) =>
      ItemCombatChangesHelper.canHaveCombatChanges(o, rollData, optionalAction)
    );
  } catch (err) {
    return false;
  }
}

/**目标是否需要人工防御（有阻止自动结算或有可选防御选项） */
export function targetNeedsManual(targetActor) {
  return targetNeedsManualFor(targetActor, "defenseOptional");
}

/**目标是否需要人工豁免（有阻止自动结算或有可选豁免选项） */
export function targetNeedsManualSave(targetActor) {
  return targetNeedsManualFor(targetActor, "savingThrowOptional");
}

/**目标是否自动结算（防御/伤害） */
export function targetAutoSettle(targetActor) {
  return !!game.settings.get("D35E", "autoApplyIntuitive") && !targetNeedsManual(targetActor);
}

/**目标是否自动豁免 */
export function targetAutoSettleSave(targetActor) {
  return !!game.settings.get("D35E", "autoApplyIntuitive") && !targetNeedsManualSave(targetActor);
}

/**目标是否自动检定（技能/属性检定：autoApplyIntuitive 开 且 无阻止自动结算 且 无可选技能高级行动） */
export function targetAutoSettleCheck(targetActor) {
  return !!game.settings.get("D35E", "autoApplyIntuitive") && !targetNeedsManualFor(targetActor, "skillOptional");
}

/**目标是否自动检定法术抗力（有可选法抗选项则需人工） */
export function targetAutoSettleSR(targetActor) {
  return !!game.settings.get("D35E", "autoApplyIntuitive") &&
    !targetNeedsManualFor(targetActor, "spellPowerResistanceOptional");
}


/** [D35E]优势/劣势检定模式（变化效果标签驱动）：
 * changeFlags.advantage / changeFlags.disadvantage（专长/状态/装备类物品勾选）
 * 优势与劣势互相抵消：只要各有至少1个标签 → 普通。
 * @returns {number} 0普通 / 1优势 / -1劣势
 */
export function getRollAdvantageMode(actor) {
  if (!actor) return 0;
  let adv = 0, dis = 0;
  for (const item of actor.items) {
    if (!ItemActiveHelper.isActive(item)) continue;
    if (item.system.changeFlags?.advantage === true) adv++;
    if (item.system.changeFlags?.disadvantage === true) dis++;
  }
  if (adv > 0 && dis > 0) return 0;
  return adv > 0 ? 1 : (dis > 0 ? -1 : 0);
}