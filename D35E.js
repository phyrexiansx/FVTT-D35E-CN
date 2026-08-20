/**
 * The D35E edition game system for Foundry Virtual Tabletop
 * Author: LoopeeDK, Rughalt
 * Software License: GNU GPLv3
 */

// Import Modules
import {D35E} from './module/config.js';
import {registerSystemSettings} from './module/settings.js';
import {registerAutoApplyHooks, registerKeybindings, actorHasNoAoO} from './module/automation/autoApply.js';
import {registerChatViews} from './module/chatlog/chatTabs.js';
import {registerChatViewKeybindings} from './module/chatlog/chatTabs.js';
import {registerAoO, handleAoOThreat, getAoOAttacks} from './module/automation/aoo.js';
import {registerChatDrag} from './module/chatlog/chatDrag.js';
import { registerChatCommandSuggest } from './module/chatlog/chat-command-suggest.js'; // [D35E]聊天命令建议：输入 / 弹出 narrator 命令选项
import {registerChatExport} from './module/chatlog/chatExport.js';
import {registerCGMPFeatures} from './module/chatlog/cgmp-features.js';
import {registerDiceTray} from './module/chatlog/dice-tray.js';
import {preloadHandlebarsTemplates} from './module/templates.js';
import {
  getConditions,
  measureDistance,
  measureDistances,
} from './module/canvas/canvas.js';
import {ActorPF} from './module/actor/entity.js';
import {ActorSheetPFCharacter} from './module/actor/sheets/character.js';
import {ActorSheetPFNPC} from './module/actor/sheets/npc.js';
import {ActorSheetPFNPCLite} from './module/actor/sheets/npc-lite.js';
import {ActorSheetPFNPCLoot} from './module/actor/sheets/npc-loot.js';
import {ActorSheetPFNPCMonster} from './module/actor/sheets/npc-monster.js';
import {Item35E} from './module/item/entity.js';
import {ItemSheetPF} from './module/item/sheets/base.js';
import {TokenPF} from './module/token/token.js';
import {
  addLowLightVisionToLightConfig,
} from './module/canvas/low-light-vision.js';
import {PatchCore} from './module/patch-core.js';
import {DicePF} from './module/dice.js';
import {CombatantD35E, CombatD35E} from './module/combat/combat.js';
import './module/combat-progress-sync.js';
import * as chat from './module/chat.js';
import {createCustomChatMessage} from './module/chat.js';
import {MeasuredTemplatePF, TemplateLayerPF} from './module/measure.js';
import {PatreonIntegrationFactory} from './module/patreon-integration.js';
import './module/ddimport/ddimport.js'; // 内置 dd-import：导入 DungeonDraft/DungeonFog 的 Universal VTT 地图（原模组合并版，模板 systems/D35E/templates/ddimport/importer.html）

import {
  getActorFromId,
  getItemOwner,
  isMinimumCoreVersion,
  sizeDie,
  sizeInt,
  sizeMonkDamageDie,
  sizeNaturalDie,
} from './module/lib.js';
import {ChatMessagePF} from './module/sidebar/chat-message.js';
import {TokenQuickActions} from './module/token-quick-actions.js';
import {TopPortraitBar} from './module/top-portrait-bar.js';
import * as migrations from './module/migration.js';
import {SemanticVersion} from './semver.js';
import * as cache from './module/cache.js';
import {CACHE} from './module/cache.js';
import D35ELayer from './module/layer.js';
import {
  EncounterGeneratorDialog,
} from './module/apps/encounter-generator-dialog.js';
import {
  TreasureGeneratorDialog,
} from './module/apps/treasure-generator-dialog.js';
import {
  MonsterImporterDialog,
} from './module/utils/monster-importer.js';
import {ActorSheetTrap} from './module/actor/sheets/trap.js';
import {applyConfigModifications} from './module/config-tools.js';
import {genTreasureFromToken} from './module/treasure/treasure.js';
import {ActiveEffectD35E} from './module/ae/entity.js';
import {CollateAuras, SyncLinkedAuras, deleteLinkedCopies, deleteCopiesBySourceActorId, unlinkDeletedCopy} from './module/auras/aura-helpers.js';
import {ActorSheetObject} from './module/actor/sheets/object.js';
import {ActorChatListener} from './module/actor/chat/chatListener.js';
import {ItemChatListener} from './module/item/chat/chatListener.js';
import {D35ECombatTracker} from './module/combat/combat-tracker.js';
import {TokenDocumentPF} from './module/token/tokenDocument.js';
import {
  darkvision,
  DetectionModeBlindSightD35E,
  DetectionModeInvisibilityD35E,
  DetectionModeTremorD35E,
} from './module/canvas/detection-modes.js';
import {EquipmentSheet35E} from './module/item/sheets/equipment.js';
import {WeaponSheet35E} from './module/item/sheets/weapon.js';
import {FeatSheet35E} from './module/item/sheets/feat.js';
import {Weapon35E} from './module/item/weapon.js';
import {Equipment35E} from './module/item/equipment.js';
import {ItemBase35E} from './module/item/base.js';
import {Spell35E} from './module/item/spell.js';
import {Card35E} from './module/item/card.js';
import {Feat35E} from './module/item/feat.js';
import {Sockets} from './module/sockets/sockets.js';
import {CompendiumBrowser} from './module/apps/compendium-browser.js';
import {Logger} from './module/utils/logger.js';
import {EnrichersHelper} from './module/enrichers.js';
import {ItemEquipHook} from './module/item/hooks/itemEquipHook.js';
import {DistanceHelper} from './module/canvas/distance-helper.js';
// 合并mod加载器（逐步合并中，当前仅chatedit）
import './module/mods/index.js';
import './module/chatportrait/chatportrait.js';
import './module/damageSound.js';
import './module/mods/monks-little-details/mld.js';
import './module/mods/notebook/scripts/MainData.js'; // Notebook 笔记侧边栏（内置：数据/笔记管理器）
import './module/mods/notebook/scripts/MainTab.js';
import './module/mods/notebook/scripts/settings.js';
import './module/mods/notebook/scripts/helpers/SocketHandler.js'; //内置：受击音效（伤害结算播放） //内置 Chat Portrait（聊天肖像+消息染色，裁剪版：仅①肖像②染色，Token聚焦/战斗追踪/内嵌发言等已停用）
import './module/mods/immediate-action/immediate-action.js'; //内置：直觉动作（GM一键推送直觉动作能力给玩家；使用直觉动作后下回合不获得迅捷动作）
import './module/walk-animation.js'; //内置：RPG Maker MV 行走图模式（3列×4行四方向 12321 帧乒乓，角色卡行走图按钮配置）
import './module/token-key-move.js'; //内置：方向键平滑移动（系统设置开关，跳过键盘重复延迟）
import './module/settings-categories.js'; //内置：设置面板分类（基础/功能/视觉/音效/杂项）
import './module/battle-animation.js'; //内置：战斗动画系统（RPG Maker MV 帧动画：近战/远程/治疗/能力四类，物品卡+系统配置，whisper同步）
import './module/target-lines.js'; //内置：锁定连线特效（目标连线：账号颜色、全员可见、向目标流动光效，系统设置-视觉分类开关）
import './module/batch-attack.js'; //内置：批量攻击（GM 框选多 Token 勾选攻击与加值，对锁定目标批量投掷，角色间 200ms 队列；设置-功能-批量攻击宏 一键创建宏）
import './module/monks-tokenbar/js/jquery.typeahead.min.js'; // monks-tokenbar 依赖（UMD→globalThis 适配）
import './module/monks-tokenbar/monks-tokenbar.js'; // 内置 Monk's TokenBar（v11.14：D35E 原生适配，tokenbar 面板/锁定移动/群体检定/分配XP；socket 改用 socketlib registerSystem）
import './module/mods/narrator-tools/context-menu.min.js'; // narrator-tools 依赖（右键菜单库，先于 narrator.js 加载）
import './module/mods/narrator-tools/narrator.js'; // 内置 Narrator Tools（v0.79：旁白/描述/笔记聊天卡，/desc /narrat /not 命令）
import './module/mods/storyteller/turn.min.js'; // storyteller 翻页库（$.fn.turn，先于 main.js 加载）
import './module/mods/storyteller/main.js'; // 内置 Storyteller（v1.2.0：故事书式日志卡）

// [D35E]内置模组资源清单（样式注入与语言合并共用；{ id: 目录名, styles: 相对 css 路径, langs: 可用语言文件名 }）
const BUNDLED_MODS = [
  { id: "narrator-tools", styles: ["narrator.css", "context-menu.min.css"], langs: ["cn", "de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt-BR", "ru", "th"] },
  { id: "storyteller", styles: ["css/storyteller.css"], langs: ["en", "es", "ja", "zh-tw"] },
];

// [D35E]内置模组以模块 scope 读写 flags：内置后模组未启用，getFlag/setFlag/unsetFlag 会报
// "Flag scope 无效"（如 narrator-tools 读取旁白消息类型），此处对内置模组的 scope 放行
//（数据仍存 flags.<scope>，兼容旧数据；与 gm-screen 移除前相同的方案，改为通用）
const BUNDLED_FLAG_SCOPES = ["narrator-tools", "storyteller"];

