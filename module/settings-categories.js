// ==================== D35E 设置面板分类 ====================

// 在 SettingsConfig 渲染后，把系统 tab（data-tab="system"）内的设置项按分类分组，

// 插入分类标题。幂等：每次渲染都先清理上次的分组标记再重建。

// 未在映射表中的设置项自动归入「未分类」兜底，方便发现新设置漏分类。



const CATEGORIES = {
  "基础": [
    // ---- 规则/房规配置（设置菜单，GM） ----
    "rollConfig",                     // 默认检定规则（菜单）：设置角色检定时默认的发言模式
    "healthConfig",                   // 生命骰规则（菜单）：设置生命骰如何处理的规则
    "currencyConfig",                 // 自定义货币（菜单）：自定义货币并为其分组
    "worldDefaults",                  // 默认技能设置（菜单）：技能默认可见性与默认技能配置
    // ---- 检定与成长规则 ----
    "diagonalMovement",               // 对角运动规则：对角线移动计距规则（555=PHB / 5105=DMG 欧几里得）
    "measureStyle",                   // 使用3R的测量风格：代替 FVTT 默认测量风格
    "experienceRate",                 // 经验获得速度：角色升级进度（慢/中/快）
    "units",                          // 系统单位：英制（英尺/磅）或公制（米/千克）
    "disableExperienceTracking",      // 禁用经验统计：移除角色界面的经验条
    "allowBackgroundSkills",          // 使用背景技能：启用背景技能可选规则
    "useFractionalBaseBonuses",       // 使用属性奖励：启用 Fractional Base Bonuses 可选规则
    "autoScaleAttacksBab",            // 自动提高攻击次数：按 BAB 自动增加武器攻击次数
    "psionicsAreDifferent",           // 变体规则·灵奥不共通：魔法抗力与异能抗力分开计算
    "autosizeWeapons",                // 自适应武器：武器伤害取决于生物体型而非武器体型
    // ---- 战斗规则 ----
    "threatened-display-mode",        // 威胁范围显示：选中棋子时威胁范围的显示方式（无/染色棋子/绘制区域）
    "coreEffects",                    // 默认棋子设置：是否同时显示核心状态图标与3.5e状态
    "sharedVisionMode",               // 共享视野模式：玩家之间视野共享方式（无选择/带选择）
    "useCombatCharacterSheet",        // 启用战利品商人：NPC 新增战利品类型，可被掠夺或作为商人
    // ---- 其他 ----
    "currencyNames",                  // 货币名称：自定义货币显示名，留空用默认
  ],
  "自动化": [
    "advanced-combat-tracking",       // 高级战斗追踪：离开受威胁区域提示借机攻击；追踪器显示每轮动作标记
    "automate-flanking-threat",       // 自动夹击/威胁检测：自动检测夹击并预勾选夹击加成
    "immediateActionRule",            // 直觉动作规则：使用直觉动作后下一回合不获得迅捷动作
    "autoApplyIntuitive",             // 自动应用攻击伤害：命中自动结算（无阻止结算/可选行动时）
    "randomizeHp",                    // 随机决定NPC生命值
    // ---- 受击/治疗特效 ----
    "hitEffectEnabled",               // 受击特效：受伤时染红闪烁并晃动
    "healEffectEnabled",              // 受治疗特效：回血时染绿并闪白光
    // ---- 弹药与法术点 ----
    "allowNoAmmo",                    // 远程武器不需要弹药：允许无弹药使用远程武器
    "useAutoAmmoRecovery",            // 启用自动回复弹药
    "noAutoSpellpointsCost",          // 禁用自动设置法术点消耗
    "spellpointCostCustomFormula",    // 法术点消耗量：自定义消耗公式（@level=法术等级，留空禁用）
  ],
  "信息显示": [
    "classFeaturesInTabs",            // 在角色卡中显示类专长能力（比如战士提供的武器擅长）
    // ---- 锁定连线特效 ----

    "foldSpellDescriptions",          // 法术描述默认折叠（聊天页）
    "hideSpellDescriptionsIfHasAction", // 隐藏法术描述页面：聊天窗口不显示法术描述片段
    "showFullAttackChatCard",         // 显示全力攻击描述卡：全力攻击时在聊天显示描述
    "hideSpells",                     // 隐藏法术简述：角色列表中的法术简述
    "playersShowContextNotes",        // 向玩家展示注释：聊天界面的上下文注释
    "saveAttackWindow",               // 保存攻击窗口：保留攻击窗口详情（攻击检定/弹药加成等）
    "cgmpNotifyTyping",               // 输入状态通知：显示"有人正在输入…"提示
    "chatedit-allowEdit",             // 允许编辑聊天（右键聊天可编辑，Chat Editor 移植）
    "chatedit-showEdited",            // 显示编辑聊天：被编辑过的消息显示编辑标记
    "autoStartMeasurement",           // 自动测量：拖动棋子时自动显示标尺
    "useGridlessRaster",              // 使用基于速度的吸附：无网格场景吸附至速度范围
    "alwaysShowSpeedForPCs",          // 向所有人展示 PC 的速度（速度着色）
    "showGMRulerToPlayers",           // 向玩家展示 GM 尺子
    "mldInvisibleImage",              // 隐形 Token 替换图像：显示替换图标而非默认隐形图标
    "showPartyHud",                   // HUD类别：顶部 HUD 显示方式（完整/窄/无）
    "showPartyHudTokenImage",         // HUD显示角色棋子头像
    "playersNoDamageDetails",         // 向PC隐藏伤害详情
    "playersNoDCDetails",             // 向PC隐藏豁免DC
    "lowLightVisionMode",             // 昏暗视觉需要选中棋子
    "autoCollapseItemCards",          // 自动折叠物品/法术描述（聊天窗口）
    "hideTokenConditions",            // 隐藏棋子状态：隐藏 Token 状态图标
  ],
  "音效": [
    "hitSoundEnabled",                // 受击音效（开关）：受伤（HP减少）时播放
    "hitSoundVolume",                 // 受击音效音量（0~1）
    "hitSoundFile",                   // 受击音效文件（默认）：未单独设置的角色使用
    "natSoundEnabled",                // 自然20/自然1音效（开关）：d20 掷出 20/1 时播放
    "natSoundVolume",                 // 自然20/自然1音效音量（0~1）
    "natSoundFile20",                 // 自然20音效文件（默认）
    "natSoundFile1",                  // 自然1音效文件（默认）
    "nonLethalHitEnabled",            // 非致命音效开关
    "nonLethalHitVolume",             // 非致命音量
    "nonLethalHitFile",               // 非致命音效文件
    "battleAnimSoundVolume",          // 战斗动画音效音量（近战/远程/治疗/能力，默认0.8）
    "imSoundEnabled",                 // 直觉动作提示音效（开关）：收到直觉动作推送时播放
    "imSoundVolume",                  // 直觉动作提示音效音量（默认0.5）
    "battleAnimConfigMenu",           // 战斗动画配置（菜单）：近战/远程/治疗/能力的图片与音效设置
  ],
  "功能": [
    "allowPlayersApplyActions",       // 允许玩家应用能力：聊天列表对玩家显示应用选项
    "cgmpAllowPlayersUseDesc",        // 允许玩家使用 /desc 命令（/as 仅 GM）
    "repeatAnimations",               // 循环进行Webm动画
    "dtEnableTray",                   // 骰子托盘：聊天输入框下方快捷骰子按钮
    "globalDisableTokenLight",        // 棋子不再发光：全局禁用棋子（含物品）发光
    "globalDisableTokenVision",       // 不覆盖棋子的视觉：全局禁用系统视觉覆盖（含物品/火把照明）
    "changeScrollIcon",               // 更改法术卷轴图标：卷轴物品显示为卷轴图标
    "clearInventory",                 // 清空库存：从随机表添加物品前清空现有物品
    "smoothKeyMove",                  // 方向键平滑移动：按住方向键连续平滑移动 Token
    "dtEnableInline",                 // 启用内联掷骰（[[ ]] 语法自动掷骰）
    "chatedit-markdown",              // Markdown样式：启用 markdown 样式聊天
    "chatedit-emoji",                 // 允许表情：聊天中可使用表情包
    "rightClickAction",               // 右键点击动作：拖动 Token 时右键=创建/删除路径点/取消
    "enableMovementHistory",          // 在战斗时启用移动历史（本回合行经路径记忆）
    "mldMovePause",                   // 暂停时限制移动：暂停时遮罩覆盖并阻止 Token 移动
    "hidePlayersList",                // 隐藏玩家列表
    "buyChat",                        // 在聊天记录显示购买信息（战利品表购买）
    "allowPathfinding",               // 允许寻路：拖动 Token 时自动寻找路径（Drag Ruler）
    "autoPathfinding",                // 自动寻路：持续点击时自动沿路径移动（Drag Ruler）
    "speedProviderSettings",          // 速度提供方设置（菜单，Drag Ruler）：拖动 Token 显示移动范围
    "batchAttackMenu",                // 批量攻击宏（菜单）：GM 一键创建批量攻击宏
    "dtEnableCalculator",             // 骰子计算器：聊天框骰子图标打开计算器对话框
    "dtHideAdv",                      // 隐藏优势/劣势按钮（骰子托盘与计算器）
  ],
  "视觉": [
    "targetLinesEnabled",             // 锁定连线特效：锁定目标时渲染连线（带流动光效）
    "mldViewArtwork",                 // 模组库查看原画：点击条目名直接弹窗查看场景原画
    "customSkin",                     // 使用皮肤：D35E 专用特殊界面
    "colorblindColors",               // 色盲模式：调整颜色适配色盲人群
    "transparentSidebarWhenUsingTheme", // 使用自定义主题的透明背景栏（边栏半透明）
    // ---- 行走图 ----
    "walkAnimInterval",               // 行走图帧间隔(ms)：RPG Maker MV 行走图每帧切换间隔
    // ---- 聊天肖像 ----
    "borderShape",                    // 肖像边框形状（圆形/方形/无）
    "useUserColorAsBorderColor",      // 使用玩家颜色作为肖像边框色
    "borderColor",                    // 肖像边框颜色
    "borderWidth",                    // 肖像边框宽度（px，默认2）
    "disableChatPortrait",            // 禁用聊天肖像
    "useTokenImage",                  // 使用Token图片（代替 Actor 标准图）
    "doNotUseTokenImageWithSpecificType", // 以下类型Actor不使用Token图片（逗号分隔）
    "useTokenName",                   // 使用Token名称（代替 Actor 标准名）
    "useAvatarImage",                 // 使用玩家头像（代替 Token/Actor 图）
    "displayPlayerName",              // 显示玩家名（IC 消息 Actor 名下）
    "portraitSize",                   // 肖像尺寸（px，默认36）
    "portraitSizeItem",               // 其他图片尺寸（px，默认36）
    "textSizeName",                   // 聊天中名字文字大小（px，0=禁用）
    "displayMessageTag",              // 给聊天消息添加文本标签（私聊/盲骰/自骰等）
    "useUserColorAsChatBackgroundColor", // 改变消息背景色（用说话者玩家颜色）
    "useUserColorAsChatBorderColor",     // 改变消息边框色（用说话者玩家颜色）
    "applyOnCombatTracker",           // 在战斗追踪器上应用肖像
    "disablePortraitForAliasGmMessage", // GM别名消息不显示肖像
    "setUpPortraitForAliasGmMessage",   // 为GM别名消息设置指定图片
    "walkConditionConfigMenu",        // 行走图条件配置（菜单）：按条件切换行走图
    "useImageReplacer",               // 使用图片替换功能（不喜欢可关闭）
    "useImageReplacerDamageType",     // 使用伤害类型图片替换（按伤害类型换图）

  ],
  "杂项": [
    "ddimportImportSettings",         // VTT 地图导入默认路径（菜单，Dungeondraft 导入）
    "ddimportOpenableWindows",        // 可开启的窗户：DungeonDraft 传送门按窗户导入
    "apiKeyWorld",                    // 世界玩家默认密码（玩家伴侣）
    "apiKeyPersonal",                 // 玩家个人密码（玩家伴侣，保留在角色上）
    "demoWorld",                      // 调试模式：启用调试用特殊功能（带团时勿开）
    "debug-distance-overlay",         // 显示距离调试覆盖层：绘制威胁范围调试矩形
    "__onboarding",                   // 已看过教程：关闭并刷新可重新查看教程
    "__onboardingHidden",             // 禁用玩家教程（为所有玩家禁用）
    "companionServerUrl",             // 玩家伴侣服务地址：本机服务对外访问的 URL（局域网/公网）
    "resetAllSettings",               // 重置设置为默认（菜单，聊天肖像模块）
    "additionalCachedCompendiums_classAbilities",     // 缓存职业能力（额外缓存合集）
    "additionalCachedCompendiums_racialAbilities",    // 缓存种族能力（额外缓存合集）
    "additionalCachedCompendiums_spellLikeAbilities", // 缓存类法术能力（额外缓存合集）
    "additionalCachedCompendiums_materials",          // 缓存材料（额外缓存合集）
    "additionalCachedCompendiums_damageTypes",        // 缓存伤害类型（额外缓存合集）
  ],
  "Token栏": [
    "monks-tokenbar.allow-player",          // 允许玩家使用 Token 栏
    "monks-tokenbar.show-movement",         // 显示移动提示
    "monks-tokenbar.show-resource-bars",    // 显示资源条
    "monks-tokenbar.token-pictures",        // 指示物图片
    "monks-tokenbar.token-size",            // 指示物尺寸
    "monks-tokenbar.resolution-size",       // 指示物分辨率
    "monks-tokenbar.show-vertical",         // 纵向显示
    "monks-tokenbar.show-offline",          // 显示离线（玩家离线标记）
    "monks-tokenbar.show-undefined",        // 未定义数据显示
    "monks-tokenbar.show-inspiration",      // 显示激励
    "monks-tokenbar.include-actor",         // 显示角色（哪些角色进 Token 栏）
    "monks-tokenbar.filter-duplicates",     // 过滤重复（掷骰消息去重）
    "monks-tokenbar.minimum-ownership",     // 最低玩家权限（显示所需权限）
    "monks-tokenbar.disable-tokenbar",      // 禁用指示物栏
    "monks-tokenbar.dblclick-action",       // 双击操作（双击 Token 栏图标的行为）
    "monks-tokenbar.allow-roll",            // 允许玩家掷骰
    "monks-tokenbar.allow-after-movement",  // 允许回合外移动
    "monks-tokenbar.movement-after-combat", // 在战斗后设置移动方式
    "monks-tokenbar.change-to-combat",      // 在战斗时改变移动方式
    "monks-tokenbar.free-npc-combat",       // 解锁当前参战者所有指示物的移动
    "monks-tokenbar.notify-on-change",      // 移动方式改变时发出提醒
    "monks-tokenbar.show-on-tracker",       // 在战斗追踪列表中显示
    "monks-tokenbar.hide-combatants",       // 隐藏参战者
    "monks-tokenbar.send-levelup-whisper",  // 在升级时私聊玩家
    "monks-tokenbar.show-xp-dialog",        // 弹出 XP 对话框
    "monks-tokenbar.divide-xp",             // 分配玩家 XP 方式
    "monks-tokenbar.npc-xp-sharing",        // NPC 的 XP 共享
    "monks-tokenbar.use-party",             // 使用队伍（Party）分配
    "monks-tokenbar.auto-gold-cr",          // 根据 CR 决定金币
    "monks-tokenbar.gold-formula",          // 金钱公式
    "monks-tokenbar.show-lootable-menu",    // 显示战利品菜单
    "monks-tokenbar.only-use-defeated",     // 仅限被击败
    "monks-tokenbar.loot-name",             // 战利品名称
    "monks-tokenbar.loot-image",            // 战利品图片
    "monks-tokenbar.loot-sheet",            // 战利品表
    "monks-tokenbar.loot-entity",           // 战利品实体
    "monks-tokenbar.open-loot",             // 打开战利品实体
    "monks-tokenbar.create-canvas-object",  // 创建 Canvas 对象（生成标记物）
    "monks-tokenbar.delete-after-grab",     // 抓取后删除消息
    "monks-tokenbar.bypass-roll-dialog",    // 绕过掷骰对话框（直接掷骰）
    "monks-tokenbar.capture-savingthrows",  // 抓取豁免骰（自动判定豁免）
    "monks-tokenbar.gm-sound",              // GM 暗骰音效
    "monks-tokenbar.request-roll-sound-file", // 请求掷骰音效文件
    "monks-tokenbar.show-disable-panning-option", // 显示禁止镜头跟随按钮
    "monks-tokenbar.editStats",             // 编辑数据（菜单）：编辑 Token 栏指示物数据
    "monks-tokenbar.resetPosition",         // 重置位置（菜单）：重置 Token 栏位置
  ],
  "外挂模组": [
    "narrator-tools.settingsMenu",   // 旁白工具设置（菜单）：/narrate 全屏旁白、/desc 描述卡、/note 笔记
    "storyteller.size",              // 故事书窗口尺寸（Story sheet 翻页书）
    "storyteller.bookOpenSound",     // 故事书翻页音效
    "storyteller.enableScroll",      // 故事书启用滚动（翻页滚动）
    "notebook.altquickcreate",       // Alt+点击快速创建笔记
    "notebook.ctrlquickcreate",      // Ctrl+点击快速创建笔记
    "notebook.shiftquickcreate",     // Shift+点击快速创建笔记
    "notebook.smallnoteheight",      // 小笔记高度（px）
    "notebook.largenoteheight",      // 大笔记高度（px）
  ],
  "隐藏": [
    "forceNameSearch",                // 强制名称搜索：按消息中的名字搜索 Actor
    "displaySetting",                 // 显示设置：哪些消息应用自定义样式
    "displaySettingOTHER",            // 显示 OTHER 类型消息（自定义样式开关）
    "displaySettingOOC",              // 显示 OOC 类型消息（自定义样式开关）
    "displaySettingIC",               // 显示 IC 类型消息（自定义样式开关）
    "displaySettingEMOTE",            // 显示 EMOTE 类型消息（自定义样式开关）
    "displaySettingWHISPER",          // 显示 WHISPER 类型消息（自定义样式开关）
    "displaySettingROLL",             // 显示 ROLL 类型消息（自定义样式开关）
    "displaySettingWhisperToOther",   // 显示私聊他人的消息（自定义样式开关）
    "customStylingMessageText",       // 文本消息自定义样式（CSS，覆盖其他设置）
    "customStylingMessageImage",      // 图片消息自定义样式（CSS）
    "enableSpeakingAs",               // 启用内嵌 "Speaking As"（消息发言）
    "speakingAsWarningCharacters",    // [仅 Speaking As] 特殊字符输入警告（保留字符高亮）
    "enableSpeakAs",                  // 启用内嵌 "Speak As..."
    "user-key",                       // Patreon 秘钥：启用 Patreon 服务功能
    "monks-tokenbar.add-advantage-buttons", // 添加优劣势按钮
    "version",                       // 系统版本记录（不显示，勿删）
    "debug",                         // 聊天肖像调试输出（示例：放进本分类的选项不渲染）
  ],
};




