/**
 * [D35E] GM 聊天消息拖拽排序（菠萝风格：左上角手柄 + 平滑让位动画）
 *
 * 交互：GM 悬停消息 → 左上角出现拖拽手柄；按住手柄上下拖动 →
 *      被拖消息平滑"抽出"跟随鼠标（transform 平移，浮起高亮），
 *      其他消息因空位平滑填充、被拖消息靠近时平滑"挤开"（transform + transition 让位）；
 *      只有松手时落在聊天栏内才提交（持久化 timestamp/sort + 广播），
 *      落在聊天栏外或按 Esc → 取消还原（transform 清零，DOM 从未改动，天然还原）。
 *
 * 机制：v11 聊天渲染顺序由 game.messages（Map 插入顺序）决定，sort 字段不参与渲染，
 *      timestamp 仅用于显示。拖拽期间只操作 DOM transform（纯视觉预览，不动 DOM 顺序）；
 *      提交时一次性把被拖消息插入最终位置，并：
 *  1. 更新文档 timestamp/sort（持久化 + 时间显示与位置一致）
 *  2. 本地重排 game.messages collection（delete + set 按新顺序）
 *  3. 通过 whisper 通道广播新顺序给其他活跃客户端（module.* socket 消息会被 core 丢弃）
 * 广播载体消息与借机提示一样：content 为空 + flags，渲染时隐藏，不产生聊天痕迹。
 */

/** 广播载体消息的 flags 键名 */
const FLAG = "chatReorder";

/** 聊天日志容器选择器（含弹出聊天窗口） */
const LOG_SELECTOR = ["#chat-log", "#chat-log-popout"];

/** 拖拽手柄选择器（消息左上角） */
const HANDLE_SELECTOR = ".d35e-chat-handle";

/** 让位动画过渡时长（毫秒） */
const SHIFT_DURATION = 180;

/** 当前拖拽状态（模块级，一次只拖一条） */
let _dragState = null;

/**
 * 注册聊天拖拽功能（ready 时调用）
 * 说明：注入手柄（仅 GM）+ 指针事件委托 + 广播通道 hooks + 历史消息手柄补注。
 */
export function registerChatDrag() {
  _patchPostOneScroll();
  _bindHandleHooks();
  _bindPointerEvents();
  _bindChannelHooks();
  // 历史消息在 ready 前已渲染（hook 会错过）：主动注入一次手柄
  _injectHandles($("#chat"));
}

/**
 * patch ChatLog.postOne：广播载体消息 post 后不改变滚动位置
 * 说明：载体消息创建会触发核心 scrollBottom（自动滚底），打扰用户阅读长聊天；
 *      这里记录 post 前的滚动位置并在 post 后恢复（GM 端与接收端同时生效）。
 */
function _patchPostOneScroll() {
  const proto = ChatLog.prototype;
  if (proto.postOne.__d35eReorderPatched) return;
  proto.postOne.__d35eReorderPatched = true;
  const orig = proto.postOne;
  proto.postOne = async function (message, notify, create) {
    const isCarrier = !!message?.getFlag?.("D35E", FLAG);
    if (!isCarrier) return orig.call(this, message, notify, create);
    // 记录所有聊天容器（主日志 + 弹出窗口）的滚动位置
    const scrolls = [...document.querySelectorAll(LOG_SELECTOR.join(","))];
    const tops = scrolls.map((s) => [s, s.scrollTop]);
    await orig.call(this, message, notify, create);
    // postOne 内部的 scrollBottom 已滚动到底，这里还原
    for (const [s, t] of tops) s.scrollTop = t;
  };
}

/**
 * 绑定手柄注入 hooks（仅 GM）
 * 说明：聊天日志整体渲染或单条消息渲染时，给消息注入左上角拖拽手柄（幂等）。
 */