/** 放行内置模组的 flags 读写（patch foundry.abstract.Document，幂等） */
function _patchBundledFlagScopes() {
  const DocProto = foundry.abstract.Document?.prototype;
  if (!DocProto || DocProto._d35eBundledFlagPatched) return;
  DocProto._d35eBundledFlagPatched = true;
  const isBundled = (scope) => BUNDLED_FLAG_SCOPES.includes(scope) || scope === "D35E"; // [D35E]D35E 系统 scope 一并放行（原版 setFlag 的 flags 深合并偶发不生效）
  const origGet = DocProto.getFlag;
  const origSet = DocProto.setFlag;
  const origUnset = DocProto.unsetFlag;
  DocProto.getFlag = function (scope, key) {
    if (isBundled(scope)) return getProperty(this.flags[scope] || {}, key);
    return origGet.call(this, scope, key);
  };
  DocProto.setFlag = async function (scope, key, value) {
    if (isBundled(scope)) {
      // [D35E]点路径直接写嵌套字段：不依赖实例 flags 缓存，连续 setFlag 互不覆盖
      return this.update({ [`flags.${scope}.${key}`]: value });
    }
    return origSet.call(this, scope, key);
  };
  DocProto.unsetFlag = async function (scope, key) {
    if (isBundled(scope)) return this.update({ [`flags.${scope}.-=${key}`]: null });
    return origUnset.call(this, scope, key);
  };
}


