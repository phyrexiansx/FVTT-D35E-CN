import { AuraMeasureDistance } from "./aura-measure-distance.js";

const AuraDebug = false;

export const AURAS = {};

function getAuraShape(source, radius) {
  const gs = canvas.dimensions.size;
  const gd = gs / canvas.dimensions.distance;
  return new PIXI.Circle(source.center.x, source.center.y, radius * gd + (source.width / 2) * gs);
}

function getActor(source) {
  if (source.document.actorLink) {
    return game.actors.get(source.document.actorId) || { auras: [] };
  } else {
    return source.actor || { auras: [] };
  }
}

function isCorrectAlliance(source, target, auraTarget) {
  switch (auraTarget) {
    case "enemy":
      return source.document.disposition !== target.document.disposition;
    case "ally":
      return source.document.disposition === target.document.disposition;
    default:
      return true;
  }
}

export async function CollateAuras(sceneID, checkAuras, removeAuras, source) {
  if (AURAS.runningUpdate) {
    AURAS.queued = true;
    return;
  }
  if (!AURAS.runningUpdate) AURAS.runningUpdate = true;
  if (!game.user.isGM) return;
  if (sceneID !== canvas.id)
    return ui.notifications.warn(
      "Collate Auras called on a non viewed scene, auras will be updated when you return to that scene"
    );

  let perfStart;
  let perfEnd;
  if (AuraDebug) perfStart = performance.now();

  let actorsAurasToAdd = new Map();
  let actorsAurasToRemove = new Map();
  let actorsAurasAlreadyPresent = new Map();
  let actorsAurasAlreadyPresentIds = new Map();
  let actorModifiedAuras = new Map();
  let actorAlreadyChecked = new Set();

  // This gets

  for (const source of canvas.tokens.placeables) {
    if (!actorsAurasAlreadyPresent.has(source.id)) {
      actorsAurasAlreadyPresent.set(source.id, new Set());
      actorsAurasAlreadyPresentIds.set(source.id, new Set());
    }
    for (let aura of getActor(source).auras) {
      actorsAurasAlreadyPresent.get(source.id).add(aura.system.sourceAuraId);
      actorsAurasAlreadyPresentIds.get(source.id).add(aura.id);
    }
    actorModifiedAuras.set(source.id, new Set());
  }

  for (const source of canvas.tokens.placeables) {
    if (!source.actor) continue;
    for (let aura of getActor(source).auras) {
      // 绑定光环（auraMode === "linked"）不走距离计算流程，由 SyncLinkedAuras 统一管理
      if (getProperty(aura.system, "auraMode") === "linked") continue;
      if (aura.system.sourceTokenId && !canvas.tokens.get(aura.system.sourceTokenId)) {
        if (!actorsAurasToRemove.has(source.id)) actorsAurasToRemove.set(source.id, []);
        actorsAurasToRemove.get(source.id).push(aura.id);
        actorModifiedAuras.get(source.id).add(aura.id);
      }
      for (const target of canvas.tokens.placeables) {
        if (!target.actor || !source.actor) continue;
        let targetName = target.actor.name;
        let sourceName = source.actor.name;
        if (aura.system.sourceTokenId) {
          if (target.id === source.id) continue;
          if (target.actor.id === source.actor.id) continue;
          if (target.id === aura.system.sourceTokenId) {
            let inAura = await AuraMeasureDistance.inAura(
              source,
              target,
              true,
              0,
              aura.system.range || 5,
              getAuraShape(target, aura.system.range || 5)
            );
            if (
              !inAura ||
              !isCorrectAlliance(source, target, aura.system.auraTarget) ||
              !actorsAurasAlreadyPresentIds.get(target.id).has(aura.system.sourceAuraId)
            ) {
              if (!actorsAurasToRemove.has(source.id)) actorsAurasToRemove.set(source.id, []);
              actorsAurasToRemove.get(source.id).push(aura.id);
              actorModifiedAuras.get(source.id).add(aura.id);
            }
          }
        } else {
          if (target.id === source.id) continue;
          if (target.actor.id === source.actor.id) continue;
          let inAura = await AuraMeasureDistance.inAura(
            target,
            source,
            true,
            0,
            aura.system.range || 5,
            getAuraShape(source, aura.system.range || 5)
          );
          if (inAura) {
            if (
              !actorsAurasAlreadyPresent.get(target.id).has(aura.id) &&
              !actorModifiedAuras.get(target.id).has(aura.id) &&
              isCorrectAlliance(source, target, aura.system.auraTarget)
            ) {
              if (!actorsAurasToAdd.has(target.id)) actorsAurasToAdd.set(target.id, []);

              let auraToAdd = aura.toObject(false);
              auraToAdd.system.sourceTokenId = source.id;
              auraToAdd.system.sourceActorId = source.actor.id;
              auraToAdd.system.sourceAuraId = aura.id;
              auraToAdd.system.sourceActorName = source.actor.name;
              delete auraToAdd.id;

              actorsAurasToAdd.get(target.id).push(auraToAdd);
            }
            actorModifiedAuras.get(target.id).add(aura.id);
          }
        }
      }
    }
  }
  let updatePromises = [];
  for (const source of canvas.tokens.placeables) {
    if (actorsAurasToAdd.get(source.id)?.length > 0) {
      updatePromises.push(
        getActor(source).createEmbeddedDocuments("Item", actorsAurasToAdd.get(source.id), { stopAuraUpdate: false })
      );
    }
    if (actorsAurasToRemove.get(source.id)?.length > 0) {
      try {
        updatePromises.push(
          getActor(source).deleteEmbeddedDocuments("Item", actorsAurasToRemove.get(source.id), {
            stopAuraUpdate: false,
          })
        );
      } catch (e) {}
    }
  }
  await Promise.all(updatePromises);

  if (AuraDebug) {
    perfEnd = performance.now();
    game.D35E.logger.log(`Active Auras Main Function took ${perfEnd - perfStart} ms, FPS:${Math.round(canvas.app.ticker.FPS)}`);
  }

  AURAS.runningUpdate = false;
  // We have a queued run from other source, that did go pas debounce
  if (AURAS.queued) {
    ui.notifications.warn("Running queued Aura update, last aura update pass took too long.");
    AURAS.queued = false;
    CollateAuras(sceneID, checkAuras, removeAuras, source);
  }
}

