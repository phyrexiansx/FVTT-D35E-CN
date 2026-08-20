import {CACHE} from "../../cache.js";
import {ActorPF} from '../entity.js';
import {createCustomChatMessage} from '../../chat.js';
import {Roll35e} from '../../roll.js';
import {targetAutoSettle, actorHasIntuition} from '../../automation/intuitive.js';
import {ItemUse} from '../../item/extensions/use.js';
import {DistanceHelper} from '../../canvas/distance-helper.js';

// [D35E] 反击：消息级去重（双聊天窗口对同一消息可能各结算一次，按 消息id|目标actor 去重）
const _counterattackRecent = new Map();
const _COUNTERATTACK_DEDUP_MS = 5000;
// [D35E] 反击链防递归：触发后 2 秒窗口内不再触发（反击造成的伤害不会再次引发反击）
let _counterattackBusyUntil = 0;
const _COUNTERATTACK_BUSY_MS = 2000;

export class ActorDamageHelper {
    /**
     * Apply rolled dice damage to the token or tokens which are currently controlled.
     * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
     *
     * @param {Number} value   The amount of damage to deal.
     * @return {Promise}
     */
    static async applyDamage(
        ev,
        roll,
        critroll,
        natural20,
        natural20Crit,
        fubmle,
        fumble20Crit,
        damage,
        normalDamage,
        material,
        alignment,
        enh,
        nonLethalDamage,
        simpleDamage = false,
        actor = null,
        attackerId = null,
        attackerTokenId = null,
        ammoId = null,
        incorporeal = false,
        touch = false
    ) {
        let value = 0;

        let tokensList = [];
        const promises = [];

        let _attacker = game.actors.get(attackerId);

        if (actor === null) {
            //自动结算：从攻击卡上的锁定目标（data-target，即攻击者锁定的目标）取目标，而非执行者自己的 targets
            if (game.D35E?._autoSettleActive && ev?.currentTarget) {
                const card = ev.currentTarget.closest?.(".chat-card");
                if (card) {
                    tokensList = Array.from(card.querySelectorAll("[data-target]"))
                        .map((el) => canvas.tokens.get(el.dataset.target))
                        .filter((t) => !!t);
                }
            }
            if (!tokensList.length) {
                if (game.user.targets.size > 0) tokensList = Array.from(game.user.targets);
                else tokensList = canvas.tokens.controlled;
            }
            if (!tokensList.length) {
                ui.notifications.warn(game.i18n.localize("D35E.NoTokensSelected"));
                return;
            }
        } else {
            tokensList.push({ actor: actor });
        }

        for (let t of tokensList) {
            let a = t.actor,
                hp = a.system.attributes.hp,
                _nonLethal = a.system.attributes.hp.nonlethal || 0,
                nonLethal = 0,
                tmp = parseInt(hp.temp) || 0,
                hit = false,
                crit = false;

            if (!a.testUserPermission(game.user, "OWNER")) {
                //自动结算时静默跳过（玩家端处理他人目标时无权限属正常情况）
                if (!game.D35E?._autoSettleActive) {
                    ui.notifications.warn(game.i18n.localize("D35E.ErrorNoActorPermission"));
                }
                continue;
            }
            //自动结算（GM端）：目标有在线玩家OWNER时交由玩家客户端结算，避免重复
            if (game.user.isGM && game.D35E?._autoSettleActive) {
                const hasOnlineOwner = game.users.some((u) => u.active && !u.isGM && a.testUserPermission(u, "OWNER"));
                if (hasOnlineOwner) continue;
            }
            if (simpleDamage) {
                hit = true;
                value = damage;
            } else {
                let finalAc = {};
                if (fubmle) return;
                if (ev && ev.originalEvent instanceof MouseEvent && ev.originalEvent.shiftKey) {
                    finalAc.noCheck = true;
                    finalAc.ac = 0;
                    finalAc.noCritical = false;
                    finalAc.applyHalf = ev.applyHalf === true;
                } else {
                    if (roll > ActorPF.SPELL_AUTO_HIT) {
                        // Spell roll value
                        if (targetAutoSettle(a)) {
                            // 自动防御对抗：无直觉且无高级战斗行动选项 → 静默结算
                            finalAc = await a.rollDefenseDialog({ ev: ev, touch: touch, flatfooted: false, skipDialog: true });
                        } else {
                            // 需要人工防御（有直觉或存在高级战斗行动选项）→ 弹出防御窗口
                            finalAc = await a.rollDefenseDialog({ ev: ev, touch: touch, flatfooted: false });
                        }
                        if (finalAc.ac === -1) continue;
                    } else {
                        finalAc.applyHalf = ev?.applyHalf === true;
                    }
                }
                let concealMiss = false;
                let concealRoll = 0;
                let concealTarget = 0;
                let concealRolled = false;
                if (
                    (finalAc.conceal ||
                        finalAc.fullConceal ||
                        a.system.attributes?.concealment?.total ||
                        finalAc.concealOverride) &&
                    roll !== ActorPF.SPELL_AUTO_HIT
                ) {
                    concealRolled = true;
                    concealRoll = new Roll35e("1d100").roll().total;
                    if (finalAc.fullConceal) concealTarget = 50;
                    if (finalAc.conceal) concealTarget = 20;
                    if (finalAc.concealOverride) concealTarget = finalAc.concealOverride;
                    concealTarget = Math.max(a.system.attributes?.concealment?.total || 0, concealTarget);
                    if (concealRoll <= concealTarget) {
                        concealMiss = true;
                    }
                }
                let achit = roll >= finalAc.ac || natural20;
                hit = ((roll >= finalAc.ac || roll === ActorPF.SPELL_AUTO_HIT || natural20) && !concealMiss) || finalAc.noCheck; // This is for spells and natural 20
                crit =
                    (critroll >= finalAc.ac || (critroll && finalAc.noCheck) || natural20Crit) &&
                    !finalAc.noCritical &&
                    !fumble20Crit;
                let damageData = null;
                let noPrecision = false;
                // Fortitifcation / crit resistance
                let fortifyRolled = false;
                let fortifySuccessfull = false;
                let fortifyValue = 0;
                let fortifyRoll = 0;
                if (hit && a.system.attributes.fortification?.total) {
                    fortifyRolled = true;
                    fortifyValue = a.system.attributes.fortification?.total;
                    fortifyRoll = new Roll35e("1d100").roll().total;
                    if (fortifyRoll <= fortifyValue) {
                        fortifySuccessfull = true;
                        crit = false;
                        if (!finalAc.applyPrecision) noPrecision = true;
                    }
                }
                if (crit) {
                    damageData = ActorDamageHelper.calculateDamageToActor(
                        a,
                        damage,
                        material,
                        alignment,
                        enh,
                        nonLethalDamage,
                        noPrecision,
                        incorporeal,
                        finalAc.applyHalf
                    );
                } else {
                    if (natural20 || (critroll && hit))
                        //Natural 20 or we had a crit roll, no crit but base attack hit
                        damageData = ActorDamageHelper.calculateDamageToActor(
                            a,
                            normalDamage,
                            material,
                            alignment,
                            enh,
                            nonLethalDamage,
                            noPrecision,
                            incorporeal,
                            finalAc.applyHalf
                        );
                    else
                        damageData = ActorDamageHelper.calculateDamageToActor(
                            a,
                            damage,
                            material,
                            alignment,
                            enh,
                            nonLethalDamage,
                            noPrecision,
                            incorporeal,
                            finalAc.applyHalf
                        );
                }
                value = damageData.damage;
                nonLethal += damageData.nonLethalDamage;

                damageData.nonLethalDamage = nonLethal;
                damageData.displayDamage = value;
                let props = [];
                if ((finalAc.rollModifiers || []).length > 0)
                    props.push({
                        header: game.i18n.localize("D35E.RollModifiers"),
                        value: finalAc.rollModifiers,
                    });
                let ammoRecovered = false;
                if (game.settings.get("D35E", "useAutoAmmoRecovery")) {
                    if (ammoId && attackerId && !hit) {
                        let recoveryRoll = new Roll35e("1d100").roll().total;
                        if (recoveryRoll < 50) {
                            ammoRecovered = true;
                            if (_attacker) await _attacker.quickChangeItemQuantity(ammoId, 1);
                        }
                    }
                }
                if (damageData.damagePoolPossibleReductionsUpdate) {
                    await a.updateDamageReductionPoolItems(damageData.damagePoolPossibleReductionsUpdate);
                }

                let actions = [];
                finalAc.rollData = {};
                finalAc.rollData.hit = hit;
                if (finalAc.allCombatChanges && finalAc.allCombatChanges.length > 0) {
                    actions = await a.getAndApplyCombatChangesSpecialActions(
                        finalAc.allCombatChanges,
                        this,
                        finalAc.rollData,
                        finalAc.optionalFeatIds,
                        finalAc.optionalFeatRanges
                    );
                }

                // Set chat data
                let chatData = {
                    speaker: ChatMessage.getSpeaker({ actor: a.data }),
                    rollMode: finalAc.rollMode || (game.D35E?._autoSettleActive ? "publicroll" : "gmroll"),
                    sound: game.D35E?._autoSettleActive ? null : CONFIG.sounds.dice,
                    "flags.D35E.noRollRender": true,
                };
                let chatTemplateData = {
                    name: a.name,
                    sourceName: _attacker?.name || "Unknown",
                    sourceImg: _attacker?.img || "systems/D35E/icons/special-abilities/imported.png",
                    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                    rollMode: finalAc.rollMode || (game.D35E?._autoSettleActive ? "publicroll" : "gmroll"),
                };
                const templateData = mergeObject(
                    chatTemplateData,
                    {
                        actor: a,
                        damageData: damageData,
                        img: a.img,
                        roll: roll,
                        ac: finalAc,
                        hit: hit,
                        achit: achit,
                        crit: crit,
                        actions: actions,
                        acModifiers: finalAc.acModifiers || [],
                        concealMiss: concealMiss,
                        concealRoll: concealRoll,
                        concealTarget: concealTarget,
                        concealRolled: concealRolled,
                        isSpell: roll === ActorPF.SPELL_AUTO_HIT,
                        applyHalf: finalAc.applyHalf,
                        ammoRecovered: ammoRecovered,
                        fortifyRolled: fortifyRolled,
                        fortifyValue: Math.min(fortifyValue, 100),
                        fortifyRoll: fortifyRoll,
                        fortifySuccessfull: fortifySuccessfull,
                        hasProperties: props.length,
                        properties: props,
                    },
                    { inplace: false }
                );
                // Create message

                await createCustomChatMessage("systems/D35E/templates/chat/damage-description.html", templateData, chatData);
            }

            //LogHelper.log('Damage Value ', value, damage)
            if (hit) {
                let dt = value > 0 ? Math.min(tmp, value) : 0;
                let nonLethalHeal = 0;
                if (value < 0) nonLethalHeal = value;
                promises.push(
                    t.actor.update({
                        "system.attributes.hp.nonlethal": Math.max(_nonLethal + nonLethal + nonLethalHeal, 0),
                        "system.attributes.hp.temp": tmp - dt,
                        "system.attributes.hp.value": Math.clamped(hp.value - (value - dt), -100, hp.max),
                    }, { hitSound: true }) //[D35E]受击音效：伤害结算标记（手动改血不播）
                );
            }
            // [D35E] 反击：命中（且实际造成伤害）或未命中（勾选「未命中也触发反击」的攻击）→ 结算后自动对来源使用；
            // 命中判定与伤害值随调用传入，由 tryCounterattack 按各反击攻击的开关自行过滤
            if (attackerId) {
                ActorDamageHelper.tryCounterattack(a, attackerId, attackerTokenId, ev?.currentTarget, {
                    hit: hit,
                    damageDealt: hit && (value > 0 || nonLethal > 0),
                }).catch((err) =>
                    console.error("D35E | Counterattack failed", err)
                );
            }
        }
        return Promise.all(promises);
    }