// Add String.format
if (!String.prototype.format) {
  String.prototype.format = function (...args) {
    return this.replace(/{(\d+)}/g, function (match, number) {
      return args[number] != null ? args[number] : match;
    });
  };
}

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`D35E | Initializing D35E System`);

  // [D35E]内置模组资源加载：注入样式 + 合并语言（原模组语言文件不会自动加载）
  // 清单：{ id: 目录名, styles: 相对 css 路径, langs: 可用语言文件名 }
  const bundledMods = BUNDLED_MODS;
  for (const mod of bundledMods) {
    const modBase = `/systems/D35E/module/mods/${mod.id}/`;
    // 样式：逐个注入 <link>
    for (const style of mod.styles) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = modBase + style;
      document.head.appendChild(link);
    }
    // 语言：优先当前语言，缺失时取清单第一个可用
    // 语言回退：模组有当前语言才优先尝试（避免对不存在的语言文件发 404 请求），否则按清单顺序取第一个可用
    const langCandidates = mod.langs.includes(game.i18n.lang) ? [game.i18n.lang, ...mod.langs.filter((l) => l !== game.i18n.lang)] : mod.langs;
    for (const lang of langCandidates) {
      try {
        const langData = await fetch(modBase + `lang/${lang}.json`).then((r) => (r.ok ? r.json() : null));
        if (langData) {
          mergeObject(game.i18n.translations, langData);
          break;
        }
      } catch (e) {
        /* 单语言失败继续尝试下一个 */
      }
    }
  }

  // CGMP 功能合并（发言锁定 / 聊天命令 / 输入通知 / NPC滚动数字）
  _patchBundledFlagScopes(); // [D35E]内置模组 flags scope 放行（narrator-tools 等）
  registerCGMPFeatures();
  registerDiceTray();

  // Clean local storage
  var toRemove = [];

  // Create a D35E namespace within the game global
  game.D35E = {
    ActorPF,
    DicePF,
    Item35E,
    migrations,
    rollItemMacro,
    rollDefenses,
    requestRoll,
    rollTurnUndead,
    rollPreProcess: {
      sizeRoll: sizeDie,
      sizeNaturalRoll: sizeNaturalDie,
      sizeMonkDamageRoll: sizeMonkDamageDie,
      sizeVal: sizeInt,
    },
    migrateWorld: migrations.migrateWorld,
    migrateCompendium: migrations.migrateCompendium,
    createdMeasureTemplates: new Set(),
    sockets: new Sockets(),
    logger: new Logger(),
  };

  // 注册快捷键（必须在 init hook 内）
  registerKeybindings();
  registerChatViewKeybindings();

  if (!isMinimumCoreVersion("10.0")) {
    Object.defineProperty(ActorPF.prototype, "_id", {
      get: function _id() {
        console.warn("Using old mapper for _id.");
        return this.id;
      },
    });
    Object.defineProperty(Item35E.prototype, "_id", {
      get: function _id() {
        console.warn("Using old mapper for _id.");
        return this.id;
      },
    });
  }

  // Record Configuration Values
  CONFIG.D35E = D35E;
  ItemEquipHook.register();
  // CONFIG.debug.hooks = true; // [D35E 2026-08-18] 已禁用：开启后每个 hook 调用都输出 DEBUG 日志（单次加载数百条控制台噪音）。需要调试时取消注释。
  CONFIG.Actor.documentClass = ActorPF;
  CONFIG.Item.documentClass = ItemBase35E;
  CONFIG.Item.documentClasses = {
    default: Item35E,
    weapon: Weapon35E,
    equipment: Equipment35E,
    spell: Spell35E,
    card: Card35E,
    feat: Feat35E,
  };
  CONFIG.Item.compendiumIndexFields.push("system.index.subType");
  CONFIG.Item.compendiumIndexFields.push("system.index.uniqueId");
  CONFIG.ActiveEffect.documentClass = ActiveEffectD35E;
  CONFIG.MeasuredTemplate.objectClass = MeasuredTemplatePF;
  CONFIG.ChatMessage.documentClass = ChatMessagePF;
  CONFIG.Combat.documentClass = CombatD35E;
  CONFIG.Combatant.documentClass = CombatantD35E;
  CONFIG.Token.objectClass = TokenPF;
  CONFIG.Token.documentClass = TokenDocumentPF;
  CONFIG.Canvas.visionModes.darkvision = darkvision;
  CONFIG.Canvas.detectionModes[DetectionModeInvisibilityD35E.ID] = new DetectionModeInvisibilityD35E({
    id: DetectionModeInvisibilityD35E.ID,
    label: DetectionModeInvisibilityD35E.LABEL,
    type: DetectionModeInvisibilityD35E.DETECTION_TYPE || DetectionMode.DETECTION_TYPES.SIGHT,
  });
  CONFIG.Canvas.detectionModes[DetectionModeTremorD35E.ID] = new DetectionModeTremorD35E({
    id: DetectionModeTremorD35E.ID,
    label: DetectionModeTremorD35E.LABEL,
    type: DetectionModeTremorD35E.DETECTION_TYPE || DetectionMode.DETECTION_TYPES.SIGHT,
  });
  CONFIG.Canvas.detectionModes[DetectionModeBlindSightD35E.ID] = new DetectionModeBlindSightD35E({
    id: DetectionModeBlindSightD35E.ID,
    label: DetectionModeBlindSightD35E.LABEL,
    type: DetectionModeBlindSightD35E.DETECTION_TYPE || DetectionMode.DETECTION_TYPES.SIGHT,
  });

  CONFIG.ui.combat = D35ECombatTracker;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("D35E", ActorSheetPFCharacter, {
    types: ["character"],
    makeDefault: true,
    label: game.i18n.localize("D35E.ActorSheetPFCharacter"),
  });
  Actors.registerSheet("D35E", ActorSheetPFNPC, {
    types: ["npc"],
    makeDefault: true,
    label: game.i18n.localize("D35E.ActorSheetPFNPC"),
  });
  Actors.registerSheet("D35E", ActorSheetPFNPCLite, {
    types: ["npc"],
    makeDefault: false,
    label: game.i18n.localize("D35E.ActorSheetPFNPCLite"),
  });
  Actors.registerSheet("D35E", ActorSheetPFNPCLoot, {
    types: ["npc", "character"],
    makeDefault: false,
    label: game.i18n.localize("D35E.ActorSheetPFNPCLoot"),
  });
  Actors.registerSheet("D35E", ActorSheetPFNPCMonster, {
    types: ["npc", "character"],
    makeDefault: false,
    label: game.i18n.localize("D35E.ActorSheetPFNPCMonster"),
  });
  Actors.registerSheet("D35E", ActorSheetTrap, {
    types: ["trap"],
    makeDefault: true,
    label: game.i18n.localize("D35E.ActorSheetPFNPCTrap"),
  });
  Actors.registerSheet("D35E", ActorSheetObject, {
    types: ["object"],
    makeDefault: true,
    label: game.i18n.localize("D35E.ActorSheetPFNPCObject"),
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("D35E", ItemSheetPF, {
    types: [
      "class",
      "spell",
      "consumable",
      "enhancement",
      "loot",
      "buff",
      "aura",
      "attack",
      "race",
      "damage-type",
      "material",
      "full-attack",
      "card",
      "valuable",
    ],
    makeDefault: true,
  });
  Items.registerSheet("D35E", EquipmentSheet35E, { types: ["equipment"], makeDefault: true });
  Items.registerSheet("D35E", WeaponSheet35E, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("D35E", FeatSheet35E, { types: ["feat"], makeDefault: true });

  // Register System Settings
  registerSystemSettings();
  // 触发合并mod的设置注册（排在3R设置下方）
  Hooks.callAll("D35E.modSettingsInit");

  if (isMinimumCoreVersion("10.0")) {
    CONFIG.statusEffects = getConditions();
    const layers = {
      d35e: {
        layerClass: D35ELayer,
        group: "primary",
      },
    };
    CONFIG.Canvas.layers = foundry.utils.mergeObject(Canvas.layers, layers);
  } else {
    CONFIG.statusEffects = getConditions();
    const layers = {
      d35e: {
        layerClass: D35ELayer,
        group: "primary",
      },
    };
    CONFIG.Canvas.layers = foundry.utils.mergeObject(Canvas.layers, layers);
  }
  if (isMinimumCoreVersion("10")) {
    CONFIG.Canvas.layers.templates.layerClass = TemplateLayerPF;
  } else if (isMinimumCoreVersion("9")) {
    CONFIG.Canvas.layers.templates.layerClass = TemplateLayerPF;
    CONFIG.Canvas.layers.sight.layerClass = SightLayerPF;
  } else {
    CONFIG.Canvas.layers.templates = TemplateLayerPF;
    CONFIG.Canvas.layers.sight = SightLayerPF;
  }

  Handlebars.registerHelper("d35eAlignmentKey", function (v) {
  // [D35E]阵营下拉：兼容旧数据（中文/英文全称）映射为英文简写
  const M = {"LG":"守序善良","NG":"中立善良","CG":"混乱善良","LN":"守序中立","N":"绝对中立","CN":"混乱中立","LE":"守序邪恶","NE":"中立邪恶","CE":"混乱邪恶","Lawful Good":"LG","Neutral Good":"NG","Chaotic Good":"CG","Lawful Neutral":"LN","Neutral":"N","Chaotic Neutral":"CN","Lawful Evil":"LE","Neutral Evil":"NE","Chaotic Evil":"CE"};
  return M[String(v || "").trim()] || v || "";
});
Handlebars.registerHelper("ifeq", function (a, b, options) {
    if (a == b) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // CONFIG.Canvas.layers.d35e = {
  //   layerClass: D35ELayer,
  //   group: "interface",
  // };

  // Patch Core Functions
  PatchCore();
  // Preload Handlebars Templates
  await preloadHandlebarsTemplates();
  applyConfigModifications();
  // Register sheet application classes
  game.D35E.sockets.init();

  game.D35E.compendiumBrowser = new CompendiumBrowser({ type: "spells", entityType: "Item" });
  // Enable skin
  $("body").toggleClass("d35ecustom", game.settings.get("D35E", "customSkin"));
  $("body").toggleClass("color-blind", game.settings.get("D35E", "colorblindColors"));
  $("body").toggleClass("no-players-list", game.settings.get("D35E", "hidePlayersList"));
  EnrichersHelper.setupEnrichers();
  });

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {
  // Localize CONFIG objects once up-front
  const toLocalize = [
    "abilities",
    "abilitiesShort",
    "alignments",
    "currencies",
    "distanceUnits",
    "distanceUnitsShort",
    "itemActionTypes",
    "senses",
    "skills",
    "targetTypes",
    "timePeriods",
    "timePeriodsSpells",
    "savingThrows",
    "ac",
    "acValueLabels",
    "featTypes",
    "conditions",
    "lootTypes",
    "flyManeuverabilities",
    "spellPreparationModes",
    "weaponTypes",
    "weaponProperties",
    "spellComponents",
    "spellSchools",
    "spellLevels",
    "conditionTypes",
    "favouredClassBonuses",
    "armorProficiencies",
    "weaponProficiencies",
    "actorSizes",
    "actorTokenSizes",
    "abilityActivationTypes",
    "abilityActivationTypesPlurals",
    "limitedUsePeriods",
    "equipmentTypes",
    "equipmentSlots",
    "consumableTypes",
    "attackTypes",
    "attackTypesShort",
    "buffTypes",
    "buffTargets",
    "contextNoteTargets",
    "healingTypes",
    "divineFocus",
    "classSavingThrows",
    "classBAB",
    "classTypes",
    "measureTemplateTypes",
    "creatureTypes",
    "race",
    "damageTypes",
    "conditionalTargets",
    "savingThrowTypes",
    "requirements",
    "savingThrowCalculationTypes",
    "attackTypesIcon",
    "abilityTypes",
    "auraTarget",
  ];

  const doLocalize = function (obj) {
    return Object.entries(obj).reduce((obj, e) => {
      if (typeof e[1] === "string") obj[e[0]] = game.i18n.localize(e[1]);
      else if (typeof e[1] === "object") obj[e[0]] = doLocalize(e[1]);
      return obj;
    }, {});
  };
  for (let o of toLocalize) {
    try {
      CONFIG.D35E[o] = doLocalize(CONFIG.D35E[o]);
    } catch (e) {
      //ignore
    }
  }
});

/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", async function () {

  // [D35E]内置模组语言兜底：init 阶段 fetch 偶发失败导致语言 key 未合并，ready 后重放（mergeObject 幂等）
  for (const mod of BUNDLED_MODS) {
    const modBase = `/systems/D35E/module/mods/${mod.id}/`;
    const candidates = mod.langs.includes(game.i18n.lang) ? [game.i18n.lang, ...mod.langs.filter((l) => l !== game.i18n.lang)] : mod.langs;
    for (const lang of candidates) {
      try {
        const langData = await fetch(modBase + `lang/${lang}.json`).then((r) => (r.ok ? r.json() : null));
        if (langData) { mergeObject(game.i18n.translations, langData); break; }
      } catch (e) { /* 单语言失败继续尝试下一个 */ }
    }
  }



  // [D35E]预加载专长/特性物品行 partial（供专长/职业特性文件夹模板引用）
  try {
    await getTemplate("systems/D35E/templates/actors/parts/actor-features-item.html");
  } catch (e) {
    /* 模板加载失败不影响其余功能 */
  }
  registerAutoApplyHooks();
  registerChatViews();
  registerChatCommandSuggest(); // [D35E]聊天命令建议（输入 / 弹出 narrator 命令选项）
  registerAoO();
  registerChatDrag();
  registerChatExport(); // [D35E]聊天记录导出（GM）

  // [D35E]玩家伴侣服务探测：未启动时提示（仅 GM，每会话一次）
  if (game.user.isGM) {
    const serverUrl = (game.settings.get("D35E", "companionServerUrl") || "").replace(/\/+$/, "");
    if (serverUrl) {
      try {
        const res = await fetch(serverUrl + "/health", { signal: AbortSignal.timeout(1500) });
        if (!res.ok) throw new Error("bad");
      } catch (e) {
        ui.notifications.warn("玩家伴侣服务未启动：请双击 companion-server\\start.bat 启动（或检查开机自启）。");
      }
    }
  }
  $("body").toggleClass("d35gm", game.user.isGM);
  $("body").toggleClass("hide-special-action", !game.settings.get("D35E", "allowPlayersApplyActions"));
  $("body").toggleClass("transparent-sidebar", game.settings.get("D35E", "transparentSidebarWhenUsingTheme"));

  // [优化] 合集缓存改为后台构建，不再阻塞世界就绪（大量宝典文档加载不会卡住 ready）
  cache.buildCache().catch((err) => console.error("D35E | 合集缓存构建失败：", err));

  const NEEDS_MIGRATION_VERSION = "2.0.0";
  let PREVIOUS_MIGRATION_VERSION = game.settings.get("D35E", "systemMigrationVersion");
  if (typeof PREVIOUS_MIGRATION_VERSION === "number") {
    PREVIOUS_MIGRATION_VERSION = PREVIOUS_MIGRATION_VERSION.toString() + ".0";
  } else if (
      typeof PREVIOUS_MIGRATION_VERSION === "string" &&
      PREVIOUS_MIGRATION_VERSION.match(/^([0-9]+)\.([0-9]+)$/)
  ) {
    PREVIOUS_MIGRATION_VERSION = `${PREVIOUS_MIGRATION_VERSION}.0`;
  }
  console.log(PREVIOUS_MIGRATION_VERSION);
  // Previous migration version is unparseable
  let needMigration =
      SemanticVersion.fromString(PREVIOUS_MIGRATION_VERSION) == null
          ? true
          : SemanticVersion.fromString(NEEDS_MIGRATION_VERSION).isHigherThan(
          SemanticVersion.fromString(PREVIOUS_MIGRATION_VERSION)
          );
  if (needMigration && game.user.isGM) {
    new Dialog(
        {
          title: `${game.i18n.localize("D35E.MigrationTitle")}`,
          content: `<p>${game.i18n.localize("D35E.MigrationText")}</p>`,
          buttons: {
            confirm: {
              label: game.i18n.localize("D35E.MigrationIMadeBackup"),
              callback: async (html) => {
                await migrations.migrateWorld();
              },
            },
            cancel: {
              label: game.i18n.localize("D35E.MigrationShutDown"),
              callback: async (html) => {
                game.shutDown();
              },
            },
          },
          default: "confirm",
        },
        {
          classes: ["dialog", "D35E", "duplicate-initiative"],
        }
    ).render(true);
  } else if (needMigration) {
    new Dialog(
        {
          title: `${game.i18n.localize("D35E.MigrationTitle")}`,
          content: `<p>${game.i18n.localize("D35E.MigrationTextUser")}</p>`,
          buttons: {
            cancel: {
              label: game.i18n.localize("D35E.MigrationLogOut"),
              callback: async (html) => {
                game.logOut();
              },
            },
          },
          default: "cancel",
        },
        {
          classes: ["dialog", "D35E", "duplicate-initiative"],
        }
    ).render(true);
  }
  let isDemo = game.settings.get("D35E", "demoWorld");
  if (isDemo) {
    $("#chat-message").val("Chat is disabled in Demo Mode. This world resets every 2 hours!");
    $("#chat-message").prop("disabled", true);
    if (game.paused) game.togglePause();
  }

  console.log("D35E | Cache is ", CACHE);
  //game.actors.contents.forEach(obj => { obj._updateChanges({sourceOnly: true}, {skipToken: true}); });

  console.log("D35E | Checking Patreon information");
  PatreonIntegrationFactory.getInstance().doPatreonCheck();

  Hooks.on("renderTokenHUD", (app, html, data) => {
    TokenQuickActions.addTop3Attacks(app, html, data);
  });
  Hooks.on("renderTokenHUD", (app, html, data) => {
    TokenQuickActions.addTop3Buffs(app, html, data);
  });

  for (let key of game.actors.keys()) {
    TopPortraitBar.render(game.actors.get(key));
  }

  let updateRequestArray = [];

  if (!game.user.isGM) {
    let isDemo = game.settings.get("D35E", "demoWorld");
    if (isDemo) {
      (
          await import(
              /* webpackChunkName: "welcome-screen" */
              "./module/demo-screen.js"
              )
      ).default();
    } else {
      (
          await import(
              /* webpackChunkName: "welcome-screen" */
              "./module/onboarding.js"
              )
      ).default();
    }
    return;
  }

  Hooks.on("renderCombatTracker", (bar, data, slot) => {
    if (game.combat) {
      game.combat.updateCombatCharacterSheet();
    }
  });
  Hooks.on("changeSidebarTab", (tab) => {
    if (tab instanceof D35ECombatTracker) {
      if (game.combat) {
        game.combat.updateCombatCharacterSheet();
      }
    }
  });

  // Edit next line to match module.
  const system = game.system;
  const title = system.title;
  const moduleVersion = system.version;
  game.settings.register(title, "version", {
    name: `${title} Version`,
    default: "0.0.0",
    type: String,
    scope: "world",
  });
  const oldVersion = game.settings.get(title, "version");

  (
      await import(
          /* webpackChunkName: "welcome-screen" */
          "./module/onboarding.js"
          )
  ).default();
  if (!isNewerVersion(moduleVersion, oldVersion)) return;
  (
      await import(
          /* webpackChunkName: "welcome-screen" */
          "./module/welcome-screen.js"
          )
  ).default();
});

