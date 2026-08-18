// ==================== 批量攻击（GM 框选多 Token → 勾选攻击 → 对锁定目标批量投掷） ====================
// 宏命令：game.D35E.batchAttack.open()（设置-功能-批量攻击宏 可一键创建宏）
// 规则：
// - GM 框选多个 Token 后执行宏，窗口列出各 Token 的所有攻击（含归属与全力攻击），
//   每行可填加值/减值；每个 Token 旁显示其「可选高级战斗行动」（attackOptional 类 combat changes）供勾选。
// - 「发起攻击」对 GM 锁定的目标批量投掷：一个角色的所有勾选攻击投完后等 200ms 再投下一个（队列防卡顿）。
// - 全力攻击物品本身是集合攻击能力：勾选后走其自带序列（useFullAttack 快进）。
// - 勾选的可选行动通过 item._batchOptionalFeats 注入 rollAttack（本次投掷生效，不污染物品数据）。

import { ItemCombatChangesHelper } from "./item/helpers/itemCombatChangesHelper.js";
import { ItemUse } from "./item/extensions/use.js";

const ATTACK_GAP_MS = 200; // 攻击间隔（含角色内）
const TOKEN_GAP_MS = 200; // 角色间间隔
const MACRO_NAME = "批量攻击";
const MACRO_COMMAND = "game.D35E.batchAttack.open()";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BatchAttackApp extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "d35e-batch-attack",
      title: "批量攻击（对锁定目标）",
      template: "systems/D35E/templates/apps/batch-attack.html",
      width: 560,
      height: "auto",
      resizable: true,
    });
  }

  getData() {
    const targets = Array.from(game.user.targets || []);
    const tokens = [];
    for (const t of canvas.tokens.controlled) {
      const actor = t.actor;
      if (!actor) continue;
      let rollData = null;
      try {
        rollData = actor.getRollData(null, true);
        // combat changes 匹配需要 rollData.item（含 actionType），与全力攻击对话框做法一致
        const anyAttack = actor.items.find((i) => (i.type === "attack" && i.hasAttack) || i.type === "full-attack");
        if (anyAttack) rollData.item = duplicate(anyAttack.getRollData());
      } catch (e) {}
      const optionals = (actor.combatChangeItems || []).filter((o) => {
        try {
          return rollData && ItemCombatChangesHelper.canHaveCombatChanges(o, rollData, "attackOptional");
        } catch (e) {
          return false;
        }
      });
      const attacks = actor.items.filter((i) => (i.type === "attack" && i.hasAttack) || i.type === "full-attack");
      tokens.push({
        tokenId: t.id,
        name: actor.name,
        img: actor.img,
        tokenName: t.name,
        optionals: optionals.map((o) => ({ id: o.id, name: o.name, tokenId: t.id })),
        attacks: attacks.map((a) => ({
          id: a.id,
          name: a.name,
          tokenId: t.id,
          isFullAttack: a.type === "full-attack",
          hasBonus: a.type !== "full-attack",
        })),
      });
    }
    return { tokens, targetCount: targets.length, targets: targets.map((t) => t.name).join("、") };
  }

  activateListeners(html) {
    html.find(".d35e-batch-cancel").click(() => this.close());
    html.find(".d35e-batch-start").click(async () => {
      if (!game.user.isGM) return ui.notifications.warn("仅 GM 可使用批量攻击");
      const targets = Array.from(game.user.targets || []);
      if (!targets.length) return ui.notifications.warn("请先锁定目标（GM 用 T 键/右键锁定）");
      const tokens = this._collect(html);
      const total = tokens.reduce((n, t) => n + t.attacks.filter((a) => a.checked).length, 0);
      if (!total) return ui.notifications.warn("请先勾选至少一个攻击");
      this.close();
      await runBatch(tokens);
      ui.notifications.info(`批量攻击完成：共投掷 ${total} 个攻击`);
    });
  }

  _collect(html) {
    const tokens = [];
    for (const t of canvas.tokens.controlled) {
      const attacks = [];
      for (const item of t.actor?.items || []) {
        if (!((item.type === "attack" && item.hasAttack) || item.type === "full-attack")) continue;
        attacks.push({
          id: item.id,
          checked: html.find(`[name="atk-${t.id}-${item.id}"]`).prop("checked") !== false,
          bonus: String(html.find(`[name="bonus-${t.id}-${item.id}"]`).val() || "").trim(),
          isFullAttack: item.type === "full-attack",
        });
      }
      const optionals = [];
      for (const o of t.actor?.items || []) {
        optionals.push({ id: o.id, checked: html.find(`[name="optional-${t.id}-${o.id}"]`).prop("checked") === true });
      }
      tokens.push({ tokenId: t.id, name: t.actor?.name, attacks, optionals: optionals.filter((o) => o.checked) });
    }
    return tokens;
  }
}