    /**
     * [D35E] 反击：受到伤害且命中后调用。
     * 规则：来源为近战武器攻击(mwak)或近战法术攻击(msak)，且来源攻击未勾选「长触及」→
     * 自动对来源使用本角色所有带「反击」开关的攻击（skipDialog 快速投掷，按单次攻击掷骰）。
     * 若本角色开启「阻止自动结算」则不生效。
     * @param {Actor} targetActor 受伤角色（拥有「反击」攻击的一方）
     * @param {string} attackerId 攻击者 actor id（伤害按钮 data-attacker）
     * @param {string|null} attackerTokenId 攻击者 token id（格式 sceneId.tokenId）
     * @param {HTMLElement} button 伤害按钮 DOM（用于回溯来源攻击卡）
     */
    static async tryCounterattack(targetActor, attackerId, attackerTokenId, button, options = {}) {
        try {
            if (!targetActor || !attackerId || !button) return;
            // [D35E]未命中也触发反击：调用方传入本次结算结果（hit / damageDealt）
            const { hit = true, damageDealt = false } = options;
            if (Date.now() < _counterattackBusyUntil) return; // 反击链防递归
            // 消息级去重：双聊天窗口对同一消息可能各结算一次，只触发一次
            const msgEl = button.closest?.(".message");
            const msgId = msgEl?.dataset?.messageId;
            if (!msgId) return;
            const dedupKey = `${msgId}|${targetActor.id}`;
            const now = Date.now();
            if (now - (_counterattackRecent.get(dedupKey) || 0) < _COUNTERATTACK_DEDUP_MS) return;
            _counterattackRecent.set(dedupKey, now);
            if (_counterattackRecent.size > 200) {
                for (const [k, t] of _counterattackRecent) {
                    if (now - t >= _COUNTERATTACK_DEDUP_MS) _counterattackRecent.delete(k);
                }
            }
            // 回溯来源攻击卡（data-item-id = 来源攻击/法术物品 id）
            const card = button.closest?.(".chat-card");
            const itemId = card?.dataset?.itemId;
            if (!itemId) return;
            const attackerActor = game.actors.get(attackerId);
            if (!attackerActor) return;
            const sourceItem = attackerActor.items.get(itemId) || game.items.get(itemId);
            if (!sourceItem) return;
            // [D35E]来源攻击类型：近战/远程武器、近战/远程法术均可成为反击目标
            const sourceActionType = getProperty(sourceItem.system, "actionType") || "";
            if (!["mwak", "rwak", "msak", "rsak"].includes(sourceActionType)) return;
            // 本角色开启「阻止自动结算」→ 不自动生效
            if (actorHasIntuition(targetActor)) return;
            // 本角色带「反击」开关的攻击（attack 类）
            let counterItems = (targetActor.items || []).filter(
                (i) => i.type === "attack" && i.system?.counterattack === true
            );
            // [D35E]「未命中也触发反击」开关：勾选的反击不要求命中/造成伤害（触发条件见下）
            const onMissItems = counterItems.filter((i) => i.system?.counterattackOnMiss === true);
            const hitOnlyItems = counterItems.filter((i) => !i.system?.counterattackOnMiss);
            if (
                !hit ||
                !damageDealt ||
                !["mwak", "msak"].includes(sourceActionType) ||
                getProperty(sourceItem.system, "longReach") === true ||
                getProperty(sourceItem.system, "originalWeaponProperties.rch") === true
            ) {
                hitOnlyItems.length = 0;
            }
            counterItems = [...hitOnlyItems, ...onMissItems];
            // [D35E]多 Token 修正：反击发起者（受伤者）Token 白闪锁定——取来源攻击卡 data-target 第一个（提前取出供借机次数判断）
            let selfTokenId = null;
            try {
                const tgtEl = card?.querySelector?.("[data-target]");
                selfTokenId = tgtEl?.dataset?.target || null;
            } catch (e2) {}
            // [D35E]「需要借机攻击」：勾选的反击在战斗中只有借机攻击次数还有剩余时才反击（每次使用计入 1 次，rollAttack 内扣减）
            if (counterItems.length) {
                const combatant = game.combat && selfTokenId ? game.combat.combatants.find((c) => c.tokenId === selfTokenId) : null;
                const aaoUsed = combatant ? combatant.getFlag("D35E", "usedAaoCount") || 0 : 0;
                const aaoMax = combatant
                    ? combatant.getFlag("D35E", "aaoCount") ?? targetActor.system?.attributes?.maxAoO ?? 1
                    : 1;
                counterItems = counterItems.filter((i) => {
                    // 战斗中且借机次数已用完 → 不反击（非战斗不检查，借机次数是战斗概念）
                    if (game.combat && i.system?.needsAoO === true && aaoUsed >= aaoMax) return false;
                    return true;
                });
            }
            if (!counterItems.length) return;
            // [D35E]反击活动计数：全力攻击/批量攻击宏据此等待反击结算完成后再继续
            //（从此刻起计入活动窗口，含 150ms 延迟与全部反击攻击的使用）
            game.D35E = game.D35E || {};
            game.D35E._counterattackActive = (game.D35E._counterattackActive || 0) + 1;
            try {
                // [D35E]反击延迟：先呈现受击视觉/音效（染红+晃动约400ms），反击停顿约150ms再发动；
                // 去重键在此之前已占位，延迟期间同一伤害的重复调用不会重复触发
                await new Promise((r) => setTimeout(r, 150));
                // 定位来源 token（攻击卡 data-attackertoken = sceneId.tokenId）
                const sourceToken = ActorDamageHelper._findAttackerToken(attackerTokenId, attackerActor);
                if (!sourceToken) return;
                // [D35E]锁定来源为目标前先清除当前锁定：GM 发起攻击时锁定的目标可能包含本角色，
                // 若保留会令反击卡同时命中多个目标（角色被自己的反击误伤）；
                // v11 updateTokenTargets 可能无返回 Promise，不能链 .catch
                try {
                    await game.user.updateTokenTargets([sourceToken.id]);
                } catch (err) {
                    /* 目标锁定失败不阻断反击 */
                }
                // 依次自动使用（标记 _pendingCounterattack：useAttack 注入 counterattack=1 且按单次攻击掷骰）
                _counterattackBusyUntil = Date.now() + _COUNTERATTACK_BUSY_MS;
                for (const item of counterItems) {
                    // [D35E]「未命中也触发反击」：攻击者必须在此角色触及范围内（几何判断，不看来源长触及）
                    if (item.system?.counterattackOnMiss === true && sourceToken && selfTokenId) {
                        const selfToken = canvas.tokens.get(selfTokenId);
                        if (!selfToken || !DistanceHelper.isThreatened(selfToken, sourceToken)) continue;
                    }
                    item._pendingCounterattack = true;
                    if (selfTokenId) item._animToken = selfTokenId;
                    try {
                        await new ItemUse(item).useAttack({ skipDialog: true });
                    } finally {
                        if (item._pendingCounterattack) delete item._pendingCounterattack;
                    }
                    await new Promise((r) => setTimeout(r, 180));
                }
                // 保持 busy 窗口至自然过期（防止反击造成的伤害再次触发反击）
            } finally {
                game.D35E._counterattackActive = Math.max(0, (game.D35E._counterattackActive || 0) - 1);
            }
        } catch (err) {
            _counterattackBusyUntil = 0;
            console.error("D35E | Counterattack failed", err);
        }
    }