Hooks.on("renderSettings", (app, html) => {
  let lotdSection = $(`<h2 id="d35e-help-section" data-action="d35e-help">3.5e SRD Help</h2>`);
  html.find("#settings-game").after(lotdSection);
  let lotdDiv = $(`<div id="d352-help"></div>`);
  lotdSection.after(lotdDiv);
  let helpButton = $(
      `<button id="d35e-help-btn" data-action="d35e-help"><i class="fas fa-question-circle"></i> Documentation</button>`
  );
  lotdDiv.append(helpButton);
  helpButton.on("click", (ev) => {
    ev.preventDefault();
    window.open("https://docs.legaciesofthedragon.com", "lotdHelp", "width=1032,height=900");
  });

  let dicordButton = $(
      `<button id="d35e-discord" data-action="d35e-discord"><i class="fab fa-discord"></i> Community Discord</button>`
  );
  lotdDiv.append(dicordButton);
  dicordButton.on("click", (ev) => {
    ev.preventDefault();
    window.open("https://discord.gg/wDyUaZH", "_blank");
  });

  let patreonButton = $(
      `<button id="d35e-discord" data-action="d35e-discord"><i class="fab fa-patreon"></i> Support on Patreon</button>`
  );
  lotdDiv.append(patreonButton);
  patreonButton.on("click", (ev) => {
    ev.preventDefault();
    window.open("https://patreon.com/rughalt", "_blank");
  });
});

Hooks.on("renderSidebarTab", async (app, html) => {
  if (game.user.isGM) {
    if (app?.options?.id == "compendium" || app instanceof CompendiumDirectory) {
      let style = "";
      if (game.release.generation >= 11) {
      }
      html.find(".drgh-encounter-browser").remove();
      let button = $(
          `<button class='drgh-encounter-browser' style="${style}">合集资源搜索器</button>`
      );
      button.on("click", () => {
        game.D35E.compendiumBrowser.render(true);
      });
      html.find(".header-actions").append(button);
    }
  }
});


Hooks.on("renderActorSheet", function (sheet, window, data) {
  //sheet.object.refresh({render: false})
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function () {
  // Extend Diagonal Measurement
  canvas.grid.diagonalRule = game.settings.get("D35E", "diagonalMovement");
  if (isMinimumCoreVersion("0.5.6")) SquareGrid.prototype.measureDistances = measureDistances;
  else SquareGrid.prototype.measureDistance = measureDistance;
});

Hooks.on("renderSceneNavigation", function () {
  for (let key of game.actors.keys()) {
    TopPortraitBar.render(game.actors.get(key));
  }
});

Hooks.on("dropActorSheetData", function (actor, sheet, dropData, userId) {
  if (actor && actor.sheet && dropData.id && !dropData.uuid) {
    //We only handle the weird drops that do not have UUID
    actor.sheet.addItemFromDropData(dropData);
  }
});

Hooks.on("deleteActor", function (actor) {
  TopPortraitBar.clear();
  for (let key of game.actors.keys()) {
    TopPortraitBar.render(game.actors.get(key));
  }
  // 绑定光环：光环来源 actor 被删除 → 删除它散落在其他 actor 上的复制品
  if (game.user?.isGM && actor?.id) deleteCopiesBySourceActorId(actor.id);
});

Hooks.on("createActor", (actor, data, options) => {
  if (actor.data.type === "character") {
    let updateData = {};
    if (
        actor.data.data.details?.levelUpProgression === undefined ||
        actor.data.data.details?.levelUpProgression === null
    ) {
      updateData["data.details.levelUpProgression"] = true;
    }
    updateData["token.vision"] = true;
    updateData["token.actorLink"] = true;
    if (updateData) actor.update(updateData);
  } else if (actor.data.type === "npc") {
    let updateData = {};
    updateData["token.bar1"] = { attribute: "attributes.hp" };
    updateData["token.displayName"] = 20;
    updateData["token.displayBars"] = 40;
    if (updateData) actor.update(updateData);
  }
});
/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", (chatMessage, html, data) => {


  // Display action buttons
  chat.displayChatActionButtons(chatMessage, html, data);

  // Hide roll info
  chat.hideRollInfo(chatMessage, html, data);

  // Hide GM sensitive info
  chat.hideGMSensitiveInfo(chatMessage, html, data);

  chat.enableToggles(chatMessage, html, data);

  chat.bindShowReveal(chatMessage, html, data);

  // Optionally collapse the content
  if (game.settings.get("D35E", "autoCollapseItemCards")) html.find(".card-content.item").hide();
});

// AoO notification: clicking a threatening-token row selects that token on canvas
Hooks.on("renderChatMessage", (chatMessage, html, data) => {
  html[0]?.querySelectorAll?.(".aoo-threatener").forEach((el) => {
    el.addEventListener("click", (event) => {
      const tokenId = el.dataset.tokenId;
      const token = canvas?.tokens?.get(tokenId);
      if (token) token.control({ releaseOthers: !event.shiftKey });
    });
    el.addEventListener("mouseenter", () => {
      const token = canvas?.tokens?.get(el.dataset.tokenId);
      if (token) try { token._onHoverIn(new Event("mouseenter"), { hoverOutOthers: false }); } catch (e) { }
    });
    el.addEventListener("mouseleave", () => {
      const token = canvas?.tokens?.get(el.dataset.tokenId);
      if (token) try { token._onHoverOut(new Event("mouseleave")); } catch (e) { }
    });
  });
});

