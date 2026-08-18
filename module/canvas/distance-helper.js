/**
 * DistanceHelper — 威胁范围 / 夹击判定（移植自上游 dragonshorn/D35E，适配 FVTT V11）
 * 提供：周围棋子检索、威胁范围计算（含长触及武器与 traits.reach）、
 * SRD 夹击判定（连线穿过敌方对边）、威胁区域高亮绘制。
 */
export class DistanceHelper {
  static getDistance(target, source, wallblocking = false) {
    let distanceRay = foundry.canvas.geometry.Ray.fromArrays([source.center.x, source.center.y], [target.center.x, target.center.y]);
    return distanceRay.distance;
  }

  static getSurroundingTokens(token, distance = 0, minDistance = 0, distanceInFeet = false) {
    if (distance === 0) {
      distance = canvas.grid.size * 4;
    }
    if (distanceInFeet) {
      distance = Math.ceil(distance / canvas.dimensions.distance) * canvas.dimensions.size;
      minDistance = Math.ceil(minDistance / canvas.dimensions.distance) * canvas.dimensions.size;
    }
    let originalDistance = distance;
    let originalMinDistance = minDistance;
    distance -= canvas.grid.size * 0.1;
    minDistance += canvas.grid.size * 0.1;
    const { size } = canvas.scene.getDimensions();
    const square = new PIXI.Rectangle(
      token.x - distance, //  x coord top left
      token.y - distance, //  y coord top left
      token.w + (2 * distance), // width of token + 2 squares
      token.w + (2 * distance) // height of token + 2 squares
    );

    const originalSquare = new PIXI.Rectangle(
      token.x - originalDistance, //  x coord top left
      token.y - originalDistance, //  y coord top left
      token.w + (2 * originalDistance), // width of token + 2 squares
      token.w + (2 * originalDistance) // height of token + 2 squares
    );

    const originalMinSquare = new PIXI.Rectangle(
      token.x - originalMinDistance, //  x coord top left
      token.y - originalMinDistance, //  y coord top left
      token.w + (2 * originalMinDistance), // width of token + 2 squares
      token.w + (2 * originalMinDistance) // height of token + 2 squares
    );

    const minSquare = new PIXI.Rectangle(
      token.x - minDistance, //  x coord top left
      token.y - minDistance, //  y coord top left
      token.w + (2 * minDistance), // width of token + 2 squares
      token.w + (2 * minDistance) // height of token + 2 squares
    );

    const debugOverlay = game.settings.get("D35E", "debug-distance-overlay");
    if (debugOverlay) {
      // remove all "boundingCheck" graphics
      canvas.layers.find((l) => l.name === "DrawingsLayer").children.filter((i) => i.boundingCheck).forEach((i) => i.destroy());
      let g = new PIXI.Graphics();
      g.beginFill("red", 0.2).drawRect(originalSquare.x, originalSquare.y, originalSquare.width, originalSquare.height).beginHole().drawRect(originalMinSquare.x, originalMinSquare.y, originalMinSquare.width, originalMinSquare.height).endHole();
      let check = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g);
      check.boundingCheck = true;
    }

