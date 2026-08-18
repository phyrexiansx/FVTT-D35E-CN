/**
 * Dice Tray 合并（源自 fvtt-dice-tray，MIT 协议）
 * 1) 骰子托盘：聊天输入框下方快捷骰子按钮（左键加/右键减/拖拽）
 * 2) 骰子计算器：聊天框骰子图标弹出计算器（骰子/数字/运算/kh/kl + D35E 属性按钮）
 * 3) 内联掷骰：聊天消息中的 [[2d6+3]] 自动解析掷骰（设置开关，默认关）
 *
 * 入口：registerDiceTray() 在 D35E.js 的 init hook 中调用
 */

import { Roll35e } from "../roll.js";

const SETTINGS = {
  tray: "dtEnableTray",
  calc: "dtEnableCalculator",
  hideAdv: "dtHideAdv",
  inline: "dtEnableInline",
  diceRows: "dtDiceRows",
};

const DEFAULT_ROWS = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export function registerDiceTray() {
  // ---- 设置 ----
  game.settings.register("D35E", SETTINGS.tray, {
    name: "D35E.DTEnableTray",
    hint: "D35E.DTEnableTrayHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: () => window.location.reload(),
  });
  game.settings.register("D35E", SETTINGS.calc, {
    name: "D35E.DTEnableCalculator",
    hint: "D35E.DTEnableCalculatorHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: () => window.location.reload(),
  });
  game.settings.register("D35E", SETTINGS.hideAdv, {
    name: "D35E.DTHideAdv",
    hint: "D35E.DTHideAdvHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
  game.settings.register("D35E", SETTINGS.inline, {
    name: "D35E.DTEnableInline",
    hint: "D35E.DTEnableInlineHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: () => window.location.reload(),
  });
  game.settings.register("D35E", SETTINGS.diceRows, {
    scope: "world",
    config: false,
    default: DEFAULT_ROWS,
    type: Array,
  });

  // ---- hooks ----
  Hooks.on("renderSidebarTab", onRenderSidebarTab);
  Hooks.on("renderActorSheet", onRenderActorSheet);
  if (game.settings.get("D35E", SETTINGS.inline)) {
    Hooks.on("preCreateChatMessage", onInlineRolls);
  }
}

/* ================================================================
 * 骰子托盘 + 计算器按钮（注入聊天侧栏）
 * ================================================================ */

function getDiceRows() {
  const rows = game.settings.get("D35E", SETTINGS.diceRows);
  return Array.isArray(rows) && rows.length ? rows : DEFAULT_ROWS;
}

async function onRenderSidebarTab(app, html, data) {
  if (app.tabName !== "chat") return;
  const form = html.find("#chat-form");
  if (!form.length) return;

  // 骰子托盘（聊天输入框上方）
  if (game.settings.get("D35E", SETTINGS.tray) && !form.find(".d35e-dice-tray").length) {
    const rows = getDiceRows();
    const hideAdv = game.settings.get("D35E", SETTINGS.hideAdv);
    const tray = $(`<div class="d35e-dice-tray">
      ${rows.map((d) => `<button type="button" class="d35e-dice-tray__btn" data-formula="${d}" draggable="true">${d}</button>`).join("")}
      ${hideAdv ? "" : `<button type="button" class="d35e-dice-tray__btn d35e-dice-tray__adv" data-formula="kh" title="${game.i18n.localize("D35E.DTAdv")}">${game.i18n.localize("D35E.DTAdv")}</button>
      <button type="button" class="d35e-dice-tray__btn d35e-dice-tray__dis" data-formula="kl" title="${game.i18n.localize("D35E.DTDis")}">${game.i18n.localize("D35E.DTDis")}</button>`}
    </div>`);
    form.prepend(tray);
    tray.on("click", ".d35e-dice-tray__btn", (ev) => {
      const f = ev.currentTarget.dataset.formula;
      if (f === "kh" || f === "kl") applyAdvantage(f);
      else updateChatDice(f, "add");
    });
    tray.on("contextmenu", ".d35e-dice-tray__btn", (ev) => {
      ev.preventDefault();
      const f = ev.currentTarget.dataset.formula;
      if (f === "kh" || f === "kl") applyAdvantage(f);
      else updateChatDice(f, "sub");
    });
    tray.on("dragstart", ".d35e-dice-tray__btn", (ev) => {
      ev.originalEvent.dataTransfer.setData("text/plain", ev.currentTarget.dataset.formula);
    });
  }

  // 聊天输入框接收托盘拖拽
  const box = html.find("#chat-message");
  if (box.length && !box[0].dataset.d35eTrayDrop) {
    box[0].dataset.d35eTrayDrop = "1";
    box.on("dragover", (ev) => {
      const f = ev.originalEvent.dataTransfer?.getData("text/plain");
      if (f && /^d\d+$/.test(f)) ev.preventDefault();
    });
    box.on("drop", (ev) => {
      const f = ev.originalEvent.dataTransfer?.getData("text/plain");
      if (f && /^d\d+$/.test(f)) {
        ev.preventDefault();
        updateChatDice(f, "add");
      }
    });
  }
}

/**
 * 优势/劣势：把聊天公式中最后一个骰子改写为 kh/kl 形式（原版 Dice Tray 逻辑）
 * d20 → 2d20kh（点优势）；已带 kh 再点 → 恢复 1d20；kh ↔ kl 互相切换
 */
function applyAdvantage(khl) {
  const $chatMessage = $("#chat-message");
  const chatVal = $chatMessage.val() || "";
  if (!chatVal.trim()) return;
  const re = /(\d*)d(\d+)(kh|kl\d*)?/g;
  const matches = [...chatVal.matchAll(re)];
  if (!matches.length) return;
  const last = matches[matches.length - 1];
  const die = last[2];
  const existing = last[3] || "";
  let replacement;
  if (existing) {
    if (existing.startsWith(khl)) replacement = `1d${die}`; // 取消
    else replacement = `2d${die}${khl}`; // kh ↔ kl 切换
  } else {
    replacement = `2d${die}${khl}`;
  }
  $chatMessage.val(chatVal.slice(0, last.index) + replacement + chatVal.slice(last.index + last[0].length));
}

/** 把骰子公式加入/移出聊天输入框 */
function updateChatDice(formula, direction) {
  const $chatMessage = $("#chat-message");
  if (!$chatMessage.length) return;
  let chatVal = $chatMessage.val() || "";
  // 初始化 /roll
  if (!chatVal.trim()) chatVal = "/roll ";
  else if (!/^\/roll\b/.test(chatVal.trim())) chatVal = "/roll " + chatVal;

  if (direction === "add") {
    chatVal = chatVal.trimEnd() + " " + formula;
  } else {
    // 右键：从末尾移除最后一个该骰子
    const parts = chatVal.split(" ").filter((p) => p.length);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === formula) {
        parts.splice(i, 1);
        break;
      }
    }
    chatVal = parts.join(" ");
    if (chatVal.trim() === "/roll") chatVal = "/roll ";
  }
  $chatMessage.val(chatVal);
  $chatMessage.focus();
}