// ===== 赐福抽取（ArtifactPicker）聊天按钮支持：所有客户端加载即注册，玩家无需手动运行宏B =====
Hooks.on("renderChatMessage", (chatMessage, html, data) => {
  const apBtn = html.find("[data-ap-open]");
  if (apBtn.length) {
    apBtn.off("click").on("click", () => {
      game.apPickerCurrentMsgId = apBtn.attr("data-ap-id") || "";
      game.apPickerTables = JSON.parse(apBtn.attr("data-tables") || "[]");
      game.apPickerBg = apBtn.attr("data-ap-bg") || "";
      const apMacro = game.macros.getName("ArtifactPicker_Open");
      if (apMacro) apMacro.execute();
      else ui.notifications.warn("未找到玩家端宏「ArtifactPicker_Open」，请先导入。");
    });
    // 该轮已选择（聊天历史中存在选择消息，含 GM 标记后的 data-ap-handled）→ 按钮置灰禁用
    const apMsgId = apBtn.attr("data-ap-id") || "";
    if (apMsgId) {
      const apPicked = game.messages.some(m => {
        const c = m.content || "";
        return c.includes(`data-ap-id="${apMsgId}"`) && (c.includes("data-ap-pick") || c.includes("data-ap-handled"));
      });
      if (apPicked) apBtn.prop("disabled", true).css({ opacity: .45, cursor: "not-allowed", filter: "grayscale(1)" });
    }
  }
  // 内部通信消息（空白的关闭通知）不显示，渲染后自动删除（玩家/GM 端都执行）
  if (html.find("[data-ap-close]").length) {
    html.hide();
    setTimeout(() => { chatMessage.delete().catch(() => {}); }, 100);
  }
  if (!game.user.isGM) return;
  // 玩家抽取完成（data-ap-done）→ 恢复随机表权限
  if (html.find("[data-ap-done]").length && game.apPickerOrigState) {
    (async () => {
      const entries = Object.entries(game.apPickerOrigState);
      delete game.apPickerOrigState;
      for (const [id, st] of entries) {
        const t = game.tables.get(id);
        if (t && st.permission) await t.update({ permission: st.permission });
      }
    })();
  }
  // 记录该轮已完成（世界 flag，持久）→ 玩家端刷新后禁止重新打开/抽取
  const doneMsg = html.find("[data-ap-done]");
  if (doneMsg.length) {
    const msgId = doneMsg.attr("data-ap-id") || "";
    if (msgId) {
      (async () => {
        try {
          const completed = game.world.flags?.artifactPicker?.completed || {};
          if (!completed[msgId]) {
            completed[msgId] = true;
            await game.world.update({ "flags.artifactPicker.completed": completed });
          }
        } catch (e) { console.warn("记录已完成赐福失败：", e); }
      })();
    }
  }
  // 从表结果解析指向的文档（合集拖入的物品：COMPENDIUM 类型）
  async function resolveArtifactDoc(res) {
    if (!res) return null;
    const dc = res.documentCollection || "";
    const di = res.documentId || "";
    try {
      if (di && di.includes(".")) {
        const d = await fromUuid(di);
        if (d instanceof foundry.abstract.Document) return d;
      }
      if (dc && di) {
        const d = await fromUuid(`${dc}.${di}`);
        if (d) return d;
      }
      if (dc && di) {
        const pack = game.packs.get(dc.replace(/^Compendium\./, ""));
        if (pack) return pack.getDocument(di);
      }
    } catch (e) {}
    return null;
  }
  // 玩家选择赐福（data-ap-pick）→ 显式锁定（v11 用 drawn）+ 自动从合集发放该物品
  // 处理前先持久标记（content 里 data-ap-pick → data-ap-handled），刷新/历史重渲染不会再处理，避免重复发放
  const pick = html.find("[data-ap-pick]");
  if (pick.length) {
    if (!pick.attr("data-ap-handled")) {
      const tableId = pick.attr("data-table-id");
      const resultId = pick.attr("data-result-id");
      const itemUuid = pick.attr("data-ap-item-uuid") || "";
      chatMessage.update({ content: chatMessage.content.replace("data-ap-pick", "data-ap-handled") }).catch(() => {});
      if (tableId && resultId) {
        // 备用记录：该轮已完成（世界 flag；主通道为聊天消息中的选择消息）
        const pickMsgId = pick.attr("data-ap-id") || "";
        if (pickMsgId) {
          try {
            const completed = game.world.flags?.artifactPicker?.completed || {};
            if (!completed[pickMsgId]) {
              completed[pickMsgId] = true;
              game.world.update({ "flags.artifactPicker.completed": completed }).catch(() => {});
            }
          } catch (e) {}
        }
        const t = game.tables.get(tableId);
        if (t) {
          t.updateEmbeddedDocuments("TableResult", [{ _id: resultId, drawn: true }]).then(() => {
            ui.notifications.info("已记录赐福选择，该结果已锁定（之后投掷不再出现）");
          }).catch((e) => console.warn("锁定赐福失败：", e));
        }
      }
      // 自动从合集获取该物品（走 GM 权限，放入发送者角色）
      (async () => {
        try {
          let doc = itemUuid ? await fromUuid(itemUuid) : null;
          if (!doc && tableId && resultId) {
            const t = game.tables.get(tableId);
            const res = t ? t.results.get(resultId) : null;
            if (res && (res.type === CONST.TABLE_RESULT_TYPES.DOCUMENT || res.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM)) {
              doc = await resolveArtifactDoc(res);
            }
          }
          if (doc && doc.documentName === "Item") {
            const actorUuid = pick.attr("data-ap-actor-uuid") || chatMessage.speaker?.actor || game.users.get(chatMessage.user)?.character?.uuid || "";
            const actor = actorUuid ? await fromUuid(actorUuid) : null;
            if (actor) {
              await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
              ui.notifications.info(`已将「${doc.name}」添加到 ${actor.name} 的物品栏`);
            } else {
              ui.notifications.warn("未找到发送者角色，无法自动发放物品");
            }
          }
        } catch (e) { console.warn("发放赐福失败：", e); }
      })();
    }
  }
  // 玩家关闭窗口（data-ap-close）→ 解锁未选择的项目（v11 drawn）+ 恢复权限/不可重复获取开关
  const close = html.find("[data-ap-close]");
  if (close.length) {
    const tableIds = JSON.parse(close.attr("data-table-ids") || "[]");
    const resultIds = JSON.parse(close.attr("data-result-ids") || "[]");
    const pickedTable = close.attr("data-picked-table-id") || "";
    const pickedId = close.attr("data-picked-result-id") || "";
    (async () => {
      for (const tableId of tableIds) {
        const t = game.tables.get(tableId);
        if (!t) continue;
        // 只解锁本轮抽取且未被选择的结果；历史已锁定的（上一轮被选择的）保持锁定
        const drawn = t.results.filter(r => r.drawn && resultIds.includes(r.id) && !(tableId === pickedTable && r.id === pickedId));
        if (drawn.length) {
          await t.updateEmbeddedDocuments("TableResult", drawn.map(r => ({ _id: r.id, drawn: false })));
        }
        if (game.apPickerOrigState && game.apPickerOrigState[tableId]) {
          const orig = game.apPickerOrigState[tableId];
          const upd = {};
          if (orig.permission) upd.permission = orig.permission;
          if (typeof orig.lockResults === "boolean") upd.lockResults = orig.lockResults;
          await t.update(upd);
          delete game.apPickerOrigState[tableId];
        }
      }
    })();
  }
});
// Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
Hooks.on("renderChatLog", (_, html) => ItemChatListener.chatListeners(html));
Hooks.on("renderChatLog", (_, html) => ActorChatListener.chatListeners(html));
Hooks.on("renderChatPopout", (_, html) => ItemChatListener.chatListeners(html));
Hooks.on("renderChatPopout", (_, html) => ActorChatListener.chatListeners(html));

const debouncedCollate = debounce((a, b, c, d) => CollateAuras(a, b, c, d), 500);
const debouncedSyncLinked = debounce(() => SyncLinkedAuras(), 250);
Hooks.on("updateItem", (item, changedData, options, user) => {
  console.log("D35E | Updated Item", item, changedData, options, user, game.userId);
  // 绑定光环：源光环被编辑 → 同步全部复制品；从绑定模式切回距离模式 → 清理残留复制品
  if (
      item.type === "aura" &&
      !getProperty(item.system, "sourceAuraId") &&
      !options?.stopLinkedSync
  ) {
    if (getProperty(item.system, "auraMode") === "linked") {
      debouncedSyncLinked();
    } else if (hasProperty(changedData, "system.auraMode")) {
      deleteLinkedCopies(item.id);
    }
  }
  let actor = item.parent;
  if (actor) {
    TopPortraitBar.render(actor);
    if (!(actor instanceof Actor)) return;

    if (user !== game.userId) {
      console.log("Not updating actor as action was started by other user");
      return;
    }
    //actor.refresh(options)
  }
});

Hooks.on("renderTokenConfig", async (app, html) => {
  // Disable vision elements if custom vision is disabled
  const noVisionOverride = getProperty(app.object.actor, "system.noVisionOverride") === true;
  if (!noVisionOverride) {
    html
        .find(`.tab[data-tab="vision"]`)
        .prepend(
            `<div style='width: 100%; padding: 4px; border-bottom: 1px solid var(--color-border-light-primary); margin-bottom: 4px;'><i class="fa-solid fa-circle-info"></i> ${game.i18n.localize(
                "D35E.VisionControlledByActor"
            )}</div>`
        );
    const tabElem = html.find(`.tab[data-tab="vision"]`);
    tabElem.find(`input, select`).prop("disabled", true);
    tabElem.find("a").unbind();
  } else {
    html
        .find(`.tab[data-tab="vision"]`)
        .prepend(
            `<div style='width: 100%; padding: 4px; border-bottom: 1px solid var(--color-border-light-primary); margin-bottom: 4px;'><i class="fa-solid fa-circle-info"></i> ${game.i18n.localize(
                "D35E.VisionNoAutomation"
            )}</div>`
        );
  }
  // let token = app.object.data.token || app.object.data;
  // let newHTML = await renderTemplate("systems/D35E/templates/internal/token-light-info.html", {
  //   object: duplicate(token.actorLink ? token.document.data.toObject(false) : token.flags ? token.toObject(false) : app.object.data.toObject(false)),
  //   globalDisable: game.settings.get("D35E", "globalDisableTokenLight")
  // });
  // html.find('.tab[data-tab="vision"] > *:nth-child(5)').after(newHTML);
  // let newHTML2 = await renderTemplate("systems/D35E/templates/internal/token-config.html", {
  //   object: duplicate(token.actorLink ? token.toObject(false) : token.flags ? token.toObject(false) : app.object.data.toObject(false))
  // });
  // html.find('.tab[data-tab="vision"] > *:nth-child(2)').after(newHTML2);
});