/* -------------------------------------------- */
/*  绑定光环（Linked Aura）                        */
/*  不计算距离：从光环发出者手动指定目标，目标 actor    */
/*  获得一份复制品；源光环更新时复制品自动同步，        */
/*  源光环删除/失活/目标移除时复制品自动删除。          */
/* -------------------------------------------- */

function _linkedDeepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => _linkedDeepEqual(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && _linkedDeepEqual(a[k], b[k]));
}

function _allActors() {
  const out = [];
  const seen = new Set();
  for (const actor of game.actors.values()) {
    if (!actor) continue;
    if (seen.has(actor.id)) continue;
    seen.add(actor.id);
    out.push(actor);
  }
  for (const actor of Object.values(game.actors.tokens || {})) {
    if (!actor) continue; // 场景初始化（Canvas.draw）期间 tokens 集合可能含 null 占位
    if (seen.has(actor.id)) continue;
    seen.add(actor.id);
    out.push(actor);
  }
  return out;
}

/**
 * 解析绑定目标。
 * @param {{actorId: string, tokenId: string, name: string}} t
 * @returns {Actor|null} 目标 actor；无法解析（如 token 不在当前场景）返回 null
 */
function _resolveLinkedTarget(t) {
  if (t && t.tokenId) {
    const token = canvas?.scene?.tokens?.get(t.tokenId);
    if (!token) return null;
    return token.actor || null;
  }
  if (!t || !t.actorId) return null;
  return game.actors.get(t.actorId) || game.actors.tokens?.[t.actorId] || null;
}

/**
 * 由源光环生成一份复制品数据（携带来源身份，保留 auraMode="linked"
 * 以阻止复制品被距离光环流程再次处理）。
 */
function _linkedCopyData(sourceActor, sourceAura) {
  const src = sourceAura.toObject(false);
  delete src._id;
  delete src.id;
  src.system.sourceTokenId = "";
  src.system.sourceActorId = sourceActor.id;
  src.system.sourceAuraId = sourceAura.id;
  src.system.sourceActorName = sourceActor.name;
  src.system.linkedTargets = []; // 复制品不继承目标列表
  return src;
}

/**
 * 对比现有复制品与源光环数据，返回需要推送的更新（不含来源身份字段）。
 * @returns {object|null}
 */
function _diffLinkedCopy(copy, srcData) {
  const updates = { _id: copy.id };
  let changed = false;
  if (copy.name !== srcData.name) {
    updates.name = srcData.name;
    changed = true;
  }
  if (copy.img !== srcData.img) {
    updates.img = srcData.img;
    changed = true;
  }
  for (const key of Object.keys(srcData.system || {})) {
    if (key.startsWith("source") || key === "linkedTargets") continue;
    const cur = copy.system?.[key];
    const next = srcData.system[key];
    if (!_linkedDeepEqual(cur, next)) {
      updates[`system.${key}`] = next;
      changed = true;
    }
  }
  return changed ? updates : null;
}

/**
 * 全量对账所有绑定光环：
 *  - 缺失的复制品 → 创建
 *  - 内容过期的复制品 → 同步
 *  - 源失活 / 目标被移除 / 目标无法解析 → 删除复制品
 * 不依赖 canvas，可在任何场景状态下运行；仅 GM 执行。
 */
