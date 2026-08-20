/**
 * 双页聊天框（聊天页 / 检定页）+ 法术描述折叠
 *
 * 实现方式：显示层分流——不改动消息数据库（日志仍存完整卡，刷新不丢数据）。
 * - 检定页：所有投掷/结算结果卡（攻击/伤害/豁免/法抗/技能/功能窗口/普通骰子），显示完整卡
 * - 聊天页：普通聊天 + 法术描述（仅法术折叠）+ 检定卡的简单摘要（如"名字 命中 HP-5"、"名字 成功"）
 * - 切换：聊天框顶部单按钮 + 快捷键 toggleChatView（默认键位 U，可在设置中改键）
 *
 * 分类信号优先级：
 *   1. 消息 flags.D35E.template（卡模板路径，创建时固化，历史消息同样可读）——精确分类
 *   2. DOM 检测兜底（保证任何含骰子的卡都进入检定页，检定页一定包含所有检定）
 */

/**D35E 检定/结算类卡模板（完整结果进检定页，聊天页只留摘要） */
export const ROLL_TEMPLATES = new Set([
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
 * scrollIntoView 无效，导致"回到底部"按钮点了没反应（最后一条恰好是隐藏类型时，玩家端尤甚）。
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

/**
 * 注册双页聊天框 hooks（ready 内调用）
 * 说明：绑定消息分类/按钮注入/快捷键相关 hooks，并立即注入一次初始状态
 *      （聊天日志在 ready 之前已完成首次渲染，renderChatLog hook 会错过）。
 */
export function registerChatViews() {
  patchChatScrollBottom();
  _bindChatHooks();
  _injectInitialState();
}

/**
 * 绑定聊天相关 hooks（分类、按钮注入、滚动 patch）
 */
function _bindChatHooks() {
  // 聊天日志整体渲染：注入切换按钮并重扫分类
  Hooks.on("renderChatLog", (_app, html) => {
    injectTabs(html);
    rescansMessages();
  });
  // #chat-controls（发言模式/复制/清空那一行）随聊天侧栏渲染而重建：
  // 渲染后把切换按钮放到最左边（发言模式选择器左侧）
  Hooks.on("renderSidebarTab", (_app, html) => {
    if (_app.tabName === "chat") injectTabs(html);
  });
  // 单条消息渲染：立即分类（插入后生效，无需等下次窗口更新）
  Hooks.on("renderChatMessage", (message, html) => {
    const $m = html instanceof jQuery ? html : $(html);
    if ($m.length && !$m.hasClass("d35e-tab-roll") && !$m.hasClass("d35e-tab-chat")) {
      classify($m, message);
    }
    rescansMessages();
  });
}

/**
 * 注入初始状态：切换按钮 + 已有消息分类
 * 说明：ready 时 #chat 已渲染完成，主动注入一次（renderChatLog hook 已错过）。
 */
function _injectInitialState() {
  injectTabs($("#chat"));
  rescansMessages();
}

/**
 * 注册"切换聊天视图"快捷键（必须在 init hook 内调用）。
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
  controls.prepend(_buildToggleButton());
}

/**
 * 构建切换按钮元素（初始显示"聊天页"视图）
 * @returns {jQuery} 切换按钮
 */
function _buildToggleButton() {
  const btn = $(`
    <button type="button" class="d35e-tab-btn active" title="${game.i18n.localize("D35E.ChatTabRoll")}">
      <i class="fas fa-comments"></i>
    </button>`);
  btn.on("click", () => toggleChatView());
  return btn;
}

/**获取聊天日志容器 */
function getLog() {
  return $("#chat-log");
}

/**
 * 全量重扫消息分类（幂等：已分类的跳过）
 * 说明：双页视图/新消息渲染时调用，保证所有消息都有分类标记。
 */
function rescansMessages() {
  const log = getLog();
  if (!log.length) return;
  log.find(".message").each((_i, el) => {
    const $m = $(el);
    if ($m.hasClass("d35e-tab-roll") || $m.hasClass("d35e-tab-chat")) return;
    classify($m);
  });
}

/**
 * 分类入口（flags 优先，DOM 兜底）：
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
    _classifyByFlags($m, content, template, flags);
    return;
  }
  // 2) DOM 兜底（非 createCustomChatMessage 产生的消息）
  _classifyByDomFallback($m, content, flags);
}

/**
 * 按 flags.template 精确分类
 * @param {jQuery} $m 消息元素
 * @param {jQuery} content 消息内容区
 * @param {string} template 模板路径（flags.template）
 * @param {object|null} flags 消息的 D35E flags
 */
function _classifyByFlags($m, content, template, flags) {
  const t = template.split("/").pop();
  if (ROLL_TEMPLATES.has(t)) {
    $m.addClass("d35e-tab-roll");
    attachSummary($m, content, t);
    return;
  }
  $m.addClass("d35e-tab-chat");
  if (t === "item-card.html" && isSpellCard($m, content, flags)) {
    $m.addClass("d35e-spell-desc");
    makeCollapsible($m, content);
  }
  // consumable-card / defenses / gm-message / aoo-notification / request-roll / deactivate-buff 等 → 聊天页完整
}

/**
 * DOM 兜底分类（非 D35E 卡消息：按内容特征判断是否含骰子）
 * @param {jQuery} $m 消息元素
 * @param {jQuery} content 消息内容区
 * @param {object|null} flags 消息的 D35E flags
 */
function _classifyByDomFallback($m, content, flags) {
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
 * 查不到一律视为非法术 → 不折叠（严格"只折叠法术"）
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

/**
 * 给检定卡附加摘要容器（聊天页视图显示，完整卡在检定页视图显示）
 * 摘要内的投掷小骰子：点击触发卡内真实投掷按钮（复用 D35E 完整卡按钮的 actor 定位/投掷逻辑）。
 */
function attachSummary($m, content, template) {
  if ($m.find(".d35e-summary").length) return;
  const summary = _buildSummaryByKind(template, $m, content);
  $m.prepend(`<div class="d35e-summary" style="display:none">${summary}</div>`);
  // 摘要投掷小骰子：点击触发卡内真实投掷按钮
  $m.find(".d35e-summary-roll").on("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const real = content.find('.card-buttons button[data-action], .item-roll').first();
    if (real.length) real[0].click();
  });
}

/**
 * 按卡模板类型构建摘要（分发到各摘要构建函数）
 * @param {string} template 模板文件名（如 damage-description.html）
 * @param {jQuery} $m 消息元素
 * @param {jQuery} content 消息内容区
 * @returns {string} 摘要 HTML
 */
function _buildSummaryByKind(template, $m, content) {
  const kind = template.split("/").pop();
  if (kind === "damage-description.html") return buildDamageSummary($m, content);
  if (kind === "saving-throw.html") return buildSaveSummary($m, content);
  if (kind === "resistance.html") return buildResistanceSummary($m, content);
  return buildGenericSummary($m, content);
}

/* ==================== 摘要构建（最简结果） ==================== */

/**
 * 从 header 提取名字（去掉内联 flavor 等子元素），并返回状态文本
 * @param {jQuery} card 卡元素
 * @param {boolean} last true=取最后一个 header（目标），false=取第一个（攻击者）
 * @returns {{name: string, status: string}} 名字与状态文本
 */
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
  const { applied, isHeal } = _extractAppliedDamage(card);
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
    // 命中/暴击：`A攻击命中B HP-10`（暴击文案本地化为"重击威胁!"）
    const verb = /暴击|重击|crit|threat/i.test(status) ? "暴击" : "命中";
    text = attacker ? `${escapeHtml(attacker)}攻击${verb}${escapeHtml(target)}` : escapeHtml(target);
    if (applied && /^[\d.]+$/.test(applied)) text += ` <b class="d35e-hp">HP-${applied}</b>`;
  }
  const icon = card.find(".card-header img").last().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";
  return `${iconHtml}<span class="d35e-summary-text">${text}</span>`;
}