Hooks.on("renderAmbientLightConfig", (app, html) => {
  addLowLightVisionToLightConfig(app, html);
});

Hooks.on("createToken", async (token, options, userId) => {
  if (userId !== game.user.id) return;

  const actor = game.actors.tokens[token.id] ?? game.actors.get(token.data.actorId);
  actor.conditions.toggleConditionStatusIcons();

  // Update changes and generate sourceDetails to ensure valid actor data
  if (actor != null) await actor.refresh();

  if (game.settings.get("D35E", "randomizeHp") && token.actor.type === "npc" && !token.actor.hasPlayerOwner) {
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let itemUpdates = [];
    token.actor.data.items
        .filter((obj) => {
          return obj.type === "class";
        })
        .forEach((item) => {
          if (item.data.data.classType === "template") return;
          if (item.data.data.classType === "minion") return;
          let hd = item.data.data.hd;
          let hp = 0;
          let levels = item.data.data.levels;
          for (let i = 0; i < levels; i++) {
            hp += getRandomInt(1, hd);
          }
          itemUpdates.push({ _id: item._id, "data.hp": hp });
        });
    await token.actor.updateEmbeddedEntity("Item", itemUpdates, { stopUpdates: false, ignoreSpellbookAndLevel: true });
  }

  debouncedCollate(canvas.scene.id, true, true, "updateToken");
});

Hooks.on("canvasReady", async (canvas, options, userId) => {
  TopPortraitBar.clear();
  for (let key of game.actors.keys()) {
    TopPortraitBar.render(game.actors.get(key));
  }
  if (options?.stopAuraUpdate) return;
  debouncedCollate(canvas.scene.id, true, true, "canvasReady");
  SyncLinkedAuras();
});

Hooks.on("updateToken", async (token, data, options, userId) => {
  if (userId !== game.user.id) return false;
  if (options?.stopAuraUpdate) return;
  if (options.tokenOnly) return;
  debouncedCollate(canvas.scene.id, true, true, "updateToken");
});

// Redraw threatened highlights after a token moves (drag-and-drop or constrained path)
Hooks.on("updateToken", (tokenDoc, data, _options, _userId) => {
  if (!canvas) return;
  if (data?.x === undefined && data?.y === undefined) return;
  if (canvas.tokens.controlled.length !== 1) return;
  const placeable = tokenDoc.object;
  if (!placeable?.actor) return;
  // 以 document 目标位置渲染威胁范围：drag-ruler 用 animate:true 逐段移动，
  // 动画期间 placeable.x/y 仍是起点，且动画 promise 可能被中断导致 finally 不执行（高亮滞留）。
  const origX = placeable.x;
  const origY = placeable.y;
  placeable.x = tokenDoc.x;
  placeable.y = tokenDoc.y;
  DistanceHelper.drawThreatenedHighlights(placeable);
  placeable.x = origX;
  placeable.y = origY;
  // 动画结束后兜底重绘最终位置（正常完成时覆盖临时渲染）
  placeable?.movementAnimationPromise?.finally(() => {
    const tok = canvas.tokens.controlled[0];
    if (tok) DistanceHelper.drawThreatenedHighlights(tok);
  });
});

/**
 * 几何判定：敌人是否威胁某目标位置（与 DistanceHelper 威胁矩形计算一致，支持大型 token 多格中心）。
 * 用于借机攻击检测——drag-ruler 把一次拖动拆成逐段 update，每段距离 ≤1 格，
 * 原“单次移动距离>1格”启发式恒为真而跳过检测，这里改为直接比较移动前后威胁状态。
 */
function isPositionThreatenedBy(enemy, tx, ty, tw, th) {
  const { distPx, minDistPx } = DistanceHelper._getThreatDistancesInPixels(enemy);
  const gridSize = canvas.grid.size;
  const outerDist = distPx - gridSize * 0.1;
  const innerDist = minDistPx > 0 ? minDistPx + gridSize * 0.1 : -1;
  const outerRect = new PIXI.Rectangle(
    enemy.x - outerDist, enemy.y - outerDist,
    enemy.w + 2 * outerDist, enemy.h + 2 * outerDist
  );
  const innerRect = innerDist > 0
    ? new PIXI.Rectangle(enemy.x - innerDist, enemy.y - innerDist, enemy.w + 2 * innerDist, enemy.h + 2 * innerDist)
    : null;
  const size = gridSize;
  for (let dx = 0; dx < tw; dx += size) {
    for (let dy = 0; dy < th; dy += size) {
      const cx = tx + dx + size / 2;
      const cy = ty + dy + size / 2;
      if (outerRect.contains(cx, cy) && (!innerRect || !innerRect.contains(cx, cy))) return true;
    }
  }
  return false;
}

Hooks.on("preUpdateToken", async (token, data, options, userId) => {
  if (userId !== game.user.id) return false;
  if (token.actor.getFlag("D35E", "lootsheettype")) {
    if (data?.x || data?.y) {
      if (!game.user.isGM && !token.actor.getFlag("D35E", "allowPlayerMovement")) {
        return false;
      }
    }
  }

  // 借机攻击：棋子离开受威胁区域时弹出通知
  // drag-ruler 将一次拖动拆成逐段 update（每段 ≤1 格），原“单次移动距离>1格”启发式恒为真而跳过；
  // 改为比较移动前后威胁状态：原位置被威胁且目标位置不再被威胁 → 触发借机攻击。
  if (
    canvas &&
    (data?.x !== undefined || data?.y !== undefined) &&
    game.settings.get("D35E", "advanced-combat-tracking")
  ) {
    DistanceHelper.clearThreatHighlights();
    const rawToken = canvas.tokens.placeables.find((t) => t.id === token.id);
    if (rawToken) {
      const targetX = data.x ?? rawToken.x;
      const targetY = data.y ?? rawToken.y;
      // 位置未变化（如仅属性更新）→ 跳过
      if (targetX === rawToken.x && targetY === rawToken.y) return;
      // [D35E]移动者隐藏或陷入无助 → 不触发借机（弹窗与聊天提示均不出现）
      if (rawToken.document?.hidden) return;
      if (rawToken.actor?.system?.attributes?.conditions?.helpless) return;
      // 移动前能威胁移动者的敌人（当前位置，placeable 判定）
      const wasThreatened = canvas.tokens.placeables.filter(
        (t) => t.id !== rawToken.id && DistanceHelper.isThreatened(t, rawToken)
      );
      // 移动后（目标位置）能威胁移动者的敌人（几何判定，不依赖 placeable 集合）
      const nowThreatened = canvas.tokens.placeables.filter(
        (t) => t.id !== rawToken.id && isPositionThreatenedBy(t, targetX, targetY, rawToken.w, rawToken.h)
      );
      // [D35E]新借机规则：在触及内移动（移动起点被威胁）且单次移动≥10尺 → 触发；
      // 不再要求"离开威胁区域"；威胁者 = 起点威胁者 ∪ 终点威胁者（起点必须已在触及内）
      const movePx = Math.hypot(targetX - rawToken.x, targetY - rawToken.y);
      const moveFeet = (movePx / canvas.dimensions.size) * canvas.dimensions.distance;
      const threateningTokens = wasThreatened.length
        ? Array.from(new Map([...wasThreatened, ...nowThreatened].map((t) => [t.id, t])).values())
        : [];
      const aoTrigger = threateningTokens.length > 0 && moveFeet >= 10;
      const result = Hooks.call("D35E.Threatened.tokenThreatened", rawToken, threateningTokens, game.user.id);
      if (result === false) return false;
      // [D35E]不会被借机：移动者拥有该能力 → 不弹借机窗口（聊天提示仍发送，改 blocked 文案）
      const moverNoAoO = actorHasNoAoO(rawToken.actor);
      // 借机只在战斗时生效：弹窗（PC → owner，NPC → GM）与聊天提示同受 game.combat 约束
      // 弹窗异常不影响下方聊天提示的发送
      if (aoTrigger && game.combat && !moverNoAoO) {
        try {
          handleAoOThreat(rawToken, threateningTokens);
        } catch (e) {
          console.error("D35E | AoO dialog failed", e);
        }
      }
      // 聊天提示（含借机次数）仅战斗时保留；[D35E]过滤无可用借机攻击的威胁者，全部无可借机则不显示
      if (aoTrigger && game.combat) {
        const aooEligible = threateningTokens.filter(
          (t) =>
            !t.document?.hidden &&
            !t.actor?.system?.attributes?.conditions?.helpless &&
            getAoOAttacks(t.actor).length > 0
        );
        if (!aooEligible.length) return;
        const content = await renderTemplate(
          "systems/D35E/templates/chat/aoo-notification.html",
          {
            moverImg: rawToken.document.texture?.src || "",
            moverName: rawToken.document.name,
            blocked: moverNoAoO,
            threateningTokens: aooEligible.map((t) => {
              const combatant = game.combat?.combatants?.find((c) => c.tokenId === t.id);
              const aooMax = combatant?.getFlag("D35E", "aaoCount") ?? 1;
              const aooUsed = combatant?.getFlag("D35E", "usedAaoCount") ?? 0;
              const aooLeft = Math.max(0, aooMax - aooUsed);
              return {
                id: t.id,
                img: t.document.texture?.src || "",
                name: t.document.name,
                aooLeft,
                aooMax,
                hasAoo: aooLeft > 0,
              };
            }),
          }
        );
        ChatMessage.create({
          content,
          speaker: ChatMessage.getSpeaker({ token: rawToken.document }),
        });
      }
    }
  }
});

