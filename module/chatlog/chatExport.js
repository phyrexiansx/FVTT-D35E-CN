// ============================================================================
// 聊天记录导出（仅 GM）
// ----------------------------------------------------------------------------
// 功能：覆盖 Foundry 原生「导出聊天记录」按钮（聊天栏控制区，data-action="export"），
//   点击时输出整洁文本：顶部一行导出时间，每条消息为「发送者 / 内容 / 分隔线」；
//   自动过滤以下消息，避免输出垃圾行：
//     1) 内容为空/纯空白的消息（借机提示、排序广播、目标连线、打字指示等载体消息）
//     2) 耳语（whisper）消息（私密对话不进入公共导出）
//     3) 检定页内容（攻击/伤害/豁免等结算卡，与双页聊天框分类一致——只保留聊天页）
// 说明：导出文本由 _buildExportText 纯函数生成（便于复用与测试），_doExport 负责下载。
// ============================================================================

import { ROLL_TEMPLATES } from "./chatTabs.js";

/** 被渲染隐藏的 D35E 载体消息 flag 列表（其 content 为空，导出时跳过） */
const HIDDEN_FLAG_KEYS = ["aooPrompt", "chatReorder", "targetLines", "typing"];

/**
 * 注册聊天导出功能：覆盖原生导出按钮 + 绑定点击委托
 */
export function registerChatExport() {
  // 每次聊天日志渲染时，把原生导出按钮的 data-action 改写为自定义值（幂等）
  Hooks.on("renderChatLog", (app, html) => _overrideNativeExportButton(html));
  // 原生 capture 监听：先于按钮上的 Foundry 原生 handler 执行（jQuery .on 不支持 capture 参数，故用 addEventListener）
  document.removeEventListener("click", _onExportCapture, true);
  document.addEventListener("click", _onExportCapture, true);
  // [D35E]立即覆盖一次：本函数在 ready 回调中被调用时 #chat 已渲染完成
  _overrideNativeExportButton($("#chat"));
}

/**
 * 导出按钮点击拦截（capture 阶段）：匹配到已覆盖的导出按钮则执行导出并阻止原生行为
 * @param {MouseEvent} ev 原生点击事件
 */
function _onExportCapture(ev) {
  if (!game.user?.isGM) return;
  const target = ev.target && ev.target.closest ? ev.target.closest('.export-log[data-action="d35e-export"]') : null;
  if (!target) return;
  ev.preventDefault();
  ev.stopImmediatePropagation();
  _doExport();
}

/**
 * 将 Foundry 原生导出按钮改写为自定义 action（仅 GM）
 * @param {jQuery} html 聊天日志渲染的根元素
 */
function _overrideNativeExportButton(html) {
  if (!game.user?.isGM) return;
  const controls = html.find("#chat-controls");
  if (!controls.length) return;
  // Foundry 原生导出按钮：.export-log（fa-save 图标，位于清除记录按钮旁），改写 data-action 以被我们的委托接管
  const btn = controls.find(".export-log");
  if (btn.length) btn.attr("data-action", "d35e-export");
}

/**
 * 导出按钮点击处理（兼容 jQuery 触发场景）
 * @param {jQuery.Event} ev 点击事件
 */
function _onExportClick(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  _doExport();
}

/**
 * 执行导出：根据当前聊天消息生成文本并下载为 .txt 文件
 */
async function _doExport() {
  const text = _buildExportText(game.messages.contents);
  _downloadText(text);
}

/**
 * 根据消息列表生成导出文本（纯函数）
 * @param {ChatMessage[]} messages 按显示顺序排列的消息列表
 * @returns {string} 导出文本（末尾带换行）
 */
export function _buildExportText(messages) {
  const lines = [];
  lines.push(`导出时间：${_formatNow()}`);
  for (const msg of messages) {
    if (!_shouldInclude(msg)) continue;
    const sender = _resolveSender(msg);
    lines.push(sender);
    lines.push(_toPlainText(msg.content));
    lines.push("---------------------------");
  }
  return lines.join("\n");
}

/**
 * 解析消息发送者显示名
 * @param {ChatMessage} msg 聊天消息
 * @returns {string} 发送者名
 */
function _resolveSender(msg) {
  // 1) 说话者显示名（角色名 / alias，与 Foundry 聊天渲染一致：扮演消息显示角色名）
  if (msg.speaker?.alias) return msg.speaker.alias;
  // 2) 作者账号名：v11 的 user 字段内嵌完整 User 文档（也可能为 id 字符串，两种都兼容）
  const userDoc = typeof msg.user === "string" ? game.users.get(msg.user) : msg.user;
  const authorName = userDoc?.name || msg.author?.name;
  if (authorName) return authorName;
  // 3) 说话者名
  if (msg.speaker?.name) return msg.speaker.name;
  // 4) 兑底
  return "未知";
}

/**
 * 判断消息是否应进入导出
 * @param {ChatMessage} msg 聊天消息
 * @returns {boolean} true=包含；false=跳过
 */
function _shouldInclude(msg) {
  // 空内容/纯空白（载体消息）跳过
  if (!msg || !msg.content || !String(msg.content).trim()) return false;
  // 耳语（私密对话）不进入公共导出
  if (msg.whisper?.length) return false;
  // 渲染时被隐藏的 D35E 载体消息跳过（双保险）
  for (const key of HIDDEN_FLAG_KEYS) {
    if (msg.getFlag("D35E", key)) return false;
  }
  // 检定页内容不导出：只保留聊天页（普通聊天 + 法术描述 + 普通骰子摘要）
  if (_isRollTabMessage(msg)) return false;
  return true;
}

/**
 * 判断消息是否属于「检定页」（与双页聊天框 chatTabs 分类逻辑一致）
 * @param {ChatMessage} msg 聊天消息
 * @returns {boolean} true=检定页消息（导出时跳过）
 */
function _isRollTabMessage(msg) {
  // 1) flags.template 精确判断（D35E 卡创建时固化模板路径）
  const template = msg.flags?.D35E?.template || "";
  const t = template ? String(template).split("/").pop() : "";
  if (t && ROLL_TEMPLATES.has(t)) return true;
  // 2) content 特征兑底（历史消息无 flags.template）：
  //    D35E 检定卡（chat-card 且含骰子/按钮/表单）→ 仅检定页；普通骰子两页都有 → 保留（聊天页有摘要）
  const html = msg.content || "";
  const isCard = html.includes("chat-card");
  const isRoll = html.includes("dice-roll") || /data-action=/.test(html) || html.includes('name="formula"');
  return isCard && isRoll;
}

/**
 * 将消息 HTML 内容转换为纯文本（去标签、压缩连续空行）
 * @param {string} html 消息 content（HTML）
 * @returns {string} 纯文本
 */
function _toPlainText(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * 生成中文导出时间（例：2026年08月20日 18时43分）
 * @returns {string} 中文时间文本
 */
function _formatNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}年${p(d.getMonth() + 1)}月${p(d.getDate())}日 ${p(d.getHours())}时${p(d.getMinutes())}分`;
}

/**
 * 将文本作为 .txt 文件下载（UTF-8）
 * @param {string} text 导出文本
 */
function _downloadText(text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `聊天记录_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
