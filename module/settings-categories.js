// ==================== D35E 设置面板分类（基础/功能/视觉/音效/杂项） ====================
// 在 SettingsConfig 渲染后，把系统 tab（data-tab="system"）内的设置项按分类分组，
// 插入分类标题。幂等：每次渲染都先清理上次的分组标记再重建。
// 未在映射表中的设置项自动归入「未分类」兜底，方便发现新设置漏分类。

const CATEGORIES = {
  "基础": [
    // 规则/房规配置（菜单）
    "rollConfig", "healthConfig", "currencyConfig", "worldDefaults",
    // 检定与成长规则
    "diagonalMovement", "measureStyle", "experienceRate", "units",
    "disableExperienceTracking", "allowBackgroundSkills", "useFractionalBaseBonuses",
    "autoScaleAttacksBab", "psionicsAreDifferent", "autosizeWeapons",
    // 战斗规则
    "advanced-combat-tracking", "automate-flanking-threat", "threatened-display-mode",
    "coreEffects", "sharedVisionMode", "useCombatCharacterSheet", "immediateActionRule",
    // 弹药与法术点
    "allowNoAmmo", "useAutoAmmoRecovery", "noAutoSpellpointsCost", "spellpointCostCustomFormula",
    // 其他
    "randomizeHp", "currencyNames",
  ],
  "功能": [
    "classFeaturesInTabs", "autoCollapseItemCards", "hideSpellDescriptionsIfHasAction",
    "showFullAttackChatCard", "hideSpells", "allowPlayersApplyActions", "playersShowContextNotes",
    "repeatAnimations", "preloadCompendiums", "autoApplyIntuitive", "displayItemsInContainers",
    "foldSpellDescriptions", "saveAttackWindow",
    "globalDisableTokenLight", "globalDisableTokenVision", "hideTokenConditions",
    "changeScrollIcon", "buyChat", "clearInventory",
    "additionalCachedCompendiums_classAbilities", "additionalCachedCompendiums_racialAbilities",
    "additionalCachedCompendiums_spellLikeAbilities", "additionalCachedCompendiums_materials",
    "additionalCachedCompendiums_damageTypes",
    "smoothKeyMove",
    "speedProviderSettings",
    "cgmpAllowPlayersUseDesc", "cgmpNotifyTyping",
    "dtEnableTray", "dtEnableCalculator", "dtHideAdv", "dtEnableInline",
    "chatedit-allowEdit", "chatedit-showEdited", "chatedit-markdown", "chatedit-emoji",
    "rightClickAction", "autoStartMeasurement", "useGridlessRaster",
    "alwaysShowSpeedForPCs", "showGMRulerToPlayers", "enableMovementHistory",
 "mldMovePause", "mldInvisibleImage", "mldViewArtwork",
  ],
  "视觉": [
    "showPartyHud", "showPartyHudTokenImage", "customSkin", "colorblindColors",
    "transparentSidebarWhenUsingTheme", "hidePlayersList", "playersNoDamageDetails",
    "playersNoDCDetails", "lowLightVisionMode",
    // 行走图
    "walkAnimInterval",
    // 受击特效
    "hitEffectEnabled",
    "healEffectEnabled",
    // 聊天肖像
    "borderShape", "useUserColorAsBorderColor", "borderColor", "borderWidth",
    "disableChatPortrait", "useTokenImage", "doNotUseTokenImageWithSpecificType",
    "useTokenName", "useAvatarImage", "displayPlayerName",
    "portraitSize", "portraitSizeItem", "forceNameSearch", "textSizeName", "displayMessageTag",
    "useUserColorAsChatBackgroundColor", "useUserColorAsChatBorderColor",
    "useImageReplacer", "useImageReplacerDamageType", "applyOnCombatTracker",
    "displaySetting", "displaySettingOTHER", "displaySettingOOC", "displaySettingIC",
    "displaySettingEMOTE", "displaySettingWHISPER", "displaySettingROLL", "displaySettingWhisperToOther",
    "customStylingMessageText", "customStylingMessageImage",
    "disablePortraitForAliasGmMessage", "setUpPortraitForAliasGmMessage",
    "enableSpeakingAs", "speakingAsWarningCharacters", "enableSpeakAs",
  ],
  "音效": [
    "hitSoundEnabled", "hitSoundVolume", "hitSoundFile",
    "natSoundEnabled", "natSoundVolume", "natSoundFile20", "natSoundFile1",
    "battleAnimSoundVolume",
    "imSoundEnabled", "imSoundVolume",
  ],
  "杂项": [
    "resetAllSettings",
    "ddimportImportSettings", "ddimportOpenableWindows",
    "apiKeyWorld", "apiKeyPersonal", "user-key",
    "demoWorld", "debug-distance-overlay", "__onboarding", "__onboardingHidden", "debug",
  ],
};

const _ALL_KEYS = Object.values(CATEGORIES).flat();

Hooks.on("renderSettingsConfig", (app, html) => {
  const sys = html.find('.tab[data-tab="system"]');
  if (!sys.length) return;
  const groups = sys.find('.form-group');
  if (!groups.length) return;

  // 清理上次分组（幂等）
  sys.find('.d35e-settings-category').remove();

  // 提取 key → 元素
  const byKey = new Map();
  groups.each((i, el) => {
    const g = $(el);
    const id = g.attr("data-setting-id") || g.find("button[data-key]").attr("data-key") || "";
    const key = id.replace(/^D35E\./, "");
    if (key) byKey.set(key, g);
  });

  // 从面板中取出所有设置项（保留非 .form-group 元素）
  groups.detach();

  const appendGroup = (name, keys) => {
    const items = keys.map((k) => byKey.get(k)).filter(Boolean);
    if (!items.length) return;
    sys.append(`<h3 class="d35e-settings-category">${name}</h3>`);
    sys.append(items);
  };

  for (const [name, keys] of Object.entries(CATEGORIES)) appendGroup(name, keys);

  // 未分类兜底（新增设置未加入映射时可见）
  const remaining = [...byKey.keys()].filter((k) => !_ALL_KEYS.includes(k));
  if (remaining.length) appendGroup("未分类", remaining);
});
