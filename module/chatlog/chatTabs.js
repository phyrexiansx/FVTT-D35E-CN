/**
 * 双页聊天框（聊天页 / 检定页）+ 法术描述折叠
 *
 * 实现方式：显示层分流——不改动消息数据库（日志仍存完整卡，刷新不丢数据）。
 * - 检定页：所有投掷/结算结果卡（攻击/伤害/豁免/法抗/技能/功能窗口/普通骰子），显示完整卡
 * - 聊天页：普通聊天 + 法术描述（仅法术折叠）+ 检定卡的简单摘要（如“名字 命中 HP-5”、“名字 成功”）
 * - 切换：聊天框顶部单按钮 + 快捷键 toggleChatView（默认键位 U，可在设置中改键）
 *
 * 分类信号优先级：
 *   1. 消息 flags.D35E.template（卡模板路径，创建时固化，历史消息同样可读）——精确分类
 *   2. DOM 检测兜底（保证任何含骰子的卡都进入检定页，检定页一定包含所有检定）
 */

/**D35E 检定/结算类卡模板（完整结果进检定页，聊天页只留摘要） */
const ROLL_TEMPLATES = new Set([
  "attack-roll.html", // 攻击卡（含攻击骰/伤害骰/豁免与法抗按钮）
  "damage-description.html", // 伤害结算卡（命中/未命中 + 实际伤害）
  "saving-throw.html", // 豁免卡
  "resistance.html", // 法术/异能抗力卡
  "skill.html", // 技能检定
  "roll-ext.html", // 属性/其他检定
  "simple-attack-roll.html", // 简化攻击
  "grapple.html", // 擒抱
  "turn-undead.html", // 驱散亡灵
  "psionic-focus.html", // 灵能聚焦
  "dot-roll.html", // 持续伤害
  "fastheal-roll.html", // 快速治疗
  "special-actions-applied.html", // 特殊行动应用结果
]);

/**
 * core 的 ChatLog.scrollBottom 滚动到 `#chat-log` 最后一个子元素（lastElementChild.scrollIntoView）。
 * 双页分类在检定页视图（d35e-rollview）下会把纯聊天消息 display:none——隐藏元素没有渲染盒子，
 * scrollIntoView 无效，导致“回到底部”按钮点了没反应（最后一条恰好是隐藏类型时，玩家端尤甚）。
 * patch：滚动到最后一个可见（有渲染盒子）的消息，其余行为与 core 一致。
 */
export function patchChatScrollBottom() {
  const proto = ChatLog.prototype;
  if (!proto || proto.scrollBottom.__d35ePatched) return;
  proto.scrollBottom = async function (...args) {
    const options = args[0] || {};
    if (!this.rendered) return;
    if (options.waitImages) await this._waitForImages();
    const log = this.element[0].querySelector("#chat-log");
    const lastVisible = log
      ? [...log.children].reverse().find((el) => el.getClientRects().length > 0)
      : null;
    lastVisible?.scrollIntoView(options.scrollOptions);
    if (options.popout) {
      this._popout?.scrollBottom({ waitImages: options.waitImages, scrollOptions: options.scrollOptions });
    }
  };
  proto.scrollBottom.__d35ePatched = true;
}

/**注册双页聊天框 hooks（ready 内调用） */
export function registerChatViews() {
  patchChatScrollBottom();
  Hooks.on("renderChatLog", (app, html) => {
    injectTabs(html);
    rescansMessages();
  });
  // #chat-controls（发言模式/复制/清空那一行）随聊天侧栏渲染而重建：
  // 渲染后把切换按钮放到最左边（发言模式选择器左侧）
  Hooks.on("renderSidebarTab", (app, html) => {
    if (app.tabName === "chat") injectTabs(html);
  });
  Hooks.on("renderChatMessage", (message, html) => {
    // html 尚未插入 #chat-log：直接对新消息分类（插入后立即生效，无需等下次窗口更新）
    const $m = html instanceof jQuery ? html : $(html);
    if ($m.length && !$m.hasClass("d35e-tab-roll") && !$m.hasClass("d35e-tab-chat")) {
      classify($m, message);
    }
    rescansMessages();
  });
  // 立即注入：聊天日志在 ready 之前已完成首次渲染，renderChatLog hook 会错过，
  // 必须在 ready 时主动注入一次切换按钮并分类已有消息
  injectTabs($("#chat"));
  rescansMessages();
}

