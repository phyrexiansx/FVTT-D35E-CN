/**
 * [D35E] 角色卡物品拖拽视觉增强（HTML5 拖拽的平滑预览与目标反馈）
 *
 * 说明：不改动数据转移逻辑（drop 仍由各目标既有处理器完成，如文件夹归组、
 *      列表排序、拖出分享等），只在视觉层做增强：
 *  - 拖拽预览卡：setDragImage 生成「图标+名称」悬浮卡，替代默认整行半透明截图
 *  - 源行反馈：被拖行半透明浮起（d35e-item-dragging）
 *  - 文件夹反馈：拖入文件夹时虚线高亮（.drag-over），折叠中的文件夹自动展开
 *  - 排序反馈：拖到其他物品行时高亮目标行，并按鼠标位置显示上/下插入指示线
 *  - 结束清理：dragend/drop 统一移除所有临时类与预览元素
 */

/** 源行拖拽中类名 */
const DRAGGING_CLASS = "d35e-item-dragging";
/** 预览卡类名 */
const PREVIEW_CLASS = "d35e-item-preview";
/** 排序目标行类名 */
const TARGET_CLASS = "d35e-drop-target";
/** 插入位置：目标行上方 */
const BEFORE_CLASS = "d35e-drop-before";
/** 插入位置：目标行下方 */
const AFTER_CLASS = "d35e-drop-after";
/** 预览卡通用图标类名（无图标时用 d20 兜底） */
const GENERIC_ICON_CLASS = "d35e-item-preview-generic";
/** 文件夹高亮类名（与模板 drop 处理器共用） */
const FOLDER_OVER_CLASS = "drag-over";

/** 当前拖拽状态（模块级，一次只拖一条） */
let _dragState = null;

/**
 * 绑定拖拽视觉增强（每张角色卡激活时调用，幂等）
 * 说明：dragstart 必须直接绑到每个可拖行——核心 DragDrop 在写入 dataTransfer 后
 *      会 stopPropagation（委托监听收不到）；同元素的其他监听不受影响。
 *      dragover/dragend 无拦截，可用根节点委托。
 * @param {jQuery} html 已渲染的角色卡 HTML
 */
export function setupItemDragPreview(html) {
  // 浏览器不支持自定义拖拽图时直接跳过（极老内核）
  if (typeof DataTransfer === "undefined" || !DataTransfer.prototype.setDragImage) return;
  html.off(".d35eDrag");
  // 拖拽开始：直接绑定（核心 stopPropagation 不影响同元素监听）
  html.find("li.item, li.skill").each((_i, li) => {
    li.addEventListener("dragstart", _onDragStartVisual);
  });
  // 目标标记：委托监听（注意 jQuery 委托先于直接绑定执行，故不在直接绑定里做清理）
  html.on("dragover.d35eDrag", ".feature-folder, li.item, li.skill", _onDragOverVisual);
  // 移出目标：清除高亮（移到非目标区时没有后续 dragover，靠 dragleave 收尾）
  html.on("dragleave.d35eDrag", ".feature-folder, li.item, li.skill", _onDragLeaveVisual);
  // 拖拽结束（无论成功与否都会在源行触发，冒泡到根）：统一清理
  html.on("dragend.d35eDrag", _onDragEndVisual);
}

/**
 * [§83]当前拖拽的源行是否位于专长/特性文件夹内（供文件夹 drop 处理器判断是否放行排序）
 * @returns {boolean}
 */
export function isDragSourceInFolder() {
  return !!_dragState?.sourceInFolder;
}

/**
 * 拖拽开始：生成预览卡并设为拖拽图，源行加浮起样式
 * @param {DragEvent} ev 原生拖拽事件（addEventListener 直接绑定）
 */
function _onDragStartVisual(ev) {
  const li = ev.currentTarget;
  // 清理上一次可能残留的视觉状态
  _cleanupVisuals();
  const preview = _buildPreview(li);
  // 用预览卡替换默认整行截图（偏移指向图标左上角）；兼容 jQuery 包装事件
  const dataTransfer = ev.originalEvent?.dataTransfer || ev.dataTransfer;
  if (dataTransfer?.setDragImage) dataTransfer.setDragImage(preview, 24, 12);
  li.classList.add(DRAGGING_CLASS);
  // [§83]记录源行是否在专长/特性文件夹内（文件夹内拖动到内部行时放行给核心排序）
  _dragState = { source: li, preview, target: null, sourceInFolder: !!li.closest(".feature-folder") };
}

/**
 * 拖拽移动：清除上一个目标高亮，再按指针位置标记新目标（文件夹优先）
 * @param {Event} ev jQuery 拖拽事件
 */
