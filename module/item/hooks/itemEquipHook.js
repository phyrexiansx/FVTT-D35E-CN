/**
 * ItemEquipHook — 装备槽位核心钩子
 * 移植自 dragonshorn/D35E（上游最新版），并适配本魔改版（FVTT V11 API）。
 * 职责：
 *  - 槽位容量检查（装备时若槽位已满则拦截，GM 可确认强制装备）
 *  - slotSource（槽位来源标记）的生命周期管理
 *  - 提供者槽位（通过 changes 授予额外槽位，如 "slot.ring" +2）的连锁自动卸装/重装
 */
export class ItemEquipHook {
  /**
   * 解析装备物品实际占用的身体槽位。
   * 护甲/盾牌使用 equipmentType 作为槽位（其 slot 字段为 "slotless"），
   * 奇物等杂项使用 system.slot。
   * @param {Item} item
   * @returns {string|null} 槽位键；不占用任何追踪槽位时返回 null
   */
  static getEffectiveSlot(item) {
    if (item.type !== "equipment") return null;
    const equipmentType = item.system?.equipmentType;
    if (equipmentType === "armor")  return "armor";
    if (equipmentType === "shield") return "shield";
    const slot = item.system?.slot;
    return (!slot || slot === "slotless") ? null : slot;
  }

  static isSlotFull(actor, item, excludeId = null) {
    const slot = ItemEquipHook.getEffectiveSlot(item);
    if (!slot) return false;
    const capacity = actor.system?.slotCapacities?.[slot] ?? 1;
    const used = actor.items.filter(i =>
      i.id !== excludeId &&
      i.type === "equipment" &&
      i.system.equipped &&
      ItemEquipHook.getEffectiveSlot(i) === slot
    ).length;
    return used >= capacity;
  }