/**
 * 注册“切换聊天视图”快捷键（必须在 init hook 内调用）。
 * 默认键位：U（可在设置中改键）。
 */
export function registerChatViewKeybindings() {
  game.keybindings.register("D35E", "toggleChatView", {
    name: "D35E.ToggleChatViewBinding",
    hint: "D35E.ToggleChatViewBindingHint",
    editable: [{ key: "KeyU" }],
    onDown: () => {
      toggleChatView();
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

/**切换聊天页/检定页视图 */
export function toggleChatView() {
  const log = $("#chat-log");
  if (!log.length) return;
  log.toggleClass("d35e-rollview");
  updateToggleButton();
}

/**更新切换按钮的图标/title（显示当前所在视图；按钮在 #chat-controls 内，用全局选择器） */
function updateToggleButton() {
  const btn = $(".d35e-tab-btn");
  if (!btn.length) return;
  const isRoll = $("#chat-log").hasClass("d35e-rollview");
  btn.find("i").attr("class", `fas ${isRoll ? "fa-dice-d20" : "fa-comments"}`);
  btn.attr("title", game.i18n.localize(isRoll ? "D35E.ChatTabChat" : "D35E.ChatTabRoll"));
}

/**
 * 注入聊天视图切换按钮（幂等，极小图标）。
 * 位置：聊天输入框上方控制行（#chat-controls）最左边——发言模式选择器（公开 ⌄）的左侧，
 * 即原版 Dice Tray 骰子图标所在的位置；随输入区固定，不随 #chat-log 滚动/遮挡。
 */
function injectTabs(html) {
  if ($(".d35e-tab-btn").length) return; // 全局幂等：只需一个按钮
  const scope = html && html.find ? html : $(document);
  const controls = scope.find("#chat-controls");
  if (!controls.length) return;
  const btn = $(`
    <button type="button" class="d35e-tab-btn active" title="${game.i18n.localize("D35E.ChatTabRoll")}">
      <i class="fas fa-comments"></i>
    </button>`);
  controls.prepend(btn);
  btn.on("click", (ev) => toggleChatView());
}

function getLog() {
  return $("#chat-log");
}

/**全量重扫消息分类（幂等：已分类的跳过） */
function rescansMessages() {
  const log = getLog();
  if (!log.length) return;
  log.find(".message").each((i, el) => {
    const $m = $(el);
    if ($m.hasClass("d35e-tab-roll") || $m.hasClass("d35e-tab-chat")) return;
    classify($m);
  });
}

/**
 * 分类（flags 优先，DOM 兜底）：
 * - 检定/结算模板 → 检定页 + 摘要（聊天页只显示最简结果）
 * - item-card（法术）→ 聊天页 + 折叠；item-card（非法术）/消耗品/防御/通知等 → 聊天页完整
 * - 普通骰子（无 D35E 卡）→ 两页各留一份（聊天页摘要、检定页完整）
 * - 其他 → 聊天页
 */
function classify($m, message) {
  const content = $m.find(".message-content").first();
  if (!content.length) {
    $m.addClass("d35e-tab-chat");
    return;
  }
  const messageId = $m.attr("data-message-id");
  const msg = message || (messageId ? game.messages.get(messageId) : null);
  const flags = msg?.flags?.D35E || null;
  const template = flags?.template || "";

  // 1) flags 精确分类（D35E 卡消息创建时写入模板路径）
  if (template) {
    const t = template.split("/").pop();
    if (ROLL_TEMPLATES.has(t)) {
      $m.addClass("d35e-tab-roll");
      attachSummary($m, content, t);
      return;
    }
    if (t === "item-card.html") {
      $m.addClass("d35e-tab-chat");
      if (isSpellCard($m, content, flags)) {
        $m.addClass("d35e-spell-desc");
        makeCollapsible($m, content);
      }
      return;
    }
    // consumable-card / defenses / gm-message / aoo-notification / request-roll / deactivate-buff 等 → 聊天页完整
    $m.addClass("d35e-tab-chat");
    return;
  }

  // 2) DOM 兜底（非 createCustomChatMessage 产生的消息）
  const html = content.html() || "";
  const isDesc = html.includes("card-content item");
  const hasDice = html.includes("dice-roll");
  const isCard = html.includes("chat-card");
  const isRoll = hasDice || /data-action=/.test(html) || html.includes('name="formula"');
  if (isDesc && !isRoll) {
    $m.addClass("d35e-tab-chat");
    if (isSpellCard($m, content, flags)) {
      $m.addClass("d35e-spell-desc");
      makeCollapsible($m, content);
    }
    return;
  }
  if (isRoll) {
    $m.addClass("d35e-tab-roll");
    attachSummary($m, content, "");
    // 普通骰子（非 D35E 卡）：两页各留一份
    if (!isCard) $m.addClass("d35e-tab-chat");
    return;
  }
  $m.addClass("d35e-tab-chat");
}

/**
 * 是否为法术描述卡（只折叠法术）：
 * 1. DOM class（新渲染的 item-card.html 带 d35e-spell-card）
 * 2. flags chatTemplateData.item.type（新版本消息创建时写入）
 * 3. 从 actor 查 item.type（actor 仍存在时）
 * 查不到一律视为非法术 → 不折叠（严格“只折叠法术”）
 */
function isSpellCard($m, content, flags) {
  if (content.find(".d35e-spell-card").length) return true;
  const itemType = flags?.chatTemplateData?.item?.type;
  if (itemType) return itemType === "spell";
  const card = content.find(".chat-card").first();
  const itemId = card.attr("data-item-id");
  const actorId = card.attr("data-actor-id");
  const actor = actorId ? game.actors.get(actorId) : null;
  const item = actor && itemId ? actor.items.get(itemId) : null;
  if (item) return item.type === "spell";
  return false;
}

/**给检定卡附加摘要容器（聊天页视图显示，完整卡在检定页视图显示） */
function attachSummary($m, content, template) {
  if ($m.find(".d35e-summary").length) return;
  const kind = template.split("/").pop();
  let summary = "";
  if (kind === "damage-description.html") summary = buildDamageSummary($m, content);
  else if (kind === "saving-throw.html") summary = buildSaveSummary($m, content);
  else if (kind === "resistance.html") summary = buildResistanceSummary($m, content);
  else summary = buildGenericSummary($m, content);
  $m.prepend(`<div class="d35e-summary" style="display:none">${summary}</div>`);

  // [D35E]摘要投掷小骰子：点击触发卡内真实投掷按钮（复用 D35E 完整卡按钮的 actor 定位/投掷逻辑）
  $m.find(".d35e-summary-roll").on("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const real = content.find('.card-buttons button[data-action], .item-roll').first();
    if (real.length) real[0].click();
  });
}

/* ==================== 摘要构建（最简结果） ==================== */

/**从 header 提取名字（去掉内联 flavor 等子元素），并返回状态文本 */
function extractHeader(card, last) {
  const headers = card.find(".card-header h3");
  if (!headers.length) return { name: "", status: "" };
  const h3 = $(headers[last ? headers.length - 1 : 0]).clone();
  h3.find("i, img, .dice-flavor").remove();
  const name = h3.text().trim();
  const status = $(headers[last ? headers.length - 1 : 0])
    .find(".dice-flavor")
    .first()
    .text()
    .trim();
  return { name, status };
}

/**
 * 伤害结算卡最简摘要（句子式）：
 * 命中 → `A攻击命中B HP-10`；暴击 → `A攻击暴击B HP-12`；未命中 → `A攻击未命中B`；治疗 → `B HP+5`
 */
function buildDamageSummary($m, content) {
  const card = content.find(".chat-card").first();
  const headers = card.find(".card-header h3");
  // 攻击者：第一个 header（sourceName 存在时才有两个 header）
  let attacker = "";
  if (headers.length > 1) attacker = $(headers[0]).clone().text().trim();
  const { name, status } = extractHeader(card, true);
  const target = name || $m.find(".message-sender").first().text().trim();

  // 实际伤害（Applied）：主卡第二个 box；无目标时兜底 toggle-content 硬编码 “Applied”
  let applied = "";
  let isHeal = false;
  const boxes = card.find(".dice-result-row .dice-result.box .dice-total.rolled-roll");
  if (boxes.length > 1) {
    const $b = $(boxes[1]);
    applied = $b.text().trim();
    isHeal = !!$b.find("i.fa-heart").length;
  }
  if (!applied) {
    card.find(".toggle-content .dice-flavor").each((i, el) => {
      if ($(el).text().trim() === "Applied") {
        const $t = $(el).closest(".flexcol").find(".dice-total").first();
        applied = $t.text().trim();
        isHeal = !!$t.find("i.fa-heart").length;
      }
    });
  }

  let text;
  if (isHeal) {
    // 治疗：`目标 HP+x`
    text = escapeHtml(target);
    if (applied && /^[\d.]+$/.test(applied)) text += ` <b class="d35e-hp">HP+${applied}</b>`;
  } else if (status && /未命中|miss/i.test(status)) {
    // 未命中：`A攻击未命中B`
    text = attacker
      ? `${escapeHtml(attacker)}攻击未命中${escapeHtml(target)}`
      : `${escapeHtml(target)}未命中`;
  } else {
    // 命中/暴击：`A攻击命中B HP-10`（暴击文案本地化为“重击威胁!”）
    const verb = /暴击|重击|crit|threat/i.test(status) ? "暴击" : "命中";
    text = attacker ? `${escapeHtml(attacker)}攻击${verb}${escapeHtml(target)}` : escapeHtml(target);
    if (applied && /^[\d.]+$/.test(applied)) text += ` <b class="d35e-hp">HP-${applied}</b>`;
  }
  const icon = card.find(".card-header img").last().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";
  return `${iconHtml}<span class="d35e-summary-text">${text}</span>`;
}

/**豁免卡最简摘要：`名字豁免成功` / `名字豁免失败`（兜底比较结果与目标值） */
function buildSaveSummary($m, content) {
  const card = content.find(".chat-card").first();
  const h3 = card.find(".card-header h3").first();
  const name = h3.text().trim().split(" - ")[0] || $m.find(".message-sender").first().text().trim();
  let status = card.find(".dice-flavor").first().text().trim();
  if (!status) {
    const r = parseInt(card.find(".rolled-roll.dice-total").first().text().trim(), 10);
    const v = parseInt(card.find(".rolled-versus.dice-total").first().text().trim(), 10);
    if (!isNaN(r) && !isNaN(v)) status = r >= v ? "成功" : "失败";
  }
  const isBad = /失败|fail/i.test(status);
  const icon = card.find(".card-header img").first().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";
  return `${iconHtml}<span class="d35e-summary-text">${escapeHtml(name)}豁免<span class="d35e-st ${isBad ? "d35e-bad" : "d35e-ok"}">${isBad ? "失败" : "成功"}</span></span>`;
}

/**法抗卡最简摘要：`名字抵抗成功` / `名字抵抗失败`（失败文案本地化为“未能抵挡攻击!”） */
function buildResistanceSummary($m, content) {
  const card = content.find(".chat-card").first();
  const h3 = card.find(".card-header h3").first();
  const name = h3.text().trim().split(" - ")[0] || $m.find(".message-sender").first().text().trim();
  let status = card.find(".dice-flavor").first().text().trim();
  if (!status) {
    const r = parseInt(card.find(".rolled-roll.dice-total").first().text().trim(), 10);
    const v = parseInt(card.find(".rolled-versus.dice-total").first().text().trim(), 10);
    if (!isNaN(r) && !isNaN(v)) status = r >= v ? "抵抗失败" : "抵抗成功";
  }
  const icon = card.find(".card-header img").first().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";
  // 无目标（“No SR”等）：只显示名字
  if (!status) return `${iconHtml}<span class="d35e-summary-text">${escapeHtml(name)}</span>`;
  // 成功文案含“成功”，失败文案含“未能抵挡”
  const isOk = /成功|success/i.test(status);
  return `${iconHtml}<span class="d35e-summary-text">${escapeHtml(name)}抵抗<span class="d35e-st ${isOk ? "d35e-ok" : "d35e-bad"}">${isOk ? "成功" : "失败"}</span></span>`;
}

/**通用摘要（攻击/技能等检定卡）：`使用者 使用 能力名：攻击检定11` */
function buildGenericSummary($m, content) {
  const header = content.find(".card-header").first();
  // 使用者（actor 名，header 的 h4）与能力名（header 的 h3）
  const actorName = header.find("h4").first().text().trim();
  const itemName = header.find("h3").first().text().trim();
  const senderName = $m.find(".message-sender").first().text().trim();
  const flavor = content.find(".dice-roll .dice-flavor").first().text().trim();
  const total = content.find(".dice-roll .dice-total").first().text().trim();
  // 结果描述：攻击 → `攻击检定11`；其余 → `伤害8` / `11`
  const atk = game.i18n.localize("D35E.Attack");
  const roll = game.i18n.localize("D35E.Roll");
  let resText = "";
  if (flavor === atk && total) resText = `${atk}${roll}${total}`;
  else if (flavor && total) resText = `${flavor}${total}`;
  else if (flavor) resText = flavor;
  else if (total) resText = total;
  // [D35E]成功/失败标记（数字后显示√/×）：D35E 卡 .dice-total.success/.failure；monks-tokenbar 卡 .result-passed/.result-failed
  const hasSuccess = content.find(".dice-total.success, .result-passed").length > 0;
  const hasFailed = content.find(".dice-total.failure, .result-failed").length > 0;
  const mark = hasSuccess ? "√" : (hasFailed ? "×" : "");
  if (mark && resText) resText += mark;
  // [D35E]结果为空时省略冒号（如 monks-tokenbar 请求卡摘要显示“手上功夫 检定”）
  const withColon = (s) => (s && resText ? `${s}：${resText}` : s || resText);
  let text;
  if (actorName && itemName) text = `${escapeHtml(actorName)} 使用 ${escapeHtml(itemName)}${resText ? `：${resText}` : ""}`;
  else if (actorName) text = withColon(escapeHtml(actorName));
  else if (itemName) text = withColon(escapeHtml(itemName));
  else if (senderName) text = withColon(escapeHtml(senderName));
  else text = resText;
  const icon = content.find(".card-header img").first().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";

  // [D35E]投掷小骰子：从完整卡读取第一个投掷按钮（rollSave/rollSkill/rollAbility 等），
  // 聊天页摘要上直接掷骰（复用全局 `button[data-action]` 委托绑定）
  // [D35E]任何 card-buttons 按钮（rollSave/rollSkill/rollAbility/grapple/CMB/damage 等）都视为“投掷/操作”按钮
  // [D35E]掷骰按钮：D35E 卡的 card-buttons 按钮，或 monks-tokenbar 请求卡的 .item-roll
  const rollBtn = content.find('.card-buttons button[data-action], .item-roll').first();
  let rollHtml = "";
  if (rollBtn.length) {
    // 注意：摘要按钮在消息级（.chat-card 之外），不能带 data-action（否则全局 button[data-action] 委托
    // 会以 closest(".chat-card")=null 的方式误触发）；点击绑定在 attachSummary 里处理（触发卡内真实按钮）
    rollHtml = `<button class="d35e-summary-roll" title="${game.i18n.localize("D35E.Roll")}"><img src="systems/D35E/icons/damage-type/badges/rolling-dices.svg" alt="dice"></button>`;
  }
  return `${iconHtml}<span class="d35e-summary-text">${text}</span>${rollHtml}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==================== 法术描述折叠 ==================== */

/**法术描述折叠：头部（图片+名字+简述）+ 可折叠描述体（默认折叠由设置控制） */
function makeCollapsible($m, content) {
  if ($m.find(".d35e-spell-fold").length) return;
  const card = content.find(".chat-card").first();
  if (!card.length) return;
  // 简述：优先物品 shortDescription，其次截断描述
  let short = "";
  try {
    const actorId = card.attr("data-actor-id");
    const itemId = card.attr("data-item-id");
    const actor = actorId ? game.actors.get(actorId) : null;
    const item = actor && itemId ? actor.items.get(itemId) : null;
    if (item) short = item.system?.shortDescription || "";
  } catch (e) {
    /*忽略*/
  }
  const descBody = card.find(".card-content").first();
  if (!short) {
    const txt = descBody.text().trim();
    short = txt.slice(0, 60) + (txt.length > 60 ? "…" : "");
  }
  const headImg = card.find(".card-header img").first();
  const name = card.find(".card-header h3").first().text().trim();
  // 默认折叠由设置控制（默认 true=折叠）
  const foldDefault = game.settings.get("D35E", "foldSpellDescriptions");
  const head = $(`
    <div class="d35e-spell-head">
      ${headImg.length ? headImg.prop("outerHTML") : ""}
      <span class="d35e-spell-name">${escapeHtml(name)}</span>
      <span class="d35e-spell-short">${escapeHtml(short)}</span>
      <a class="d35e-spell-toggle" title="${game.i18n.localize("D35E.SpellFoldToggle")}"><i class="fas fa-chevron-down"></i></a>
    </div>`);
  card.prepend(head);
  if (foldDefault) descBody.hide();
  head.on("click", ".d35e-spell-toggle", (ev) => {
    ev.stopPropagation();
    const open = descBody.is(":visible");
    descBody.toggle();
    head.find("i").attr("class", open ? "fas fa-chevron-down" : "fas fa-chevron-up");
    head.toggleClass("open", !open);
  });
}