/* ================================================================
 * 骰子计算器对话框
 * ================================================================ */

/** D35E 专属按钮组（能力修正/豁免/常用属性） */
function getD35EButtons() {
  const abils = ["str", "dex", "con", "int", "wis", "cha"].map((a) => ({
    label: a,
    name: a.toUpperCase(),
    formula: `@abilities.${a}.mod`,
  }));
  const saveKeys = { fort: "D35E.Fortitude", ref: "D35E.Reflex", will: "D35E.Will" };
  const saves = Object.entries(saveKeys).map(([k, label]) => ({
    label: k,
    name: game.i18n.localize(label),
    formula: `@attributes.savingThrows.${k}.total`,
  }));
  const attrs = [
    { label: "init", name: game.i18n.localize("D35E.Initiative"), formula: "@attributes.init.total" },
    { label: "bab", name: "BAB", formula: "@attributes.bab.total" },
    { label: "cmb", name: "CMB", formula: "@attributes.cmb.total" },
  ];
  return { abilities: abils, saves, attributes: attrs };
}

async function openDiceCalculator() {
  const actor = canvas?.tokens?.controlled?.[0]?.actor || game.user.character || null;
  const buttons = getD35EButtons();
  const content = await renderTemplate("systems/D35E/templates/chat/dice-calculator.html", {
    abilities: buttons.abilities,
    saves: buttons.saves,
    attributes: buttons.attributes,
    adv: !game.settings.get("D35E", SETTINGS.hideAdv),
    i18n: {
      roll: game.i18n.localize("D35E.DTRoll"),
      del: game.i18n.localize("D35E.DTDel"),
      clear: game.i18n.localize("D35E.DTClear"),
      adv: game.i18n.localize("D35E.DTAdv"),
      dis: game.i18n.localize("D35E.DTDis"),
    },
  });
  const dialog = new Dialog(
    {
      title: game.i18n.localize("D35E.DTEnableCalculator"),
      content,
      buttons: {
        roll: {
          label: game.i18n.localize("D35E.DTRoll"),
          callback: (html) => {
            const formula = $(html).find(".dice-calculator__text-input").val().trim();
            if (!formula) return;
            const rollData = actor ? actor.getRollData() : {};
            try {
              const roll = new Roll35e(formula, rollData);
              roll.evaluate({ async: false });
              roll.toMessage();
            } catch (e) {
              ui.notifications.error(game.i18n.localize("D35E.DTRollError"));
            }
          },
        },
      },
      default: "roll",
      close: () => {},
    },
    { width: 460, classes: ["dialog", "dialog--dice-calculator"] }
  );
  dialog.render(true);
  // 按钮逻辑（模板渲染后绑定）
  setTimeout(() => {
    const $input = dialog.element.find(".dice-calculator__text-input");
    const append = (token) => {
      let cur = $input.val() || "";
      cur = cur.trimEnd() + (cur.trim() ? " " : "") + token;
      $input.val(cur);
    };
    dialog.element.find(".dice-calculator--button").on("click", (ev) => {
      const f = String($(ev.currentTarget).data("formula"));
      if (f === "DELETE") {
        const parts = $input.val().split(" ").filter((p) => p.length);
        parts.pop();
        $input.val(parts.join(" "));
      } else if (f === "CLEAR") $input.val("");
      else append(f);
    });

  }, 50);
}