function _bindHandleHooks() {
  Hooks.on("renderChatLog", (_app, html) => {
    _injectHandles(html);
  });
  Hooks.on("renderChatMessage", (_message, html) => {
    _injectHandles(html);
  });
}

/**
 * 给消息元素注入拖拽手柄（仅 GM，幂等）
 * 说明：手柄插在消息左上角（CSS 绝对定位），按住手柄才可拖动，不影响消息内容操作。
 * @param {jQuery} html 消息或日志的 jQuery 对象
 */
function _injectHandles(html) {
  if (!game.user.isGM) return;
  const $m = html && html.find ? html : $(html);
  $m.find(".message").addBack(".message").each((_i, el) => {
    const $el = $(el);
    if ($el.find(HANDLE_SELECTOR).length) return;
    $el.prepend(`<span class="d35e-chat-handle" draggable="false"><i class="fas fa-grip-vertical"></i></span>`);
  });
}

/**
 * 绑定指针拖拽事件（事件委托）
 * 说明：pointerdown 委托到手柄元素；pointermove/pointerup/pointercancel 监听在 document
 *      （拖出消息也能跟手）；Esc 取消拖拽。仅 GM 生效（handler 内二次校验）。
 */
function _bindPointerEvents() {
  $(document).off(".d35eChatDrag");
  // 手柄按下：开始拖拽（委托到手柄，currentTarget 为手柄元素）
  $(document).on("pointerdown.d35eChatDrag", HANDLE_SELECTOR, _onHandleDown);
  // 拖拽过程：document 级监听（实时预览/提交/取消）
  $(document).on("pointermove.d35eChatDrag", _onDragMove);
  $(document).on("pointerup.d35eChatDrag", _onDragUp);
  $(document).on("pointercancel.d35eChatDrag", _onDragCancel);
  // Esc 取消拖拽
  $(document).on("keydown.d35eChatDrag", _onKeyDown);
}

/**
 * 绑定消息通道 hooks（广播载体的隐藏 + 接收端重排）
 */
function _bindChannelHooks() {
  // 广播载体消息：渲染时隐藏（与 aooPrompt 一致，不产生聊天痕迹）
  Hooks.on("renderChatMessage", (message, html) => {
    if (message.getFlag("D35E", FLAG)) html.hide();
  });
  // 接收端：收到其他客户端发来的新顺序，执行同样的本地重排
  Hooks.on("createChatMessage", (message) => {
    const data = message.getFlag("D35E", FLAG);
    if (!data?.ids?.length) return;
    applyReorder(data.ids);
  });
}

/**
 * 手柄按下：开始拖拽（仅 GM，左键/触摸）
 * @param {Event} ev jQuery 指针事件
 */
function _onHandleDown(ev) {
  if (!game.user.isGM) return;
  if (ev.button !== 0 && ev.pointerType !== "touch") return;
  const el = ev.currentTarget.closest(".message");
  if (!el?.dataset?.messageId) return;
  ev.preventDefault();
  // 记录拖拽状态：被拖消息、按下 Y、消息高度、起始插入点
  _dragState = {
    msgId: el.dataset.messageId,
    el,
    height: el.getBoundingClientRect().height,
    startY: ev.clientY,
    oriIndex: _getMessageIndex(el), // 原插入点（el 前面有几条其他消息）
    overIndex: _getMessageIndex(el), // 当前插入点（初始 = 原位置）
    moved: false,
  };
  el.classList.add("d35e-chat-dragging");
  _clearShifts();
}

/**
 * 指针移动：更新拖拽预览（被拖消息跟随 + 其他消息平滑让位）
 * @param {Event} ev jQuery 指针事件
 */
function _onDragMove(ev) {
  if (!_dragState) return;
  ev.preventDefault();
  const moved = Math.abs(ev.clientY - _dragState.startY) > 4; // 忽略微小抖动
  if (!moved) return;
  _dragState.moved = true;
  _updateDragPreview(ev.clientY);
}

