// ==================== Monk's Little Details 精选功能内置（D35E） ====================
// 移植自 monks-little-details（IronMonk，MIT 许可），选取 4 个功能：
// 1) 暂停时限制移动（CSS 遮罩阻止点击）
// 2) 隐形 Token 替换图像（invisible.svg 图标）
// 3) 模组库查看原画（场景模组库点击条目弹窗大图）
// 4) 批量更新图像（按文件夹文件名批量匹配更新模组库 Actor 头像/Token 图像）
import { UpdateImages } from "./update-images.js";

const NS = "D35E";
const BASE = "systems/D35E/module/mods/monks-little-details/";
const S = {
  movePause: "mldMovePause",
  invisible: "mldInvisibleImage",
  viewArtwork: "mldViewArtwork",
  updateImages: "mldUpdateImages",
};

const setting = (key) => game.settings.get(NS, key);

/* ---------------- 设置注册 ---------------- */
Hooks.once("init", () => {
  game.settings.register(NS, S.movePause, {
    name: "暂停时限制移动",
    hint: "暂停游戏时用暂停遮罩覆盖屏幕，阻止 token 移动（Monk's Little Details 移植）。",
    scope: "world", config: true, type: String, default: "none",
    choices: { none: "不限制", players: "限制玩家（GM 不受限）", all: "限制所有人" },
  });
  game.settings.register(NS, S.invisible, {
    name: "隐形 Token 替换图像",
    hint: "隐形 Token 显示替换图标（invisible.svg），而非默认隐形图标。",
    scope: "world", config: true, type: Boolean, default: true,
  });
  game.settings.register(NS, S.viewArtwork, {
    name: "模组库查看原画",
    hint: "场景模组库中点击条目名称，直接弹窗查看场景原画大图。",
    scope: "world", config: true, type: Boolean, default: true,
  });
  game.settings.registerMenu(NS, S.updateImages, {
    name: "批量更新图像",
    label: "批量更新图像",
    hint: "从文件夹按文件名批量匹配，更新模组库 Actor 的头像/Token 图像（Monk's Little Details 移植）。",
    icon: "fas fa-image",
    restricted: true,
    type: UpdateImages,
  });
});

/* ---------------- 暂停时限制移动（CSS 遮罩） ---------------- */
function _applyPauseCss() {
  let style = document.getElementById("d35e-mld-pause-css");
  if (!style) {
    style = document.createElement("style");
    style.id = "d35e-mld-pause-css";
    document.head.appendChild(style);
  }
  const v = setting(S.movePause);
  style.textContent = (v === "all" || (v === "players" && !game.user.isGM))
    ? `#pause { bottom: 30%; } #pause img { top: -100px; left: calc(50% - 150px); height: 300px; width: 300px; opacity: 0.3; }`
    : "";
}

Hooks.on("ready", () => {
  if (setting(S.invisible)) CONFIG.controlIcons.visibility = BASE + "icons/invisible.svg";
  _applyPauseCss();
});

// 设置变化即时生效（无需重载）
Hooks.on("updateSetting", (settingDoc) => {
  if (settingDoc.key !== NS + "." + S.movePause && settingDoc.key !== NS + "." + S.invisible) return;
  if (settingDoc.key === NS + "." + S.invisible) {
    CONFIG.controlIcons.visibility = settingDoc.value ? BASE + "icons/invisible.svg" : "icons/svg/invisible.svg";
  }
  _applyPauseCss();
});

/* ---------------- 模组库查看原画（场景模组库） ---------------- */
Hooks.on("renderCompendium", (compendium, html) => {
  if (!setting(S.viewArtwork)) return;
  if (compendium.collection.documentName !== "Scene") return;
  html.find("li.directory-item h4 a").click((ev) => {
    ev.preventDefault();
    ev.cancelBubble = true;
    if (ev.stopPropagation) ev.stopPropagation();
    const documentId = ev.currentTarget.closest("li").dataset.documentId;
    compendium.collection.getDocument(documentId).then((entry) => {
      const img = entry.background?.src;
      if (img) {
        if (VideoHelper.hasVideoExtension(img)) {
          ImageHelper.createThumbnail(img, { width: entry.width, height: entry.height }).then((t) => {
            new ImagePopout(t.thumb, { title: entry.name, shareable: true, uuid: entry.uuid }).render(true);
          });
        } else {
          new ImagePopout(img, { title: entry.name, shareable: true, uuid: entry.uuid }).render(true);
        }
      } else {
        ev.currentTarget.parentElement.click();
      }
    });
  });
});