/**
 * 从伤害卡提取实际伤害（Applied）与是否治疗
 * 说明：优先主卡第二个 box；无目标时兜底 toggle-content 硬编码 "Applied"。
 * @returns {{applied: string, isHeal: boolean}} 实际伤害文本与治疗标记
 */
function _extractAppliedDamage(card) {
  let applied = "";
  let isHeal = false;
  const boxes = card.find(".dice-result-row .dice-result.box .dice-total.rolled-roll");
  if (boxes.length > 1) {
    const $b = $(boxes[1]);
    applied = $b.text().trim();
    isHeal = !!$b.find("i.fa-heart").length;
  }
  if (!applied) {
    card.find(".toggle-content .dice-flavor").each((_i, el) => {
      if ($(el).text().trim() === "Applied") {
        const $t = $(el).closest(".flexcol").find(".dice-total").first();
        applied = $t.text().trim();
        isHeal = !!$t.find("i.fa-heart").length;
      }
    });
  }
  return { applied, isHeal };
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

/**法抗卡最简摘要：`名字抵抗成功` / `名字抵抗失败`（失败文案本地化为"未能抵挡攻击!"） */
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
  // 无目标（"No SR"等）：只显示名字
  if (!status) return `${iconHtml}<span class="d35e-summary-text">${escapeHtml(name)}</span>`;
  // 成功文案含"成功"，失败文案含"未能抵挡"
  const isOk = /成功|success/i.test(status);
  return `${iconHtml}<span class="d35e-summary-text">${escapeHtml(name)}抵抗<span class="d35e-st ${isOk ? "d35e-ok" : "d35e-bad"}">${isOk ? "成功" : "失败"}</span></span>`;
}