Hooks.on("deleteToken", async (token, options, userId) => {
  if (options?.stopAuraUpdate) return;
  if (options.tokenOnly) return;
  debouncedCollate(canvas.scene.id, true, true, "updateToken");
  // 绑定光环：unlinked 光环来源 token 被删除（其 token actor id === token.id）→ 清理复制品
  if (game.user?.isGM && token?.id) deleteCopiesBySourceActorId(token.id);
});

Hooks.on("createCombatant", (combat, combatant, info, data) => {
  if (!game.user.isGM) return;
  const actor = game.actors.tokens[combatant.tokenId];
  if (actor != null) {
    let itemResourcesData = {};
    for (let i of actor.items || []) {
      actor.getItemResourcesUpdate(i, itemResourcesData);
    }
    actor.refreshWithData(itemResourcesData, {});
  }
});

Hooks.on("updateCombat", async (combat, combatant, info, data) => {
  if (!game.user.isGM) return;
  if (
      (combat.current.turn <= combat.previous.turn && combat.current.round === combat.previous.round) ||
      combat.current.round < combat.previous.round
  )
    return; // We moved back in time
  debouncedCollate(canvas.scene.id, true, true, "updateToken");
  // const actor = combat.combatant.actor;
  // const buffId = combat.combatant.data?.flags?.D35E?.buffId;
  // if (actor != null) {
  //     await actor.progressRound();
  // } else if (buffId) {
  //     let actor;
  //     if (combat.combatant.data?.flags?.D35E?.isToken) {
  //         actor = canvas.scene.tokens.get(combat.combatant.data?.flags?.D35E?.tokenId).actor;
  //     } else {
  //         actor = game.actors.get(combat.combatant.data?.flags?.D35E?.actor);
  //     }
  //
  //     await actor.progressBuff(buffId,1);
  //     debouncedCollate(canvas.scene.id, true, true, "updateToken")
  // }
});

Hooks.on("createMeasuredTemplate", (template, _template, data, user) => {
  game.D35E.createdMeasureTemplates.add(template.data._id);
});

// Create race on actor
Hooks.on("preCreateOwnedItem", (actor, item) => {
  if (!(actor instanceof Actor)) return;
  if (actor.race == null) return;

  if (item.type === "race") {
    actor.race.update(item);
    return false;
  }
});

Hooks.on("preCreateItem", (data, d, options, user) => {
  if (!(data.parent instanceof Actor)) return;

  if (user !== game.userId) {
    console.log("Not updating actor as action was started by other user");
    return;
  }
  //data.parent.refresh(options);
});

Hooks.on("createItem", (data, options, user) => {
  if (!(data.parent instanceof Actor)) return;

  if (user !== game.userId) {
    console.log("Not updating actor as action was started by other user");
    return;
  }
  // 绑定光环：新建源光环 → 立即同步复制品（复制品创建带 stopLinkedSync，不会回环）
  if (
      data.type === "aura" &&
      getProperty(data.system, "auraMode") === "linked" &&
      !getProperty(data.system, "sourceAuraId") &&
      !options?.stopLinkedSync
  ) {
    debouncedSyncLinked();
  }
  //data.parent.refresh(options);
});
Hooks.on("deleteItem", (data, options, user) => {
  if (!(data.parent instanceof Actor)) return;

  if (user !== game.userId) {
    console.log("Not updating actor as action was started by other user");
    return;
  }
  // 绑定光环：源光环被删除 → 删除所有复制品；复制品被删除 → 从源光环目标列表移除
  if (data.type === "aura" && !options?.stopLinkedSync) {
    if (!getProperty(data.system, "sourceAuraId")) {
      deleteLinkedCopies(data.id);
    } else {
      unlinkDeletedCopy(data);
    }
  }
  //data.parent.refresh(options);
});

Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);

Hooks.on("updateActor", (actor, data, options, user) => {
  TopPortraitBar.render(actor);
  if (!(actor instanceof Actor)) return;
  if (user !== game.userId) {
    console.log("Not updating actor as action was started by other user");
    return;
  } else {
    if (canvas.scene) {
      debouncedCollate(canvas.scene.id, true, true, "updateToken");
    }
    if (actor.data.data.companionAutosync) {
      actor.syncToCompendium();
    }
  }
});

Hooks.on("controlToken", (token, selected) => {
  // Refresh canvas sight
  canvas.perception.update({
    initializeLighting: true,
    refreshLighting: true,
    refreshVision: true,
    refreshSounds: true,
    refreshTiles: true,
  });

  // 威胁范围高亮：选中单个棋子时绘制/染色，取消选中时清除
  if (!selected) {
    DistanceHelper.clearThreatHighlights();
  } else if (canvas.tokens.controlled.length === 1) {
    DistanceHelper.drawThreatenedHighlights(canvas.tokens.controlled[0]);
  } else {
    DistanceHelper.clearThreatHighlights();
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data.type === "skill") {
    createSkillMacro(data.uuid, data.skill, slot)
    return false;
  }
  if (data.type === "Item") {
    createItemMacro(data.uuid, slot);
    return false;
  }
});

Hooks.on("updateWorldTime", async (date, delta, other) => {
  let roundsDelta = Math.floor(delta / 6);
  if (roundsDelta === 0) return;
  if (!game.user.isGM) return;
  let alreadyChecked = new Set();
  let updatePromises = [];
  for (const source of canvas.tokens.placeables) {
    if (!source.actor) continue;
    let actor = ActorPF.getActorFromTokenPlaceable(source);

    let trueId = actor.id;
    if (actor.isToken) trueId = source.id;
    if (alreadyChecked.has(trueId)) continue;
    alreadyChecked.add(trueId);

    if (actor) {
      updatePromises.push(actor.progressTime(roundsDelta));
    }
  }
  Promise.all(updatePromises).then(() => {
    debouncedCollate(canvas.scene.id, true, true, "updateToken");
  });
});

Hooks.on("diceSoNiceReady", (dice3d) => {
  dice3d.addColorset(
      {
        name: "Legacies of the Dragon",
        description: "Legacies of the Dragon",
        category: "Standard",
        foreground: "#fff4eb",
        background: "#340403",
        texture: "dragon",
        edge: "#340403",
      },
      "default"
  );
});

Hooks.on("aipSetup", (packageConfig) => {
  const api = game.modules.get("autocomplete-inline-properties").API;
  const DATA_MODE = api.CONST.DATA_MODE;

  // Define the config for our package
  const config = {
    packageName: "D35E",
    sheetClasses: [
      {
        name: "ItemSheetPF", // this _must_ be the class name of the `Application` you want it to apply to
        fieldConfigs: [
          {
            selector: `.tab[data-tab="details"] input[type="text"]`, // this targets all text input fields on the "details" tab. Any css selector should work here.
            showButton: true,
            allowHotkey: true,
            dataMode: DATA_MODE.CUSTOM,
            inlinePrefix: "@",
            customDataGetter: (sheet) => {
              return sheet.item.getActorItemRollData();
            },
          },
          // Add more field configs if necessary
        ],
      },
      // Add more sheet classes if necessary
    ],
  };

  // Add our config
  packageConfig.push(config);
});

/**
 * Create a Macro from an Skill drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} actorId  The actor id
 * @param {string} skill    The skill name
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createSkillMacro(actorId, skill, slot) {
  const actor = fromUuidSync(actorId);
  let skillName = CONFIG.D35E.skills[skill] ? CONFIG.D35E.skills[skill] : skill;
  const command =
      `fromUuidSync("${actorId}").rollSkill("${skill}");`;
  let macro = game.macros.contents.find((m) => m.name === skillName && m.command === command);
  if (!macro) {
    macro = await Macro.create(
        {
          name: skillName,
          type: "script",
          img: CONFIG.D35E.skills[skill] ? `/systems/D35E/icons/skills/${skill}.png` : `/systems/D35E/icons/actions/unknown.png`,
          command: command,
          flags: { "D35E.skillMacro": true },
        },
        { displaySheet: false }
    );
  }
  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} item     The item data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(itemUuid, slot) {
  const item = await fromUuid(itemUuid);
  const actor = getItemOwner(item);
  const command =
      `fromUuidSync("${itemUuid}").use({})`;
  let macro = game.macros.contents.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create(
        {
          name: item.name,
          type: "script",
          img: item.img,
          command: command,
          flags: { "D35E.itemMacro": true },
        },
        { displaySheet: false }
    );
  }
  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @param {object} [options={}]
 * @return {Promise}
 */