  /**
   * 槽位已满时给出提示；GM 可弹出确认对话框。
   * 返回 Promise<boolean>：true 表示继续装备。非 GM 恒为 false。
   * @param {string} slot
   * @param {number} capacity
   * @returns {Promise<boolean>}
   */
  static async _promptSlotFull(slot, capacity) {
    const slotLabel = game.i18n.localize(`D35E.EquipSlot${slot.charAt(0).toUpperCase()}${slot.slice(1)}`);
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.format("D35E.SlotFull", { slot: slotLabel, capacity }));
      return false;
    }
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("D35E.SlotFullTitle"),
        content: `<p>${game.i18n.format("D35E.SlotFullConfirm", { slot: slotLabel, capacity })}</p>`,
        buttons: {
          yes: {
            label: game.i18n.localize("D35E.Yes"),
            callback: () => resolve(true),
          },
          no: {
            label: game.i18n.localize("D35E.No"),
            callback: () => resolve(false),
          },
        },
        default: "no",
        close: () => resolve(false),
      }).render(true);
    });
  }

  /** 判断物品的 Changes 中是否包含授予额外槽位的内容 */
  static _hasSlotChanges(item) {
    // Changes 结构：[value, target, subTarget, ...]
    return (item.system?.changes ?? []).some(c => typeof c[2] === "string" && c[2].startsWith("slot."));
  }

  /** 汇总 changes 中按槽位键授予的数量，如 { ring: 2, neck: 1 } */
  static _slotGrantsFromChanges(changes = []) {
    const grants = {};
    for (const ch of changes) {
      if (typeof ch[2] === "string" && ch[2].startsWith("slot.") && Number(ch[0]) > 0) {
        const key = ch[2].slice(5);
        grants[key] = (grants[key] ?? 0) + Number(ch[0]);
      }
    }
    return grants;
  }

  /** 卸下并清除所有引用该提供者的 slotSource 数据 */
  static async _clearProviderSlotData(actor, providerName) {
    const affected = actor.items.filter(i => {
      const src = i.getFlag("D35E", "slotSource");
      return src === providerName || (src && src.startsWith(providerName + ":"));
    });
    for (const item of affected) {
      if (item.system.equipped) {
        await item.update({ "system.equipped": false }, { _forceUnequip: true });
      }
      await item.unsetFlag("D35E", "slotSource");
    }
  }

  /** 卸下所有占用指定提供者槽位的物品（保留 slotSource 以便重装时恢复） */
  static async _unequipProviderItems(actor, providerName) {
    const toUnequip = actor.items.filter(i => {
      if (i.type !== "equipment" || !i.system.equipped) return false;
      const src = i.getFlag("D35E", "slotSource");
      return src === providerName || (src && src.startsWith(providerName + ":"));
    });
    for (const item of toUnequip) {
      // 保留 slotSource，_reequipProviderItems 会在提供者重新装备时恢复
      await item.update({ "system.equipped": false }, { _forceUnequip: true });
    }
  }

  /** 提供者重新装备/激活时，恢复占用其槽位的物品 */
  static async _reequipProviderItems(actor, providerName) {
    const toReequip = actor.items.filter(i => {
      if (i.type !== "equipment" || i.system.equipped) return false;
      const src = i.getFlag("D35E", "slotSource");
      return src === providerName || (src && src.startsWith(providerName + ":"));
    });
    for (const item of toReequip) {
      await item.update({ "system.equipped": true }, { _slotBypass: true });
    }
  }

  static register() {
    Hooks.on("preCreateItem", (item, d, options, user) => {
      if (!(item.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      if (item.system.equipped === true && ['weapon', 'equipment'].includes(item.type)) {
        Hooks.call("D35E.ItemEquip.preEquipItem", item, options, user);
      }
    });

    Hooks.on("createItem", (item, options, user) => {
      if (!(item.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      if (!['weapon', 'equipment'].includes(item.type)) return;
      if (item.system.equipped !== true) return;

      // 默认穿戴：新获得的武器/装备默认装备（createEmbeddedEntity 已设置 equipped=true）。
      // 容器内物品不参与默认穿戴；装备槽已满时默认不装。
      if (item.system.containerId && item.system.containerId !== "none") {
        item.update({ "system.equipped": false }, { _forceUnequip: true });
        return;
      }
      if (ItemEquipHook.isSlotFull(item.parent, item, item.id)) {
        item.update({ "system.equipped": false }, { _forceUnequip: true });
        return;
      }
      Hooks.call("D35E.ItemEquip.postEquipItem", item, options, user);
    });

    Hooks.on("preDeleteItem", (data, options, user) => {
      if (!(data.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      Hooks.call("D35E.ItemEquip.preUnequipItem", data, options, user);
    });

    Hooks.on("deleteItem", (data, options, user) => {
      if (!(data.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      Hooks.call("D35E.ItemEquip.postUnequipItem", data, options, user);

      // 删除提供者时，自动卸下占用其槽位的物品
      if (ItemEquipHook._hasSlotChanges(data)) {
        ItemEquipHook._unequipProviderItems(data.parent, data.id).catch(err =>
          console.error("D35E | Error auto-unequipping provider items on delete:", err)
        );
      }
    });

    Hooks.on("preUpdateItem", (data, updateData, options, user) => {
      if (!(data.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      if (options._forceUnequip) return;

      // 记录提供者状态变化，供 updateItem 钩子做连锁处理
      if (ItemEquipHook._hasSlotChanges(data)) {
        if (updateData.system?.equipped === false && data.system.equipped === true) {
          options._wasProviderUnequipped = data.id;
        }
        if (updateData.system?.active === false && data.system.active === true) {
          options._wasProviderDeactivated = data.id;
        }
        if (updateData.system?.changes !== undefined) {
          const oldGrants = ItemEquipHook._slotGrantsFromChanges(data.system.changes);
          const newGrants = ItemEquipHook._slotGrantsFromChanges(updateData.system.changes);
          const reduced = Object.keys(oldGrants).some(k => (newGrants[k] ?? 0) < oldGrants[k]);
          if (reduced) options._providerSlotsReduced = data.id;
        }
      }

      if (updateData.system?.equipped === undefined) return;
      // 装备时（false → true）进行槽位容量检查，_slotBypass 时跳过
      if (!options._slotBypass &&
          data.type === "equipment" &&
          data.system.equipped === false &&
          updateData.system.equipped === true) {
        const actor = data.parent;
        if (ItemEquipHook.isSlotFull(actor, data, data.id)) {
          const slot = ItemEquipHook.getEffectiveSlot(data);
          const capacity = actor.system?.slotCapacities?.[slot] ?? 1;
          ItemEquipHook._promptSlotFull(slot, capacity).then(confirmed => {
            if (confirmed) {
              data.update(updateData, { ...options, _slotBypass: true });
            }
          }).catch(err => console.error("D35E | Slot capacity dialog error:", err));
          return false;
        }
      }
      if (data.system.equipped === false && data.system.equipped != updateData.system.equipped && ['weapon', 'equipment'].includes(data.type)) {
        Hooks.call("D35E.ItemEquip.preEquipItem", data, options, user);
      } else if (data.system.equipped === true && data.system.equipped != updateData.system.equipped && ['weapon', 'equipment'].includes(data.type)) {
        Hooks.call("D35E.ItemEquip.preUnequipItem", data, options, user);
      }
    });

    Hooks.on("updateItem", (data, updateData, options, user) => {
      if (!(data.parent instanceof Actor)) return;
      if (user !== game.userId) return;
      if (options._forceUnequip) return;

      // preUpdateItem 将提供者 ID 暂存于 options；此处文档已变更，可安全执行异步连锁
      if (options._wasProviderUnequipped || options._wasProviderDeactivated) {
        const providerId = options._wasProviderUnequipped ?? options._wasProviderDeactivated;
        ItemEquipHook._unequipProviderItems(data.parent, providerId).catch(err =>
          console.error("D35E | Error auto-unequipping provider items on update:", err)
        );
      }

      // 提供者槽位被缩减时，清除已失效位置上的物品数据
      if (options._providerSlotsReduced) {
        ItemEquipHook._clearProviderSlotData(data.parent, options._providerSlotsReduced).catch(err =>
          console.error("D35E | Error clearing slot data on provider slot reduction:", err)
        );
      }

      // 提供者重新装备时，恢复占用其槽位的物品
      if (updateData.system?.equipped === true && ItemEquipHook._hasSlotChanges(data)) {
        ItemEquipHook._reequipProviderItems(data.parent, data.id).catch(err =>
          console.error("D35E | Error re-equipping provider items on update:", err)
        );
      }

      // 手动卸下时清除 slotSource，释放槽位位置
      if (updateData.system?.equipped === false) {
        data.unsetFlag("D35E", "slotSource").catch(err =>
          console.error("D35E | Error clearing slotSource on manual unequip:", err)
        );
      }

      if (updateData.system?.equipped === undefined) return;
      if (data.system.equipped === true && ['weapon', 'equipment'].includes(data.type)) {
        Hooks.call("D35E.ItemEquip.postEquipItem", data, options, user);
      } else if (data.system.equipped === false && ['weapon', 'equipment'].includes(data.type)) {
        Hooks.call("D35E.ItemEquip.postUnequipItem", data, options, user);
      }
    });
  }
}
