/**
 * CGMP 功能合并（源自 Cautious Gamemasters Pack，MIT 协议）
 * 1) 玩家消息强制以绑定角色发言（固定行为，GM 不处理）
 * 2) /desc /as /ooc 聊天命令
 * 3) 输入状态通知（"xxx 正在输入…"，跨用户走 whisper+flags 通道，系统 socket 不可用）
 *
 * 入口：registerCGMPFeatures() 在 D35E.js 的 init hook 中调用
 * （设置必须在 init 注册；hooks 注册时机任意）
 */

const SETTINGS = {
  allowPlayersUseDesc: "cgmpAllowPlayersUseDesc",
  notifyTyping: "cgmpNotifyTyping",
};

const SUB_TYPES = { NONE: 0, DESC: 1, AS: 2, OOC: 3 };
const DESC_ALIAS = "#D35E_DESCRIPTION";

const PATTERNS = {
  as: /^(\/as\s+)(\([^\)]+\)|\[[^\]]+\]|"[^"]+"|'[^']+'|[^\s]+)\s+([^]*)/i,
  desc: /^(\/desc\s+)()([^]*)/i,
  ooc: /^(\/ooc\s+)()([^]*)/i,
};

const TYPING_TIMEOUT = 10000;
const TYPING_HEARTBEAT = 8000;

/** 正在输入的用户（接收端维护）：Map<userId, {name, timer}> */
const typingUsers = new Map();