/**
 * 指针抬起：落在聊天栏内 → 提交；否则取消还原
 * @param {Event} ev jQuery 指针事件
 */
function _onDragUp(ev) {
  if (!_dragState) return;
  if (!_dragState.moved) {
    _cleanupDrag();
    return;
  }
  if (!_isInsideChatLog(ev.clientX, ev.clientY)) {
    // 放在聊天栏外：不是有效改动 → 取消还原
    _cancelDrag();
    return;
  }
  const state = _dragState;
  // 1) 把被拖消息 DOM 插入最终位置（视觉上 transform 清零即落位，无跳变）
  _insertElAt(state.el, state.overIndex);
  // 2) 清除所有让位/跟随 transform
  _clearTransforms();
  _cleanupDrag();
  // 3) 持久化 + 广播（按当前 DOM 顺序）
  _commitReorder(state.msgId);
}

/**
 * 指针取消 / 拖拽中断：还原（transform 清零，DOM 从未改动）
 */
function _onDragCancel() {
  if (!_dragState) return;
  _cancelDrag();
}

/**
 * Esc 取消拖拽
 * @param {Event} ev jQuery 键盘事件
 */
function _onKeyDown(ev) {
  if (!_dragState || ev.key !== "Escape") return;
  _cancelDrag();
}

/**
 * 更新拖拽预览：
 * 1. 被拖消息 transform 跟随鼠标（瞬时跟手）
 * 2. 计算当前插入点，让区间内其他消息以 transform + transition 平滑让位（挤开/填充）
 * @param {number} clientY 鼠标当前 Y
 */
function _updateDragPreview(clientY) {
  const { el, height, startY } = _dragState;
  // 被拖消息跟随（相对按下位置平移；不加 transition，保持跟手）
  el.style.transform = `translate(0, ${clientY - startY}px)`;
  // 计算插入点：被拖消息视觉中心 vs 其他消息中心
  const visualCenter = el.getBoundingClientRect().top + height / 2;
  const siblings = _getSiblingMessages(el);
  let over = siblings.length;
  for (let i = 0; i < siblings.length; i++) {
    const r = siblings[i].getBoundingClientRect();
    if (visualCenter <= r.top + r.height / 2) {
      over = i;
      break;
    }
  }
  if (over === _dragState.overIndex) return;
  _dragState.overIndex = over;
  _applyShifts(siblings, over);
}

/**
 * 让位动画：给"被拖消息原位置与插入点之间"的消息设置位移 transform（带 transition 平滑过渡）
 * 说明：向下拖 → 区间内消息上移（空位填充）；向上拖 → 区间内消息下移（被挤开）。
 * @param {HTMLElement[]} siblings 除被拖消息外的消息元素（按 DOM 顺序）
 * @param {number} over 新的插入点（在 siblings 中的位置）
 */
function _applyShifts(siblings, over) {
  const { height, oriIndex: ori } = _dragState;
  if (ori === -1) return;
  const lo = Math.min(ori, over);
  const hi = Math.max(ori, over);
  siblings.forEach((s, i) => {
    if (i >= lo && i < hi) {
      // 区间内：向被拖消息让出的方向平移一个消息高度
      const dir = over > ori ? -1 : 1; // 向下拖：上移填洞；向上拖：下移被挤
      s.style.transform = `translate(0, ${dir * height}px)`;
      s.classList.add("d35e-chat-shift");
    } else {
      s.style.transform = "";
      s.classList.remove("d35e-chat-shift");
    }
  });
}

/**
 * 清除所有消息的让位 transform（拖拽开始/结束时调用）
 */
function _clearShifts() {
  for (const selector of LOG_SELECTOR) {
    const log = document.querySelector(selector);
    if (!log) continue;
    log.querySelectorAll(".message").forEach((s) => {
      s.style.transform = "";
      s.classList.remove("d35e-chat-shift");
    });
  }
}

/**
 * 清除全部拖拽相关 transform（被拖消息跟随 + 其他消息让位）
 */