/**
 * 通用摘要（攻击/技能等检定卡）：`使用者 使用 能力名：攻击检定11`
 * 说明：成功/失败标记（数字后 √/×）；结果为空时省略冒号；附投掷小骰子。
 */
function buildGenericSummary($m, content) {
  const header = content.find(".card-header").first();
  // 使用者（actor 名，header 的 h4）与能力名（header 的 h3）
  const actorName = header.find("h4").first().text().trim();
  const itemName = header.find("h3").first().text().trim();
  const senderName = $m.find(".message-sender").first().text().trim();
  const flavor = content.find(".dice-roll .dice-flavor").first().text().trim();
  const total = content.find(".dice-roll .dice-total").first().text().trim();
  const resText = _buildResultText(flavor, total);
  const mark = _buildResultMark(content, $m);
  const text = _buildGenericSentence(actorName, itemName, senderName, resText, mark);
  const icon = content.find(".card-header img").first().attr("src") || "";
  const iconHtml = icon ? `<img class="d35e-summary-icon" src="${icon}">` : "";
  return `${iconHtml}<span class="d35e-summary-text">${text}</span>${_buildSummaryRollButton(content)}`;
}

/**
 * 构建结果文本：攻击 → `攻击检定11`；其余 → `伤害8` / `11`
 * @param {string} flavor 结果标签文本
 * @param {string} total 骰子总值文本
 * @returns {string} 结果描述文本
 */
function _buildResultText(flavor, total) {
  const atk = game.i18n.localize("D35E.Attack");
  const roll = game.i18n.localize("D35E.Roll");
  if (flavor === atk && total) return `${atk}${roll}${total}`;
  if (flavor && total) return `${flavor}${total}`;
  if (flavor) return flavor;
  return total || "";
}

/**
 * 构建成功/失败标记（数字后显示 √/×）
 * 说明：优先读 tokenbar 卡 flags 的判定结果（token*.passed），GM/玩家端各自的
 *      gm-only/player-only 元素会被移除，DOM 类检测在对端不可靠；
 *      D35E 自身检定卡用 DOM 类 .dice-total.success/.failure 兜底。
 * @param {jQuery} content 消息内容区
 * @param {jQuery|null} $m 消息元素（用于读 flags）
 * @returns {string} 标记文本（√ 或 × 或空）
 */
function _buildResultMark(content, $m) {
  // tokenbar 卡：flags.D35E.token* 带 passed（true=成功 / false=失败 / undefined=未判定）
  const msgId = $m?.attr("data-message-id");
  const msg = msgId ? game.messages.get(msgId) : null;
  const d35eFlags = msg?.flags?.D35E || null;
  if (d35eFlags && typeof d35eFlags === "object") {
    const tokens = Object.values(d35eFlags).filter((v) => v && typeof v === "object" && v.passed !== undefined);
    if (tokens.some((t) => t.passed === true || t.passed === "success")) return "√";
    if (tokens.some((t) => t.passed === false || t.passed === "failed")) return "×";
  }
  // D35E 自身检定卡兜底：骰子结果带 success/failure 类
  const hasSuccess = content.find(".dice-total.success").length > 0;
  const hasFailed = content.find(".dice-total.failure").length > 0;
  return hasSuccess ? "√" : (hasFailed ? "×" : "");
}