export function registerCGMPFeatures() {
  // ---- 设置 ----
  game.settings.register("D35E", SETTINGS.allowPlayersUseDesc, {
    name: "D35E.CGMPAllowPlayersDesc",
    hint: "D35E.CGMPAllowPlayersDescHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("D35E", SETTINGS.notifyTyping, {
    name: "D35E.CGMPNotifyTyping",
    hint: "D35E.CGMPNotifyTypingHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

  // ---- hooks ----
  Hooks.on("chatMessage", onChatMessage);
  Hooks.on("preCreateChatMessage", onPreCreateChatMessage);
  Hooks.on("renderChatMessage", onRenderChatMessage);
  Hooks.on("renderChatLog", onRenderChatLog);
  Hooks.on("createChatMessage", onTypingChannelMessage);
}

/* ================================================================
 * /desc /as /ooc 命令
 * ================================================================ */

function parseChatMessage(message) {
  for (const [command, rgx] of Object.entries(PATTERNS)) {
    const match = message.match(rgx);
    if (match) return [command, match];
  }
  return [undefined, undefined];
}

function onChatMessage(chatLog, message, chatData) {
  const [command, match] = parseChatMessage(message);
  switch (command) {
    case "desc":
      if (!game.user.isGM && !game.settings.get("D35E", SETTINGS.allowPlayersUseDesc)) return true;
      chatData.flags ??= {};
      chatData.flags.D35E ??= {};
      chatData.flags.D35E.chatSubType = SUB_TYPES.DESC;
      chatData.type = CONST.CHAT_MESSAGE_TYPES.OTHER;
      chatData.speaker = { alias: DESC_ALIAS, scene: game.user.viewedScene };
      chatData.content = match[3].replace(/\n/g, "<br>");
      ChatMessage.implementation.create(chatData, {});
      return false;

    case "as":
      if (!game.user.isGM) return true;
      const alias = match[2].replace(/^["'\(\[(.*?)"'\)\]]$/, '$1');
      chatData.flags ??= {};
      chatData.flags.D35E ??= {};
      chatData.flags.D35E.chatSubType = SUB_TYPES.AS;
      chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
      chatData.speaker = { alias, scene: game.user.viewedScene };
      chatData.content = match[3].replace(/\n/g, "<br>");
      ChatMessage.implementation.create(chatData, {});
      return false;

    case "ooc":
      chatData.flags ??= {};
      chatData.flags.D35E ??= {};
      chatData.flags.D35E.chatSubType = SUB_TYPES.OOC;
      return true;

    default:
      return true;
  }
}

/* ================================================================
 * 玩家消息强制以绑定角色发言
 * ================================================================ */

function onPreCreateChatMessage(message, data, options, userId) {
  if (game.user.isGM) return;
  if (!game.user.character) return;
  // 跳过：whisper、掷骰、命令（/desc /as /ooc）、输入状态消息、D35E 聊天卡
  if (message.type === CONST.CHAT_MESSAGE_TYPES.WHISPER) return;
  if (message.rolls?.length) return;
  if (message.getFlag("D35E", "chatSubType") !== undefined) return;
  if (message.getFlag("D35E", "typing") !== undefined) return;
  if (message.getFlag("D35E", "chatTemplateData")) return;

  const speaker = ChatMessage.getSpeaker({ actor: game.user.character });
  const updates = { speaker };
  if (message.type === CONST.CHAT_MESSAGE_TYPES.OOC) updates.type = CONST.CHAT_MESSAGE_TYPES.IC;
  message.updateSource(updates);
}

/* ================================================================
 * 渲染样式 class
 * ================================================================ */

function onRenderChatMessage(message, html, data) {
  if (message.getFlag("D35E", "typing") !== undefined) {
    html.addClass("d35e-typing-msg");
    return;
  }
  const sub = message.getFlag("D35E", "chatSubType");
  if (sub === SUB_TYPES.AS) html.addClass("d35e-as");
  else if (sub === SUB_TYPES.DESC) html.addClass("d35e-desc");
  else if (message.speaker?.alias === DESC_ALIAS) html.addClass("d35e-desc");
}

/* ================================================================
 * 输入状态通知（whisper + flags 通道）
 * ================================================================ */

function getChatForm(html) {
  const fromApp = game.chatLog?.element?.find("#chat-form");
  if (fromApp?.length) return fromApp;
  const fromHtml = html?.find?.("#chat-form");
  if (fromHtml?.length) return fromHtml;
  return $("#chat-form");
}

function sendTyping(active) {
  if (!game.settings.get("D35E", SETTINGS.notifyTyping)) return;
  const recipients = game.users.filter((u) => u.active && u.id !== game.userId).map((u) => u.id);
  if (!recipients.length) return;
  ChatMessage.create({
    type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
    whisper: recipients,
    content: " ",
    speaker: { alias: game.user.name },
    flags: { D35E: { typing: { user: game.userId, name: game.user.name, active } } },
  }).catch((e) => console.warn("D35E | typing notify failed", e));
}

function onRenderChatLog(chatLog, html, data) {
  const form = getChatForm(html);
  if (!form.length) return;
  if (!form.find(".d35e-typing-notice").length) {
    form.append(`<div class="d35e-typing-notice" style="display:none"></div>`);
  }
  const box = form.find("#chat-message");
  if (!box.length || box[0].dataset.d35eTyping) return;
  box[0].dataset.d35eTyping = "1";
  let sent = false;
  let lastBeat = 0;
  box.on("keydown", (ev) => {
    const key = (ev.key ?? ev.code).toUpperCase();
    if ((key === "ENTER" || key === "NUMPADENTER") && !ev.shiftKey) {
      if (sent) { sent = false; sendTyping(false); }
    } else if (!sent) {
      sent = true;
      lastBeat = Date.now();
      sendTyping(true);
    } else if (Date.now() - lastBeat > TYPING_HEARTBEAT) {
      lastBeat = Date.now();
      sendTyping(true);
    }
  });
  box.on("blur", () => { if (sent) { sent = false; sendTyping(false); } });
  box.on("input", () => { if (sent && !box.val().trim()) { sent = false; sendTyping(false); } });
}

function onTypingChannelMessage(message) {
  const t = message.getFlag("D35E", "typing");
  if (t === undefined) return;
  // GM 负责延迟清理（whisper 数据对非接收方隐藏）
  if (game.user.isGM) {
    setTimeout(() => message.delete().catch(() => {}), TYPING_TIMEOUT);
  }
  if (!game.settings.get("D35E", SETTINGS.notifyTyping)) return;
  if (t.user === game.userId) return;
  if (t.active) {
    const existing = typingUsers.get(t.user);
    if (!existing) typingUsers.set(t.user, { name: t.name, timer: null });
    else typingUsers.get(t.user).name = t.name;
    clearTimeout(typingUsers.get(t.user).timer);
    typingUsers.get(t.user).timer = setTimeout(() => {
      typingUsers.delete(t.user);
      updateTypingNotice();
    }, TYPING_TIMEOUT);
  } else {
    typingUsers.delete(t.user);
  }
  updateTypingNotice();
}

function updateTypingNotice() {
  const el = document.querySelector(".d35e-typing-notice");
  if (!el) return;
  if (typingUsers.size === 0) {
    el.style.display = "none";
    return;
  }
  const names = [...typingUsers.values()].map((v) => v.name);
  let text;
  if (names.length === 1) text = game.i18n.format("D35E.TypingOne", { user: names[0] });
  else if (names.length === 2) text = game.i18n.format("D35E.TypingTwo", { user1: names[0], user2: names[1] });
  else text = game.i18n.format("D35E.TypingMany", { user1: names[0], user2: names[1], others: names.length - 2 });
  el.innerHTML = text;
  el.style.display = "";
}
