import { BaseRolls } from "./base-rolls.js"
import { Roll35e } from "../../roll.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"
import { targetAutoSettleCheck, targetAutoSettleSave, getRollAdvantageMode } from "../../automation/intuitive.js"

export class D35eRolls extends BaseRolls {
    rollSuccess(roll, dc, actorId, request) {
        // [D35E]自动弹出检定开关打开：无论如何不自动结算（结果留 GM 手动标记）
        if (request?.autopopup) return { passed: undefined };
        // [D35E]与攻击/豁免自动结算一致：autoApplyIntuitive 开 且 目标无阻止自动结算 且 无可选高级行动 才自动判定；
        // 否则返回 passed:undefined（请求卡 ✓/✗ 留 GM 手动标记）
        let auto = true;
        if (actorId) {
            const actor = game.actors.get(actorId);
            if (actor) {
                auto = request?.type === "save"
                    ? targetAutoSettleSave(actor)
                    : targetAutoSettleCheck(actor);
            }
        }
        if (!auto) return { passed: undefined };
        return super.rollSuccess(roll, dc, actorId, request);
    }
    constructor() {
        super();

        this._requestoptions = [
            { id: "misc", text: '', groups: { init: i18n("MonksTokenBar.Initiative") } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.savingThrows },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
        /*
        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat1: "attributes.ac.normal.total",
            stat2: "skills.spt.value"
        });*/
    }

    get canGrab() {
        // [D35E]启用“抓取”功能（BaseRolls默认false→抓取按钮不显示，delete-after-grab永不生效）
        return true;
    }

    get showAdvantage() {
        // [D35E]显示优势/劣势按钮（adv-btn，BaseRolls默认false不显示）
        return true;
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return !game.settings.get('D35E', 'disableExperienceTracking');
    }

    getXP(actor) {
        return actor?.system.details.xp;
    }

    calcXP(actors, monsters) {
        //get the monster xp
        let combatxp = 0;
        for (let monster of monsters) {
            monster.xp = (MonksTokenBar.system.getXP(monster.actor)?.value || 0);
            combatxp += monster.xp;
        };

        return combatxp;
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.normal.total", icon: "fa-shield-alt" }, {stat:"skills.spt.value", icon: "fa-eye"}];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'skill', key: 'spt' } : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        // [D35E]优势/劣势：从 adv-btn 点击目标读取（dnd5e parseKeys 逻辑）
        if (e) {
            e.advantage = e.advantage ?? $(e?.originalEvent?.target).hasClass("advantage");
            e.disadvantage = e.disadvantage ?? $(e?.originalEvent?.target).hasClass("disadvantage");
        }
        // [D35E]adv-btn 点击 > 变化效果标签（抵消）> 普通
        const tagMode = getRollAdvantageMode(actor);
        const advMode = e?.advantage ? "kh" : (e?.disadvantage ? "kl" : (tagMode === 1 ? "kh" : (tagMode === -1 ? "kl" : "")));
        const d20 = advMode ? "2d20" + advMode : "1d20"; // 优势2d20kh / 劣势2d20kl
        // [D35E]自动结算条件：autoApplyIntuitive 开 && 目标无“阻止自动结算” && 无可选高级行动 → 直接自动投
        const auto = request?.type === 'save'
            ? targetAutoSettleSave(actor)
            : targetAutoSettleCheck(actor);
        // 手动模式：目标有“阻止自动结算”或该检定存在可选高级行动 → 走 D35E 完整掷骰弹窗（可勾选高级行动/加成）
        if (!auto) {
            const opts = { rollMode: rollMode, fastForward: false, skipDialog: false, chatMessage: false, fromMars5eChatCard: true, event: e };
            let p;
            try {
                if (request.type == 'ability') p = actor.rollAbilityTest(request.key, opts);
                else if (request.type == 'save') p = actor.rollSavingThrow(request.key, null, null, opts);
                else if (request.type == 'skill') p = actor.rollSkill(request.key, opts);
                else if (request.key == 'init') p = actor.rollInitiative({ createCombatants: false, rerollInitiative: game.user.isGM });
                else return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
            } catch (err) {
                console.error('[D35E-TokenBar] 手动掷骰异常', err);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
            return p.then((roll) => {
                if (roll instanceof Combat) return callback(roll);
                return callback(Array.isArray(roll) ? (roll[0] || roll) : roll);
            }).catch(() => {
                console.error('[D35E-TokenBar] 手动掷骰失败', request);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            });
        }
        // 自动模式：直接掷（无弹窗、无重复消息）——结果只回填请求卡
        try {
            if (request.type == 'ability') {
                const abl = getProperty(actor.system, 'abilities.' + request.key);
                const data = {
                    mod: abl?.mod || 0,
                    checkMod: abl?.checkMod || 0,
                    drain: getProperty(actor.system, 'attributes.energyDrain') || 0,
                };
                const r1 = new Roll35e(d20 + ' + @mod + @checkMod - @drain', data).roll();
                if (!(r1 instanceof Roll)) return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
                return callback(r1);
            }
            else if (request.type == 'save') {
                const total = getProperty(actor.system, 'attributes.savingThrows.' + request.key + '.total') || 0;
                const r2 = new Roll35e(d20 + ' + ' + total).roll();
                if (!(r2 instanceof Roll)) return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
                return callback(r2);
            }
            else if (request.type == 'skill') {
                const skill = getProperty(actor.system, 'skills.' + request.key);
                const mod = skill?.mod || 0;
                const r3 = new Roll35e(d20 + ' + ' + mod).roll();
                if (!(r3 instanceof Roll)) return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
                return callback(r3);
            }
            else if (request.key == 'init') {
                return actor.rollInitiative({ createCombatants: false, rerollInitiative: game.user.isGM })
                    .then((combat) => callback(combat))
                    .catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            }
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        } catch (err) {
            console.error('[D35E-TokenBar] 自动掷骰异常', err);
            return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
        }
    }

    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.details.xp.value": parseInt(actor.system.details.xp.value) + parseInt(msgactor.xp)
        });

        if (setting("send-levelup-whisper") && actor.system.details.xp.value >= actor.system.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }
}