function _clearTransforms() {
  const { el } = _dragState;
  if (el) el.style.transform = "";
  _clearShifts();
}

/**
 * 把消息元素插入到指定插入点（siblings 数组视角）
 * @param {HTMLElement} el 被拖消息元素
 * @param {number} index 插入点（不含 el 的消息列表中的位置）
 */
function _insertElAt(el, index) {
  const log = el.closest(LOG_SELECTOR.join(","));
  if (!log) return;
  const siblings = _getSiblingMessages(el);
  if (index <= 0) log.insertBefore(el, siblings[0] || null);
  else if (index >= siblings.length) log.appendChild(el);
  else log.insertBefore(el, siblings[index]);
}

/**
 * 获取某消息在全部消息中的插入点（=它前面有几条消息）
 * @param {HTMLElement} el 消息元素
 * @returns {number} 插入点下标
 */
function _getMessageIndex(el) {
  const log = el.closest(LOG_SELECTOR.join(",")) || _getLogElement();
  if (!log) return 0;
  return Array.from(log.querySelectorAll(".message")).indexOf(el);
}

/**
 * 获取除指定消息外的所有消息元素（按 DOM 顺序）
 * @param {HTMLElement} el 被拖消息元素
 * @returns {HTMLElement[]}
 */
function _getSiblingMessages(el) {
  const log = el.closest(LOG_SELECTOR.join(",")) || _getLogElement();
  if (!log) return [];
  return Array.from(log.querySelectorAll(".message")).filter((m) => m !== el);
}

/**
 * 判断坐标是否在聊天栏内（落在聊天栏外不算有效改动）
 * @param {number} clientX 鼠标 X
 * @param {number} clientY 鼠标 Y
 * @returns {boolean}
 */
