import {ItemDescriptionsHelper} from "../../item/helpers/itemDescriptionsHelper.js";

export class ActorDescriptionHelper {

    /**
     * @param {ActorPF} actor
     */
    constructor(actor) {
        this.actor = actor
    }

    /** 提取物品名中的中文部分（无中文时回退全名） */
    getDisplayName(item) {
        const name = item?.name || "";
        const cn = name.replace(/[a-zA-Z0-9\s\-_()（）]/g, "");
        return cn || name;
    }

    /** 阵营：守序善良 (LG) */
    describeAlignment() {
        const alignment = this.actor.system?.details?.alignment;
        if (!alignment) return "";
        const key = CONFIG.D35E.alignments?.[String(alignment).toLowerCase()];
        const name = key ? game.i18n.localize(key) : "";
        return name ? `${name} (${alignment})` : String(alignment);
    }

    /** 生物类型：优先取 race 类物品上的 creatureType，其次角色 attributes.creatureType */
    describeCreatureType() {
        let type = "";
        const race = (this.actor.items || []).find((i) => i.type === "race");
        if (race?.system?.creatureType) type = race.system.creatureType;
        else if (this.actor.system?.attributes?.creatureType) type = this.actor.system.attributes.creatureType;
        if (!type) return "—";
        const key = CONFIG.D35E.creatureTypes?.[type];
        return key ? game.i18n.localize(key) : type;
    }

    /** 职业列表：术士8/武僧2（按等级从大到小） */
    describeClasses() {
        const classes = (this.actor.items || [])
            .filter((i) => i.type === "class" && i.system?.classType === "base" && Number(i.system.levels) > 0)
            .sort((a, b) => Number(b.system.levels) - Number(a.system.levels));
        if (!classes.length) return "—";
        return classes.map((c) => `${this.getDisplayName(c)}${c.system.levels}`).join("/");
    }

    describeHitDice() {
        const hpMax = this.actor.system?.attributes?.hp?.max || 0;
        const classes = (this.actor.items || [])
            .filter((i) => i.type === "class" && i.system?.classType === "base" && Number(i.system.levels) > 0)
            .sort((a, b) => Number(b.system.levels) - Number(a.system.levels));
        if (!classes.length) return `— (${hpMax} hp)`;
        const dice = classes.map((c) => `${c.system.levels}d${c.system.hd}`).join("+");
        const conMod = Number(this.actor.system?.abilities?.con?.mod) || 0;
        const totalLevels = classes.reduce((s, c) => s + Number(c.system.levels), 0);
        const conBonus = conMod * totalLevels;
        let result = dice;
        if (conBonus !== 0) result += (conBonus > 0 ? "+" : "") + conBonus;
        return `${result} (${hpMax} hp)`;
    }

    describeSize() {
        const key = CONFIG.D35E.actorSizes[this.actor.system?.traits?.actualSize];
        return key ? game.i18n.localize(key) : "—";
    }

    formatBonus(total) {
        if (total > 0) return "+" + total;
        else return "" + total;
    }

    describeSpeed() {
        let speedLabels = [];
        let speeds = this.actor.system.attributes.speed || {};
        let moveLabels = {land: "陆地", climb: "攀爬", swim: "游泳", burrow: "挖掘", fly: "飞行"};
        let maneuverLabels = {
            clumsy: "D35E.FlyManeuverabilityClumsy",
            poor: "D35E.FlyManeuverabilityPoor",
            average: "D35E.FlyManeuverabilityAverage",
            good: "D35E.FlyManeuverabilityGood",
            perfect: "D35E.FlyManeuverabilityPerfect",
        };
        let firstLabel = true;
        for (let [speed, data] of Object.entries(speeds)) {
            if (!data || !data.total) continue;
            let label = '';
            if (speed === 'land') {
                label = `${data.total} ft.(${Math.floor(data.total / 5)} 格)`;
            } else {
                label = `${moveLabels[speed] || speed} ${data.total} ft.`;
                if (speed === 'fly' && data.maneuverability && maneuverLabels[data.maneuverability]) {
                    label = label + `（机动性：${game.i18n.localize(maneuverLabels[data.maneuverability])}）`;
                }
            }
            if (firstLabel) {
                speedLabels.push(label);
                firstLabel = false;
            } else {
                speedLabels.push(label);
            }
        }
        return speedLabels.join('；');
    }