async function runBatch(tokens) {
  for (const tok of tokens) {
    const t = canvas.tokens.get(tok.tokenId);
    const actor = t?.actor;
    if (!actor) continue;
    // [D35E] 该角色已死亡（3.5 规则 -10）→ 跳过其攻击（群体攻击宏同理）
    if (actor.system.attributes.hp.value <= -10) {
      ui.notifications.warn(`${actor.name} 已死亡，跳过其攻击`);
      continue;
    }
    for (const atk of tok.attacks) {
      if (!atk.checked) continue;
      // [D35E] 攻击者死亡 → 停止该角色接下来的攻击
      if (actor.system.attributes.hp.value <= -10) {
        ui.notifications.warn(`${actor.name} 已死亡，停止其后续攻击`);
        break;
      }
      const item = actor.items.get(atk.id);
      if (!item) continue;
      // [D35E] 多 Token 修正：白闪锁定实际发起 token
      item._animToken = tok.tokenId;
      // 可选高级战斗行动：注入本次投掷（rollAttack 读取 item._batchOptionalFeats）
      if (tok.optionals.length) item._batchOptionalFeats = tok.optionals.map((o) => o.id);
      try {
        if (atk.isFullAttack) {
          // 全力攻击：本身是集合攻击能力，走其自带序列（内部各段加值由物品配置决定）
          // 注意：Item35E.use 是 options 风格（内部转换为 ItemUse.use 的位置参数）
          await item.use({ skipDialog: true });
        } else {
          await new ItemUse(item).useAttack({ skipDialog: true, faAttackBonus: atk.bonus || null });
        }
      } catch (e) {
        console.error("D35E | 批量攻击失败：" + item.name, e);
      }
      if (item._batchOptionalFeats) delete item._batchOptionalFeats;
      await sleep(ATTACK_GAP_MS);
      // [D35E] 等待反击结算（目标触发反击时，等反击完成再投下一个攻击）
      try {
        await game.D35E.waitForCounterattackIdle();
      } catch (e) {}
    }
    await sleep(TOKEN_GAP_MS);
    // [D35E] 角色间同样等待反击结算
    try {
      await game.D35E.waitForCounterattackIdle();
    } catch (e) {}
  }
}

// 宏设置菜单：一键创建宏
export class BatchAttackMacroMenu extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "d35e-batch-macro-menu",
      title: "批量攻击宏",
      template: "systems/D35E/templates/apps/batch-attack-macro.html",
      width: 500,
      height: "auto",
      closeOnSubmit: false,
    });
  }
  getData() {
    return { command: MACRO_COMMAND, exists: !!game.macros?.contents.find((m) => m.name === MACRO_NAME) };
  }
  activateListeners(html) {
    html.find(".d35e-batch-macro-create").click(async () => {
      const existing = game.macros?.contents.find((m) => m.name === MACRO_NAME);
      if (existing) await existing.delete();
      await Macro.create({
        name: MACRO_NAME,
        type: "script",
        scope: "global",
        command: MACRO_COMMAND,
        img: "icons/svg/d20.svg",
      });
      ui.notifications.info(`宏「${MACRO_NAME}」已创建：框选多个 Token 后执行即可打开批量攻击窗口`);
      this.render(true);
    });
    html.find(".d35e-batch-macro-close").click(() => this.close());
  }
}

Hooks.once("init", () => {
  game.settings.registerMenu("D35E", "batchAttackMenu", {
    name: "批量攻击宏",
    label: "批量攻击宏",
    hint: "为 GM 一键创建「批量攻击」宏：框选多个 Token → 执行宏 → 窗口勾选攻击与加值/减值（每个 Token 旁可勾选可选高级战斗行动）→ 一键对 GM 锁定的目标批量投掷（角色间 200ms 队列防卡顿）。",
    icon: "fas fa-crosshairs",
    type: BatchAttackMacroMenu,
    restricted: true,
  });
});

Hooks.once("ready", () => {
  game.D35E = game.D35E || {};
  game.D35E.batchAttack = {
    open() {
      if (!game.user.isGM) return ui.notifications.warn("仅 GM 可使用批量攻击");
      if (!canvas?.scene) return ui.notifications.warn("请先进入场景");
      if (!canvas.tokens.controlled.length) return ui.notifications.warn("请先选中一个或多个 Token（框选）");
      new BatchAttackApp().render(true);
    },
    createMacro: async () => {
      const existing = game.macros?.contents.find((m) => m.name === MACRO_NAME);
      if (existing) await existing.delete();
      return Macro.create({ name: MACRO_NAME, type: "script", scope: "global", command: MACRO_COMMAND, img: "icons/svg/d20.svg" });
    },
  };
});
