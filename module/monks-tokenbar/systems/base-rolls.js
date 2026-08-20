import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js"
import { SavingThrowApp } from "../apps/savingthrow.js";
import { ContestedRollApp } from "../apps/contestedroll.js";
import { AssignXPApp } from "../apps/assignxp.js";

export class BaseRolls {
    constructor() {
        this._config = CONFIG[game.system.id.toUpperCase()];
        this._requestoptions = [{
            id: "dice", text: "Dice", cssclass: "dice-group", groups: { "1d2": "1d2", "1d4": "1d4", "1d6": "1d6", "1d8": "1d8", "1d10": "1d10", "1d12": "1d12", "1d20": "1d20", "1d100": "1d100" }
        }];
    }

    get _supportedSystem() {
        return false;
    }

    getValue(actor, type, key) {
        return null;
    }

    rollProperties(request) {
        return [];
    }

    isCritical(roll) {
        if (!(roll.terms[0] instanceof Die) && (roll.terms[0].faces === 20) || !roll._evaluated) return undefined;
        if (Number.isNumeric(roll.options.critical) && roll.dice[0].total >= roll.options.critical) return 'critical';
        if (Number.isNumeric(roll.options.fumble) && roll.dice[0].total <= roll.options.fumble) return 'fumble';
        return false;
    }

    static activateHooks() {
    }

    get requestoptions() {
        return this._requestoptions;
    }

    get contestedoptions() {
        return this._requestoptions.filter(o => { return o.id != 'save' && o.id != 'misc' });
    }

    get config() {
        return this._config;
    }

    get canReroll() {
        return true;
    }

    get showRoll() {
        return true;
    }

    get useDegrees() {
        return false;
    }

    get hasCritical() {
        return false;
    }

    /**
     * 判定掷骰结果是否达到 DC（成功/失败）
     * 防御：roll 可能为序列化 JSON（tokenbar 的 msgtoken.roll 经 toJSON 存储，无 total getter），
     *       先归一化为 Roll 实例再比较；无法归一化或结果非数值时按“不可判定”处理。
     * @param {Roll|object|string} roll 掷骰结果（Roll 实例 / JSON / 序列化字符串）
     * @param {number} dc 检定 DC
     * @returns {{passed: boolean|undefined}} passed=true 成功 / false 失败 / undefined 不可判定
     */
    rollSuccess(roll, dc, actorId, request) {
        // [D35E]归一化：JSON/字符串 → Roll 实例（无 total 的原始数据无法判定）
        const r = this._normalizeRoll(roll);
        if (!r || !Number.isFinite(r.total)) return { passed: undefined };
        const passed = r.total >= dc;
        return { passed };
    }

    /**
     * 将掷骰数据归一化为 Roll 实例（兼容 Roll 实例 / Roll.toJSON 结果 / 序列化字符串）
     * @param {Roll|object|string} roll 原始掷骰数据
     * @returns {Roll|null} 归一化后的 Roll，失败返回 null
     */
    _normalizeRoll(roll) {
        if (!roll) return null;
        if (roll instanceof Roll) return roll;
        try {
            if (typeof roll === "string") return Roll.fromJSON(roll);
            if (roll.formula) return Roll.fromData(roll);
        } catch (e) {
            // 重建失败：按不可判定处理（保持调用方安全）
        }
        return null;
    }

    get showXP() {
        return false;
    }

    calcXP(actors, monsters) {
        return 0;
    }

    getXP (actor) {
        return { value: 0, max: 0 };
    }

    getLevel(actor) {
        return actor.system.details?.level?.value ?? actor.system.details?.level ?? 0;
    }

    get dcLabel() {
        return "MonksTokenBar.SavingDC";
    }

    get defaultStats() {
        return [];
    }

    getButtons() {
        var buttons = [];
        if (setting("show-movement")) {
            buttons.push([
                {
                    id: 'movement-free',
                    title: 'MonksTokenBar.FreeMovement',
                    icon: 'fa-running',
                    click: (game.user.isGM ?
                        (event) => {
                            event.preventDefault();
                            MonksTokenBar.changeGlobalMovement('free');
                        } : null)
                },
                {
                    id: 'movement-none',
                    title: 'MonksTokenBar.NoMovement',
                    icon: 'fa-street-view',
                    click: (game.user.isGM ?
                        (event) => {
                            event.preventDefault();
                            MonksTokenBar.changeGlobalMovement('none');
                        } : null)
                },
                {
                    id: 'movement-combat',
                    title: 'MonksTokenBar.CombatTurn',
                    icon: 'fa-fist-raised',
                    click: (game.user.isGM ? (event) => {
                        event.preventDefault();
                        MonksTokenBar.changeGlobalMovement('combat');
                    } : null)
                }
            ]);
        }
        if (game.user.isGM && MonksTokenBar.system._supportedSystem) {
            buttons.push([
                {
                    id: 'request-roll',
                    title: 'MonksTokenBar.RequestRoll',
                    icon: 'fa-tools',
                    click: (event) => {
                        event.preventDefault();
                        this.savingthrow = new SavingThrowApp().render(true);
                    }
                },
                {
                    id: 'contested-roll',
                    title: 'MonksTokenBar.ContestedRoll',
                    icon: 'fa-people-arrows',
                    click: (event) => {
                        event.preventDefault();
                        this.contestedroll = new ContestedRollApp().render(true);
                    }
                },
                {
                    id: 'assign-xp',
                    title: 'MonksTokenBar.AssignXP',
                    icon: 'fa-book-medical',
                    hidden: !(game.user.isGM && MonksTokenBar.system.showXP),
                    click: (event) => {
                        event.preventDefault();
                        new AssignXPApp().render(true);
                    }
                }
            ]);
        }
        return buttons;
    }

    defaultRequest() {
        return null;
    }

    defaultContested() {
        return null;
    }

    get canGrab() {
        return false;
    }

    get showAdvantage() {
        return false;
    }

    dynamicRequest(tokens) {
        return [];
    }

    roll({ id }, callback, e) {
        return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    async assignXP(msgactor) {

    }

    async checkXP(actor) {

    }

    parseKeys(e, keys) {

    }

    getCurrency() {
        let lootsheet = setting('loot-sheet');
        let currency = Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {});
        if (lootsheet == "monks-enhanced-journal" && game.modules.get("monks-enhanced-journal")?.active) {
            currency = game.MonksEnhancedJournal.currencies.filter(c => c.convert != null);
        }

        return currency;
    }
}