    let tokens = canvas.tokens.placeables.filter(e => square.contains(e.center.x, e.center.y) && e.id !== token.document.id);
    // get all tokens that are in the expanded square (- the tokens that are in the square)
    for (let i = 1; i < 3; i++) {
      let expandedDistance = distance + canvas.grid.size * i;
      let expandedSquare = new PIXI.Rectangle(
        token.x - expandedDistance, //  x coord top left
        token.y - expandedDistance, //  y coord top left
        token.w + (2 * expandedDistance), // width of token + 2 squares
        token.w + (2 * expandedDistance) // height of token + 2 squares
      );
      let expandedTokens = canvas.tokens.placeables.filter(
        e => expandedSquare.contains(e.center.x, e.center.y) && e.id !==
          token.document.id);
      // remove tokens that are in the square
      expandedTokens = expandedTokens.filter(
        e => !square.contains(e.center.x, e.center.y));

      // remove tokens that are too small (their size is less than i + 1 squares)
      // In the first expanded square, size 2 and 3 tokens are left as they are adjacent (this is because token of size 3)
      // will have the center in the middle of the square, so it will be in the first expanded square. In the second expanded
      // square, only size 4 tokens are threatening
      let minTokenSize = i === 1 ? canvas.grid.size * 2 : canvas.grid.size * 4;
      expandedTokens = expandedTokens.filter(
        e => e.w >= minTokenSize);
      tokens = tokens.concat(expandedTokens);

      if (debugOverlay) {
        let g3 = new PIXI.Graphics();
        g3.beginFill("orange", 0.1 * i).drawRect(expandedSquare.x, expandedSquare.y, expandedSquare.width, expandedSquare.height).beginHole().drawRect(square.x, square.y, square.width, square.height).endHole();
        let check3 = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g3);
        check3.boundingCheck = true;
      }
    }
    // remove tokens that are too close
    tokens = tokens.filter(e => !minSquare.contains(e.center.x, e.center.y));
    if (debugOverlay) {
      tokens.forEach(e => {
        let g2 = new PIXI.Graphics();
        g2.beginFill("red", 0.5).drawCircle(e.center.x, e.center.y, e.w / 2);
        let check2 = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g2);
        check2.boundingCheck = true;
      });
    }
    return tokens;
  }

  static clearThreatenedTokensGraphics() {
    // Backward-compat alias — also clear any debug PIXI overlay
    canvas.layers.find((l) => l.name === "DrawingsLayer").children.filter((i) => i.boundingCheck).forEach((i) => i.destroy());
    DistanceHelper.clearThreatHighlights();
  }

  static clearThreatHighlights() {
    // Clear token-mode tints on individual token meshes
    for (const t of canvas.tokens.placeables) {
      if (t.mesh?._d35eThreatTinted) {
        t.mesh.tint = 0xffffff;
        delete t.mesh._d35eThreatTinted;
      }
      // Also clear any legacy PIXI graphic children from older sessions
      for (const child of [...t.children]) {
        if (child._d35eThreatHighlight) child.destroy();
      }
    }
    // Clear area-mode highlights (grid highlight layer)
    if (canvas.interface?.grid?.getHighlightLayer("D35E.ThreatZone")) {
      canvas.interface.grid.clearHighlightLayer("D35E.ThreatZone");
    }
  }

  // 有效触及（尺）：基础（角色卡手动 traits.reach）+ 变化加成（reachBonus，由 buff/光环/专长的“杂项→触及”变化写入），最低 5 尺
  static getReach(actor) {
    if (!actor?.system?.traits) return 5;
    const base = parseInt(actor.system.traits.reach) || 0;
    const bonus = parseInt(actor.system.traits.reachBonus) || 0;
    return 5 + base + bonus;
  }

  // Returns the threat distances (in pixels) for a token based on its equipped weapon/traits.
  // 基础威胁范围 = 角色 traits.reach（默认5尺，支持 buff data changes 加成，如 +5 尺）；
  // 长触及武器（rch）= traits.reach + 5 尺，且无法威胁相邻格（minDistFeet=5）。
  static _getThreatDistancesInPixels(token) {
    if (!token.actor) return { distPx: canvas.grid.size, minDistPx: 0 };
    let distFeet = DistanceHelper.getReach(token.actor);
    let minDistFeet = 0;
    const weapon = token.actor.items.find(
      (i) => i.type === "weapon" && i.system.equipped && i.system.weaponSubtype !== "ranged"
    );
    if (weapon?.system?.properties?.rch) {
      minDistFeet = 5;
      distFeet += 5;
    }
    const distPx = Math.ceil(distFeet / canvas.dimensions.distance) * canvas.dimensions.size;
    const minDistPx = Math.ceil(minDistFeet / canvas.dimensions.distance) * canvas.dimensions.size;
    return { distPx, minDistPx };
  }

  static drawThreatenedHighlights(token) {
    if (!token?.actor) return;
    DistanceHelper.clearThreatHighlights();
    const mode = game.settings.get("D35E", "threatened-display-mode");
    if (mode === "none") return;

    if (mode === "tokens") {
      const threatened = DistanceHelper.getThreatenedTokens(token);
      for (const t of threatened) {
        if (t.mesh) {
          t.mesh.tint = 0xff6666;
          t.mesh._d35eThreatTinted = true;
        }
      }
    } else if (mode === "area") {
      const { distPx, minDistPx } = DistanceHelper._getThreatDistancesInPixels(token);
      const gridSize = canvas.grid.size;
      // Match getSurroundingTokens inclusion/exclusion margins
      const outerDist = distPx - gridSize * 0.1;
      const innerDist = minDistPx > 0 ? minDistPx + gridSize * 0.1 : -1;

      const outerRect = new PIXI.Rectangle(
        token.x - outerDist, token.y - outerDist,
        token.w + 2 * outerDist, token.h + 2 * outerDist
      );
      const innerRect = innerDist > 0 ? new PIXI.Rectangle(
        token.x - innerDist, token.y - innerDist,
        token.w + 2 * innerDist, token.h + 2 * innerDist
      ) : null;
      const tokenRect = new PIXI.Rectangle(token.x, token.y, token.w, token.h);

      const startX = Math.floor((token.x - distPx) / gridSize) * gridSize;
      const startY = Math.floor((token.y - distPx) / gridSize) * gridSize;
      const endX = token.x + token.w + distPx;
      const endY = token.y + token.h + distPx;

      if (!canvas.interface.grid.getHighlightLayer("D35E.ThreatZone")) {
        canvas.interface.grid.addHighlightLayer("D35E.ThreatZone");
      }
      // clearThreatHighlights() at the top already cleared the layer
      for (let gx = startX; gx < endX; gx += gridSize) {
        for (let gy = startY; gy < endY; gy += gridSize) {
          const cx = gx + gridSize / 2;
          const cy = gy + gridSize / 2;
          if (tokenRect.contains(cx, cy)) continue;
          if (!outerRect.contains(cx, cy)) continue;
          if (innerRect && innerRect.contains(cx, cy)) continue;
          canvas.interface.grid.highlightPosition("D35E.ThreatZone", {
            x: gx, y: gy,
            color: 0xdd3300,
            border: null,
            alpha: 0.3,
          });
        }
      }
    }
  }

  static getThreatenedTokens(token) {
    if (!token.actor) return [];
    // get actor from token
    let actor = token.actor;
    // 基础威胁范围 = 角色 traits.reach（默认5尺，支持 buff 加成）；长触及武器 = traits.reach + 5 尺
    let distance = DistanceHelper.getReach(actor);
    let minDistance = 0;
    let weapon = actor.items.find(i => i.type === "weapon" && i.system.equipped && i.system.weaponSubtype !== "ranged");
    if (weapon?.system?.properties?.rch) {
      minDistance = 5;
      distance += 5;
    }
    var tokens = this.getSurroundingTokens(token, distance, minDistance, true);
    // get only tokens that have the opposite disposition
    tokens = tokens.filter(t => t.document.disposition !== token.document.disposition);
    return tokens;
  }

  static isThreatened(token, enemy) {
    let threatenedTokens = this.getThreatenedTokens(token);
    return threatenedTokens.some(t => t.id === enemy.id);
  }

  static isAttackThreatening(token, attack, target) {
    let actor = token.actor;
    // 基础威胁范围 = 角色 traits.reach（默认5尺，支持 buff 加成）；长触及武器 = traits.reach + 5 尺
    let distance = DistanceHelper.getReach(actor);
    let minDistance = 0;
    if (attack.system.attackType === "natural") {
      distance = DistanceHelper.getReach(actor);
    } else {
      let weapon = actor.items.get(attack.system.originalWeaponId);
      if (weapon?.system?.properties?.rch) {
        minDistance = 5;
        distance = DistanceHelper.getReach(actor) + 5;
      }
    }
    var tokens = this.getSurroundingTokens(token, distance, minDistance, true);
    return tokens.some(t => t.id === target.id);
  }

  // Helper: returns the center point of each grid square occupied by the token (large token support).
  static _getTokenSquareCenters(token) {
    const size = canvas.grid.size;
    const centers = [];
    for (let dx = 0; dx < token.w; dx += size)
      for (let dy = 0; dy < token.h; dy += size)
        centers.push({ x: token.x + dx + size / 2, y: token.y + dy + size / 2 });
    return centers;
  }

  // Helper: SRD line test — does the segment p1→p2 pass through opposite borders of the box?
  // "Opposite borders" per SRD: top↔bottom or left↔right (corners count as part of both borders).
  static _linePassesThroughOppositeBorders(p1, p2, box) {
    const { x: ex, y: ey, w: ew, h: eh } = box;
    // Top ↔ Bottom
    if ((p1.y <= ey && p2.y >= ey + eh) || (p2.y <= ey && p1.y >= ey + eh)) {
      const tTop = (ey - p1.y) / (p2.y - p1.y);
      const xTop = p1.x + tTop * (p2.x - p1.x);
      const tBot = (ey + eh - p1.y) / (p2.y - p1.y);
      const xBot = p1.x + tBot * (p2.x - p1.x);
      if (xTop >= ex && xTop <= ex + ew && xBot >= ex && xBot <= ex + ew) return true;
    }
    // Left ↔ Right
    if ((p1.x <= ex && p2.x >= ex + ew) || (p2.x <= ex && p1.x >= ex + ew)) {
      const tLeft = (ex - p1.x) / (p2.x - p1.x);
      const yLeft = p1.y + tLeft * (p2.y - p1.y);
      const tRight = (ex + ew - p1.x) / (p2.x - p1.x);
      const yRight = p1.y + tRight * (p2.y - p1.y);
      if (yLeft >= ey && yLeft <= ey + eh && yRight >= ey && yRight <= ey + eh) return true;
    }
    return false;
  }

  // SRD flanking: line between attacker and ally centers must pass through opposite borders of enemy.
  // Large token exception: any square the flanker occupies qualifies.
  static isFlanking(attackerToken, enemyToken, allyToken) {
    if (!this.isThreatened(attackerToken, enemyToken)) return false;
    if (!this.isThreatened(allyToken, enemyToken)) return false;
    const attackerCenters = DistanceHelper._getTokenSquareCenters(attackerToken);
    const allyCenters = DistanceHelper._getTokenSquareCenters(allyToken);
    for (const ac of attackerCenters)
      for (const bc of allyCenters)
        if (DistanceHelper._linePassesThroughOppositeBorders(ac, bc, enemyToken)) return true;
    return false;
  }
}
