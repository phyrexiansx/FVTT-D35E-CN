import { CR } from "../lib.js";

// [优化] 单次渲染条目上限：资源过多时避免整表渲染卡死（搜索/筛选在数据层过滤后重渲染）
const _MAX_RENDER = 200;

// [优化] 列表 partial（渐进/局部刷新用）：注册一次，渲染前兜底确保存在
const _LIST_PARTIAL = "systems/D35E/templates/apps/compendium-browser-list.html";
async function _ensureListPartial() {
  if (!Handlebars.partials?.[_LIST_PARTIAL]) {
    const tpl = await getTemplate(_LIST_PARTIAL);
    Handlebars.registerPartial(_LIST_PARTIAL, tpl);
  }
}
Hooks.once("ready", () => _ensureListPartial().catch(() => {}));

// [优化] 合集轻量索引字段（各类型并集）：搜索器用 getIndex 而非 getDocuments，
// 不实例化 Document（不触发 prepareData，海量条目不再报错/卡顿），点击条目时才加载单条
const _INDEX_FIELDS = [
  "system.level", "system.school", "system.subschool", "system.types",
  "system.learnedAt.class", "system.learnedAt.domain", "system.learnedAt.subDomain",
  "system.learnedAt.elementalSchool", "system.learnedAt.bloodline",
  "system.featType", "system.tags", "system.associations.classes",
  "system.enhancementType", "system.allowedTypes", "system.properties",
  "system.uniqueId", "system.snip", "system.details.cr", "system.attributes.creatureType",
];


export class CompendiumBrowser extends Application {
  constructor(...args) {
    super(...args);

    this.items = [];

    this.filters = [];

    this.activeFilters = {};

    this._data = {
      loaded: false,
      data: {},
      promise: null,
    };

    // [修复] 从构造参数初始化类型（D35E.js 传入 { type: "spells", entityType: "Item" }）
    this.type = this.options.type || undefined;
    this.entityType = this.options.entityType || undefined;
    this._loadToken = 0; // [修复-竞态] 加载代际令牌
    this._docCache = {}; // [缓存] 按 packId 缓存原始文档，整个会话每个合集只读一次
    this._typeCache = {}; // [缓存] 按类型缓存构建结果（items/filters/extraFilters/_system）

    // Preload compendiums
    // if (game.settings.get("D35E", "preloadCompendiums") === true) {
    // this.loadData();
    // }
  }

  preset(type, entityType, activeFilters = {}) {
    this.type = type;
    this.entityType = entityType;
    this.activeFilters = activeFilters;
    this.extraFilters = null;
    this._filtered = null; // [优化] 清除上次搜索结果
    // [修复-竞态] 丢弃在途加载的 Promise，并递增代际令牌，令旧加载失效
    this._data.promise = null;
    this._loadToken = (this._loadToken || 0) + 1;

    // [缓存] 命中类型缓存：直接恢复数据，不再重新加载
    const cached = this._typeCache[type];
    if (cached) {
      this.items = cached.items;
      this.filters = cached.filters;
      this.extraFilters = cached.extraFilters;
      this.compendiumSources = cached.compendiumSources;
      this._system = cached.system;
      this._data.loaded = true;
    } else {
      this._data.loaded = false;
    }
  }

  async loadData() {
    const token = this._loadToken; // [修复-竞态]
    $("#d35e-compendium-browser-loader-label").text(game.i18n.localize("D35E.LoadingCompendiums"));
    $("#d35e-compendium-browser-loader-bar").css("width", "0%");
    $("#d35e-compendium-browser-loader").show();
    return new Promise((resolve) => {
      let promise = this._data.promise;
      if (promise == null) {
        promise = this._gatherData();
        this._data.promise = promise;
      }

      promise.then(() => {
        if (token !== this._loadToken) return; // [修复-竞态] 已被切换，丢弃旧加载结果
        this._data.loaded = true;
        this._data.promise = null;
        // [修复] 加载完成后应用默认来源勾选（含 _filtered 预置）；非法术/专长 tab 内部直接返回
        this._applyDefaultFilters();

        $("#d35e-compendium-browser-loader").hide();
        this.render(false);
        resolve(this._system);
      });
    });
  }

