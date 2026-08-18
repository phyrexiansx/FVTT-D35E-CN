import {LogHelper} from "../../helpers/LogHelper.js";

export class ActorMinionsHelper {
    static async calculateMinionDistance(master) {
        if (master == null) return;
        if (!master.testUserPermission(game.user, "OWNER")) return;
        if (master.data.type === "npc") {
            let myToken = master.getActiveTokens()[0];
            let masterId = master.system?.master?.id;
            let master = game.actors.get(masterId);
            if (!master || !master.getActiveTokens()) return;
            let masterToken = master.getActiveTokens()[0];
            if (!!myToken && !!masterToken) {
                let distance = Math.floor(canvas.grid.measureDistance(myToken, masterToken) / 5.0) * 5;
                let masterData = {
                    data: {
                        master: {
                            distance: distance
                        }
                    }
                };
                let minionData = {
                    data: {
                        attributes: {minionDistance: {}}
                    }
                };
                minionData.system.attributes.minionDistance[master.data.name.toLowerCase().replace(/ /g, '').replace(/,/g, '')] = distance
                master.update(minionData, {stopUpdates: true, skipToken: true, skipMinions: true});
                master.update(masterData, {stopUpdates: true, skipToken: true});
            }
        } else if (master.data.type === "character") {
            let myToken = master.getActiveTokens()[0];
            let minionData = {
                data: {
                    attributes: {minionDistance: {}}
                }
            };
            let hasAnyMinion = false;
            game.actors.forEach(minion => {
                if (minion.system?.master?.id === master.id) {
                    hasAnyMinion = true;
                    let minionToken = minion.getActiveTokens()[0]
                    if (!!myToken && !!minionToken) {
                        let distance = Math.floor(canvas.grid.measureDistance(myToken, minionToken) / 5.0) * 5;
                        let masterData = {
                            data: {
                                master: {
                                    distance: distance
                                }
                            }
                        };
                        minionData.attributes.minionDistance[minion.data.name.toLowerCase().replace(/ /g, '').replace(/,/g, '')] = distance
                        minion.update(masterData, {stopUpdates: true, skipToken: true});
                    }
                }
            });
            if (hasAnyMinion)
                master.update(minionData, {stopUpdates: true, skipToken: true, skipMinions: true});
        }
    }

    static async updateMinions(master, options) {
        if (options.skipMinions) return;

        const rollData = master.getRollData();   // 只算一次
        const minionLevels = rollData.attributes?.minionClassLevels || {};

        // 通用：同步一个 Actor（主控或追随者）身上的随从职业等级
        const syncClass = async (target) => {
            const minionClass = target.items.find(
                (o) => o.type === "class" && getProperty(o.system, "classType") === "minion");
            if (!minionClass) return;

            const group = (minionClass.system.minionGroup || '').toLowerCase();
            const level = minionLevels[group] ?? 0;
            if (Number(minionClass.system.levels) === Number(level)) return; // 没变化不写

            await target.updateEmbeddedDocuments('Item', [{
                _id: minionClass.id || minionClass._id,
                'system.levels': level,
            }], {stopUpdates: true, massUpdate: true});
        };

        // 0) 主控自己身上若有随从职业，也同步
        await syncClass(master);

        for (const minion of game.actors) {
            if (minion.system?.master?.id !== master.id) continue;

            // 1) 同步主控信息
            await minion.update({
                system: {
                    master: {
                        img: master.img,
                        name: master.name,
                        data: rollData,
                    },
                },
            }, {stopUpdates: true});

            // 2) 同步追随者职业等级
            await syncClass(minion);
        }
    }


    // static async updateMinions(master, options) {
    //     if (options.skipMinions) return;
    //     for (const minion of game.actors) {
    //         if (minion.system?.master?.id === master.id) {
    //             let masterData = {
    //                 data : {
    //                     master : {
    //                         img: master.img,
    //                         name: master.name,
    //                         data: master.getRollData(),
    //                     }
    //                 }
    //             };
    //
    //             // Updating minion "Familiar class"
    //             const classes = minion.data.items.filter(obj => {
    //                 return obj.type === "class";
    //             });
    //
    //             const minionClass = classes.find(o => getProperty(o.system, "classType") === "minion");
    //             if (!!minionClass) {
    //                 let updateObject = {}
    //                 updateObject["_id"] = minionClass.id || minionClass._id;
    //                 updateObject["data.levels"] = master.getRollData().attributes.minionClassLevels[minionClass.system.minionGroup] || 0;
    //                 LogHelper.log('Minion class', minionClass, updateObject, master.getRollData(), )
    //                 await minion.updateOwnedItem(updateObject, {stopUpdates: true, massUpdate: true})
    //             }
    //             minion.update(masterData, {stopUpdates: true});
    //         }
    //     }
    // }
}
