/**
 * ContainerApplication — 容器独立窗口
 *
 * 在角色卡/物品卡上点击"打开容器"按钮弹出。
 * - 物品可直接拖入本窗口放入容器（禁止容器嵌套）
 * - 容器内每个物品可单独设置"在角色身上生效"（system.containerActive）：
 *   效果词条（changes）、可用动作生效，但不占用装备槽位
 * - 重量继承容器设置（bagOfHoldingLike → containerWeightless）
 * - 未打开窗口时，角色卡内仍以现有方式展开显示容器内物品
 */

// OR 逻辑辅助：模板中用于容器内物品“生效”开关与旧版容器级开关的兼容
Handlebars.registerHelper("or", function () {
  const args = Array.from(arguments);
  args.pop(); // 移除 options 参数
  return args.some(Boolean);
});

export class ContainerApplication extends Application {
  constructor(item, actor, options = {}) {
    super(options);
    this.item = item; // 容器物品（Item35E 或世界物品）
    this.actor = actor; // 所属 Actor（世界物品容器无 actor）
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["D35E", "sheet", "container-sheet"],
      width: 460,
      height: 560,
      resizable: true,
      scrollY: [".container-body"],
      dragDrop: [{ dragSelector: ".item-row", dropSelector: ".container-body" }],
    });
  }

  get title() {
    return this.item.name;
  }

  get template() {
    return "systems/D35E/templates/items/container-sheet.html";
  }

  async getData() {
    const contents = this.actor
      ? this.actor.items.filter((i) => i.system.containerId === this.item.id)
      : [];
    const isMetric = game.settings.get("D35E", "units") === "metric";
    const conversion = isMetric ? 0.5 : 1;
    const unitLabel = isMetric
      ? game.i18n.localize("D35E.Kgs")
      : game.i18n.localize("D35E.Lbs");

    let itemsWeight = 0;
    const items = contents.map((i) => {
      const d = i.toObject(false);
      d.system = d.system || {};
      const qty = d.system.quantity || 0;
      const w = d.system.weight || 0;
      if (!d.system.containerWeightless)
        itemsWeight += Math.round(qty * w * conversion * 10) / 10;
      d.labels = i.labels;
      d.hasAction = i.hasAction || i.isCharged;
      d.isCharged = i.isCharged;
      d.canRecharge = i.canRecharge;
      d.hasTimedRecharge = i.hasTimedRecharge;
      d.isRecharging = i.isRecharging;
      d.maxCharges = i.maxCharges;
      d.charges = i.charges;
      d.tag = i.tag;
      d.showUnidentifiedData = i.showUnidentifiedData;
      d.isStack = Number(qty) > 1;
      // 数量缺失时不误判为空（旧数据兼容）
      d.empty = Number(d.system.quantity) <= 0;
      d.broken = d.system.hp?.value === 0 && d.system.hp?.max > 0;
      return d;
    });

    const capacity = this.item.system.capacity || 0;
    const convertedCapacity = Math.round(capacity * conversion * 10) / 10;
    const percentage =
      convertedCapacity > 0
        ? Math.min(98, Math.floor((itemsWeight / convertedCapacity) * 100))
        : 0;

    return {
      container: this.item.toObject(false),
      owner: this.actor ? this.actor.isOwner : false,
      isGM: game.user.isGM,
      config: CONFIG.D35E,
      items,
      itemsWeight,
      convertedCapacity,
      percentage,
      weightless: !!this.item.system.bagOfHoldingLike,
      unitLabel,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".container-active-toggle").change((ev) => this._onToggleActive(ev));
    html.find(".item-edit").click((ev) => this._onEditItem(ev));
    html.find(".item-delete").click((ev) => this._onDeleteItem(ev));
    html.find(".item-remove").click((ev) => this._onRemoveItem(ev));
    html.find(".item-image").click((ev) => this._onItemRoll(ev));
  }

  /** 物品级"在角色身上生效"开关 */
  async _onToggleActive(event) {
    event.preventDefault();
    if (!this.actor) return;
    const itemId = event.currentTarget.closest(".item-row")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) {
      this.render(false);
      return;
    }
    const active = event.currentTarget.checked === true;
    await item.update({ "system.containerActive": active });
    this.render(false);
  }

  _onEditItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-row")?.dataset?.itemId;
    const item = this.actor?.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    if (!this.actor) return;
    const itemId = event.currentTarget.closest(".item-row")?.dataset?.itemId;
    // 防御：行数据已过期（物品不存在）时刷新窗口而不是报错
    if (!itemId || !this.actor.items.get(itemId)) {
      this.render(false);
      return;
    }
    await this.actor.deleteEmbeddedDocuments("Item", [itemId], { stopUpdates: true });
    this.render(false);
  }

  /** 移出容器（回到角色背包） */
  async _onRemoveItem(event) {
    event.preventDefault();
    if (!this.actor) return;
    const itemId = event.currentTarget.closest(".item-row")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) {
      this.render(false);
      return;
    }
    await item.update({
      "system.containerId": "none",
      "system.container": "None",
      "system.containerWeightless": false,
    });
    this.render(false);
  }

  async _onItemRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-row")?.dataset?.itemId;
    const item = this.actor?.items.get(itemId);
    if (item) await item.roll();
  }

  /** 拖出（供拖到角色卡等处） */
  async _onDragStart(event) {
    const row = event.currentTarget.closest(".item-row");
    const item = this.actor?.items.get(row?.dataset?.itemId);
    if (!item) return;
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "Item", uuid: item.uuid, id: item.id, data: item })
    );
  }

  /** 拖入：把物品放入此容器 */
  async _onDrop(event) {
    event.preventDefault();
    if (!this.actor) return false;
    let dropData;
    try {
      dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }
    if (dropData.type !== "Item") return false;

    let source = null;
    if (dropData.uuid) {
      source = await fromUuid(dropData.uuid);
    } else if (dropData.pack) {
      const pack = game.packs.get(dropData.pack);
      source = pack ? await pack.getDocument(dropData.id || dropData._id) : null;
    } else if (game.items.get(dropData.id)) {
      source = game.items.get(dropData.id);
    }
    if (!source) return false;

    // 禁止容器嵌套
    const isContainer = source.type === "loot" && source.system?.subType === "container";
    if (isContainer) {
      ui.notifications.warn(game.i18n.localize("D35E.ContainerNestingForbidden"));
      return false;
    }

    // 同一角色：直接移入容器
    if (source.parent === this.actor) {
      if (source.system.containerId === this.item.id) return true;
      await source.update({
        "system.containerId": this.item.id,
        "system.container": this.item.name,
        "system.containerWeightless": !!this.item.system.bagOfHoldingLike,
        "system.equipped": false,
      });
      this.render(false);
      return true;
    }

    // 其他来源（其他角色/世界/合集）：复制一份进容器
    const data = source.toObject(false);
    if (data._id) delete data._id;
    data.system = data.system || {};
    data.system.containerId = this.item.id;
    data.system.container = this.item.name;
    data.system.containerWeightless = !!this.item.system.bagOfHoldingLike;
    data.system.equipped = false;
    await this.actor.createEmbeddedEntity("Item", data, { dataType: "data" });
    this.render(false);
    return true;
  }
}