    /** [D35E] 根据攻击卡 token 标记（sceneId.tokenId）或攻击者 actor 定位来源 token */
    static _findAttackerToken(attackerTokenId, attackerActor) {
        if (attackerTokenId) {
            const parts = String(attackerTokenId).split(".");
            const tokenId = parts[parts.length - 1];
            const sceneId = parts.length > 1 ? parts.slice(0, -1).join(".") : canvas.scene?.id;
            if (sceneId && canvas.scene?.id && sceneId === canvas.scene.id) {
                const t = canvas.tokens.get(tokenId);
                if (t) return t;
            }
        }
        if (attackerActor) {
            return canvas.tokens?.placeables?.find((t) => t.actor && t.actor.id === attackerActor.id) || null;
        }
        return null;
    }

    static async applyRegeneration(damage, actor = null) {
        let value = 0;

        let tokensList = [];
        const promises = [];
        if (actor === null) {
            if (game.user.targets.size > 0) tokensList = Array.from(game.user.targets);
            else tokensList = canvas.tokens.controlled;
            if (!tokensList.length) {
                ui.notifications.warn(game.i18n.localize("D35E.NoTokensSelected"));
                return;
            }
        } else {
            tokensList.push({ actor: actor });
        }

        for (let t of tokensList) {
            let a = t.actor,
                nonLethal = a.system.attributes.hp.nonlethal || 0;

            promises.push(
                t.actor.update({
                    "system.attributes.hp.nonlethal": Math.max(0, nonLethal - damage),
                })
            );
        }
        return Promise.all(promises);
    }