    describeAC() {
        let acLabels = [];
        let acs = this.actor.system.attributes.ac || {};
        let sourceDetails = expandObject(this.actor.sourceDetails) || {};

        for (let [a, ac] of Object.entries(acs)) {
            ac.label = CONFIG.D35E.ac[a];
            ac.labelShort = CONFIG.D35E.acShort[a];
            ac.valueLabel = CONFIG.D35E.acValueLabels[a];
            ac.sourceDetails = sourceDetails?.system?.attributes?.ac?.[a]?.total || [];
        }

        let firstLabel = true;
        for (let ac of Object.keys(acs)) {
            if (acs[ac].total) {
                let label = `${acs[ac].label} ${acs[ac].total}`
                if (firstLabel) {
                    let sources = [];
                    for (let acSource of (acs[ac].sourceDetails || [])) {
                        sources.push(`${acSource.name} ${this.formatBonus(acSource.value)}`)
                    }
                    // 来源为空时不显示空括号
                    if (sources.length) label = label + ` (${sources.join(', ')})`
                    firstLabel = false;
                }
                acLabels.push(label);
            }
        }
        return acLabels.join('; ');
    }

    /** 豁免：强韧 +3；反射+2；意志+8 */
    describeSaves() {
        const saves = this.actor.system?.attributes?.savingThrows || {};
        const parts = [];
        for (const k of ["fort", "ref", "will"]) {
            const labelKey = CONFIG.D35E.savingThrows?.[k];
            const label = labelKey ? game.i18n.localize(labelKey) : k;
            parts.push(`${label} ${this.formatBonus(Number(saves[k]?.total) || 0)}`);
        }
        return parts.join('；');
    }

    /** 攻击列表：中文名 + 攻击检定 + 伤害 + 重击范围/倍率（近战→远程→其他分组，与战斗页一致） */
    describeAttacks() {
        const attacks = (this.actor.items || []).filter((i) => i.type === "attack");
        if (!attacks.length) return "";
        let rollData = null;
        try {
            rollData = this.actor.getRollData();
        } catch (e) {
            rollData = null;
        }
        // 近战（武器+近战动作）→ 远程（武器+远程动作）→ 其他（天生/能力/杂项等）
        const groups = {melee: [], ranged: [], other: []};
        const otherOrder = {natural: 0, ability: 1, racialAbility: 2, misc: 3, full: 4};
        for (const item of attacks) {
            const actionType = item.system?.actionType;
            const attackType = item.system?.attackType;
            if (attackType === "weapon" && actionType === "mwak") groups.melee.push(item);
            else if (attackType === "weapon" && actionType === "rwak") groups.ranged.push(item);
            else groups.other.push(item);
        }
        // 其他组内按攻击类型排序（天生→能力→种族能力→杂项→全力攻击）
        groups.other.sort((a, b) => {
            const oa = otherOrder[a.system?.attackType] ?? 99;
            const ob = otherOrder[b.system?.attackType] ?? 99;
            return oa - ob;
        });
        const ordered = [...groups.melee, ...groups.ranged, ...groups.other];
        const lines = [];
        for (const item of ordered) {
            const name = this.getDisplayName(item);
            let attackBonus = "";
            let damage = "";
            try {
                attackBonus = ItemDescriptionsHelper.attackDescription(item, rollData) || "";
                damage = ItemDescriptionsHelper.damageDescription(item, rollData) || "";
            } catch (e) {}
            // 去掉运算符周围空格（1d8 + 30 → 1d8+30），更贴近数据卡风格
            damage = damage.replace(/ ?\+ ?/g, "+").replace(/ ?- ?/g, "-");
            // 重击范围/倍率：物品里的 critRange 到 20，如 "20" → 20-20，x3
            let critStr = "";
            const critRange = item.system?.ability?.critRange;
            const critMult = item.system?.ability?.critMult;
            if (critRange != null && critMult != null && String(critRange) !== "") {
                let range = String(critRange);
                if (!range.includes("-")) range = `${range}-20`;
                critStr = ` ${range} x${critMult}`;
            }
            lines.push(`${name}${attackBonus ? " " + attackBonus : ""}${damage ? " " + damage : ""}${critStr}`);
        }
        return lines.map((l) => `&nbsp;&nbsp;${l}<br>`).join("");
    }