  async _gatherData() {
    const token = this._loadToken; // [修复-竞态]
    await this._fetchMetadata();
    if (token !== this._loadToken) return; // [修复-竞态] 已被切换，丢弃本次结果

    this._system = {
      filters: this.filters,
      collection: this.items,
      type: this.type,
      entityType: this.entityType,
    };
    // [默认] 应用默认来源勾选（法术=法术+灵能合集合集；专长=专长合集合集）
    this._applyDefaultFilters();
  }

  // [默认] 法术/专长默认只显示指定来源的合集合集（pack id 不存在时自动跳过）
  _applyDefaultFilters() {
    if (this.type !== "spells" && this.type !== "feats") return;
    const defaults = this.type === "spells" ? ["D35E.spells", "D35E.powers"] : ["D35E.feats"];
    const available = (this.compendiumSources.items || []).map((i) => i.key);
    const pack = defaults.filter((id) => available.includes(id));
    if (!pack.length) return;
    this.activeFilters["pack"] = pack;
    this.filterQuery = this.filterQuery || /.*/;
    const list = (this._system?.collection || []).filter((e) => this._passesFilters(e.item));
    this._filtered = list;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/D35E/templates/apps/compendium-browser.html",
      id: "d35e-compendium-browser",
      width: 1080,
      height: window.innerHeight - 60,
      top: 30,
      left: 40,
      classes: ["compendium-browser-window"],
    });
  }

  get typeName() {
    switch (this.type) {
      case "spells":
        return game.i18n.localize("D35E.Spells");
      case "items":
        return game.i18n.localize("D35E.Items");
      case "enhancements":
        return game.i18n.localize("D35E.Enhancements");
    }
    return this.type;
  }

  get title() {
    return "Compendium Browser";
  }

  async _fetchMetadata() {
    const token = this._loadToken; // [修复-竞态] 记录本次加载的代际
    this.items = [];
    this.compendiumSources = { path: "pack", label: game.i18n.localize("D35E.Compendium"), items: [] };
    let packCount = 0;
    for (let p of game.packs.values()) {
      if (p.private && !game.user.isGM) continue;
      if ((p.entity || p.documentName) !== this.entityType) continue;
      packCount++;
    }
    let percentPerPack = 100.0 / packCount;
    let loadedPercent = 0.0;
    for (let p of game.packs.values()) {
      if (p.private && !game.user.isGM) continue;
      if ((p.entity || p.documentName) !== this.entityType) continue;
      // [缓存] 轻量索引整个会话只读一次（不实例化 Document，海量条目也不报错/卡顿）
      let docs = this._docCache[p.metadata.id];
      if (!docs) {
        docs = await p.getIndex({ fields: _INDEX_FIELDS });
        if (token !== this._loadToken) return; // [修复-竞态] 加载期间标签被切换，丢弃本次结果
        this._docCache[p.metadata.id] = docs;
      }
      let addedItems = false;
      for (let i of docs) {
        if (!this._filterItems(i)) continue;
        addedItems = true;
        this.items.push(this._mapItem(p, i));
      }
      loadedPercent += percentPerPack;
      $("#d35e-compendium-browser-loader-bar").css("width", `${loadedPercent}%`);
      if (addedItems)
        this.compendiumSources.items.push({ key: `${p.metadata.id}`, name: `${p.metadata.label} (${p.metadata.id})` });
      // [优化] 渐进加载：每完成一个合集合集就刷新一次列表（边加载边显示，首次打开不再白等）
      this._system = { ...(this._system || {}), collection: this.items.slice() };
      const label = this.element?.find("#d35e-compendium-browser-loader-label");
      if (label?.length) label.text(`正在加载… ${this.items.length} 条（${this.compendiumSources.items.length + 1}/${packCount} 合集合集）`);
      this._renderList();
    }
    this.items.sort((a, b) => {
      if (a.item.name < b.item.name) return -1;
      if (a.item.name > b.item.name) return 1;
      return 0;
    });

    if (this.items.length === 0) {
      return;
    }

    // [修复-竞态] 派发过滤器前再校验一次，避免旧加载在标签切换后继续写状态
    if (token !== this._loadToken) return;

    if (this.type === "spells") this._fetchSpellFilters();
    else if (this.type === "items") this._fetchItemFilters();
    else if (this.type === "bestiary") this._fetchBestiaryFilters();
    else if (this.type === "feats") this._fetchFeatFilters();
    else if (this.type === "enhancements") this._fetchEnhancementFilters();
    this.filters.unshift(this.compendiumSources);
    this.activeFilters = this.filters.reduce((cur, f) => {
      cur[f.path] = [];
      return cur;
    }, {});

    // [缓存] 保存该类型的构建结果，下次切标签/重开窗口直接复用
    this._typeCache[this.type] = {
      items: this.items,
      filters: this.filters,
      extraFilters: this.extraFilters,
      compendiumSources: this.compendiumSources,
      system: {
        filters: this.filters,
        collection: this.items,
        type: this.type,
        entityType: this.entityType,
      },
    };
  }

  _filterItems(item) {
    if (item.system.uniqueId) return false;
    if (this.type === "spells" && item.type !== "spell") return false;
    if (this.type === "items" && !["weapon", "equipment", "loot", "consumable"].includes(item.type)) return false;
    if (this.type === "feats" && item.type !== "feat") return false;
    if (this.type === "buffs" && item.type !== "buff") return false;
    if (this.type === "enhancements" && item.type !== "enhancement") return false;
    return true;
  }

  _mapItem(pack, item) {
    const result = {
      collection: pack.collection,
      packname: `${pack.metadata.label} (${pack.metadata.id})`,
      issystem: pack.metadata.packageName === "D35E",
      item: {
        _id: item._id,
        // [优化] index 条目无 uuid，按 Compendium 约定构造（点击打开时 fromUuid 再实例化单条）
        uuid: `Compendium.${pack.collection}.Item.${item._id}`,
        name: item.name,
        type: item.type,
        img: item.img,
        system: item.system,
        pack: pack.collection,
        isSpell: item.type === "spell",
      },
    };

    if (this.type === "enhancements") {
      if (!this.extraFilters) {
        this.extraFilters = {
          allowedTypes: [],
        };
      }

      result.item.allowedTypes = (getProperty(item.system, "allowedTypes") || []).reduce((cur, o) => {
        if (!this.extraFilters["allowedTypes"].includes(o[0])) this.extraFilters["allowedTypes"].push(o[0]);
        cur.push(o[0]);
        return cur;
      }, []);
    }

    // Feat-specific variables
    if (this.type === "feats") {
      if (!this.extraFilters) {
        this.extraFilters = {
          tags: [],
          associations: {
            class: [],
          },
        };
      }

      result.item.tags = (getProperty(item.system, "tags") || []).reduce((cur, o) => {
        if (!this.extraFilters["tags"].includes(o[0])) this.extraFilters["tags"].push(o[0]);
        cur.push(o[0]);
        return cur;
      }, []);

      result.item.associations = {
        class: (getProperty(item.system, "featType") === "classFeat"
                ? getProperty(item.system, "associations.classes") || []
                : []
        ).reduce((cur, o) => {
          if (!this.extraFilters["associations.class"].includes(o[0])) this.extraFilters["associations.class"].push(o[0]);
          cur.push(o[0]);
          return cur;
        }, []),
      };
    }

    // Item-specific variables
    if (this.type === "items") {
      if (!this.extraFilters) {
        this.extraFilters = {};
      }

      result.item.weaponProps = Object.entries(getProperty(item.system, "properties") || []).reduce((cur, o) => {
        if (o[1]) cur.push(o[0]);
        return cur;
      }, []);
    }

    // Spell-specific variables
    if (this.type === "spells") {
      if (!this.extraFilters) {
        this.extraFilters = {
          "learnedAt.class": [],
          "learnedAt.domain": [],
          "learnedAt.subDomain": [],
          "learnedAt.elementalSchool": [],
          "learnedAt.bloodline": [],
          "system.subschool": [],
          spellTypes: [],
        };
      }

      result.item.allSpellLevels = [];

      // Add class/domain/etc filters
      result.item.learnedAt = {
        class: (getProperty(item.system, "learnedAt.class") || []).reduce((cur, o) => {
          if (!this.extraFilters["learnedAt.class"].includes(o[0])) this.extraFilters["learnedAt.class"].push(o[0]);
          if (!result.item.allSpellLevels.includes(o[1])) result.item.allSpellLevels.push(o[1]);
          cur.push(o[0]);
          return cur;
        }, []),
        domain: (getProperty(item.system, "learnedAt.domain") || []).reduce((cur, o) => {
          if (!this.extraFilters["learnedAt.domain"].includes(o[0])) this.extraFilters["learnedAt.domain"].push(o[0]);
          if (!result.item.allSpellLevels.includes(o[1])) result.item.allSpellLevels.push(o[1]);
          cur.push(o[0]);
          return cur;
        }, []),
        subDomain: (getProperty(item.system, "learnedAt.subDomain") || []).reduce((cur, o) => {
          if (!this.extraFilters["learnedAt.subDomain"].includes(o[0]))
            this.extraFilters["learnedAt.subDomain"].push(o[0]);
          if (!result.item.allSpellLevels.includes(o[1])) result.item.allSpellLevels.push(o[1]);
          cur.push(o[0]);
          return cur;
        }, []),
        elementalSchool: (getProperty(item.system, "learnedAt.elementalSchool") || []).reduce((cur, o) => {
          if (!this.extraFilters["learnedAt.elementalSchool"].includes(o[0]))
            this.extraFilters["learnedAt.elementalSchool"].push(o[0]);
          if (!result.item.allSpellLevels.includes(o[1])) result.item.allSpellLevels.push(o[1]);
          cur.push(o[0]);
          return cur;
        }, []),
        bloodline: (getProperty(item.system, "learnedAt.bloodline") || []).reduce((cur, o) => {
          if (!this.extraFilters["learnedAt.bloodline"].includes(o[0]))
            this.extraFilters["learnedAt.bloodline"].push(o[0]);
          if (!result.item.allSpellLevels.includes(o[1])) result.item.allSpellLevels.push(o[1]);
          cur.push(o[0]);
          return cur;
        }, []),
        spellLevel: {
          class: (getProperty(item.system, "learnedAt.class") || []).reduce((cur, o) => {
            cur[o[0]] = o[1];
            return cur;
          }, {}),
          domain: (getProperty(item.system, "learnedAt.domain") || []).reduce((cur, o) => {
            cur[o[0]] = o[1];
            return cur;
          }, {}),
          subDomain: (getProperty(item.system, "learnedAt.subDomain") || []).reduce((cur, o) => {
            cur[o[0]] = o[1];
            return cur;
          }, {}),
          elementalSchool: (getProperty(item.system, "learnedAt.elementalSchool") || []).reduce((cur, o) => {
            cur[o[0]] = o[1];
            return cur;
          }, {}),
          bloodline: (getProperty(item.system, "learnedAt.bloodline") || []).reduce((cur, o) => {
            cur[o[0]] = o[1];
            return cur;
          }, {}),
        },
      };

      // Add subschools
      {
        const subschool = getProperty(item.system, "subschool");
        if (subschool && !this.extraFilters["system.subschool"].includes(subschool))
          this.extraFilters["system.subschool"].push(subschool);
      }
      // Add spell types
      {
        const spellTypes = getProperty(item.system, "types")
            ? getProperty(item.system, "types").split(CONFIG.D35E.re.traitSeparator)
            : [];
        result.item.spellTypes = spellTypes;
        for (let st of spellTypes) {
          if (!this.extraFilters["spellTypes"].includes(st)) this.extraFilters["spellTypes"].push(st);
        }
      }
    }

    // Bestiary-specific variables
    if (this.type === "bestiary") {
      if (!this.extraFilters) {
        this.extraFilters = {
          "system.details.cr": [],
        };
      }

      // Add CR filters
      if (item.type === "npc") {
        const cr = getProperty(item.system, "details.cr");
        if (cr && !this.extraFilters["system.details.cr"].includes(cr))
          this.extraFilters["system.details.cr"].push(parseFloat(cr));
      }
    }

    return result;
  }

  // [优化] 可见列表：无搜索/无勾选分类时截断前 _MAX_RENDER 条；有搜索或分类筛选时渲染全部匹配
  _visibleList(src) {
    const q = this.filterQuery;
    const hasQuery = q && q.source !== ".*" && q.source.length > 0;
    // [默认] 来源(pack)勾选不触发全量渲染：默认/来源筛选结果通常很大，保持截断防卡死
    const hasFilters = Object.entries(this.activeFilters || {}).some(([p, f]) => p !== "pack" && f && f.length > 0);
    const showAll = hasQuery || hasFilters;
    const list = showAll ? src : src.slice(0, _MAX_RENDER);
    return { list, total: src.length, truncated: src.length > list.length };
  }

  // [优化] 只刷新结果列表区域（不重建筛选器，保持折叠/勾选/滚动位置）
  async _renderList() {
    await _ensureListPartial();
    const src = this._filtered || this._system?.collection || [];
    const v = this._visibleList(src);
    try {
      const html = await renderTemplate("systems/D35E/templates/apps/compendium-browser-list.html", {
        collection: v.list,
        totalCount: v.total,
        truncated: v.truncated,
      });
      const container = this.element?.find(".directory-container");
      if (container?.length) container.html(html);
    } catch (err) {
      /* 渐进渲染失败不阻断加载 */
    }
  }

  async getData() {
    if (!this._data.loaded) {
      this.loadData();
    }
    const src = this._filtered || this._system?.collection || [];
    const v = this._visibleList(src);
    // [修复] 预计算筛选项勾选状态（render 重建后复选框与 activeFilters 保持一致）
    const filters = (this._system?.filters || []).map((f) => ({
      ...f,
      items: f.items.map((it) => ({ ...it, checked: (this.activeFilters?.[f.path] || []).includes(it.key) })),
    }));
    return {
      ...(this._system || {}),
      filters,
      collection: v.list,
      totalCount: v.total,
      truncated: v.truncated,
    };
  }

  async refresh() {
    // [缓存] 手动刷新按钮：清空文档与类型缓存，强制重新加载
    this._docCache = {};
    this._typeCache = {};
    this._data.loaded = false;
    this._filtered = null; // [优化] 清除旧搜索结果
    // [优化] 先打开窗口：边加载边渐进显示（不再白等几十秒）
    await _ensureListPartial();
    this._render(true);
    await this.loadData();
  }

  _fetchSpellFilters() {
    // [修复-兜底] 没有任何法术条目被收集时 extraFilters 为 null，先补默认结构防止崩溃
    if (!this.extraFilters) {
      this.extraFilters = {
        "learnedAt.class": [],
        "learnedAt.domain": [],
        "learnedAt.subDomain": [],
        "learnedAt.elementalSchool": [],
        "learnedAt.bloodline": [],
        "system.subschool": [],
        spellTypes: [],
      };
    }

    this.filters = [
      {
        path: "system.school",
        label: game.i18n.localize("D35E.SpellSchool"),
        items: Object.entries(CONFIG.D35E.spellSchools)
            .reduce((cur, o) => {
              cur.push({ key: o[0], name: o[1] });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "system.subschool",
        label: game.i18n.localize("D35E.SubSchool"),
        items: this.extraFilters["system.subschool"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "spellTypes",
        label: game.i18n.localize("D35E.TypePlural"),
        items: this.extraFilters["spellTypes"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "learnedAt.class",
        label: game.i18n.localize("D35E.ClassPlural"),
        items: this.extraFilters["learnedAt.class"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "learnedAt.domain",
        label: game.i18n.localize("D35E.Domain"),
        items: this.extraFilters["learnedAt.domain"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "learnedAt.subDomain",
        label: game.i18n.localize("D35E.SubDomain"),
        items: this.extraFilters["learnedAt.subDomain"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      // {
      //   path: "learnedAt.elementalSchool",
      //   label: game.i18n.localize("D35E.ElementalSchool"),
      //   items: this.extraFilters["learnedAt.elementalSchool"].reduce((cur, o) => {
      //     cur.push({ key: o, name: o });
      //     return cur;
      //   }, []),
      // },
      {
        path: "learnedAt.bloodline",
        label: game.i18n.localize("D35E.Bloodline"),
        items: this.extraFilters["learnedAt.bloodline"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "_spellLevel",
        label: game.i18n.localize("D35E.SpellLevel"),
        items: Object.entries(CONFIG.D35E.spellLevels).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
    ];
  }

  _fetchItemFilters() {
    // [修复-兜底]
    if (!this.extraFilters) this.extraFilters = {};

    this.filters = [
      {
        path: "type",
        label: game.i18n.localize("D35E.Type"),
        items: [
          { key: "weapon", name: game.i18n.localize("D35E.ItemTypeWeapon") },
          { key: "equipment", name: game.i18n.localize("D35E.ItemTypeEquipment") },
          { key: "consumable", name: game.i18n.localize("D35E.ItemTypeConsumable") },
          { key: "loot", name: game.i18n.localize("D35E.Misc") },
        ],
      },
      {
        path: "system.weaponType",
        label: game.i18n.localize("D35E.WeaponType"),
        items: Object.entries(CONFIG.D35E.weaponTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1]._label });
          return cur;
        }, []),
      },
      {
        path: "system.weaponSubtype",
        label: game.i18n.localize("D35E.WeaponSubtype"),
        items: Object.values(CONFIG.D35E.weaponTypes).reduce((cur, o) => {
          cur = cur.concat(
              Object.entries(o)
                  .filter((i) => !i[0].startsWith("_"))
                  .reduce((arr, i) => {
                    if (!cur.filter((a) => a.key === i[0]).length) {
                      arr.push({ key: i[0], name: i[1] });
                    }
                    return arr;
                  }, [])
          );
          return cur;
        }, []),
      },
      {
        path: "weaponProps",
        label: game.i18n.localize("D35E.WeaponProperties"),
        items: Object.entries(CONFIG.D35E.weaponProperties).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
      {
        path: "system.equipmentType",
        label: game.i18n.localize("D35E.EquipmentType"),
        items: Object.entries(CONFIG.D35E.equipmentTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1]._label });
          return cur;
        }, []),
      },
      {
        path: "system.equipmentSubtype",
        label: game.i18n.localize("D35E.EquipmentSubtype"),
        items: Object.values(CONFIG.D35E.equipmentTypes).reduce((cur, o) => {
          cur = cur.concat(
              Object.entries(o)
                  .filter((i) => !i[0].startsWith("_"))
                  .reduce((arr, i) => {
                    if (!cur.filter((a) => a.key === i[0]).length) {
                      arr.push({ key: i[0], name: i[1] });
                    }
                    return arr;
                  }, [])
          );
          return cur;
        }, []),
      },
      {
        path: "system.slot",
        label: game.i18n.localize("D35E.Slot"),
        items: Object.values(CONFIG.D35E.equipmentSlots).reduce((cur, o) => {
          cur = cur.concat(
              Object.entries(o)
                  .filter((i) => !i[0].startsWith("_"))
                  .reduce((arr, i) => {
                    if (!cur.filter((a) => a.key === i[0]).length) {
                      arr.push({ key: i[0], name: i[1] });
                    }
                    return arr;
                  }, [])
          );
          return cur;
        }, []),
      },
      {
        path: "system.consumableType",
        label: game.i18n.localize("D35E.ConsumableType"),
        items: Object.entries(CONFIG.D35E.consumableTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
      {
        path: "system.subType",
        label: game.i18n.localize("D35E.Misc"),
        items: Object.entries(CONFIG.D35E.lootTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
    ];
  }

  _fetchBestiaryFilters() {
    // [修复-兜底]
    if (!this.extraFilters) this.extraFilters = { "system.details.cr": [] };

    this.filters = [
      {
        path: "system.details.cr",
        label: "CR",
        items: this.extraFilters["system.details.cr"]
            .sort(function (a, b) {
              return a - b;
            })
            .reduce((cur, o) => {
              cur.push({ key: o, name: CR.fromNumber(o) });
              return cur;
            }, []),
      },
      {
        path: "system.attributes.creatureType",
        label: game.i18n.localize("D35E.CreatureType"),
        items: Object.entries(CONFIG.D35E.creatureTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
    ];
  }

  _fetchEnhancementFilters() {
    // [修复-兜底]
    if (!this.extraFilters) this.extraFilters = { allowedTypes: [] };

    this.filters = [
      {
        path: "system.enhancementType",
        label: game.i18n.localize("D35E.Type"),
        items: Object.entries(CONFIG.D35E.enhancementType).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
      {
        path: "allowedTypes",
        label: game.i18n.localize("D35E.EnhancementAllowedTypes"),
        items: this.extraFilters.allowedTypes
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
    ];
  }

  _fetchFeatFilters() {
    // [修复-兜底]
    if (!this.extraFilters) this.extraFilters = { tags: [], associations: { class: [] } };

    this.filters = [
      {
        path: "system.featType",
        label: game.i18n.localize("D35E.Type"),
        items: Object.entries(CONFIG.D35E.featTypes).reduce((cur, o) => {
          cur.push({ key: o[0], name: o[1] });
          return cur;
        }, []),
      },
      {
        path: "tags",
        label: game.i18n.localize("D35E.Tags"),
        items: this.extraFilters.tags
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
      {
        path: "associations.class",
        label: game.i18n.localize("D35E.ClassPlural"),
        items: this.extraFilters.associations["class"]
            .reduce((cur, o) => {
              cur.push({ key: o, name: o });
              return cur;
            }, [])
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            }),
      },
    ];
  }

  async _render(...args) {
    await super._render(...args);

    this.filterQuery = /.*/;
    this.element.find(".filter-content").css("display", "none");
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Open sheets
    html.find(".entry-name").click((ev) => {
      let li = ev.currentTarget.parentElement.parentElement;
      this._onEntry(li.getAttribute("data-collection"), li.getAttribute("data-entry-id"));
    });

    // Make compendium items draggable
    html.find(".directory-item").each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart, false);
    });

    html.find('input[name="search"]').keyup(this._onFilterResults.bind(this));
    html.find('input[name="search"]').focus();

    html.find('.filter input[type="checkbox"]').change(this._onActivateBooleanFilter.bind(this));

    html.find(".filter h3").click(this._toggleFilterVisibility.bind(this));

    html.find("button.refresh").click(this.refresh.bind(this));

    html.find(".compendium-browser-tabs .browser").click((e) => this.presetAndLoadFromTab(e));
  }

  /**
   * Handle opening a single compendium entry by invoking the configured entity class and its sheet
   * @private
   */
  async _onEntry(collectionKey, entryId) {
    const entity = await fromUuid(entryId);
    entity.sheet.render(true);
  }

  /**
   * Handle a new drag event from the compendium, create a placeholder token for dropping the item
   * @private
   */
  _onDragStart(event) {
    const li = this,
        packName = li.getAttribute("data-collection"),
        pack = game.packs.find((p) => p.metadata.id === packName);

    // Get the pack
    if (!pack) {
      event.preventDefault();
      return false;
    }

    // Set the transfer data
    event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: pack.entity || pack.documentName,
          uuid: li.getAttribute("data-entry-id"),
        })
    );
  }

  _toggleFilterVisibility(event) {
    event.preventDefault();
    const title = event.currentTarget;
    const content = $(title).siblings(".filter-content")[0];

    if (content.style.display === "none") content.style.display = "block";
    else content.style.display = "none";
  }

  _onFilterResults(event) {
    event.preventDefault();
    let input = event.currentTarget;

    // Define filtering function
    let filter = (query) => {
      this.filterQuery = query;
      this._filterResults();
    };

    // Filter if we are done entering keys
    let query = new RegExp(RegExp.escape(input.value), "i");
    if (this._filterTimeout) {
      clearTimeout(this._filterTimeout);
      this._filterTimeout = null;
    }
    this._filterTimeout = setTimeout(() => filter(query), 100);
  }

  _onActivateBooleanFilter(event) {
    event.preventDefault();
    let input = event.currentTarget;
    const path = input.closest(".filter")?.dataset?.path;
    if (!path || !this.activeFilters) return;
    // [修复] 勾选状态数组可能未初始化（preset 未传 filters 时为空对象）
    if (!Array.isArray(this.activeFilters[path])) this.activeFilters[path] = [];
    const key = input.name;
    const value = input.checked;

    if (value) {
      let index = this.activeFilters[path].indexOf(key);
      if (index < 0) this.activeFilters[path].push(key);
    } else {
      let index = this.activeFilters[path].indexOf(key);
      if (index >= 0) this.activeFilters[path].splice(index, 1);
    }

    this._filterResults();
  }

  // [优化] 数据层过滤 + 仅刷新列表区域（不再重建整个窗口，筛选器折叠/位置保持不变）
  _filterResults() {
    const list = (this._system?.collection || []).filter((e) => this._passesFilters(e.item));
    this._filtered = list;
    this._renderList();
  }

  _passesFilters(item) {
    if (!this.filterQuery.test(item.name)) return false;

    for (let [path, filter] of Object.entries(this.activeFilters)) {
      if (filter.length === 0) continue;

      // [修复] 合集合集来源筛选（条目 item 上存的是 pack，即 pack id）
      if (path === "pack") {
        if (!filter.includes(item.pack)) return false;
        continue;
      }

      // Handle special cases
      // Handle Spell Level
      {
        let result = null;
        if (this.type === "spells" && path === "_spellLevel") {
          result = false;
          let hasActiveFilter = false;
          const spellLevels = this.activeFilters[path];
          const checks = [
            { path: "learnedAt.class", type: "class" },
            { path: "learnedAt.domain", type: "domain" },
            { path: "learnedAt.subDomain", type: "subDomain" },
            { path: "learnedAt.elementalSchool", type: "elementalSchool" },
            { path: "learnedAt.bloodline", type: "bloodline" },
          ];
          for (let c of checks) {
            const f = this.activeFilters[c.path];
            if (!f || !f.length) continue;
            hasActiveFilter = true;
            for (let fi of f) {
              const p = getProperty(item, `learnedAt.spellLevel.${c.type}`);
              for (let sl of spellLevels) {
                if (p[fi] === parseInt(sl)) result = true;
              }
            }
          }
          if (!hasActiveFilter) {
            for (let sl of spellLevels) {
              if (item.allSpellLevels.includes(parseInt(sl))) result = true;
            }
          }
        }
        if (result === false) return false;
        else if (result === true) continue;
      }

      // Handle the rest
      const prop = getProperty(item, path);
      if (prop == null) return false;
      if (typeof prop === "number") {
        filter = filter.map((o) => parseFloat(o)).filter((o) => !isNaN(o));
      }
      if (prop instanceof Array) {
        if (!filter.every((o) => prop.includes(o))) return false;
        continue;
      }
      if (!filter.includes(prop)) return false;
    }

    return true;
  }

  presetAndLoadFromTab(evt) {
    const link = evt.currentTarget;
    this.preset(link.dataset.type, link.dataset.entityType);
    // [缓存] 命中缓存直接重绘；未命中才加载
    if (this._data.loaded) {
      this.render(false);
    } else {
      this.refresh();
    }
  }


  static async browseCompendium(type, entityType, filters = {}) {
    await _ensureListPartial();
    game.D35E.compendiumBrowser.preset(type, entityType, filters);
    game.D35E.compendiumBrowser._render(true);
  }
}