function rollItemMacro(itemName, { itemId = null, itemType = null, actorId = null } = {}) {
  let actor = getActorFromId(actorId);
  if (actor && !actor.testUserPermission(game.user, "OWNER"))
    return ui.notifications.warn(game.i18n.localize("D35E.ErrorNoActorPermission"));
  const item = actor
      ? actor.items.find((i) => {
        if (itemId != null && i._id !== itemId) return false;
        if (itemType != null && i.type !== itemType) return false;
        return i.name === itemName;
      })
      : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  if (!game.keyboard.isModifierActive("Control")) {
    return item.use({ skipDialog: game.keyboard.isModifierActive("Shift") });
  }
  return item.roll();
}

/**
 * Show an actor's defenses.
 */
function rollDefenses({ actorName = null, actorId = null } = {}) {
  const speaker = ChatMessage.getSpeaker();
  let actor = game.actors.contents.filter((o) => {
    if (!actorName && !actorId) return false;
    if (actorName && o.name !== actorName) return false;
    if (actorId && o._id !== actorId) return false;
    return true;
  })[0];
  if (speaker.token && !actor) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) return ui.notifications.warn("No applicable actor found");

  return actor.displayDefenses();
}

/**
 * Roll Turn Undead
 * @param actorName
 * @param actorId
 * @returns {*|void}
 */
function rollTurnUndead({ actorName = null, actorId = null } = {}) {
  const speaker = ChatMessage.getSpeaker();
  let actor = game.actors.contents.filter((o) => {
    if (!actorName && !actorId) return false;
    if (actorName && o.name !== actorName) return false;
    if (actorId && o._id !== actorId) return false;
    return true;
  })[0];
  if (speaker.token && !actor) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) return ui.notifications.warn("No applicable actor found");

  return actor.rollTurnUndead();
}

function requestRoll({rollType = "skill", rollTarget = "apr", dcTarget = 0, rollMode = "public"}) {
  // Create a chat message with a button depending on the selected roll type
  if (rollType === "save") {
    let buttonCode = `<div class="flexcol card-buttons"><button class="everyone no-actor" data-action="rollSave" data-value="${rollTarget}" data-ability="${dcTarget}" data-targetrollmode="${rollMode}" data-target="${dcTarget}">
${game.i18n.localize("D35E.RollSavingThrow")}
            </button></div>`;
    let chatTemplateData = {
      name: game.i18n.localize("D35E.RollSavingThrow") + ` (${CONFIG.D35E.savingThrows[rollTarget]})`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      rollMode: rollMode,
      text: buttonCode,
      targetText: `
      <div class="dice-result box">
          <h4 class="box-title">
          DC
          </h4>
          <h4 class="dice-total rolled-roll">
          ${dcTarget}
          </h4>
      </div>`,
    };
    createCustomChatMessage("systems/D35E/templates/chat/request-roll.html", chatTemplateData, {}, {});
  }
  else if (rollType === "skill") {
    let buttonCode = `<div class="flexcol card-buttons"><button class="everyone no-actor" data-action="rollSkill" data-value="${rollTarget}" data-ability="${dcTarget}" data-targetrollmode="${rollMode}" data-target="${dcTarget}">
${game.i18n.localize("D35E.RollSkillCheck")}
            </button></div>`;
    let skillName = CONFIG.D35E.skills[rollTarget];
    let chatTemplateData = {
      name: `${game.i18n.localize("D35E.RollSkillCheck")} (${skillName})`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      rollMode: rollMode,
      text: buttonCode,
      // DC target text
      targetText: `
      <div class="dice-result box">
          <h4 class="box-title">
          DC
          </h4>
          <h4 class="dice-total rolled-roll">
          ${dcTarget}
          </h4>
      </div>`,
    };
    createCustomChatMessage("systems/D35E/templates/chat/request-roll.html", chatTemplateData, {}, {});
  } else if (rollType === "ability") {
    let buttonCode = `<div class="flexcol card-buttons"><button class="everyone no-actor" data-action="rollAbility" data-value="${rollTarget}" data-ability="${dcTarget}" data-targetrollmode="${rollMode}" data-target="${dcTarget}">
${game.i18n.localize("D35E.RollSkillCheck")}
            </button></div>`;
    let abilityName = CONFIG.D35E.abilities[rollTarget];
    let chatTemplateData = {
      name: `${game.i18n.localize("D35E.RollAbilityCheck")} (${abilityName})`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      rollMode: rollMode,
      text: buttonCode,
      // DC target text
      targetText: `
      <div class="dice-result box">
          <h4 class="box-title">
          DC
          </h4>
          <h4 class="dice-total rolled-roll">
          ${dcTarget}
          </h4>
      </div>`,
    };
    createCustomChatMessage("systems/D35E/templates/chat/request-roll.html", chatTemplateData, {}, {});
  }

}

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  game.D35E.logger.log("Adding D35E GM Tools and scene controls");
  controls.find((control) => control.name === "token").tools.push(
      {
        name: "d35e-gm-tools-convert-to-loot",
        title: "D35E.ConvertToLoot",
        icon: "fa-regular fa-treasure-chest",
        onClick: async () => {
          let selectedTokens = canvas.tokens.controlled.filter(
              (t) =>
                  game.actors.get(t.data.actorId).type === "npc" || game.actors.get(t.data.actorId).type === "character"
          );
          if (selectedTokens.length === 0) {
            ui.notifications.error(`Please select at least one token`);
            return;
          }
          for (let token of selectedTokens) {
            await token.document.update({
              actorLink: false,
              actorData: { flags: { core: { sheetClass: "D35E.ActorSheetPFNPCLoot" } } },
            });
            await canvas.scene.updateEmbeddedDocuments("Token", [{ _id: token.id }]);
          }
          ui.notifications.info(`转为战利品`);
        },
        button: true,
      },
      {
        name: "d35e-gm-tools-treasure-generator",
        title: "D35E.TreasureGenerator",
        icon: "fas fa-gem",
        onClick: async () => {
          let selectedNpcTokens = canvas.tokens.controlled.filter(
              (t) => game.actors.get(t.data.actorId).data.type === "npc"
          );
          if (selectedNpcTokens.length === 0) {
            ui.notifications.error(`Please select at least a token`);
            return;
          }
          for (let token of canvas.tokens.controlled.filter(
              (t) => game.actors.get(t.data.actorId).data.type === "npc"
          )) {
            await genTreasureFromToken(token);
          }
          ui.notifications.info(`宝藏生成完成！`);
        },
        button: true,
      }
  )
  controls.push({
    name: "d35e-gm-tools",
    title: "D35E.GMTools",
    icon: "fas fa-dungeon",
    layer: "d35e",
    tools: [
      {
        name: "select",
        title: "CONTROLS.BasicSelect",
        icon: "fas fa-expand",
      },
      // {
      //   name: "d35e-gm-tools-roll-requestor",
      //   title: "D35E.RequestRoll",
      //   icon: "fas fa-dice",
      //   onClick: () => {
      //     new RollRequestorDialog().render(true);
      //   },
      //   button: true,
      // },
      {
        name: "d35e-gm-tools-encounter-generator",
        title: "D35E.EncounterGenerator",
        icon: "fas fa-dragon",
        onClick: () => {
          new EncounterGeneratorDialog().render(true);
        },
        button: true,
      },
      {
        name: "d35e-gm-tools-custom-treasure-generator",
        title: "D35E.CustomTreasureGenerator",
        icon: "fas fa-store",
        onClick: () => {
          new TreasureGeneratorDialog().render(true);
        },
        button: true,
      },
      {
        name: "d35e-gm-tools-rest-party",
        title: "D35E.RestParty",
        icon: "fas fa-bed",
        onClick: () => {
          if (typeof SimpleCalendar !== "undefined") {
            SimpleCalendar.api.changeDate({ hour: 8 });
          }
          let restingPromises = [];
          for (let actor of game.actors.filter((a) => a.data.data.isPartyMember)) {
            restingPromises.push(actor.rest(true, true, false));
          }
          Promise.all(restingPromises).then(() => {
            let chatTemplateData = {
              name: game.i18n.localize("D35E.PartyRestedHeader"),
              type: CONST.CHAT_MESSAGE_TYPES.OTHER,
              rollMode: "public",
              text: game.i18n.localize("D35E.PartyRested"),
            };
            createCustomChatMessage("systems/D35E/templates/chat/gm-message.html", chatTemplateData, {}, {});
          });
        },
        button: true,
      },
    ],
    activeTool: "select",
  });
});

Hooks.on("renderItemSheet", (app, html) => {
  if (!app?.object?.system.uniqueId) return;
  const copyUidButton = $(
      `<a class="document-uid-link" alt="Copy document UID" data-tooltip="Item UID: ${app?.object?.system.uniqueId}" data-tooltip-direction="UP"><i class="fa-solid fa-anchor"></i></a>`
  );
  copyUidButton.on("click", async () => {
    navigator.clipboard.writeText(app?.object?.system.uniqueId);
  });
  const div = html.find("h4.window-title");
  div.append(copyUidButton);
});

EnrichersHelper.setupHooks();
