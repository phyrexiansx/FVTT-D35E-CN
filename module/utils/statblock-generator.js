import {ActorPF} from "../actor/entity.js";
import {ActorDescriptionHelper} from "../actor/helpers/actorDescriptionHelper.js";

export class StatblockGenerator {
    /**
     * @param {ActorPF} actor
     */
    static async generateContent(actor) {
        try {
            const helper = new ActorDescriptionHelper(actor);
            let content = ''
            content = content + `<h2>${actor.name}</h2>`;
            // 阵营（有则显示）
            const alignment = helper.describeAlignment();
            if (alignment) content = content + `<strong>阵营:</strong> ${alignment}<br>`;
            // 体型/生物类型
            content = content + `<strong>体型/生物类型:</strong> ${helper.describeSize()} ${helper.describeCreatureType()}<br>`;
            // 职业
            content = content + `<strong>职业:</strong> ${helper.describeClasses()}<br>`;
            // 生命骰
            content = content + `<strong>生命骰:</strong> ${helper.describeHitDice()}<br>`;
            // 先攻
            content = content + `<strong>先攻:</strong> ${helper.formatBonus(actor.system.attributes.init.total)}<br>`;
            // 速度（含特殊移动汉化与飞行机动性）
            content = content + `<strong>速度:</strong> ${helper.describeSpeed()}<br>`;
            // 防御等级
            content = content + `<strong>防御等级:</strong> ${helper.describeAC()}<br>`;
            // 豁免
            content = content + `<strong>豁免:</strong> ${helper.describeSaves()}<br>`;
            // 攻击
            const attacks = helper.describeAttacks();
            if (attacks) content = content + `<strong>攻击:</strong><br>${attacks}`;
            // 专长
            const feats = helper.describeFeats();
            if (feats) content = content + `<strong>专长:</strong><br>${feats}`;
            // 种族特性（有 race 物品且描述非空才显示）
            const racial = await helper.describeRacialFeatures();
            if (racial) content = content + `<strong>种族特性:</strong><br>${racial}<br>`;
            // 物品（库存：物品+数量+装备部位/货币，空则跳过）
            const inventory = helper.describeInventory();
            if (inventory) content = content + `<strong>物品:</strong><br>${inventory}`;
            // 档案（有才显示）
            const bio = helper.describeBiography();
            if (bio) content = content + `<strong>档案:</strong><br>${bio}`;
            return content;
        } catch (e) {
            ui.notifications.error('生成统计块内容失败: ' + (e.message || e));
            console.error(e);
            return null;
        }
    }

    /** 生成并写入 actor 的档案（biography） */
    static async generateAndSaveStatblock(actor) {
        const content = await this.generateContent(actor);
        if (content === null) return null;
        await actor.update({ "system.details.biography.value": content });
        return content;
    }

    /**
     * @param {ActorPF} actor
     */
    static async generateStatblock(actor) {
        try {
            const content = await this.generateContent(actor);
            var myWindow = window.open('', 'bookWindow', 'width=1000,height=600');
            if (myWindow) {
                myWindow.document.write(`<html><head><meta charset="utf-8"><title>${actor.name} - Statblock</title></head><body style="font-family: sans-serif; padding: 12px;">${content}</body></html>`);
                myWindow.document.close();
            } else {
                ui.notifications.warn('统计块弹出窗口被浏览器拦截，内容已输出到控制台');
                console.log(content);
            }
        } catch (e) {
            ui.notifications.error('生成统计块失败: ' + (e.message || e));
            console.error(e);
        }
    }
}
