// ==================== 战斗推进同步（非 GM → GM） ====================
// FVTT v11 的 game.socket 自定义事件无法跨客户端送达（服务器只转发白名单事件：
// chatBubble/av/数据库操作）。因此非 GM 客户端点击「下一回合/下一轮」时，
// combat.js 改为通过 whisper+flags 通知 GM 客户端执行真正的回合推进。
// 本模块负责：GM 端接收并执行，同时双方隐藏该 whisper 消息。
// 相关修改：module/combat/combat.js 的 nextTurn()/nextRound() 非 GM 分支。

Hooks.on("createChatMessage", (msg) => {
  const p = msg.flags?.D35E?.combatProgress;
  if (!p) return;

  const whisperIds = (msg.whisper || []).map((w) => (typeof w === "object" ? w.id : w));
  const msgUserId = typeof msg.user === "object" ? msg.user?.id : msg.user;

  // 作者端（非 GM 玩家点击下一回合/下一轮）：立即真删（作者权限），广播后所有端同步移除，无残留
  if (msgUserId === game.user.id) {
    msg.delete().catch(() => {
      // 真删失败时降级为本地隐藏
      game.messages.delete(msg.id);
      $(`#chat-log .message[data-message-id="${msg.id}"]`).remove();
    });
    return;
  }
  // 只处理发给当前客户端的消息
  if (!whisperIds.includes(game.user.id)) return;

  // 只有 GM 端执行推进；消息仅本地隐藏（真删由作者端广播完成，避免双删报错）
  if (!game.user.isGM) {
    game.messages.delete(msg.id);
    $(`#chat-log .message[data-message-id="${msg.id}"]`).remove();
    return;
  }
  const combat = game.combats.get(p.combatId);
  if (!combat) return;
  if (p.type === "round") {
    combat.nextRound();
  } else if (p.type === "turn") {
    combat.nextTurn();
  }
  game.messages.delete(msg.id);
  $(`#chat-log .message[data-message-id="${msg.id}"]`).remove();
});
