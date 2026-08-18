import { isMinimumCoreVersion } from "../lib.js";

export class ChatMessagePF extends ChatMessage {
  async update(data, context) {
    return super.update(data, context);
  }

  async getHTML() {
    if (this.getFlag("D35E", "template")) {
      let chatTemplateData = this.getFlag("D35E", "chatTemplateData");
      chatTemplateData.revealed = this.getFlag("D35E", "revealed") || game.user.isGM; // [D35E]GM掷骰后DC/目标默认直接可见（原为false→target-hidden半透明遮挡，要点眼睛整卡重渲染才显示且卡顿）
      chatTemplateData.shouldDisplayTarget = chatTemplateData.revealed || game.user.isGM;
      chatTemplateData.isGM = game.user.isGM;
      chatTemplateData.ownerOrGM = game.actors.get(chatTemplateData?.actor?._id)?.isOwner || game.user.isGM;
      chatTemplateData.ownerOrGMAndNotBlind = chatTemplateData.ownerOrGM && (!this.blind || game.user.isGM);
      chatTemplateData.blind = this.blind;
      this.content = await renderTemplate(this.getFlag("D35E", "template"), chatTemplateData);
    }
    return super.getHTML();
  }
}