const _ALL_KEYS = Object.values(CATEGORIES).flat();

// 隐藏分类：放进该分类的 key 不会渲染（分类标题本身也不显示）
const HIDDEN_CATEGORY = "隐藏";

Hooks.on("renderSettingsConfig", (app, html) => {
  // 遍历所有设置 tab（system + 各模块 tab），统一按 CATEGORIES 分组管理
  html.find("section.tab.category").each((i, tabEl) => {
    const tab = $(tabEl);
    const groups = tab.find(".form-group");
    if (!groups.length) return;

    // 提取 key → 元素（设置带 data-setting-id；菜单带 button[data-key]）
    const byKey = new Map();
    groups.each((i, el) => {
      const g = $(el);
      const id = g.attr("data-setting-id") || g.find("button[data-key]").attr("data-key") || "";
      const key = id.replace(/^D35E\./, ""); // D35E 命名空间去前缀；其他模块保留 模块名.key
      if (key) byKey.set(key, g);
    });

    const isSystem = tab.attr("data-tab") === "system";
    // 本 tab 有映射命中才接管，第三方模块的 tab 保持原样不受影响
    if (!isSystem && !_ALL_KEYS.some((k) => byKey.has(k))) return;

    // 清理上次分组（幂等）
    tab.find(".d35e-settings-category").remove();
    tab.find(".d35e-settings-nav").remove();

    // 从面板中取出所有设置项（保留非 .form-group 元素，如模块 h2 标题）
    groups.detach();

    const tabKey = isSystem ? "s" : (tab.attr("data-tab") || "m").replace(/[^a-z0-9]/gi, "");
    const catNames = []; // 记录非空分类，用于生成导航
    const appendGroup = (name, keys) => {
      if (name === HIDDEN_CATEGORY) {
        // 隐藏分类：直接移除这些选项，不渲染标题
        keys.forEach((k) => { const el = byKey.get(k); if (el) el.remove(); });
        return;
      }
      const items = keys.map((k) => byKey.get(k)).filter(Boolean);
      if (!items.length) return; // 空分类不渲染标题
      const idx = catNames.length;
      catNames.push(name);
      tab.append(`<h3 class="d35e-settings-category" id="d35e-cat-${tabKey}-${idx}">${name}</h3>`);
      tab.append(items);
    };

    for (const [name, keys] of Object.entries(CATEGORIES)) appendGroup(name, keys);

    // 未分类兜底（新增设置未加入映射时仍可见）
    const remaining = [...byKey.keys()].filter((k) => !_ALL_KEYS.includes(k));
    if (remaining.length) appendGroup("未分类", remaining);

    // 分类导航条：仅 system tab（sticky 定位样式见 D35E.css）
    if (isSystem && catNames.length) {
      const links = catNames
        .map((name, i) => `<a class="d35e-settings-nav-link" data-cat="${i}">${name}</a>`)
        .join("");
      const nav = $(`<div class="d35e-settings-nav">${links}<span class="d35e-settings-nav-tip">「${HIDDEN_CATEGORY}」分类中的选项不显示</span></div>`);
      nav.find("a").on("click", (ev) => {
        ev.preventDefault();
        const target = document.getElementById(`d35e-cat-s-${ev.currentTarget.dataset.cat}`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tab.prepend(nav);
    }
  });
});