/**
 * 构建摘要句子：`使用者 使用 能力名：结果`
 * 说明：结果为空时省略冒号（如 monks-tokenbar 请求卡摘要显示"手上功夫 检定"）。
 */
function _buildGenericSentence(actorName, itemName, senderName, resText, mark) {
  // 成功/失败标记只追加在结果文本后（结果为空时保持为空，与原逻辑一致）
  if (mark && resText) resText += mark;
  const withColon = (s) => (s && resText ? `${s}：${resText}` : s || resText);
  if (actorName && itemName) return `${escapeHtml(actorName)} 使用 ${escapeHtml(itemName)}${resText ? `：${resText}` : ""}`;
  if (actorName) return withColon(escapeHtml(actorName));
  if (itemName) return withColon(escapeHtml(itemName));
  if (senderName) return withColon(escapeHtml(senderName));
  return resText;
}

/**
 * 构建摘要投掷小骰子按钮（点击触发卡内真实投掷按钮）
 * 说明：摘要按钮在消息级（.chat-card 之外），不能带 data-action（否则全局 button[data-action] 委托
 *      会以 closest(".chat-card")=null 的方式误触发）；点击绑定在 attachSummary 里处理。
 * @returns {string} 按钮 HTML（卡内无投掷按钮时为空）
 */
function _buildSummaryRollButton(content) {
  const rollBtn = content.find('.card-buttons button[data-action], .item-roll').first();
  if (!rollBtn.length) return "";
  return `<button class="d35e-summary-roll" title="${game.i18n.localize("D35E.Roll")}"><img src="systems/D35E/icons/damage-type/badges/rolling-dices.svg" alt="dice"></button>`;
}

/**HTML 转义工具 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==================== 法术描述折叠 ==================== */

/**
 * 法术描述折叠：头部（图片+名字+简述）+ 可折叠描述体（默认折叠由设置控制）
 */
function makeCollapsible($m, content) {
  if ($m.find(".d35e-spell-fold").length) return;
  const card = content.find(".chat-card").first();
  if (!card.length) return;
  const descBody = card.find(".card-content").first();
  const head = _buildSpellHead(card, descBody);
  card.prepend(head);
  _bindFoldToggle(head, descBody);
}

/**
 * 构建法术折叠头部（图片 + 名字 + 简述 + 折叠箭头）
 * 说明：简述优先物品 shortDescription，其次截断描述正文；默认折叠由设置控制（默认 true=折叠）。
 * @returns {jQuery} 头部元素
 */
function _buildSpellHead(card, descBody) {
  let short = _getSpellShortDescription(card);
  if (!short) {
    const txt = descBody.text().trim();
    short = txt.slice(0, 60) + (txt.length > 60 ? "…" : "");
  }
  const headImg = card.find(".card-header img").first();
  const name = card.find(".card-header h3").first().text().trim();
  const head = $(`
    <div class="d35e-spell-head">
      ${headImg.length ? headImg.prop("outerHTML") : ""}
      <span class="d35e-spell-name">${escapeHtml(name)}</span>
      <span class="d35e-spell-short">${escapeHtml(short)}</span>
      <a class="d35e-spell-toggle" title="${game.i18n.localize("D35E.SpellFoldToggle")}"><i class="fas fa-chevron-down"></i></a>
    </div>`);
  if (game.settings.get("D35E", "foldSpellDescriptions")) descBody.hide();
  return head;
}

/**
 * 从卡上的物品获取简述文本（优先 shortDescription）
 * @returns {string} 简述（可能为空）
 */
function _getSpellShortDescription(card) {
  try {
    const actorId = card.attr("data-actor-id");
    const itemId = card.attr("data-item-id");
    const actor = actorId ? game.actors.get(actorId) : null;
    const item = actor && itemId ? actor.items.get(itemId) : null;
    return item?.system?.shortDescription || "";
  } catch (e) {
    /*忽略*/
    return "";
  }
}

/**
 * 绑定折叠切换（点击箭头展开/收起描述体）
 * @param {jQuery} head 头部元素
 * @param {jQuery} descBody 描述体元素
 */
function _bindFoldToggle(head, descBody) {
  head.on("click", ".d35e-spell-toggle", (ev) => {
    ev.stopPropagation();
    const open = descBody.is(":visible");
    descBody.toggle();
    head.find("i").attr("class", open ? "fas fa-chevron-down" : "fas fa-chevron-up");
    head.toggleClass("open", !open);
  });
}
