/**
 * D35E 系统合并mod加载器（逐步合并中，当前启用：chatedit, socketlib, drag-ruler）
 * 原独立mod复制自 Data/modules，设置统一注册到 "D35E" 命名空间（键前缀 <modid>- 防冲突）。
 * ⚠️ 请勿同时启用 Data/modules 下的原模块（会双重加载）。
 */

// socketlib 必须先加载（init 时设置 window.socketlib 全局，供 drag-ruler 等使用）
import "./socketlib/src/socketlib.js";
import "./chatedit/chatedit.mjs";
import "./drag-ruler/src/main.js";

Hooks.once("init", () => {
  // 注入各mod的CSS
  const STYLES = [
    "systems/D35E/module/mods/chatedit/chatedit.css",
  ];
  for (const href of STYLES) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;
    document.head.appendChild(link);
  }

  console.log("D35E | 已合并加载mod：socketlib, chatedit, drag-ruler");
});
