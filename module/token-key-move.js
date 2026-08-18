// ==================== 方向键逐格平滑移动（RPG Maker 风格） ====================
// 默认关闭：保持 Foundry 原"按住方向键逐格移动"行为（首键按下后需等待系统按键重复延迟）。
// 开启后：
//  - 按方向键立即走一格（带动画），之后每 STEP_MS 毫秒自动走下一格（跳过系统重复延迟，无停顿）；
//  - 以方格为单位移动（每次一格 = grid.size），移动途中可按新方向键，走完当前格后立即转向（取最后按下的方向）；
//  - 松开/失焦即停；输入框（聊天/表单等）内不拦截。

const SETTING = { smooth: "smoothKeyMove" };
const STEP_MS = 260; // 每格步进间隔（含单格移动动画）
const ANIM_MS = 250; // 单格移动动画时长（与 Foundry 默认 token 移动动画一致）

let _dirOrder = []; // 按按下顺序记录方向键（最后一个=当前方向）
let _timer = null;

Hooks.once("init", () => {
  game.settings.register("D35E", SETTING.smooth, {
    name: "方向键平滑移动",
    hint: "按住方向键移动选中 Token 时，跳过系统按键重复延迟，以方格为单位连续移动（RPG Maker 风格：每格一个移动动画，途中可转向）。默认关闭=保持原逐格移动行为。",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
});

function _isTypingTarget(e) {
  const t = e.target;
  if (!t) return false;
  const tag = t.tagName || "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!t.isContentEditable;
}

function _step() {
  if (!canvas?.tokens || !canvas.tokens.controlled?.length) {
    _stop();
    return;
  }
  const key = _dirOrder[_dirOrder.length - 1];
  if (!key) return;
  const g = canvas.scene?.grid?.size || 100;
  let dx = 0;
  let dy = 0;
  if (key === "ArrowLeft") dx = -1;
  else if (key === "ArrowRight") dx = 1;
  else if (key === "ArrowUp") dy = -1;
  else if (key === "ArrowDown") dy = 1;
  for (const t of canvas.tokens.controlled) {
    // 目标位置 = 当前格 + 一格，并吸附到网格（保证以方格为单位移动）
    let nx = t.document.x + dx * g;
    let ny = t.document.y + dy * g;
    if (canvas.grid) {
      const snapped = canvas.grid.getSnappedPosition(nx, ny);
      nx = snapped.x;
      ny = snapped.y;
    }
    t.document
      .update({ x: nx, y: ny }, { animation: { duration: ANIM_MS } })
      .catch(() => {});
  }
}

function _start() {
  if (_timer) return;
  _timer = setInterval(_step, STEP_MS);
}

function _stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

function _onKeyDown(e) {
  if (!game.settings.get("D35E", SETTING.smooth)) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  if (_isTypingTarget(e)) return;
  if (!canvas?.tokens || !canvas.tokens.controlled?.length) return;
  e.preventDefault();
  e.stopPropagation();
  // 新方向移到队尾（成为当前方向）；重复按下同一方向无变化
  _dirOrder = _dirOrder.filter((k) => k !== e.key);
  _dirOrder.push(e.key);
  if (!_timer) _step(); // 按下立即走一格
  _start();
}

function _onKeyUp(e) {
  _dirOrder = _dirOrder.filter((k) => k !== e.key);
  if (!_dirOrder.length) _stop();
}

// capture 阶段抢先拦截，阻断 Foundry 默认的方向键逐格移动
window.addEventListener("keydown", _onKeyDown, { capture: true });
window.addEventListener("keyup", _onKeyUp, { capture: true });
window.addEventListener("blur", () => {
  _dirOrder = [];
  _stop();
});