function _onDragOverVisual(ev) {
  if (!_dragState) return;
  _clearTargetHighlight();
  const t = ev.target;
  // [§83]物品/技能行优先（含文件夹内部行）：按指针垂直位置决定插入线（上/下），支持文件夹内排序反馈
  const rowEl = t.closest ? t.closest("li.item, li.skill") : null;
  if (rowEl && !rowEl.classList.contains("inventory-header")) {
    const rect = rowEl.getBoundingClientRect();
    const before = ev.clientY < rect.top + rect.height / 2;
    rowEl.classList.add(TARGET_CLASS);
    rowEl.classList.add(before ? BEFORE_CLASS : AFTER_CLASS);
    _dragState.target = rowEl;
    return;
  }
  // 文件夹（非行区域，如头部/空白）：整块视为文件夹目标，虚线高亮并自动展开
  const folderEl = t.closest ? t.closest(".feature-folder") : null;
  if (folderEl) {
    folderEl.classList.add(FOLDER_OVER_CLASS);
    _expandCollapsedFolder(folderEl);
    _dragState.target = folderEl;
  }
}

/**
 * 移出目标：仅当离开的是当前高亮目标时清除高亮
 * @param {Event} ev jQuery 拖拽事件
 */
function _onDragLeaveVisual(ev) {
  if (!_dragState) return;
  if (_dragState.target === ev.currentTarget) _clearTargetHighlight();
}

/**
 * 拖拽结束：统一清理所有临时视觉状态
 */
function _onDragEndVisual() {
  _cleanupVisuals();
}

/**
 * 生成拖拽预览卡（固定在屏幕外，仅作 setDragImage 快照源）
 * @param {HTMLElement} li 被拖行元素
 * @returns {HTMLElement} 预览卡元素
 */
function _buildPreview(li) {
  const card = document.createElement("div");
  card.className = PREVIEW_CLASS;
  // 图标：优先复用源行 .item-image 的背景图，否则 d20 兜底
  const icon = document.createElement("div");
  icon.className = "d35e-item-preview-icon";
  const img = li.querySelector(".item-image");
  if (img && img.style.backgroundImage) {
    icon.style.backgroundImage = img.style.backgroundImage;
  } else {
    icon.classList.add(GENERIC_ICON_CLASS);
  }
  // 名称：取行内 h4 文本
  const name = document.createElement("div");
  name.className = "d35e-item-preview-name";
  name.textContent = (li.querySelector("h4")?.textContent || "").trim() || li.dataset.itemId || "物品";
  card.append(icon, name);
  document.body.appendChild(card);
  return card;
}

/**
 * 清除当前目标高亮（文件夹描边 / 物品行指示线）
 */
function _clearTargetHighlight() {
  const t = _dragState?.target;
  if (t) t.classList.remove(TARGET_CLASS, BEFORE_CLASS, AFTER_CLASS, FOLDER_OVER_CLASS);
  if (_dragState) _dragState.target = null;
}

/**
 * 折叠中的文件夹被拖入时自动展开，并持久化展开状态
 * @param {HTMLElement} folderEl 文件夹行元素
 */
function _expandCollapsedFolder(folderEl) {
  if (!folderEl.classList.contains("collapsed")) return;
  folderEl.classList.remove("collapsed");
  // 同步展开图标（与折叠按钮一致：fa-caret-right → fa-caret-down）
  const icon = folderEl.querySelector(".feature-folder-toggle i");
  if (icon) icon.classList.replace("fa-caret-right", "fa-caret-down");
  // 持久化到 localStorage（与 _onFeatureFolderToggle 共用键）
  const section = folderEl.dataset.section || "feat";
  const actorId = _getActorId(folderEl);
  if (!actorId) return;
  const key = `d35e.featureFolders.${actorId}.${section}`;
  try {
    const states = JSON.parse(localStorage.getItem(key) || "{}");
    states[folderEl.dataset.folder] = false;
    localStorage.setItem(key, JSON.stringify(states));
  } catch (e) {
    /* 忽略存储异常 */
  }
}

/**
 * 从元素向上解析所属角色的 id（经 window-app 找到应用实例）
 * @param {HTMLElement} el 卡片内任意元素
 * @returns {string|null} 角色 id
 */
function _getActorId(el) {
  const appEl = el.closest(".window-app");
  const app = appEl ? ui.windows[appEl.dataset.appid] : null;
  return app?.actor?.id || null;
}

/**
 * 清理全部拖拽视觉状态（源行样式、预览卡、目标高亮）
 */
function _cleanupVisuals() {
  if (_dragState?.source) _dragState.source.classList.remove(DRAGGING_CLASS);
  _clearTargetHighlight();
  if (_dragState?.preview) _dragState.preview.remove();
  _dragState = null;
}