/* ================================================================
 * 内联掷骰 [[公式]]
 * ================================================================ */

function onInlineRolls(message, data, options, userId) {
  const content = message.content;
  if (!content?.includes("[[")) return;
  const matches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)];
  if (!matches.length) return;
  const actor = ChatMessage.getSpeakerActor(message) || game.user.character || null;
  const rollData = actor?.getRollData?.() || {};
  let newContent = content;
  for (const m of matches) {
    try {
      const roll = new Roll35e(m[1], rollData);
      roll.evaluate({ async: false });
      newContent = newContent.replace(m[0], `<span class="d35e-inline-roll">${roll.total}</span>`);
    } catch (e) {
      console.warn("D35E | inline roll failed:", m[1], e);
    }
  }
  if (newContent !== content) message.updateSource({ content: newContent });
}

/* ================================================================
 * 托盘骰子拖到角色卡：用该角色数据直接掷骰
 * ================================================================ */

function onRenderActorSheet(app, html, data) {
  html.on("drop", (ev) => {
    const formula = ev.originalEvent.dataTransfer?.getData("text/plain");
    if (!formula || !/^d\d+$/.test(formula)) return;
    ev.preventDefault();
    const actor = app.actor;
    if (!actor) return;
    const roll = new Roll35e(formula, actor.getRollData());
    roll.evaluate({ async: false });
    roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }) });
  });
}