function _isInsideChatLog(clientX, clientY) {
  const log = _getLogElement();
  if (!log) return false;
  const r = log.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

/**
 * 提交拖拽结果：按当前 DOM 顺序持久化被拖消息的 timestamp/sort，并广播新顺序
 * @param {string} msgId 被拖消息 id
 */
async function _commitReorder(msgId) {
  const src = game.messages.get(msgId);
  if (!src) return;
  // 目标顺序：DOM 顺序 + collection 中未渲染的消息（保持原相对顺序，追加末尾）
  const domIds = _getDomOrder();
  const rest = game.messages.contents
    .filter((m) => !domIds.includes(m.id))
    .map((m) => m.id);
  const ids = [...domIds, ...rest];
  // 计算被拖消息的新 timestamp/sort（按新位置相邻消息的中间值）
  const { timestamp, sort } = _computeNewTimestampsByIds(ids, msgId, src);
  // 持久化（timestamp 与位置一致；sort 兼容未来版本排序）
  await src.update({ timestamp, sort });
  // 本地重排（collection + 时间显示）——DOM 已在提交时插入最终位置
  applyReorder(ids);
  // 广播新顺序给其他活跃客户端
  _broadcastReorder(ids);
}

/**
 * 取消拖拽：transform 清零（DOM 从未改动，消息自然回到原位）
 */
function _cancelDrag() {
  _clearTransforms();
  _cleanupDrag();
}

/**
 * 清理拖拽状态（还原消息样式）
 */
function _cleanupDrag() {
  if (_dragState?.el) {
    _dragState.el.classList.remove("d35e-chat-dragging");
  }
  _dragState = null;
}

/**
 * 获取聊天日志 DOM 容器（优先主日志）
 * @returns {HTMLElement|null}
 */
function _getLogElement() {
  return document.querySelector("#chat-log") || document.querySelector("#chat-log-popout");
}

/**
 * 读取当前 DOM 中所有消息 id（按 DOM 顺序）
 * @returns {string[]}
 */
function _getDomOrder() {
  const log = _getLogElement();
  if (!log) return [];
  return Array.from(log.querySelectorAll(".message")).map((el) => el.dataset.messageId);
}

/**
 * 计算被移动消息的新 timestamp 与 sort（按 id 顺序数组）
 * 说明：取新位置相邻消息的中间值；顶部 -1ms、底部 +1ms；相邻时间差过小时强制错开 1ms。
 * @param {string[]} ids 目标顺序的消息 id 列表
 * @param {string} msgId 被移动消息 id
 * @param {ChatMessage} src 被移动消息文档
 * @returns {{timestamp: number, sort: number}} 新的时间戳与排序值
 */
function _computeNewTimestampsByIds(ids, msgId, src) {
  const i = ids.indexOf(msgId);
  const prev = i > 0 ? game.messages.get(ids[i - 1]) : null;
  const next = i >= 0 && i < ids.length - 1 ? game.messages.get(ids[i + 1]) : null;
  let timestamp = src.timestamp;
  let sort = src.sort;
  if (!prev && next) {
    // 移到最顶部：早于下一条 1ms
    timestamp = next.timestamp - 1;
    sort = next.sort - 1;
  } else if (prev && !next) {
    // 移到最底部：晚于上一条 1ms
    timestamp = prev.timestamp + 1;
    sort = prev.sort + 1;
  } else if (prev && next) {
    // 夹在中间：取相邻中间值
    timestamp = prev.timestamp + Math.max(1, Math.floor((next.timestamp - prev.timestamp) / 2));
    sort = (prev.sort + next.sort) / 2;
  }
  return { timestamp, sort };
}

/**
 * 广播新顺序给所有活跃客户端
 * 说明：module.* socket 消息会被 core 丢弃，故复用 whisper + flags 通道；
 *      载体消息 content 为空，渲染时由 hook 隐藏。
 * @param {string[]} ids 新顺序的消息 id 列表
 */
function _broadcastReorder(ids) {
  const recipients = game.users.filter((u) => u.active).map((u) => u.id);
  if (!recipients.length) return;
  ChatMessage.create({
    whisper: recipients,
    content: "",
    speaker: { alias: "" },
    flags: { D35E: { [FLAG]: { ids } } },
  });
}

/**
 * 本地重排入口（GM 端与接收端共用）
 * 说明：按新顺序依次重建 collection、移动 DOM、刷新时间显示。
 * @param {string[]} ids 新顺序的消息 id 列表
 */
function applyReorder(ids) {
  _reorderCollection(ids);
  _reorderDom(ids);
  _refreshTimestamps(ids);
}

/**
 * 重排 collection（Map 插入顺序 = 渲染顺序）
 * @param {string[]} ids 新顺序的消息 id 列表
 */
function _reorderCollection(ids) {
  for (const id of ids) {
    const doc = game.messages.get(id);
    if (doc) {
      game.messages.delete(id);
      game.messages.set(id, doc);
    }
  }
}

/**
 * 重排聊天 DOM（按新顺序 append，保持滚动位置）
 * @param {string[]} ids 新顺序的消息 id 列表
 */
function _reorderDom(ids) {
  for (const selector of LOG_SELECTOR) {
    const container = document.querySelector(selector);
    if (!container) continue;
    for (const id of ids) {
      const el = container.querySelector(`.message[data-message-id="${id}"]`);
      if (el) container.appendChild(el);
    }
  }
}

/**
 * 刷新被移动消息的时间显示（与更新后的 timestamp 一致）
 * @param {string[]} ids 新顺序的消息 id 列表
 */
function _refreshTimestamps(ids) {
  for (const id of ids) {
    const doc = game.messages.get(id);
    if (!doc?.timestamp) continue;
    for (const selector of LOG_SELECTOR) {
      const el = document.querySelector(`${selector} .message[data-message-id="${id}"]`);
      const stamp = el?.querySelector(".message-timestamp");
      if (stamp) stamp.textContent = foundry.utils.timeSince(doc.timestamp);
    }
  }
}