    /** 专长：只取「专长」页「专长」分组（featType=feat），排除职业特性/特性/种族/杂项 */
    describeFeats() {
        const feats = (this.actor.items || []).filter(
            (i) => i.type === "feat" && i.system?.featType === "feat"
        );
        if (!feats.length) return "";
        const seen = new Set();
        const lines = [];
        for (const f of feats) {
            const name = this.getDisplayName(f);
            if (seen.has(name)) continue;
            seen.add(name);
            lines.push(name);
        }
        return lines.map((l) => `&nbsp;&nbsp;${l}<br>`).join("");
    }

    /** 种族特性：从 race 类物品获取（解析 @LinkedDescription），没有则返回空 */
    async describeRacialFeatures() {
        const race = (this.actor.items || []).find((i) => i.type === "race");
        if (!race) return "";
        let desc = race.system?.description?.value || race.system?.shortDescription || "";
        if (!desc) return "";
        const m = desc.match(/@LinkedDescription\[(Compendium\.[^\]]+)\]/);
        if (m) {
            try {
                const doc = await fromUuid(m[1]);
                if (doc) desc = doc.system?.description?.value || doc.system?.shortDescription || "";
            } catch (e) {}
        }
        return desc;
    }

    /** 装备部位中文名：护甲/盾牌按 equipmentType，奇物按 slot（无部位返回空） */
    getEquipSlot(item) {
        const equipmentType = item.system?.equipmentType;
        if (equipmentType === "armor") return game.i18n.localize("D35E.EquipSlotArmor");
        if (equipmentType === "shield") return game.i18n.localize("D35E.EquipSlotShield");
        const slot = item.system?.slot;
        if (!slot || slot === "slotless") return "";
        const key = `D35E.EquipSlot${slot.charAt(0).toUpperCase()}${slot.slice(1)}`;
        const label = game.i18n.localize(key);
        return label && label !== key ? label : slot;
    }

    /** 库存：物品名+数量；装备类写部位/未装备；货币全部换算成金币 */
    describeInventory() {
        const inventoryTypes = ["weapon", "equipment", "loot", "consumable", "valuable", "card", "material"];
        const items = (this.actor.items || []).filter((i) => inventoryTypes.includes(i.type));
        if (!items.length) return "";
        // 分组排序：武器→装备→弹药→容器→其他，组内按中文名
        const groupOrder = {weapon: 0, equipment: 1, loot: 2};
        const lootOrder = {ammo: 0, container: 1};
        const sorted = [...items].sort((a, b) => {
            const ga = groupOrder[a.type] ?? 3;
            const gb = groupOrder[b.type] ?? 3;
            if (ga !== gb) return ga - gb;
            if (a.type === "loot") {
                const la = lootOrder[a.system?.subType] ?? 2;
                const lb = lootOrder[b.system?.subType] ?? 2;
                if (la !== lb) return la - lb;
            }
            return this.getDisplayName(a).localeCompare(this.getDisplayName(b), "zh");
        });
        const lines = [];
        for (const item of sorted) {
            const name = this.getDisplayName(item);
            const qty = Number(item.system?.quantity) || 1;
            let line = `${name} x${qty}`;
            if (item.type === "equipment") {
                if (item.system?.equipped) {
                    const slot = this.getEquipSlot(item);
                    if (slot) line += ` ${slot}`;
                } else {
                    line += " 未装备";
                }
            }
            lines.push(line);
        }
        // 货币换算成金币：1pp=10gp, 1sp=0.1gp, 1cp=0.01gp
        const cur = this.actor.system?.currency || {};
        const gpTotal = (Number(cur.pp) || 0) * 10 + (Number(cur.gp) || 0) + (Number(cur.sp) || 0) * 0.1 + (Number(cur.cp) || 0) * 0.01;
        if (gpTotal > 0) lines.push(`货币：${Number(gpTotal.toFixed(2))} 金币`);
        return lines.map((l) => `&nbsp;&nbsp;${l}<br>`).join("");
    }

    /** 档案：biography */
    describeBiography() {
        const bio = this.actor.system?.details?.biography?.value;
        return bio && String(bio).trim() ? bio : "";
    }
}
