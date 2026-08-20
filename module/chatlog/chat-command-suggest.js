/**
 * [D35E]聊天命令建议：聊天输入框以 "/" 开头时弹出可用命令选项
 * 说明：
 * - 命令表与 narrator-tools 对齐（/narrate 旁白、/desc 描述、/note 笔记、/as 扮演）
 * - 按 narrator-tools 的权限设置（PERMNarrate/PERMDescribe/PERMAs）过滤可见项
 * - 交互：↓/↑ 移动高亮，Tab 选择填入，Esc 关闭；Enter 保留原发送行为
 * - 委托绑定在 #chat 上，聊天侧栏重建时无需重新绑定
 */

/**命令表：cmd 为填入命令，label 为中文说明，permKey 为 narrator-tools 权限设置 key */
const COMMANDS = [
  { cmd: "/narrate", label: "旁白（全屏居中文本）", permKey: "PERMNarrate" },
  { cmd: "/desc", label: "描述（描述卡）", permKey: "PERMDescribe" },
  { cmd: "/note", label: "笔记（仅 GM 可见）", permKey: "PERMDescribe" },
  { cmd: "/as", label: "扮演（以其他身份发言）", permKey: "PERMAs" },
];

/**当前建议状态 */
let _state = null;

/**
 * 绑定聊天输入框命令建议（幂等：只绑定一次，委托在 #chat 上）
 * 说明：v11 聊天输入框为 textarea#chat-message，#chat 容器在侧栏中常驻
 */
export function registerChatCommandSuggest() {
  if (window._d35eChatSuggestBound) return;
  window._d35eChatSuggestBound = true;
  const chat = document.getElementById("chat");
  if (!chat) return;
  chat.addEventListener("input", _onInput);
  chat.addEventListener("keydown", _onKeydown);
  chat.addEventListener("blur", _onBlur, true);
}

/**按权限过滤当前用户可用命令 */
function _available() {
  return COMMANDS.filter((c) => {
    try {
      return game.user.role >= game.settings.get("narrator-tools", c.permKey);
    } catch (e) {
      return true; // 设置读取失败时全部可用
    }
  });
}

/**输入变化：以 "/" 开头且为未完成单词时显示建议 */
function _onInput(e) {
  const input = e.target;
  if (!input || input.id !== "chat-message") return;
  const val = input.value || "";
  const m = val.match(/^\/([a-zA-Z]*)$/);
  if (!m) {
    _hide();
    return;
  }
  const q = m[1].toLowerCase();
  const list = _available().filter((c) => c.cmd.slice(1).startsWith(q));
  if (!list.length) {
    _hide();
    return;
  }
  _render(input, list);
}

/**键盘交互：↓/↑ 移动高亮，Tab 选择，Esc 关闭 */
function _onKeydown(e) {
  const t = e.target;
  if (!t || t.id !== "chat-message" || !_state) return;
  const { ul, list, active } = _state;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    _setActive(ul, Math.min(active + 1, list.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    _setActive(ul, Math.max(active - 1, 0));
  } else if (e.key === "Tab") {
    e.preventDefault();
    _apply(t, list[_state.active].cmd);
  } else if (e.key === "Escape") {
    _hide();
  }
}

/**失焦延迟关闭（给点击留时间，选择用 mousedown 先于 blur 触发） */
function _onBlur(e) {
  if (e.target && e.target.id === "chat-message") setTimeout(_hide, 150);
}

/**渲染建议下拉（挂在输入框所在表单顶部） */
function _render(input, list) {
  const box = input.closest("#chat-form");
  if (!box) {
    _hide();
    return;
  }
  let ul = box.querySelector(".d35e-command-suggest");
  if (!ul) {
    ul = document.createElement("ul");
    ul.className = "d35e-command-suggest";
    box.prepend(ul);
  }
  ul.innerHTML = "";
  list.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = i === 0 ? "d35e-cs-active" : "";
    li.innerHTML = `<span class="d35e-cs-cmd">${c.cmd}</span><span class="d35e-cs-label">${c.label}</span>`;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault(); // 避免输入框失焦
      _apply(input, c.cmd);
    });
    li.addEventListener("mouseenter", () => _setActive(ul, i));
    ul.appendChild(li);
  });
  _state = { input, ul, list, active: 0 };
}

/**设置高亮项 */
function _setActive(ul, i) {
  [...ul.children].forEach((li, j) => li.classList.toggle("d35e-cs-active", j === i));
  if (_state) _state.active = i;
}

/**填入命令并聚焦输入框 */
function _apply(input, cmd) {
  input.value = cmd + " ";
  _hide();
  input.focus();
}

/**隐藏并清空状态 */
function _hide() {
  if (_state && _state.ul) _state.ul.remove();
  _state = null;
}