export async function SyncLinkedAuras() {
  if (!game.user?.isGM) return;
  if (AURAS.linkedRunning) return; // 防重入
  AURAS.linkedRunning = true;
  try {

  const allActors = _allActors();
  const sources = [];
  for (const actor of allActors) {
    if (!actor?.items) continue;
    for (const item of actor.items) {
      if (
        item.type === "aura" &&
        getProperty(item.system, "auraMode") === "linked" &&
        !getProperty(item.system, "sourceAuraId")
      ) {
        sources.push({ sourceActor: actor, sourceAura: item });
      }
    }
  }

  const toDelete = new Map(); // actorId -> [itemIds]

  for (const { sourceActor, sourceAura } of sources) {
    const active = getProperty(sourceAura.system, "active") !== false;
    const targets = (getProperty(sourceAura.system, "linkedTargets") || []).filter((t) => t && t.actorId);
    const keepTargets = new Set();

    if (active) {
      for (const t of targets) {
        const targetActor = _resolveLinkedTarget(t);
        if (!targetActor || targetActor.id === sourceActor.id) continue;
        keepTargets.add(targetActor.id);
        const copy = targetActor.items.find(
          (i) => i.type === "aura" && getProperty(i.system, "sourceAuraId") === sourceAura.id
        );
        const srcData = _linkedCopyData(sourceActor, sourceAura);
        if (!copy) {
          await targetActor.createEmbeddedDocuments("Item", [srcData], { stopLinkedSync: true });
        } else {
          const diff = _diffLinkedCopy(copy, srcData);
          if (diff) {
            await targetActor.updateEmbeddedDocuments("Item", [diff], { massUpdate: true, stopLinkedSync: true });
          }
        }
      }
    }

    // 清理：源失活 / 目标不在绑定列表 / 目标无法解析 / 目标就是源自己
    for (const targetActor of allActors) {
      if (!targetActor?.items) continue;
      for (const item of targetActor.items) {
        if (item.type !== "aura" || getProperty(item.system, "sourceAuraId") !== sourceAura.id) continue;
        if (item.id === sourceAura.id) continue;
        const keep = active && keepTargets.has(targetActor.id);
        if (!keep) {
          if (!toDelete.has(targetActor.id)) toDelete.set(targetActor.id, []);
          toDelete.get(targetActor.id).push(item.id);
        }
      }
    }
  }

  for (const [actorId, ids] of toDelete) {
    const actor = game.actors.get(actorId) || game.actors.tokens?.[actorId];
    if (actor && ids.length) {
      await actor.deleteEmbeddedDocuments("Item", ids, { stopLinkedSync: true });
    }
  }
  } finally {
    AURAS.linkedRunning = false;
  }
}

/** 源光环物品被删除时：删除所有指向它的复制品 */
export async function deleteLinkedCopies(sourceAuraId) {
  if (!game.user?.isGM || !sourceAuraId) return;
  for (const actor of _allActors()) {
    if (!actor?.items) continue;
    const ids = actor.items
      .filter((i) => i.type === "aura" && getProperty(i.system, "sourceAuraId") === sourceAuraId)
      .map((i) => i.id);
    if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids, { stopLinkedSync: true });
  }
}

/** 源 actor（或 unlinked token）被删除时：删除所有来源为它的复制品 */
export async function deleteCopiesBySourceActorId(sourceActorId) {
  if (!game.user?.isGM || !sourceActorId) return;
  for (const actor of _allActors()) {
    if (!actor?.items) continue;
    const ids = actor.items
      .filter((i) => i.type === "aura" && getProperty(i.system, "sourceActorId") === sourceActorId)
      .map((i) => i.id);
    if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids, { stopLinkedSync: true });
  }
}

/** 复制品被手动删除时：把对应目标从源光环的 linkedTargets 里移除，防止下次同步又重建 */
export async function unlinkDeletedCopy(copy) {
  if (!game.user?.isGM) return;
  const sourceActorId = getProperty(copy.system, "sourceActorId");
  const sourceAuraId = getProperty(copy.system, "sourceAuraId");
  if (!sourceActorId || !sourceAuraId) return;
  const sourceActor = game.actors.get(sourceActorId) || game.actors.tokens?.[sourceActorId];
  if (!sourceActor) return;
  const sourceAura = sourceActor.items.get(sourceAuraId);
  if (!sourceAura) return;
  const oldTargets = getProperty(sourceAura.system, "linkedTargets") || [];
  const newTargets = oldTargets.filter((t) => t && t.actorId !== copy.parent?.id);
  if (newTargets.length !== oldTargets.length) {
    await sourceAura.update({ "system.linkedTargets": newTargets }, { stopLinkedSync: true });
  }
}