    static get defaultDR() {
        return {
            uid: null,
            value: 0
        }
    }

    static getDamageTypeForUID(damageTypes, uid) {
        return damageTypes.find(dt => dt.uid === uid);
    }

    static getBaseDRDamageTypes() {
        let damageTypes = [
            {uid: 'any', name: game.i18n.localize("D35E.DRNonPenetrable"), value: 0, immunity: false},
            {uid: 'good', name: game.i18n.localize("D35E.AlignmentGood"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'evil', name: game.i18n.localize("D35E.AlignmentEvil"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'chaotic', name: game.i18n.localize("D35E.AlignmentChaotic"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'lawful', name: game.i18n.localize("D35E.AlignmentLawful"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'slashing', name: game.i18n.localize("D35E.DRSlashing"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'bludgeoning', name: game.i18n.localize("D35E.DRBludgeoning"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'piercing', name: game.i18n.localize("D35E.DRPiercing"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'epic', name: game.i18n.localize("D35E.DREpic"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'magic', name: game.i18n.localize("D35E.DRMagic"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'silver', name: game.i18n.localize("D35E.DRSilver"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'adamantine', name: game.i18n.localize("D35E.DRAdamantine"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'coldiron', name: game.i18n.localize("D35E.DRColdIron"), value: 0, or: false, lethal: false, immunity: false},
            {uid: 'incorporeal', name: game.i18n.localize("D35E.Incorporeal"), value: 0, or: false, lethal: false, immunity: false}]
        return damageTypes.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }

    static getDRDamageTypes() {
        let damageTypes = ActorDamageHelper.getBaseDRDamageTypes();
        return damageTypes;
    }

    static getDRForActor(actor, base = false) {
        let damageTypes = duplicate(this.getDRDamageTypes());
        let actorData = actor.system;
        let actorDR = base ? actorData.damageReduction : actorData.combinedDR
        ActorDamageHelper.getDamageTypeForUID(damageTypes,'any').value = actorDR?.any || 0;
        (actorDR?.types || []).forEach(t => {
            if (t.uid === null) return ;
            let type = ActorDamageHelper.getDamageTypeForUID(damageTypes,t.uid);
            type.value = t.value;
            type.or = t.or;
            type.lethal = t.lethal;
            type.immunity = t.immunity;
            type.modified = t.modified;
            type.items = t.items;
            type.providedBy = t.providedBy;
            type.isPool = t.isPool;
        })
        return damageTypes;
    }

    /**
     * This creates map in format that is used by the actor template
     * @param dr data resistances in format provided by this class
     * @returns {{}} map in correct format to be persisted in actor
     */
    static getActorMapForDR(dr) {
        let damageReduction = {}
        damageReduction['any'] = ActorDamageHelper.getDamageTypeForUID(dr,'any').value;
        damageReduction['types'] = []
        dr.forEach(t => {
            if (t.uid === "any") return;
            damageReduction['types'].push(ActorDamageHelper.getDamageTypeForUID(dr,t.uid));
        })
        return damageReduction;
    }

    static computeDRString(dr) {
        let or = game.i18n.localize("D35E.or")
        let and = game.i18n.localize("D35E.and")
        let DR = game.i18n.localize("D35E.DR")
        let lethal = game.i18n.localize("D35E.LethalDamageFrom")
        let immune = game.i18n.localize("D35E.Immunity")
        let drParts = [];
        let drOrParts = [];
        let orValue = 0;
        if (ActorDamageHelper.getDamageTypeForUID(dr,'any').value > 0) {
            drParts.push(`${DR} ${ActorDamageHelper.getDamageTypeForUID(dr,'any').value}/-`)
        }
        dr.forEach(t => {
            if (t.uid === "any") return;
            let drType = ActorDamageHelper.getDamageTypeForUID(dr,t.uid)
            if (drType.immunity) {
                if (drType.or) {
                    drOrParts.push(`${drType.name}`)
                    orValue = immune;
                } else {
                    drParts.push(`${DR} ${immune}/${drType.name}`)
                }
            }
            else if (drType.value > 0) {
                if (drType.or) {
                    drOrParts.push(`${drType.name}`)
                    orValue = drType.value
                } else {
                    drParts.push(`${DR} ${drType.value}/${drType.name}`)
                }
            }
            if (drType.lethal) {
                drParts.push(`${lethal} ${drType.name}`)
            }
        })
        if (drOrParts.length)
            drParts.push(`${DR} ${orValue}/${drOrParts.join(` ${or} `)}`)

        return drParts.join('; ')
    }

    static computeDRTags(dr) {
        let or = game.i18n.localize("D35E.or")
        let and = game.i18n.localize("D35E.and")
        let DR = game.i18n.localize("D35E.DR")
        let lethal = game.i18n.localize("D35E.LethalDamageFrom")
        let immune = game.i18n.localize("D35E.Immunity")
        let drParts = [];
        drParts.push('<ul class="traits-list">')
        let drOrParts = [];
        let orValue = 0;
        if (ActorDamageHelper.getDamageTypeForUID(dr,'any').value > 0) {
            drParts.push(`<li class="tag">${DR} ${ActorDamageHelper.getDamageTypeForUID(dr,'any').value}/-</li>`)
        }
        let drOrModified = false;
        dr.forEach(t => {
            if (t.uid === "any") return;
            let drType = ActorDamageHelper.getDamageTypeForUID(dr,t.uid)
            if (drType.immunity) {
                if (drType.or) {
                    drOrParts.push(`${drType.name}`)
                    orValue = immune;
                    drOrModified = drOrModified || t.modified;
                } else {
                    drParts.push(`<li class="tag ${t.modified ? 'modified' : ''}">${DR} ${immune}/${drType.name}</li>`)
                }
            }
            else if (drType.value > 0) {
                if (drType.or) {
                    drOrParts.push(`${drType.name}`)
                    orValue = drType.value
                    drOrModified = drOrModified || t.modified;
                } else {
                    drParts.push(`<li class="tag ${t.modified ? 'modified' : ''}">${DR} ${drType.value}/${drType.name}</li>`)
                }
            }
            if (drType.lethal) {
                drParts.push(`<li class="tag ${t.modified ? 'modified' : ''}">${lethal} ${drType.name}</li>`)
            }
        })
        if (drOrParts.length)
            drParts.push(`<li class="tag ${drOrModified ? 'modified' : ''}">${DR} ${orValue}/${drOrParts.join(` ${or} `)}</li>`)
        drParts.push('</ul>')
        return drParts.join('')
    }

    /**
     * Energy resistance part
     */

    static get defaultER() {
        return {
            uid: null,
            value: 0,
            vulnerable: false,
            immunity: false,
            lethal: false
        }
    }

    static getERDamageTypes() {
        let energyTypes = [];
        for(let damageType of CACHE.DamageTypes.values()) {
            if (damageType.system.damageType === "energy") {
                let energyType = {
                        uid: damageType.system.uniqueId,
                        name: damageType.name,
                        value: 0,
                        vulnerable: false,
                        immunity: false,
                        lethal: false
                    }
                    energyTypes.push(energyType)
            }
        }
        return energyTypes.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }

    static getERForActor(actor, base = false) {
        let damageTypes = duplicate(this.getERDamageTypes());
        let actorData = actor.system;
        ((base ? actorData.energyResistance : actorData.combinedResistances) || []).forEach(t => {
            if (t.uid === null) return ;
            let type = ActorDamageHelper.getDamageTypeForUID(damageTypes,t.uid);
            if (!type) return;
            type.value = t.value;
            type.vulnerable = t.vulnerable;
            type.immunity = t.immunity;
            type.lethal = t.lethal;
            type.half = t.half;
            type.modified = t.modified;
            type.items = t.items;
            type.providedBy = t.providedBy;
            type.isPool = t.isPool;
        })
        return damageTypes;
    }

    static getActorMapForER(er) {
        let energyResistance = []
        er.forEach(t => {
            if (t.uid === "any") return;
            energyResistance.push(ActorDamageHelper.getDamageTypeForUID(er,t.uid));
        })
        return energyResistance;
    }

    static computeERString(er) {
        let erParts = [];
        er.forEach(e => {
            if (e?.vulnerable) {
                erParts.push(`${e.name} ${game.i18n.localize("D35E.Vulnerability")}`)
            } else if (e?.immunity) {
                erParts.push(`${e.name} ${game.i18n.localize("D35E.Immunity")}`)
            } else if (e?.half) {
                erParts.push(`${e.name} ${game.i18n.localize("D35E.Half")}`)
            } else if (e?.lethal) {
                erParts.push(`${game.i18n.localize("D35E.LethalDamageFrom")} ${e.name}`)
            } else if (e.value > 0) {
                erParts.push(`${e.name} ${e.value}`)
            }
        });
        return erParts.join('; ')
    }

    static computeERTags(er) {
        let erParts = [];
        erParts.push('<ul class="traits-list">')
        er.forEach(e => {
            if (e?.vulnerable) {
                erParts.push(`<li class="tag ${e.modified ? 'modified' : ''}">${e.name} ${game.i18n.localize("D35E.Vulnerability")}</li>`)
            } else if (e?.immunity) {
                erParts.push(`<li class="tag ${e.modified ? 'modified' : ''}">${e.name} ${game.i18n.localize("D35E.Immunity")}</li>`)
            } else if (e?.half) {
                erParts.push(`<li class="tag ${e.modified ? 'modified' : ''}">${e.name} ${game.i18n.localize("D35E.Half")}</li>`)
            } else if (e?.lethal) {
                erParts.push(`<li class="tag ${e.modified ? 'modified' : ''}">${game.i18n.localize("D35E.LethalDamageFrom")} ${e.name}</li>`)
            } else if (e.value > 0) {
                erParts.push(`<li class="tag ${e.modified ? 'modified' : ''}">${e.name} ${e.value}</li>`)
            }
        });
        erParts.push('</ul>')
        return erParts.join('')
    }

    /**
     * Damage Calculation
     */
    static calculateDamageToActor(actor,damage,material,alignment,enh,nonLethal,noPrecision,incorporeal,applyHalf) {
        let er = ActorDamageHelper.getERForActor(actor).filter(d => d.value > 0 || d.vulnerable || d.immunity || d.lethal);
        let dr = ActorDamageHelper.getDRForActor(actor).filter(d => d.value > 0 || d.lethal || d.immunity);
        let hasRegeneration = !!actor.system.traits.regen;
        let nonLethalDamage = 0;
        let bypassedDr = new Set()
        let materialData = material?.system || material?.data
        if (enh > 0)
            bypassedDr.add("magic");
        if (enh > 5)
            bypassedDr.add("epic");
        if (alignment?.good)
            bypassedDr.add("good");
        if (alignment?.evil)
            bypassedDr.add("evil");
        if (alignment?.lawful)
            bypassedDr.add("lawful");
        if (alignment?.chaotic)
            bypassedDr.add("chaotic");
        if (incorporeal)
            bypassedDr.add("incorporeal");
        if (materialData?.isAdamantineEquivalent)
            bypassedDr.add("adamantine");
        if (materialData?.isAlchemicalSilverEquivalent)
            bypassedDr.add("silver");
        if (materialData?.isColdIronEquivalent)
            bypassedDr.add("coldiron");
        let damageBeforeDr = 0;

        //Checks for slashing/piercing/bludgeonign damage and typeless damage
        let hasAnyTypeDamage = false;
        let baseIsNonLethal = nonLethal || false;
        // Sum the damage for each damageTypeUid in the damage array, and remove duplicates from the damage array
        damage = this.mergeDamageTypes(damage);
        damage.forEach(d => {
            if (d.damageTypeUid) {
                let _damage = CACHE.DamageTypes.get(d.damageTypeUid)
                if (_damage.system.damageType === "type") {
                    if (noPrecision && d.damageTypeUid === "damage-precision")
                        return; // We drop out if we do not apply precision damage
                    if (_damage.system.isPiercing)
                        bypassedDr.add("piercing");
                    if (_damage.system.isSlashing)
                        bypassedDr.add("slashing");
                    if (_damage.system.isBludgeoning)
                        bypassedDr.add("bludgeoning");
                    damageBeforeDr += d.roll.total;
                    hasAnyTypeDamage = true;
                    if (d.damageTypeUid === "damage-nonlethal"){
                        baseIsNonLethal = true;
                    }
                }
            } else {
                damageBeforeDr += d.roll.total;
                hasAnyTypeDamage = true;
            }
        })
        if (hasAnyTypeDamage)
            damageBeforeDr = Math.max(1,damageBeforeDr) // This makes base damage minimum 1
        let filteredDr = dr.filter(d => bypassedDr.has(d.uid))
        let lethalDr = dr.filter(d => d.lethal)
        let hasLethalDr = dr.some(d => bypassedDr.has(d.uid))
        if (hasRegeneration && !hasLethalDr)
            baseIsNonLethal = true;
        let hasOrInFiltered = filteredDr.some(d => d.or);
        let finalDr = dr.filter(d => !bypassedDr.has(d.uid))
        if (hasOrInFiltered) {
            finalDr = finalDr.filter(d => !d.or)
        }
        let highestDr = 0;
        let appliedDr = null
        finalDr.forEach(d => {if (d.immunity || d.value > highestDr) {
            highestDr = d.immunity ? 65536 : d.value ;
            appliedDr = d;
        }});
        let realDamage = (applyHalf ? Math.floor(damageBeforeDr/2.0) : damageBeforeDr);
        let damageAfterDr = Math.max(realDamage - highestDr,0);
        let damagePoolPossibleReductionsUpdate = []
        let damageDifference = realDamage - damageAfterDr;
        if (damageDifference && appliedDr.providedBy && appliedDr.isPool)
            damagePoolPossibleReductionsUpdate.push({id:appliedDr.providedBy,value:damageDifference})
        if (baseIsNonLethal) {
            nonLethalDamage += damageAfterDr;
            damageAfterDr = 0;
        }
        let energyDamageAfterEr = 0
        let energyDamageBeforeEr = 0
        let energyDamage = []
        

        damage.forEach(d => {
            if (d.damageTypeUid) {
                let _damage = CACHE.DamageTypes.get(d.damageTypeUid)
                if (_damage.system.damageType === "energy") {
                    let erValue = ActorDamageHelper.getDamageTypeForUID(er,d.damageTypeUid)
                    let realDamage = (applyHalf ? Math.floor(d.roll.total/2.0) : d.roll.total);
                    let damageAfterEr = Math.max(realDamage - (erValue?.value || 0),0)

                    if (d.damageTypeUid === 'damage-healing')
                        damageAfterEr =- damageAfterEr;
                    else if (actor.system.attributes?.creatureType === "undead" && d.damageTypeUid === "energy-negative")
                        damageAfterEr =- damageAfterEr;
                    else if (actor.system.attributes?.creatureType !== "undead" && d.damageTypeUid === "energy-positive")
                        damageAfterEr =- damageAfterEr;
                    
                    let value = erValue?.value
                    if (erValue?.immunity) {
                        damageAfterEr = 0;
                        value = game.i18n.localize("D35E.Immunity")
                    }
                    else if (hasRegeneration && !erValue?.lethal) {
                        if (damageAfterEr > 0) {
                            nonLethalDamage += damageAfterEr;
                            damageAfterEr = 0;
                            value = game.i18n.localize("D35E.WeaponPropNonLethal")
                        }
                    }
                    else if (erValue?.vulnerable) {
                        damageAfterEr = Math.ceil(realDamage * 1.5)
                        value = game.i18n.localize("D35E.Vulnerability")
                    } else if (erValue?.half) {
                        damageAfterEr = Math.ceil(damageAfterEr * 0.5)
                        value = game.i18n.localize("D35E.Half")
                    } else if (damageAfterEr === realDamage) {
                        value = game.i18n.localize("D35E.NoER")
                    }
                    let damageDifference = realDamage-damageAfterEr;
                    energyDamage.push({nonLethal: hasRegeneration && !erValue?.lethal,name:_damage.name,uid:_damage.system.uniqueId,before:d.roll.total,after:damageAfterEr,value:value || 0,lower:damageAfterEr<d.roll.total,higher:damageAfterEr>d.roll.total,equal:d.roll.total===damageAfterEr});
                    energyDamageAfterEr += damageAfterEr;
                    energyDamageBeforeEr += d.roll.total;
                    if (damageDifference && erValue?.providedBy && erValue?.isPool)
                        damagePoolPossibleReductionsUpdate.push({id:erValue.providedBy,value:damageDifference})

                    if (d.damageTypeUid === "energy-positive" || d.damageTypeUid === "energy-negative" || d.damageTypeUid === "energy-force") {
                        incorporeal = true; //These energy damages always are treated as incorporeal
                    }
                }
            }
        })



        let beforeDamage = damageBeforeDr + energyDamageBeforeEr;
        let afterDamage = energyDamageAfterEr + damageAfterDr;
        let incorporealMiss = false;
        let incorporealRoll = Math.random();
        let incorporealRolled = false;
        if (actor.system.traits.incorporeal && !incorporeal) {
            incorporealRolled = true;
            if (incorporealRoll < 0.5 || enh < 1){
                afterDamage = 0;
                energyDamageAfterEr = 0;
                damageAfterDr = 0;
                nonLethalDamage = 0;
                incorporealMiss = true;
            }
        }
        return {
            beforeDamage: beforeDamage,
            damage: afterDamage,
            baseIsNonLethal: baseIsNonLethal,
            nonLethalDamage: nonLethalDamage,
            displayDamage: Math.abs(afterDamage),
            isHealing: afterDamage < 0,
            baseBeforeDR: damageBeforeDr,
            baseAfterDR: damageAfterDr,
            energyDamageBeforeEr: energyDamageBeforeEr,
            energyDamageAfterEr: energyDamageAfterEr,
            lower:afterDamage<beforeDamage,
            higher:afterDamage>beforeDamage,
            equal:afterDamage===beforeDamage,
            appliedDR: appliedDr,
            energyDamage: energyDamage,
            incorporealRoll: Math.floor(incorporealRoll * 100),
            incorporealRolled: incorporealRolled,
            damagePoolPossibleReductionsUpdate: damagePoolPossibleReductionsUpdate,
            incorporealMiss: incorporealMiss};
    }

    static mergeDamageTypes(damage) {
        let damageMap = new Map();
        let finalDamageArray = [];
        damage.forEach(d => {
            if (d.damageTypeUid) {
                if (!damageMap.has(d.damageTypeUid)) {
                    damageMap.set(d.damageTypeUid, d);
                } else {
                    // Add the damage to existing damage roll total
                    damageMap.get(d.damageTypeUid).roll.total += d.roll.total;
                }
            } else {
                finalDamageArray.push(d);
            }
        });
        finalDamageArray.push(...damageMap.values());
        return finalDamageArray;
    }

    static mapDamageType(type) {
        for (let damageType of CACHE.DamageTypes.values()) {
            let identifiers = damageType.system.identifiers;
            if (identifiers.some(i => i[0].toLowerCase() === type.toLowerCase()))
                return damageType.system.uniqueId;
        }
        return type;
    }

    static isDamageType(type) {
        for (let damageType of CACHE.DamageTypes.values()) {
            let identifiers = damageType.system.identifiers;
            if (identifiers.some(i => i[0].toLowerCase() === type.toLowerCase()))
                return true;
        }
        return false;
    }

    static nameByType(type) {
        for (let damageType of CACHE.DamageTypes.values()) {
            let identifiers = damageType.system.identifiers;
            if (identifiers.some(i => i[0].toLowerCase() === type.toLowerCase()))
                return damageType.name;
        }
        return type;
    }

    static getDamageIcon(dmgName) {
        let dmgIconBase = dmgName?.toLowerCase() || "";
        let dmgIcon = "unknown";
        if (dmgIconBase.includes("energy-")) {
            dmgIconBase = dmgIconBase.replace("energy-", "");
        }
        switch (dmgIconBase) {
            case "fire":
            case "f":
                dmgIcon = "fire";
                break;
            case "cold":
            case "c":
                dmgIcon = "cold";
                break;
            case "electricity":
            case "electric":
            case "el":
            case "e":
                dmgIcon = "electricity";
                break;
            case "acid":
            case "a":
                dmgIcon = "acid";
                break;
            case "sonic":
                dmgIcon = "sonic";
                break;
            case "air":
                dmgIcon = "air";
                break;
            case "piercing":
            case "p":
                dmgIcon = "p";
                break;
            case "slashing":
            case "s":
                dmgIcon = "s";
                break;
            case "bludgeoning":
            case "b":
                dmgIcon = "b";
                break;
            case "unarmed":
                dmgIcon = "unarmed";
                break;
            case "positive energy":
                dmgIcon = "positive-energy";
                break;
            case "force":
                dmgIcon = "force";
                break;
            case "negative energy":
                dmgIcon = "negative-energy";
                break;
            default:
                return "unknown";
        }
        return dmgIcon;
    }
}
