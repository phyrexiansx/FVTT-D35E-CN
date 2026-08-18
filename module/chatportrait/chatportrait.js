var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const CONSTANTS = {
  MODULE_ID: "D35E",
  PATH: `systems/D35E/`,
  INV_UNIDENTIFIED_BOOK: `systems/D35E/assets/chatportrait/inv-unidentified-book.png`,
  DEF_TOKEN_IMG_NAME: "mystery-man",
  DEF_TOKEN_IMG_PATH: "icons/svg/mystery-man.svg"
};
CONSTANTS.PATH = `systems/${CONSTANTS.MODULE_ID}/`;
function debug(msg, ...args) {
  try {
    if (game.settings.get(CONSTANTS.MODULE_ID, "debug") || game.modules.get("_dev-mode")?.api?.getPackageDebugValue(CONSTANTS.MODULE_ID, "boolean")) {
      console.log(`DEBUG | ${CONSTANTS.MODULE_ID} | ${msg}`, ...args);
    }
  } catch (e) {
    console.error(e.message);
  }
  return msg;
}
__name(debug, "debug");
function info(info2, notify = false, ...args) {
  try {
    info2 = `${CONSTANTS.MODULE_ID} | ${info2}`;
    if (notify) {
      ui.notifications?.info(info2);
    }
    console.log(info2.replace("<br>", "\n"), ...args);
  } catch (e) {
    console.error(e.message);
  }
  return info2;
}
__name(info, "info");
function warn(warning, notify = false, ...args) {
  try {
    warning = `${CONSTANTS.MODULE_ID} | ${warning}`;
    if (notify) {
      ui.notifications?.warn(warning);
    }
    console.warn(warning.replace("<br>", "\n"), ...args);
  } catch (e) {
    console.error(e.message);
  }
  return warning;
}
__name(warn, "warn");
function error(error2, notify = true, ...args) {
  try {
    error2 = `${CONSTANTS.MODULE_ID} | ${error2}`;
    if (notify) {
      ui.notifications?.error(error2);
    }
    console.error(error2.replace("<br>", "\n"), ...args);
  } catch (e) {
    console.error(e.message);
  }
  return new Error(error2.replace("<br>", "\n"));
}
__name(error, "error");
const i18n = /* @__PURE__ */ __name((key) => {
  return game.i18n.localize(key)?.trim();
}, "i18n");
const i18nFormat = /* @__PURE__ */ __name((key, data = {}) => {
  return game.i18n.format(key, data)?.trim();
}, "i18nFormat");
const a5e = {
  SYSTEM_ID: "a5e",
  imageReplacerDamageType: [
    { name: "A5E.DamageAcid", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acid.svg` },
    { name: "A5E.DamageBludgeoning", icon: `modules/${CONSTANTS.MODULE_ID}/assets/bludgeoning.svg` },
    { name: "A5E.DamageCold", icon: `modules/${CONSTANTS.MODULE_ID}/assets/cold.svg` },
    { name: "A5E.DamageFire", icon: `modules/${CONSTANTS.MODULE_ID}/assets/fire.svg` },
    { name: "A5E.DamageForce", icon: `modules/${CONSTANTS.MODULE_ID}/assets/force.svg` },
    { name: "A5E.DamageLightning", icon: `modules/${CONSTANTS.MODULE_ID}/assets/lightning.svg` },
    { name: "A5E.DamageNecrotic", icon: `modules/${CONSTANTS.MODULE_ID}/assets/necrotic.svg` },
    { name: "A5E.DamagePiercing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/piercing.svg` },
    { name: "A5E.DamagePoison", icon: `modules/${CONSTANTS.MODULE_ID}/assets/poison.svg` },
    { name: "A5E.DamagePsychic", icon: `modules/${CONSTANTS.MODULE_ID}/assets/psychic.svg` },
    { name: "A5E.DamageRadiant", icon: `modules/${CONSTANTS.MODULE_ID}/assets/radiant.svg` },
    { name: "A5E.DamageSlashing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/slashing.svg` },
    { name: "A5E.DamageThunder", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thunder.svg` },
    { name: "A5E.DamageUnknown", icon: `modules/${CONSTANTS.MODULE_ID}/assets/non_magical_physical.svg` }
  ],
  imageReplacerWeaponProperties: [
    { name: "A5E.WeaponPropertyBurn", icon: `` },
    { name: "A5E.WeaponPropertyBreaker", icon: `` },
    { name: "A5E.WeaponPropertyCompounding", icon: `` },
    { name: "A5E.WeaponPropertyDefensive", icon: `` },
    { name: "A5E.WeaponPropertyDualWielding", icon: `` },
    { name: "A5E.WeaponPropertyFinesse", icon: `` },
    { name: "A5E.WeaponPropertyFlamboyant", icon: `` },
    { name: "A5E.WeaponPropertyHandMounted", icon: `` },
    { name: "A5E.WeaponPropertyHeavy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/heavy.svg` },
    { name: "A5E.WeaponPropertyInaccurate", icon: `` },
    { name: "A5E.WeaponPropertyLoading", icon: `modules/${CONSTANTS.MODULE_ID}/assets/loading.svg` },
    { name: "A5E.WeaponPropertyMounted", icon: `` },
    { name: "A5E.WeaponPropertyMuzzleLoading", icon: `` },
    { name: "A5E.WeaponPropertyParrying", icon: `` },
    { name: "A5E.WeaponPropertyParryingImmunity", icon: `` },
    { name: "A5E.WeaponPropertyQuickdraw", icon: `` },
    { name: "A5E.WeaponPropertyRange", icon: `` },
    { name: "A5E.WeaponPropertyReach", icon: `modules/${CONSTANTS.MODULE_ID}/assets/reach.svg` },
    { name: "A5E.WeaponPropertyRifled", icon: `` },
    { name: "A5E.WeaponPropertyScatter", icon: `` },
    { name: "A5E.WeaponPropertyShock", icon: `` },
    { name: "A5E.WeaponPropertySimple", icon: `` },
    { name: "A5E.WeaponPropertyThrown", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thrown.svg` },
    { name: "A5E.WeaponPropertyTriggerCharge", icon: `modules/${CONSTANTS.MODULE_ID}/assets/special.svg` },
    { name: "A5E.WeaponPropertyTrip", icon: `` },
    { name: "A5E.WeaponPropertyTwoHanded", icon: `modules/${CONSTANTS.MODULE_ID}/assets/two-Handed.svg` },
    { name: "A5E.WeaponPropertyVersatile", icon: `modules/${CONSTANTS.MODULE_ID}/assets/versatile.svg` },
    { name: "A5E.WeaponPropertyVicious", icon: `` }
  ],
  imageReplacerIconizer: [
    { name: "A5E.AbilityDefault", icon: `modules/${CONSTANTS.MODULE_ID}/assets/gaming_set.svg` },
    { name: "A5E.AbilitySpellcasting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/arcana.svg` },
    { name: "A5E.AbilityCheck", icon: `modules/${CONSTANTS.MODULE_ID}/assets/survival.svg` },
    { name: "A5E.AbilityStr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/strength.svg` },
    { name: "A5E.AbilityDex", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dexterity.svg` },
    { name: "A5E.AbilityCon", icon: `modules/${CONSTANTS.MODULE_ID}/assets/constitution.svg` },
    { name: "A5E.AbilityInt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intelligence.svg` },
    { name: "A5E.AbilityWis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wisdom.svg` },
    { name: "A5E.AbilityCha", icon: `modules/${CONSTANTS.MODULE_ID}/assets/charisma.svg` },
    { name: "A5E.SkillAcr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acrobatics.svg` },
    { name: "A5E.SkillAni", icon: `modules/${CONSTANTS.MODULE_ID}/assets/animal_handling.svg` },
    { name: "A5E.SkillArc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/arcana.svg` },
    { name: "A5E.SkillAth", icon: `modules/${CONSTANTS.MODULE_ID}/assets/athletics.svg` },
    { name: "A5E.SkillCul", icon: `modules/${CONSTANTS.MODULE_ID}/assets/culture.svg` },
    { name: "A5E.SkillDec", icon: `modules/${CONSTANTS.MODULE_ID}/assets/deception.svg` },
    { name: "A5E.SkillEng", icon: `modules/${CONSTANTS.MODULE_ID}/assets/engineering.svg` },
    { name: "A5E.SkillHis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/history.svg` },
    { name: "A5E.SkillIns", icon: `modules/${CONSTANTS.MODULE_ID}/assets/insight.svg` },
    { name: "A5E.SkillItm", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intimidation.svg` },
    { name: "A5E.SkillInv", icon: `modules/${CONSTANTS.MODULE_ID}/assets/investigation.svg` },
    { name: "A5E.SkillMed", icon: `modules/${CONSTANTS.MODULE_ID}/assets/medicine.svg` },
    { name: "A5E.SkillNat", icon: `modules/${CONSTANTS.MODULE_ID}/assets/nature.svg` },
    { name: "A5E.SkillPrc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/perception.svg` },
    { name: "A5E.SkillPrf", icon: `modules/${CONSTANTS.MODULE_ID}/assets/performance.svg` },
    { name: "A5E.SkillPer", icon: `modules/${CONSTANTS.MODULE_ID}/assets/persuasion.svg` },
    { name: "A5E.SkillRel", icon: `modules/${CONSTANTS.MODULE_ID}/assets/religion.svg` },
    { name: "A5E.SkillSlt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/sleight_of_hand.svg` },
    { name: "A5E.SkillSte", icon: `modules/${CONSTANTS.MODULE_ID}/assets/stealth.svg` },
    { name: "A5E.SkillSur", icon: `modules/${CONSTANTS.MODULE_ID}/assets/survival.svg` },
    { name: "A5E.SkillSpecialties", icon: `modules/${CONSTANTS.MODULE_ID}/assets/specialties.svg` },
    { name: "A5E.SkillSpecialtyAberrations", icon: `modules/${CONSTANTS.MODULE_ID}/assets/aberrations.svg` },
    { name: "A5E.SkillSpecialtyActing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acting.svg` },
    { name: "A5E.SkillSpecialtyAppraisal", icon: `modules/${CONSTANTS.MODULE_ID}/assets/appraisal.svg` },
    { name: "A5E.SkillSpecialtyAlignment", icon: `modules/${CONSTANTS.MODULE_ID}/assets/alignment.svg` },
    { name: "A5E.SkillSpecialtyAnimals", icon: `modules/${CONSTANTS.MODULE_ID}/assets/animals.svg` },
    { name: "A5E.SkillSpecialtyAnonymity", icon: `modules/${CONSTANTS.MODULE_ID}/assets/anonymity.svg` },
    { name: "A5E.SkillSpecialtyArchitecture", icon: `modules/${CONSTANTS.MODULE_ID}/assets/architecture.svg` },
    { name: "A5E.SkillSpecialtyArts", icon: `modules/${CONSTANTS.MODULE_ID}/assets/arts.svg` },
    { name: "A5E.SkillSpecialtyAstronomy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/astronomy.svg` },
    { name: "A5E.SkillSpecialtyAuthority", icon: `modules/${CONSTANTS.MODULE_ID}/assets/authority.svg` },
    { name: "A5E.SkillSpecialtyAutopsy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/autopsy.svg` },
    { name: "A5E.SkillSpecialtyBalancing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/balancing.svg` },
    { name: "A5E.SkillSpecialtyBeastLore", icon: `modules/${CONSTANTS.MODULE_ID}/assets/beast Lore.svg` },
    { name: "A5E.SkillSpecialtyBoasting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/boasting.svg` },
    { name: "A5E.SkillSpecialtyBribery", icon: `modules/${CONSTANTS.MODULE_ID}/assets/bribery.svg` },
    { name: "A5E.SkillSpecialtyCalming", icon: `modules/${CONSTANTS.MODULE_ID}/assets/calming.svg` },
    { name: "A5E.SkillSpecialtyCelestials", icon: `modules/${CONSTANTS.MODULE_ID}/assets/celestials.svg` },
    { name: "A5E.SkillSpecialtyCamouflage", icon: `modules/${CONSTANTS.MODULE_ID}/assets/camouflage.svg` },
    { name: "A5E.SkillSpecialtyCasing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/casing.svg` },
    { name: "A5E.SkillSpecialtyChemistry", icon: `modules/${CONSTANTS.MODULE_ID}/assets/chemistry.svg` },
    { name: "A5E.SkillSpecialtyCiphers", icon: `modules/${CONSTANTS.MODULE_ID}/assets/ciphers.svg` },
    { name: "A5E.SkillSpecialtyClimbing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/climbing.svg` },
    {
      name: "A5E.SkillSpecialtyConcealingEmotions",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/concealing_emotions.svg`
    },
    { name: "A5E.SkillSpecialtyComposing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/composing.svg` },
    { name: "A5E.SkillSpecialtyConstructs", icon: `modules/${CONSTANTS.MODULE_ID}/assets/constructs.svg` },
    {
      name: "A5E.SkillSpecialtyCourtlyManners",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/courtly_manners.svg`
    },
    { name: "A5E.SkillSpecialtyCults", icon: `modules/${CONSTANTS.MODULE_ID}/assets/cults.svg` },
    { name: "A5E.SkillSpecialtyDancing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dancing.svg` },
    { name: "A5E.SkillSpecialtyDeciphering", icon: `modules/${CONSTANTS.MODULE_ID}/assets/deciphering.svg` },
    {
      name: "A5E.SkillSpecialtyDetectingLies",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/detecting_lies.svg`
    },
    { name: "A5E.SkillSpecialtyDetection", icon: `modules/${CONSTANTS.MODULE_ID}/assets/detection.svg` },
    { name: "A5E.SkillSpecialtyDiseases", icon: `modules/${CONSTANTS.MODULE_ID}/assets/diseases.svg` },
    { name: "A5E.SkillSpecialtyDistraction", icon: `modules/${CONSTANTS.MODULE_ID}/assets/distraction.svg` },
    { name: "A5E.SkillSpecialtyDragons", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dragons.svg` },
    { name: "A5E.SkillSpecialtyDriving", icon: `modules/${CONSTANTS.MODULE_ID}/assets/driving.svg` },
    { name: "A5E.SkillSpecialtyDungeoneering", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dungeoneering.svg` },
    { name: "A5E.SkillSpecialtyElementals", icon: `modules/${CONSTANTS.MODULE_ID}/assets/elementals.svg` },
    { name: "A5E.SkillSpecialtyEmpires", icon: `modules/${CONSTANTS.MODULE_ID}/assets/empires.svg` },
    {
      name: "A5E.SkillSpecialtyEscapeArtistry",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/escape_artistry.svg`
    },
    { name: "A5E.SkillSpecialtyEtiquette", icon: `modules/${CONSTANTS.MODULE_ID}/assets/etiquette.svg` },
    { name: "A5E.SkillSpecialtyExplosives", icon: `modules/${CONSTANTS.MODULE_ID}/assets/explosives.svg` },
    { name: "A5E.SkillSpecialtyFarming", icon: `modules/${CONSTANTS.MODULE_ID}/assets/farming.svg` },
    { name: "A5E.SkillSpecialtyFarsight", icon: `modules/${CONSTANTS.MODULE_ID}/assets/farsight.svg` },
    { name: "A5E.SkillSpecialtyFerocity", icon: `modules/${CONSTANTS.MODULE_ID}/assets/ferocity.svg` },
    { name: "A5E.SkillSpecialtyFey", icon: `modules/${CONSTANTS.MODULE_ID}/assets/fey.svg` },
    { name: "A5E.SkillSpecialtyFineArt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/fine_art.svg` },
    { name: "A5E.SkillSpecialtyFlattery", icon: `modules/${CONSTANTS.MODULE_ID}/assets/flattery.svg` },
    { name: "A5E.SkillSpecialtyForaging", icon: `modules/${CONSTANTS.MODULE_ID}/assets/foraging.svg` },
    {
      name: "A5E.SkillSpecialtyForbiddenKnowledge",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/forbidden_knowledge.svg`
    },
    { name: "A5E.SkillSpecialtyForensics", icon: `modules/${CONSTANTS.MODULE_ID}/assets/forensics.svg` },
    { name: "A5E.SkillSpecialtyFiends", icon: `modules/${CONSTANTS.MODULE_ID}/assets/fiends.svg` },
    { name: "A5E.SkillSpecialtyGadgetry", icon: `modules/${CONSTANTS.MODULE_ID}/assets/gadgetry.svg` },
    {
      name: "A5E.SkillSpecialtyGatheringRumors",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/gathering_rumors.svg`
    },
    { name: "A5E.SkillSpecialtyGenealogy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/genealogy.svg` },
    { name: "A5E.SkillSpecialtyGods", icon: `modules/${CONSTANTS.MODULE_ID}/assets/gods.svg` },
    { name: "A5E.SkillSpecialtyHerbalism", icon: `modules/${CONSTANTS.MODULE_ID}/assets/herbalism.svg` },
    { name: "A5E.SkillSpecialtyHolySymbols", icon: `modules/${CONSTANTS.MODULE_ID}/assets/holy_symbols.svg` },
    { name: "A5E.SkillSpecialtyHunting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/hunting.svg` },
    { name: "A5E.SkillSpecialtyInterrogation", icon: `modules/${CONSTANTS.MODULE_ID}/assets/interrogation.svg` },
    {
      name: "A5E.SkillSpecialtyInvisibleObjects",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/invisible _objects.svg`
    },
    { name: "A5E.SkillSpecialtyJumping", icon: `modules/${CONSTANTS.MODULE_ID}/assets/jumping.svg` },
    { name: "A5E.SkillSpecialtyLaws", icon: `modules/${CONSTANTS.MODULE_ID}/assets/laws.svg` },
    { name: "A5E.SkillSpecialtyLeadership", icon: `modules/${CONSTANTS.MODULE_ID}/assets/leadership.svg` },
    { name: "A5E.SkillSpecialtyLegends", icon: `modules/${CONSTANTS.MODULE_ID}/assets/legends.svg` },
    { name: "A5E.SkillSpecialtyLegerdemain", icon: `modules/${CONSTANTS.MODULE_ID}/assets/legerdemain.svg` },
    { name: "A5E.SkillSpecialtyLifting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/lifting.svg` },
    { name: "A5E.SkillSpecialtyLinguistics", icon: `modules/${CONSTANTS.MODULE_ID}/assets/linguistics.svg` },
    { name: "A5E.SkillSpecialtyListening", icon: `modules/${CONSTANTS.MODULE_ID}/assets/listening.svg` },
    { name: "A5E.SkillSpecialtyMathematics", icon: `modules/${CONSTANTS.MODULE_ID}/assets/mathematics.svg` },
    {
      name: "A5E.SkillSpecialtyMechanicalTraps",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/mechanical_traps.svg`
    },
    { name: "A5E.SkillSpecialtyMimicry", icon: `modules/${CONSTANTS.MODULE_ID}/assets/mimicry.svg` },
    { name: "A5E.SkillSpecialtyMonstrosities", icon: `modules/${CONSTANTS.MODULE_ID}/assets/monstrosities.svg` },
    { name: "A5E.SkillSpecialtyMorality", icon: `modules/${CONSTANTS.MODULE_ID}/assets/morality.svg` },
    { name: "A5E.SkillSpecialtyNegotiation", icon: `modules/${CONSTANTS.MODULE_ID}/assets/negotiation.svg` },
    { name: "A5E.SkillSpecialtyOozes", icon: `modules/${CONSTANTS.MODULE_ID}/assets/oozes.svg` },
    { name: "A5E.SkillSpecialtyPeacemaking", icon: `modules/${CONSTANTS.MODULE_ID}/assets/peacemaking.svg` },
    { name: "A5E.SkillSpecialtyPickpocketing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/pickpocketing.svg` },
    { name: "A5E.SkillSpecialtyThePlanes", icon: `modules/${CONSTANTS.MODULE_ID}/assets/the_planes.svg` },
    { name: "A5E.SkillSpecialtyPlantLore", icon: `modules/${CONSTANTS.MODULE_ID}/assets/plant_lore.svg` },
    { name: "A5E.SkillSpecialtyPoisons", icon: `modules/${CONSTANTS.MODULE_ID}/assets/poisons.svg` },
    { name: "A5E.SkillSpecialtyProphecy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/prophecy.svg` },
    {
      name: "A5E.SkillSpecialtyReadingEmotions",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/reading_emotions.svg`
    },
    {
      name: "A5E.SkillSpecialtyRegionalGoods",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/regional_goods.svg`
    },
    { name: "A5E.SkillSpecialtyResearch", icon: `modules/${CONSTANTS.MODULE_ID}/assets/research.svg` },
    { name: "A5E.SkillSpecialtyRiding", icon: `modules/${CONSTANTS.MODULE_ID}/assets/riding.svg` },
    { name: "A5E.SkillSpecialtyRunning", icon: `modules/${CONSTANTS.MODULE_ID}/assets/running.svg` },
    { name: "A5E.SkillSpecialtyScent", icon: `modules/${CONSTANTS.MODULE_ID}/assets/scent.svg` },
    {
      name: "A5E.SkillSpecialtySensingMotives",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/sensing_motives.svg`
    },
    { name: "A5E.SkillSpecialtySiegecraft", icon: `modules/${CONSTANTS.MODULE_ID}/assets/siegecraft.svg` },
    { name: "A5E.SkillSpecialtySinging", icon: `modules/${CONSTANTS.MODULE_ID}/assets/singing.svg` },
    { name: "A5E.SkillSpecialtySpeaking", icon: `modules/${CONSTANTS.MODULE_ID}/assets/speaking.svg` },
    { name: "A5E.SkillSpecialtyStreetwise", icon: `modules/${CONSTANTS.MODULE_ID}/assets/streetwise.svg` },
    {
      name: "A5E.SkillSpecialtySubtleThreats",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/subtle_threats.svg`
    },
    { name: "A5E.SkillSpecialtySwimming", icon: `modules/${CONSTANTS.MODULE_ID}/assets/swimming.svg` },
    { name: "A5E.SkillSpecialtySwinging", icon: `modules/${CONSTANTS.MODULE_ID}/assets/swinging.svg` },
    { name: "A5E.SkillSpecialtyThrowing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/throwing.svg` },
    { name: "A5E.SkillSpecialtyTracking", icon: `modules/${CONSTANTS.MODULE_ID}/assets/tracking.svg` },
    { name: "A5E.SkillSpecialtyTrade", icon: `modules/${CONSTANTS.MODULE_ID}/assets/trade.svg` },
    { name: "A5E.SkillSpecialtyTraining", icon: `modules/${CONSTANTS.MODULE_ID}/assets/training.svg` },
    { name: "A5E.SkillSpecialtyTrapfinding", icon: `modules/${CONSTANTS.MODULE_ID}/assets/trapfinding.svg` },
    { name: "A5E.SkillSpecialtyTumbling", icon: `modules/${CONSTANTS.MODULE_ID}/assets/tumbling.svg` },
    { name: "A5E.SkillSpecialtyUndead", icon: `modules/${CONSTANTS.MODULE_ID}/assets/undead.svg` },
    { name: "A5E.SkillSpecialtyWars", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wars.svg` },
    { name: "A5E.SkillSpecialtyWayfinding", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wayfinding.svg` },
    {
      name: "A5E.SkillSpecialtyWeaponDisplays",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/weapon_displays.svg`
    },
    { name: "A5E.SkillSpecialtyWeather", icon: `modules/${CONSTANTS.MODULE_ID}/assets/weather.svg` },
    { name: "A5E.SkillSpecialtyWriting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/writing.svg` }
  ]
};
const dnd5e = {
  SYSTEM_ID: "dnd5e",
  /**
   * based on https://github.com/game-icons/icons/issues/516
   */
  imageReplacerDamageType: [
    { name: "DND5E.DamageAcid", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acid.svg` },
    { name: "DND5E.DamageBludgeoning", icon: `modules/${CONSTANTS.MODULE_ID}/assets/bludgeoning.svg` },
    { name: "DND5E.DamageCold", icon: `modules/${CONSTANTS.MODULE_ID}/assets/cold.svg` },
    { name: "DND5E.DamageFire", icon: `modules/${CONSTANTS.MODULE_ID}/assets/fire.svg` },
    { name: "DND5E.DamageForce", icon: `modules/${CONSTANTS.MODULE_ID}/assets/force.svg` },
    { name: "DND5E.DamageLightning", icon: `modules/${CONSTANTS.MODULE_ID}/assets/lightning.svg` },
    { name: "DND5E.DamageNecrotic", icon: `modules/${CONSTANTS.MODULE_ID}/assets/necrotic.svg` },
    { name: "DND5E.DamagePiercing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/piercing.svg` },
    { name: "DND5E.DamagePhysical", icon: `modules/${CONSTANTS.MODULE_ID}/assets/non_magical_physical.svg` },
    { name: "DND5E.DamagePoison", icon: `modules/${CONSTANTS.MODULE_ID}/assets/poison.svg` },
    { name: "DND5E.DamagePsychic", icon: `modules/${CONSTANTS.MODULE_ID}/assets/psychic.svg` },
    { name: "DND5E.DamageRadiant", icon: `modules/${CONSTANTS.MODULE_ID}/assets/radiant.svg` },
    { name: "DND5E.DamageSlashing", icon: `modules/${CONSTANTS.MODULE_ID}/assets/slashing.svg` },
    { name: "DND5E.DamageThunder", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thunder.svg` }
  ],
  imageReplacerWeaponProperties: [
    { name: "DND5E.WeaponPropertiesAda", icon: `modules/${CONSTANTS.MODULE_ID}/assets/adamantine.svg` },
    { name: "DND5E.WeaponPropertiesAmm", icon: `modules/${CONSTANTS.MODULE_ID}/assets/ammunition.svg` },
    { name: "DND5E.WeaponPropertiesFin", icon: `modules/${CONSTANTS.MODULE_ID}/assets/finesse.svg` },
    { name: "DND5E.WeaponPropertiesFir", icon: `modules/${CONSTANTS.MODULE_ID}/assets/firearm.svg` },
    { name: "DND5E.WeaponPropertiesFoc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/focus.svg` },
    { name: "DND5E.WeaponPropertiesHvy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/heavy.svg` },
    { name: "DND5E.WeaponPropertiesLgt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/light.svg` },
    { name: "DND5E.WeaponPropertiesLod", icon: `modules/${CONSTANTS.MODULE_ID}/assets/loading.svg` },
    { name: "DND5E.WeaponPropertiesMgc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/magical.svg` },
    { name: "DND5E.WeaponPropertiesRch", icon: `modules/${CONSTANTS.MODULE_ID}/assets/reach.svg` },
    { name: "DND5E.WeaponPropertiesRel", icon: `modules/${CONSTANTS.MODULE_ID}/assets/reload.svg` },
    { name: "DND5E.WeaponPropertiesRet", icon: `modules/${CONSTANTS.MODULE_ID}/assets/returning.svg` },
    { name: "DND5E.WeaponPropertiesSil", icon: `modules/${CONSTANTS.MODULE_ID}/assets/silvered.svg` },
    { name: "DND5E.WeaponPropertiesSpc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/special.svg` },
    { name: "DND5E.WeaponPropertiesThr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thrown.svg` },
    { name: "DND5E.WeaponPropertiesTwo", icon: `modules/${CONSTANTS.MODULE_ID}/assets/two-Handed.svg` },
    { name: "DND5E.WeaponPropertiesVer", icon: `modules/${CONSTANTS.MODULE_ID}/assets/versatile.svg` }
  ],
  /**
   * based on https://github.com/game-icons/icons/issues/516
   */
  imageReplacerIconizer: [
    // =======================================================================
    // dnd5e
    // =======================================================================
    { name: "DND5E.DamageRoll", icon: `modules/${CONSTANTS.MODULE_ID}/assets/damage_roll.svg` },
    { name: "DND5E.AttackRoll", icon: `modules/${CONSTANTS.MODULE_ID}/assets/attack_roll.svg` },
    { name: "DND5E.SkillAcr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acrobatics.svg` },
    { name: "DND5E.SkillAni", icon: `modules/${CONSTANTS.MODULE_ID}/assets/animal_handling.svg` },
    { name: "DND5E.SkillArc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/arcana.svg` },
    { name: "DND5E.SkillAth", icon: `modules/${CONSTANTS.MODULE_ID}/assets/athletics.svg` },
    { name: "DND5E.SkillDec", icon: `modules/${CONSTANTS.MODULE_ID}/assets/deception.svg` },
    { name: "DND5E.SkillHis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/history.svg` },
    { name: "DND5E.SkillIns", icon: `modules/${CONSTANTS.MODULE_ID}/assets/insight.svg` },
    { name: "DND5E.SkillItm", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intimidation.svg` },
    { name: "DND5E.SkillInv", icon: `modules/${CONSTANTS.MODULE_ID}/assets/investigation.svg` },
    { name: "DND5E.SkillMed", icon: `modules/${CONSTANTS.MODULE_ID}/assets/medicine.svg` },
    { name: "DND5E.SkillNat", icon: `modules/${CONSTANTS.MODULE_ID}/assets/nature.svg` },
    { name: "DND5E.SkillPrc", icon: `modules/${CONSTANTS.MODULE_ID}/assets/perception.svg` },
    { name: "DND5E.SkillPrf", icon: `modules/${CONSTANTS.MODULE_ID}/assets/performance.svg` },
    { name: "DND5E.SkillPer", icon: `modules/${CONSTANTS.MODULE_ID}/assets/persuasion.svg` },
    { name: "DND5E.SkillRel", icon: `modules/${CONSTANTS.MODULE_ID}/assets/religion.svg` },
    { name: "DND5E.SkillSlt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/sleight_of_hand.svg` },
    { name: "DND5E.SkillSte", icon: `modules/${CONSTANTS.MODULE_ID}/assets/stealth.svg` },
    { name: "DND5E.SkillSur", icon: `modules/${CONSTANTS.MODULE_ID}/assets/survival.svg` },
    { name: "DND5E.ToolArtisans", icon: `modules/${CONSTANTS.MODULE_ID}/assets/artisan_s_tools.svg` },
    { name: "DND5E.ToolDisguiseKit", icon: `modules/${CONSTANTS.MODULE_ID}/assets/disguise_kit.svg` },
    { name: "DND5E.ToolForgeryKit", icon: `modules/${CONSTANTS.MODULE_ID}/assets/forgery_kit` },
    { name: "DND5E.ToolGamingSet", icon: `modules/${CONSTANTS.MODULE_ID}/assets/gaming_set.svg` },
    { name: "DND5E.ToolHerbalismKit", icon: `modules/${CONSTANTS.MODULE_ID}/assets/herbalism_kit` },
    {
      name: "DND5E.ToolMusicalInstrument",
      icon: `modules/${CONSTANTS.MODULE_ID}/assets/musical_instrument.svg`
    },
    { name: "DND5E.ToolNavigators", icon: `modules/${CONSTANTS.MODULE_ID}/assets/navigator_s_tools.svg` },
    { name: "DND5E.ToolPoisonersKit", icon: `modules/${CONSTANTS.MODULE_ID}/assets/poisoner_s_kit.svg` },
    { name: "DND5E.ToolThieves", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thieves_tools.svg` },
    { name: "DND5E.ShortRest", icon: `modules/${CONSTANTS.MODULE_ID}/assets/short_rest.svg` },
    { name: "DND5E.LongRest", icon: `modules/${CONSTANTS.MODULE_ID}/assets/long_rest.svg` },
    { name: "DND5E.DeathSave", icon: `modules/${CONSTANTS.MODULE_ID}/assets/death_saves.svg` },
    { name: "DND5E.AbilityStr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/strength.svg` },
    { name: "DND5E.AbilityDex", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dexterity.svg` },
    { name: "DND5E.AbilityCon", icon: `modules/${CONSTANTS.MODULE_ID}/assets/constitution.svg` },
    { name: "DND5E.AbilityInt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intelligence.svg` },
    { name: "DND5E.AbilityWis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wisdom.svg` },
    { name: "DND5E.AbilityCha", icon: `modules/${CONSTANTS.MODULE_ID}/assets/charisma.svg` },
    { name: "DND5E.Initiative", icon: `modules/${CONSTANTS.MODULE_ID}/assets/initiative.svg` }
    //https://game-icons.net/1x1/delapouite/acoustic-megaphone.html
    // TODO CONDITION I JUST DON'T KNOW HO CAN BE USEFUL
    // { name : 'DND5E.ConBlinded', icon : `Blinded",
    // { name : 'DND5E.ConCharmed', icon : `Charmed",
    // { name : 'DND5E.ConDeafened', icon : `Deafened",
    // { name : 'DND5E.ConDiseased', icon : `Diseased",
    // { name : 'DND5E.ConExhaustion', icon : `Exhaustion",
    // { name : 'DND5E.ConFrightened', icon : `Frightened",
    // { name : 'DND5E.ConGrappled', icon : `Grappled",
    // { name : 'DND5E.ConImm', icon : `Condition Immunities",
    // { name : 'DND5E.ConIncapacitated', icon : `Incapacitated",
    // { name : 'DND5E.ConInvisible', icon : `Invisible",
    // { name : 'DND5E.ConParalyzed', icon : `Paralyzed",
    // { name : 'DND5E.ConPetrified', icon : `Petrified",
    // { name : 'DND5E.ConPoisoned', icon : `Poisoned",
    // { name : 'DND5E.ConProne', icon : `Prone",
    // { name : 'DND5E.ConRestrained', icon : `Restrained",
    // { name : 'DND5E.ConStunned', icon : `Stunned",
    // { name : 'DND5E.ConUnconscious', icon : `Unconscious",
    // { name : 'DND5E.Concentration', icon : `Concentration",
  ]
};
const generic = {
  SYSTEM_ID: "",
  imageReplacerDamageType: [],
  imageReplacerWeaponProperties: [],
  imageReplacerIconizer: []
};
const pf2e = {
  SYSTEM_ID: "pf2e",
  imageReplacerDamageType: [],
  imageReplacerWeaponProperties: [],
  imageReplacerIconizer: [
    // { name : 'PF2E.AbilityBoost', icon : `Ability Boost",
    // { name : 'PF2E.AbilityBoostLevels', icon : `Ability Boost Levels",
    { name: "PF2E.AbilityCha", icon: `modules/${CONSTANTS.MODULE_ID}/assets/charisma.svg` },
    { name: "PF2E.AbilityCon", icon: `modules/${CONSTANTS.MODULE_ID}/assets/constitution.svg` },
    { name: "PF2E.AbilityDex", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dexterity.svg` },
    { name: "PF2E.AbilityFlaw", icon: `modules/${CONSTANTS.MODULE_ID}/assets/flaw.svg` },
    { name: "PF2E.AbilityInt", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intelligence.svg` },
    // { name : 'PF2E.AbilityModifierLabel', icon : `Ability Modifier",
    // { name : 'PF2E.AbilityScoresHeader', icon : `Ability Scores",
    { name: "PF2E.AbilityFree", icon: `modules/${CONSTANTS.MODULE_ID}/assets/free.svg` },
    { name: "PF2E.AbilityStr", icon: `modules/${CONSTANTS.MODULE_ID}/assets/strength.svg` },
    // { name : 'PF2E.AbilityTitle', icon : `Ability",
    { name: "PF2E.AbilityWis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wisdom.svg` },
    { name: "PF2E.AbilityCheck.str", icon: `modules/${CONSTANTS.MODULE_ID}/assets/strength.svg` },
    { name: "PF2E.AbilityCheck.dex", icon: `modules/${CONSTANTS.MODULE_ID}/assets/dexterity.svg` },
    { name: "PF2E.AbilityCheck.con", icon: `modules/${CONSTANTS.MODULE_ID}/assets/constitution.svg` },
    { name: "PF2E.AbilityCheck.int", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intelligence.svg` },
    { name: "PF2E.AbilityCheck.wis", icon: `modules/${CONSTANTS.MODULE_ID}/assets/wisdom.svg` },
    { name: "PF2E.AbilityCheck.cha", icon: `modules/${CONSTANTS.MODULE_ID}/assets/charisma.svg` },
    { name: "PF2E.ActionsCheck.acrobatics", icon: `modules/${CONSTANTS.MODULE_ID}/assets/acrobatics.svg` },
    { name: "PF2E.ActionsCheck.arcana", icon: `modules/${CONSTANTS.MODULE_ID}/assets/arcana.svg` },
    { name: "PF2E.ActionsCheck.athletics", icon: `modules/${CONSTANTS.MODULE_ID}/assets/athletics.svg` },
    { name: "PF2E.ActionsCheck.crafting", icon: `modules/${CONSTANTS.MODULE_ID}/assets/crafting.svg` },
    { name: "PF2E.ActionsCheck.deception", icon: `modules/${CONSTANTS.MODULE_ID}/assets/deception.svg` },
    { name: "PF2E.ActionsCheck.diplomacy", icon: `modules/${CONSTANTS.MODULE_ID}/assets/diplomacy.svg` },
    { name: "PF2E.ActionsCheck.intimidation", icon: `modules/${CONSTANTS.MODULE_ID}/assets/intimidation.svg` },
    { name: "PF2E.ActionsCheck.medicine", icon: `modules/${CONSTANTS.MODULE_ID}/assets/medicine.svg` },
    { name: "PF2E.ActionsCheck.nature", icon: `modules/${CONSTANTS.MODULE_ID}/assets/nature.svg` },
    { name: "PF2E.ActionsCheck.occultism", icon: `modules/${CONSTANTS.MODULE_ID}/assets/occultism.svg` },
    { name: "PF2E.ActionsCheck.perception", icon: `modules/${CONSTANTS.MODULE_ID}/assets/perception.svg` },
    { name: "PF2E.ActionsCheck.performance", icon: `modules/${CONSTANTS.MODULE_ID}/assets/performance.svg` },
    { name: "PF2E.ActionsCheck.religion", icon: `modules/${CONSTANTS.MODULE_ID}/assets/religion.svg` },
    { name: "PF2E.ActionsCheck.society", icon: `modules/${CONSTANTS.MODULE_ID}/assets/society.svg` },
    { name: "PF2E.ActionsCheck.stealth", icon: `modules/${CONSTANTS.MODULE_ID}/assets/stealth.svg` },
    { name: "PF2E.ActionsCheck.survival", icon: `modules/${CONSTANTS.MODULE_ID}/assets/survival.svg` },
    { name: "PF2E.ActionsCheck.thievery", icon: `modules/${CONSTANTS.MODULE_ID}/assets/thievery.svg` }
  ]
};
const swade = {
  SYSTEM_ID: "swade",
  imageReplacerDamageType: [],
  imageReplacerWeaponProperties: [],
  imageReplacerIconizer: []
};
const SYSTEMS = {
  get DATA() {
    return {
      // ↓ ADD SYSTEMS HERE ↓
      a5e,
      dnd5e,
      generic,
      pf2e,
      swade
      // ↑ ADD SYSTEMS HERE ↑
    }?.[game.system.id];
  }
};
const registerSettings = /* @__PURE__ */ __name(function() {
  game.settings.registerMenu(CONSTANTS.MODULE_ID, "resetAllSettings", {
    name: `${CONSTANTS.MODULE_ID}.setting.reset.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.reset.hint`,
    icon: "fas fa-coins",
    type: ResetSettingsDialog,
    restricted: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "disableChatPortrait", {
    name: `${CONSTANTS.MODULE_ID}.settings.disableChatPortrait.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.disableChatPortrait.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useTokenImage", {
    name: `${CONSTANTS.MODULE_ID}.settings.useTokenImage.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useTokenImage.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "doNotUseTokenImageWithSpecificType", {
    name: `${CONSTANTS.MODULE_ID}.settings.doNotUseTokenImageWithSpecificType.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.doNotUseTokenImageWithSpecificType.hint`,
    scope: "world",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useTokenName", {
    name: `${CONSTANTS.MODULE_ID}.settings.useTokenName.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useTokenName.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useAvatarImage", {
    name: `${CONSTANTS.MODULE_ID}.settings.useAvatarImage.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useAvatarImage.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displayPlayerName", {
    name: `${CONSTANTS.MODULE_ID}.settings.displayPlayerName.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displayPlayerName.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "portraitSize", {
    name: `${CONSTANTS.MODULE_ID}.settings.portraitSize.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.portraitSize.hint`,
    scope: "client",
    config: true,
    type: Number,
    default: 36
  });
  game.settings.register(CONSTANTS.MODULE_ID, "portraitSizeItem", {
    name: `${CONSTANTS.MODULE_ID}.settings.portraitSizeItem.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.portraitSizeItem.hint`,
    scope: "client",
    config: true,
    type: Number,
    default: 36
  });
  game.settings.register(CONSTANTS.MODULE_ID, "borderShape", {
    name: `${CONSTANTS.MODULE_ID}.settings.borderShape.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.borderShape.hint`,
    scope: "client",
    config: true,
    type: String,
    default: "square",
    choices: {
      square: i18n(`${CONSTANTS.MODULE_ID}.settings.borderShape.choice.square`),
      circle: i18n(`${CONSTANTS.MODULE_ID}.settings.borderShape.choice.circle`),
      none: i18n(`${CONSTANTS.MODULE_ID}.settings.borderShape.choice.none`)
    }
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useUserColorAsBorderColor", {
    name: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsBorderColor.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsBorderColor.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "borderColor", {
    name: `${CONSTANTS.MODULE_ID}.settings.borderColor.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.borderColor.hint`,
    scope: "client",
    config: true,
    type: String,
    default: "#000000"
  });
  game.settings.register(CONSTANTS.MODULE_ID, "borderWidth", {
    name: `${CONSTANTS.MODULE_ID}.settings.borderWidth.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.borderWidth.hint`,
    scope: "client",
    config: true,
    type: Number,
    default: 2
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useUserColorAsChatBackgroundColor", {
    name: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsChatBackgroundColor.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsChatBackgroundColor.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true // [D35E] 用户要求默认背景色染色
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useUserColorAsChatBorderColor", {
    name: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsChatBorderColor.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useUserColorAsChatBorderColor.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false // [D35E] 默认背景色模式，边框色关闭
  });
  game.settings.register(CONSTANTS.MODULE_ID, "forceNameSearch", {
    name: `${CONSTANTS.MODULE_ID}.settings.forceNameSearch.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.forceNameSearch.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "textSizeName", {
    name: `${CONSTANTS.MODULE_ID}.settings.textSizeName.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.textSizeName.hint`,
    scope: "client",
    config: true,
    type: Number,
    default: 0
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displayMessageTag", {
    name: `${CONSTANTS.MODULE_ID}.settings.displayMessageTag.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displayMessageTag.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useImageReplacer", {
    name: `${CONSTANTS.MODULE_ID}.settings.useImageReplacer.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useImageReplacer.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "useImageReplacerDamageType", {
    name: `${CONSTANTS.MODULE_ID}.settings.useImageReplacerDamageType.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.useImageReplacerDamageType.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "imageReplacerDamageType", {
    name: `${CONSTANTS.MODULE_ID}.setting.imageReplacerDamageType.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.imageReplacerDamageType.hint`,
    scope: "world",
    config: false,
    default: SYSTEMS.DATA ? SYSTEMS.DATA.imageReplacerDamageType : [],
    type: Array
  });
  game.settings.register(CONSTANTS.MODULE_ID, "imageReplacerWeaponProperties", {
    name: `${CONSTANTS.MODULE_ID}.setting.imageReplacerWeaponProperties.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.imageReplacerWeaponProperties.hint`,
    scope: "world",
    config: false,
    default: SYSTEMS.DATA ? SYSTEMS.DATA.imageReplacerWeaponProperties : [],
    type: Array
  });
  game.settings.register(CONSTANTS.MODULE_ID, "imageReplacerIconizer", {
    name: `${CONSTANTS.MODULE_ID}.setting.imageReplacerIconizer.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.imageReplacerIconizer.hint`,
    scope: "world",
    config: false,
    default: SYSTEMS.DATA ? SYSTEMS.DATA.imageReplacerIconizer : [],
    type: Array
  });
  game.settings.register(CONSTANTS.MODULE_ID, "applyOnCombatTracker", {
    name: `${CONSTANTS.MODULE_ID}.settings.applyOnCombatTracker.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.applyOnCombatTracker.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySetting", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySetting.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySetting.hint`,
    scope: "client",
    config: true,
    default: "allCards",
    type: String,
    choices: {
      allCards: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.allCards`),
      selfAndGM: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.selfAndGM`),
      self: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.self`),
      gm: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.gm`),
      player: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.player`),
      none: i18n(`${CONSTANTS.MODULE_ID}.settings.displaySetting.choice.none`)
    }
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingOTHER", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingOTHER.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingOTHER.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingOOC", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingOOC.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingOOC.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingIC", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingIC.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingIC.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingEMOTE", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingEMOTE.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingEMOTE.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingWHISPER", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingWHISPER.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingWHISPER.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingROLL", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingROLL.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingROLL.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "displaySettingWhisperToOther", {
    name: `${CONSTANTS.MODULE_ID}.settings.displaySettingWhisperToOther.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.displaySettingWhisperToOther.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "customStylingMessageText", {
    name: `${CONSTANTS.MODULE_ID}.settings.customStylingMessageText.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.customStylingMessageText.hint`,
    scope: "client",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(CONSTANTS.MODULE_ID, "customStylingMessageImage", {
    name: `${CONSTANTS.MODULE_ID}.settings.customStylingMessageImage.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.customStylingMessageImage.hint`,
    scope: "client",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(CONSTANTS.MODULE_ID, "disablePortraitForAliasGmMessage", {
    name: `${CONSTANTS.MODULE_ID}.settings.disablePortraitForAliasGmMessage.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.disablePortraitForAliasGmMessage.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "setUpPortraitForAliasGmMessage", {
    name: `${CONSTANTS.MODULE_ID}.settings.setUpPortraitForAliasGmMessage.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.setUpPortraitForAliasGmMessage.hint`,
    scope: "world",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(CONSTANTS.MODULE_ID, "enableSpeakingAs", {
    name: `${CONSTANTS.MODULE_ID}.settings.enableSpeakingAs.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.enableSpeakingAs.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "speakingAsWarningCharacters", {
    name: `${CONSTANTS.MODULE_ID}.settings.speakingAsWarningCharacters.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.speakingAsWarningCharacters.hint`,
    scope: "client",
    config: true,
    type: String,
    default: '".+"'
  });
  game.settings.register(CONSTANTS.MODULE_ID, "enableSpeakAs", {
    name: `${CONSTANTS.MODULE_ID}.settings.enableSpeakAs.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.enableSpeakAs.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "debug", {
    name: `${CONSTANTS.MODULE_ID}.setting.debug.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.debug.hint`,
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });
  game.settings.register(CONSTANTS.MODULE_ID, "systemFound", {
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  });
  game.settings.register(CONSTANTS.MODULE_ID, "systemNotFoundWarningShown", {
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  });
  game.settings.register(CONSTANTS.MODULE_ID, "preconfiguredSystem", {
    name: `${CONSTANTS.MODULE_ID}.setting.preconfiguredSystem.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.preconfiguredSystem.hint`,
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  });
}, "registerSettings");
const _ResetSettingsDialog = class _ResetSettingsDialog extends FormApplication {
  constructor(...args) {
    super(...args);
    return new Dialog({
      title: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.title`),
      content: '<p style="margin-bottom:1rem;">' + game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.content`) + "</p>",
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.confirm`),
          callback: async () => {
            const worldSettings = game.settings.storage?.get("world")?.filter((setting) => setting.key.startsWith(`${CONSTANTS.MODULE_ID}.`));
            for (let setting of worldSettings) {
              console.log(`Reset setting '${setting.key}'`);
              await setting.delete();
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.cancel`)
        }
      },
      default: "cancel"
    });
  }
  async _updateObject(event, formData) {
  }
};
__name(_ResetSettingsDialog, "ResetSettingsDialog");
let ResetSettingsDialog = _ResetSettingsDialog;
const preloadTemplates = /* @__PURE__ */ __name(async function() {
  const templatePaths = []; // [D35E] 设置表单模板已裁剪
  return loadTemplates(templatePaths);
}, "preloadTemplates");
const _ChatLink = class _ChatLink {
  static init() {
    _ChatLink.updateSettings();
  }
  static updateSettings() {
    _ChatLink.showTooltip = game.settings.get(CONSTANTS.MODULE_ID, "hoverTooltip");
  }
  static prepareEvent(message, html, speakerInfo, gameSystemId) {
    const clickable = html.find(`.chat-portrait-message-portrait-${gameSystemId}`);
    if (!clickable) {
      return;
    }
    const speaker = speakerInfo.message ? speakerInfo.message.speaker : speakerInfo;
    if (!(speaker.actor || speaker.token)) {
      return;
    }
    const speakerName = clickable[0]?.textContent ?? speaker.alias ?? _ChatLink.i18n(CONSTANTS.MODULE_ID + ".genericName");
    const speakerData = {
      idScene: speaker.scene,
      idActor: speaker.actor,
      idToken: speaker.token,
      name: speakerName
    };
    if (!speakerData.idScene) {
      if (speakerInfo.author) {
        speakerData.idScene = speakerInfo.author.viewedScene;
      } else {
        speakerData.idScene = game.scenes?.current?.id;
      }
    }
    clickable.hover((event) => {
      _ChatLink.hoverIn(event, speaker);
    }, _ChatLink.hoverOut);
    clickable.dblclick((event) => _ChatLink.panToToken(speakerData));
  }
  static prepareEventImage(message, html, speakerInfo, gameSystemId) {
    const clickable = html.find(`.chat-portrait-message-portrait-${gameSystemId}`);
    const speaker = speakerInfo.message ? speakerInfo.message.speaker : speakerInfo;
    if (!(speaker.actor || speaker.token)) {
      return;
    }
    const speakerName = clickable[0]?.textContent ?? speaker.alias ?? _ChatLink.i18n(CONSTANTS.MODULE_ID + ".genericName");
    const speakerData = {
      idScene: speaker.scene,
      idActor: speaker.actor,
      idToken: speaker.token,
      name: speakerName
    };
    if (!speakerData.idScene) {
      if (speakerInfo.author) {
        speakerData.idScene = speakerInfo.author.viewedScene;
      } else {
        speakerData.idScene = game.scenes?.current?.id;
      }
    }
    clickable.hover((event) => {
      _ChatLink.hoverIn(event, speaker);
    }, _ChatLink.hoverOut);
    clickable.dblclick((event) => _ChatLink.panToToken(speakerData));
  }
  // If it's reached this far, assume scene is correct.
  static panToToken(speakerData) {
    const user = game.user;
    const token = _ChatLink.getToken(speakerData);
    if (!_ChatLink.tokenExists(user, speakerData, token)) {
      return;
    }
    if (!_ChatLink.permissionToSee(user, speakerData, token)) {
      return;
    }
    _ChatLink.doPanToToken(user, token);
  }
  static selectToken(event, speakerData) {
    const user = game.user;
    const token = _ChatLink.getToken(speakerData);
    if (!_ChatLink.tokenExists(user, speakerData, token))
      return;
    if (!_ChatLink.permissionToSee(user, speakerData, token))
      return;
    _ChatLink.doSelectToken(event, user, token);
  }
  static getToken(speakerData) {
    let token = canvas.tokens?.placeables.find((t) => t.id === speakerData.idToken);
    if (!token)
      token = canvas.tokens?.placeables.find((t) => t.actor?.id === speakerData.idActor);
    return token;
  }
  static tokenExists(user, speakerData, token) {
    if (token && token.visible) {
      return true;
    }
    if (!_ChatLink.isRightScene(user, speakerData)) {
      return false;
    }
    const message = user.isGM ? _ChatLink.playerWarning(speakerData) + ` ${_ChatLink.i18n(CONSTANTS.MODULE_ID + ".noTokenFound")}` : _ChatLink.playerWarning(speakerData);
    _ChatLink.warning(message);
    return false;
  }
  static isRightScene(user, speakerData) {
    if (canvas.scene?.id === speakerData.idScene) {
      return true;
    }
    let sceneNote;
    if (!speakerData.idScene) {
      sceneNote = ` ${_ChatLink.i18n(CONSTANTS.MODULE_ID + ".noSceneFound")}`;
    } else {
      const tokenScene = game.scenes?.find((s) => s.id === speakerData.idScene);
      sceneNote = ` ${_ChatLink.i18nFormat(CONSTANTS.MODULE_ID + ".checkScene", {
        sceneName: tokenScene?.name
      })}`;
    }
    const message = user.isGM ? _ChatLink.playerWarning(speakerData) + sceneNote : _ChatLink.playerWarning(speakerData);
    _ChatLink.warning(message);
    return false;
  }
  static permissionToSee(user, speakerData, token) {
    if (user.isGM || token.visible) {
      return true;
    }
    _ChatLink.warning(_ChatLink.playerWarning(speakerData));
    return false;
  }
  static permissionToControl(user, token) {
    return user.isGM || token.actor?.hasPlayerOwner;
  }
  static doSelectToken(event, user, token) {
    const ctrlKey = event.ctrlKey;
    if (!_ChatLink.permissionToControl(user, token)) {
      _ChatLink.targetToken(event, user, token, ctrlKey);
      return;
    }
    const shiftKey = event.shiftKey;
    if (shiftKey) {
      _ChatLink.targetToken(event, user, token, ctrlKey);
    } else {
      _ChatLink.controlToken(event, user, token, ctrlKey);
    }
  }
  static doPanToToken(user, token) {
    const scale = canvas.scene?._viewPosition.scale;
    canvas.animatePan({ x: token.x, y: token.y, scale, duration: 500 });
    if (token && token.isVisible) {
      canvas.animatePan({ ...token.center, duration: 250 });
    }
  }
  static controlToken(event, user, token, ctrlKey) {
    const releaseOthers = { releaseOthers: !ctrlKey };
    if (ctrlKey) {
      if (token._controlled)
        token.release();
      else
        token.control(releaseOthers);
      return;
    }
    if (token._controlled || canvas.tokens?.controlled.length !== 1)
      token.control(releaseOthers);
    else if (!token._controlled && canvas.tokens?.controlled.length === 1)
      token.control(releaseOthers);
    else
      token.release();
  }
  static targetToken(event, user, token, ctrlKey) {
    const releaseOthers = { releaseOthers: !ctrlKey };
    if (ctrlKey) {
      if (token.isTargeted)
        token.setTarget(false, releaseOthers);
      else
        token.setTarget(true, releaseOthers);
      return;
    }
    if (token.isTargeted && game.user?.targets.size !== 1)
      token.setTarget(true, releaseOthers);
    else if (token.isTargeted && game.user?.targets.size === 1)
      token.setTarget(false, releaseOthers);
    else
      token.setTarget(true, releaseOthers);
  }
  static getCoords(token) {
    const result = { x: token.center.x, y: token.center.y, width: 1, height: 1 };
    return result;
  }
  static warning(message) {
    warn(message, true);
  }
};
__name(_ChatLink, "ChatLink");
let ChatLink = _ChatLink;
ChatLink.clickTimeout = 250;
ChatLink.clickCount = 0;
ChatLink.playerWarning = (data) => ChatLink.i18nFormat(CONSTANTS.MODULE_ID + ".notInSight", data);
ChatLink.showTooltip = true;
ChatLink.hoverTimeout = 1e3;
ChatLink.hoverTimer = null;
ChatLink.i18n = (toTranslate) => game.i18n.localize(toTranslate);
ChatLink.i18nFormat = (toTranslate, data) => game.i18n.format(toTranslate, data);
ChatLink.hoverIn = (event, speaker) => {
  const token = ChatPortrait.getTokenFromSpeaker(speaker);
  if (token && token.visible) {
    event.fromChat = true;
    if (token._object) {
      token._object._onHoverIn(event);
      ChatLink.lastHoveredToken = token;
    }
  }
};
ChatLink.hoverOut = (event) => {
  if (ChatLink.lastHoveredToken && ChatLink.lastHoveredToken._hover) {
    event.fromChat = true;
    ChatLink.lastHoveredToken._onHoverOut(event);
    ChatLink.lastHoveredToken = null;
  }
};
const _SettingsForm = class _SettingsForm {
  //#region getters and setters
  // static getBorderShapeList() {
  //     return game.settings.get(MODULE_ID, 'borderShapeList');
  // }
  static getDisableChatPortrait() {
    return game.settings.get(CONSTANTS.MODULE_ID, "disableChatPortrait");
  }
  static setDisableChatPortrait(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "disableChatPortrait", value);
  }
  static getUseTokenImage() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useTokenImage");
  }
  static setUseTokenImage(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useTokenImage", value);
  }
  static getDoNotUseTokenImageWithSpecificType() {
    return game.settings.get(CONSTANTS.MODULE_ID, "doNotUseTokenImageWithSpecificType");
  }
  static setDoNotUseTokenImageWithSpecificType(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "doNotUseTokenImageWithSpecificType", value);
  }
  static getUseTokenName() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useTokenName");
  }
  static setUseTokenName(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useTokenName", value);
  }
  static getPortraitSize() {
    return game.settings.get(CONSTANTS.MODULE_ID, "portraitSize");
  }
  static setPortraitSize(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "portraitSize", value);
  }
  static getPortraitSizeItem() {
    return game.settings.get(CONSTANTS.MODULE_ID, "portraitSizeItem");
  }
  static setPortraitSizeItem(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "portraitSizeItem", value);
  }
  static getBorderShape() {
    return game.settings.get(CONSTANTS.MODULE_ID, "borderShape");
  }
  static setBorderShape(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "borderShape", value);
  }
  static getUseUserColorAsBorderColor() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useUserColorAsBorderColor");
  }
  static setUseUserColorAsBorderColor(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useUserColorAsBorderColor", value);
  }
  static getBorderColor() {
    return game.settings.get(CONSTANTS.MODULE_ID, "borderColor");
  }
  static setBorderColor(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "borderColor", value);
  }
  static getBorderWidth() {
    return game.settings.get(CONSTANTS.MODULE_ID, "borderWidth");
  }
  static setBorderWidth(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "borderWidth", value);
  }
  static getUseUserColorAsChatBackgroundColor() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useUserColorAsChatBackgroundColor");
  }
  static setUseUserColorAsChatBackgroundColor(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useUserColorAsChatBackgroundColor", value);
  }
  static getUseUserColorAsChatBorderColor() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useUserColorAsChatBorderColor");
  }
  static setUseUserColorAsChatBorderColor(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useUserColorAsChatBorderColor", value);
  }
  // static getFlavorNextToPortrait() {
  // 	return <boolean>game.settings.get(CONSTANTS.MODULE_ID, "flavorNextToPortrait");
  // }
  // static setFlavorNextToPortrait(value: boolean) {
  // 	game.settings.set(CONSTANTS.MODULE_ID, "flavorNextToPortrait", value);
  // }
  static getForceNameSearch() {
    return game.settings.get(CONSTANTS.MODULE_ID, "forceNameSearch");
  }
  static setForceNameSearch(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "forceNameSearch", value);
  }
  // static getHoverTooltip() {
  //     return <boolean>game.settings.get(CONSTANTS.MODULE_ID, 'hoverTooltip');
  // }
  // static setHoverTooltip(value:boolean) {
  //     game.settings.set(CONSTANTS.MODULE_ID,'hoverTooltip',value);
  // }
  static getTextSizeName() {
    return game.settings.get(CONSTANTS.MODULE_ID, "textSizeName");
  }
  static setTextSizeName(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "textSizeName", value);
  }
  static getDisplaySetting() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySetting");
  }
  static setDisplaySetting(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySetting", value);
  }
  static getUseAvatarImage() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useAvatarImage");
  }
  static setUseAvatarImage(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useAvatarImage", value);
  }
  static getDisplayPlayerName() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displayPlayerName");
  }
  static setDisplayPlayerName(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displayPlayerName", value);
  }
  //   static getDisplayUnknown() {
  //     return game.settings.get(CONSTANTS.MODULE_ID, "displayUnknown");
  //   }
  //   static setDisplayUnknown(value) {
  //     game.settings.set(CONSTANTS.MODULE_ID, "displayUnknown", value);
  //   }
  //   static getDisplayUnknownPlaceHolderActorName() {
  //     return game.settings.get(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderActorName");
  //   }
  //   static setDisplayUnknownPlaceHolderActorName(value) {
  //     game.settings.set(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderActorName", value);
  //   }
  //   static getDisplayUnknownPlaceHolderItemName() {
  //     return game.settings.get(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderItemName");
  //   }
  //   static setDisplayUnknownPlaceHolderItemName(value) {
  //     game.settings.set(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderItemName", value);
  //   }
  //   static getDisplayUnknownPlaceHolderItemIcon() {
  //     return game.settings.get(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderItemIcon");
  //   }
  //   static setDisplayUnknownPlaceHolderItemIcon(value) {
  //     game.settings.set(CONSTANTS.MODULE_ID, "displayUnknownPlaceHolderItemIcon", value);
  //   }
  static getDisplaySettingOTHER() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingOTHER");
  }
  static setDisplaySettingOTHER(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingOTHER", value);
  }
  static getDisplaySettingOOC() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingOOC");
  }
  static setDisplaySettingOOC(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingOOC", value);
  }
  static getDisplaySettingIC() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingIC");
  }
  static setDisplaySettingIC(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingIC", value);
  }
  static getDisplaySettingEMOTE() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingEMOTE");
  }
  static setDisplaySettingEMOTE(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingEMOTE", value);
  }
  static getDisplaySettingWHISPER() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingWHISPER");
  }
  static setDisplaySettingWHISPER(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingWHISPER", value);
  }
  static getDisplaySettingROLL() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingROLL");
  }
  static setDisplaySettingROLL(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingROLL", value);
  }
  static getDisplaySettingWhisperToOther() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displaySettingWhisperToOther");
  }
  static setDisplaySettingWhisperToOther(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displaySettingWhisperToOther", value);
  }
  // static getCustomStylingMessageSystem() {
  //   return <boolean>game.settings.get(CONSTANTS.MODULE_ID, 'customStylingMessageSystem');
  // }
  // static setCustomStylingMessageSystem(value: boolean) {
  //   game.settings.set(CONSTANTS.MODULE_ID, 'customStylingMessageSystem', value);
  // }
  static getCustomStylingMessageText() {
    return game.settings.get(CONSTANTS.MODULE_ID, "customStylingMessageText");
  }
  static setCustomStylingMessageText(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "customStylingMessageText", value);
  }
  static getCustomStylingMessageImage() {
    return game.settings.get(CONSTANTS.MODULE_ID, "customStylingMessageImage");
  }
  static setCustomStylingMessageImage(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "customStylingMessageImage", value);
  }
  static getDisplayMessageTag() {
    return game.settings.get(CONSTANTS.MODULE_ID, "displayMessageTag");
  }
  static setDisplayMessageTag(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "displayMessageTag", value);
  }
  // static getDisplayMessageTagNextToName() {
  // 	return <boolean>game.settings.get(CONSTANTS.MODULE_ID, "displayMessageTagNextToName");
  // }
  // static setDisplayMessageTagNextToName(value: boolean) {
  // 	game.settings.set(CONSTANTS.MODULE_ID, "displayMessageTagNextToName", value);
  // }
  static getUseImageReplacer() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useImageReplacer");
  }
  static setUseImageReplacer(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useImageReplacer", value);
  }
  static getUseImageReplacerDamageType() {
    return game.settings.get(CONSTANTS.MODULE_ID, "useImageReplacerDamageType");
  }
  static setUseImageReplacerDamageType(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "useImageReplacerDamageType", value);
  }
  static getApplyOnCombatTracker() {
    return game.settings.get(CONSTANTS.MODULE_ID, "applyOnCombatTracker");
  }
  static setApplyOnCombatTracker(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "applyOnCombatTracker", value);
  }
  // static getApplyPreCreateChatMessagePatch() {
  // 	return <boolean>game.settings.get(CONSTANTS.MODULE_ID, "applyPreCreateChatMessagePatch");
  // }
  // static setApplyPreCreateChatMessagePatch(value: boolean) {
  // 	game.settings.set(CONSTANTS.MODULE_ID, "applyPreCreateChatMessagePatch", value);
  // }
  static getDisablePortraitForAliasGmMessage() {
    return game.settings.get(CONSTANTS.MODULE_ID, "disablePortraitForAliasGmMessage");
  }
  static setDisablePortraitForAliasGmMessage(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "disablePortraitForAliasGmMessage", value);
  }
  static getSetUpPortraitForAliasGmMessage() {
    return game.settings.get(CONSTANTS.MODULE_ID, "setUpPortraitForAliasGmMessage");
  }
  static setSetUpPortraitForAliasGmMessage(value) {
    game.settings.set(CONSTANTS.MODULE_ID, "setUpPortraitForAliasGmMessage", value);
  }
};
__name(_SettingsForm, "SettingsForm");
let SettingsForm = _SettingsForm;
const _ImageReplacerData = class _ImageReplacerData {
  constructor() {
    this.iconMainReplacer = "";
    this.iconsDamageType = [];
  }
};
__name(_ImageReplacerData, "ImageReplacerData");
let ImageReplacerData = _ImageReplacerData;
const API = {
  /**
   * The attributes used to track dynamic attributes in this system
   *
   * @returns {array}
   */
  get imageReplacerDamageType() {
    let arr = game.settings.get(CONSTANTS.MODULE_ID, "imageReplacerDamageType") || [];
    if (arr.length <= 0) {
      arr = SYSTEMS.DATA?.imageReplacerDamageType;
    }
    return arr;
  },
  /**
   * Sets the inAttribute used to track the passive perceptions in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  async setImageReplacerDamageType(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw error("setImageReplacerDamageType | inAttribute must be of type string");
    }
    await game.settings.set(CONSTANTS.MODULE_ID, "preconfiguredSystem", true);
    return game.settings.set(CONSTANTS.MODULE_ID, "imageReplacerDamageType", inAttribute);
  },
  /**
   * The attributes used to track dynamic attributes in this system
   *
   * @returns {array}
   */
  get imageReplacerWeaponProperties() {
    let arr = game.settings.get(CONSTANTS.MODULE_ID, "imageReplacerWeaponProperties") || [];
    if (arr.length <= 0) {
      arr = SYSTEMS.DATA?.imageReplacerWeaponProperties;
    }
    return arr;
  },
  /**
   * Sets the inAttribute used to track the passive perceptions in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  async setImageReplacerWeaponProperties(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw error("setImageReplacerWeaponProperties | inAttribute must be of type string");
    }
    await game.settings.set(CONSTANTS.MODULE_ID, "preconfiguredSystem", true);
    return game.settings.set(CONSTANTS.MODULE_ID, "imageReplacerWeaponProperties", inAttribute);
  },
  /**
   * The attributes used to track dynamic attributes in this system
   *
   * @returns {array}
   */
  get imageReplacerIconizer() {
    let arr = game.settings.get(CONSTANTS.MODULE_ID, "imageReplacerIconizer") || [];
    if (arr.length <= 0) {
      arr = SYSTEMS.DATA?.imageReplacerIconizer;
    }
    return arr;
  },
  /**
   * Sets the inAttribute used to track the passive perceptions in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  async setImageReplacerIconizer(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw error("setImageReplacerIconizer | inAttribute must be of type string");
    }
    await game.settings.set(CONSTANTS.MODULE_ID, "preconfiguredSystem", true);
    return game.settings.set(CONSTANTS.MODULE_ID, "imageReplacerIconizer", inAttribute);
  },
  retrieveSystemId() {
    const sys = SYSTEMS.DATA?.SYSTEM_ID;
    if (sys && game.system.id === sys) {
      return sys;
    } else {
      return "generic";
    }
  }
};
const _ChatPortrait = class _ChatPortrait {
  /**
   * @param  {ChatMessage} chatMessage
   * @param  {JQuery} html
   * @param  {MessageRenderData} messageData
   */
  static onRenderChatMessage(chatMessage, html, speakerInfo, imageReplacer) {
    let doNotStyling = false;
    let doNotPrintPortrait = false;
    let doOnlyPortrait = false;
    const gameSystemId = API.retrieveSystemId();
    const elementMessageHeaderBySystem1 = html.find(`chat-portrait-message-header-${gameSystemId}`);
    const elementMessageHeaderBySystem2 = html.find(`chat-portrait-message-portrait-${gameSystemId}`);
    const elementMessageHeaderBySystem3 = html.find(`chat-portrait-message-portrait`);
    if (elementMessageHeaderBySystem1?.length > 0 || elementMessageHeaderBySystem2?.length > 0 || elementMessageHeaderBySystem3?.length > 0) {
      return void 0;
    }
    if (Hooks.call("ChatPortraitEnabled", chatMessage, html, speakerInfo) === false) {
      return html;
    }
    if (!_ChatPortrait.shouldOverrideMessageStyling(speakerInfo)) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingWhisperToOther && _ChatPortrait.isWhisperToOther(speakerInfo)) {
      doNotStyling = true;
    }
    const messageType = _ChatPortrait.getMessageTypeVisible(speakerInfo);
    if (!_ChatPortrait.settings.displaySettingOTHER && messageType == CONST.CHAT_MESSAGE_TYPES.OTHER) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingOOC && messageType == CONST.CHAT_MESSAGE_TYPES.OOC) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingIC && messageType == CONST.CHAT_MESSAGE_TYPES.IC) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingEMOTE && messageType == CONST.CHAT_MESSAGE_TYPES.EMOTE) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingWHISPER && messageType == CONST.CHAT_MESSAGE_TYPES.WHISPER) {
      doNotStyling = true;
    }
    if (!_ChatPortrait.settings.displaySettingROLL && messageType == CONST.CHAT_MESSAGE_TYPES.ROLL) {
      doNotStyling = true;
    }
    if (_ChatPortrait.settings.disablePortraitForAliasGmMessage) {
      const userByAlias = game.users?.find((u) => {
        return (speakerInfo.alias === u.name || speakerInfo.author.name === u.name) && u?.isGM;
      });
      if (userByAlias) {
        doNotStyling = true;
      }
    }
    if (speakerInfo.alias == i18n("NT.Narrator")) {
      return html;
    }
    const isTurnAnnouncer = html.find(".message-content .turn-announcer .portrait")[0];
    if (isTurnAnnouncer) {
      const size = _ChatPortrait.settings.portraitSize;
      if (size && size > 0) {
        isTurnAnnouncer.style.width = size + "px";
        isTurnAnnouncer.style.height = size + "px";
        isTurnAnnouncer.style.flex = "0 0 " + size + "px";
      }
      doNotStyling = true;
    }
    const isMonkTokenBarXP = html.find(".message-content")[0]?.firstElementChild?.classList;
    if (isMonkTokenBarXP && isMonkTokenBarXP.length > 0) {
      if (isMonkTokenBarXP.contains("monks-tokenbar") && "assignxp") {
        doNotStyling = true;
      }
    }
    const isMonkLittleUtilitiesRoundUp = getProperty(chatMessage, `flags.monks-little-details.roundmarker`);
    if (String(isMonkLittleUtilitiesRoundUp) === "true") {
      doNotStyling = true;
    }
    const isMonkEnhancedJournal = getProperty(chatMessage, `flags.monks-enhanced-journal.action`);
    if (isMonkEnhancedJournal) {
      doOnlyPortrait = true;
    }
    const isChatImage = html.find(".message-content .chat-images-container img")[0];
    if (isChatImage) {
      isChatImage.style.width = "100%";
      isChatImage.style.height = "100%";
      doNotStyling = true;
    }
    const isInnocentiLoot = html.find(".message-content .innocenti-loot")[0];
    if (isInnocentiLoot) {
      doNotStyling = true;
    }
    const isMonkRoundup = html.find(".message-content .round-marker")[0];
    if (isMonkRoundup) {
      doNotStyling = true;
    }
    let hasBottom = false;
    let hasMiddle = false;
    if (html[0]?.classList.contains(`dfce-cm-top`))
      ;
    if (html[0]?.classList.contains(`dfce-cm-middle`)) {
      hasMiddle = true;
    }
    if (html[0]?.classList.contains(`dfce-cm-bottom`)) {
      hasBottom = true;
    }
    if (hasBottom || hasMiddle) {
      doNotPrintPortrait = true;
    }
    let messageSenderElement;
    let messageHeaderElementBase;
    let elementItemImageList;
    let elementItemNameList;
    let elementItemContentList;
    let elementItemTextList;
    messageSenderElement = html.find(".message-sender")[0];
    if (!messageSenderElement) {
      messageSenderElement = html.find(".chat-card")[0];
    }
    messageHeaderElementBase = html.find(".message-header")[0];
    if (!messageHeaderElementBase) {
      messageHeaderElementBase = html.find(".card-header")[0];
    }
    elementItemImageList = html.find(".message-content img");
    if (!elementItemImageList) {
      elementItemImageList = html.find(".card-content img");
    }
    elementItemNameList = html.find(".message-content h3");
    if (!elementItemNameList) {
      elementItemNameList = html.find(".card-content h3");
    }
    elementItemContentList = html.find(".message-content");
    if (!elementItemContentList) {
      elementItemContentList = html.find(".card-content");
    }
    elementItemTextList = html.find(".message-header .flavor-text");
    if (!elementItemTextList) {
      elementItemTextList = html.find(".card-header p");
    }
    if (!elementItemContentList[0]?.innerText) {
      return html;
    }
    if (!elementItemContentList[0]?.innerText.replace(/(\r\n|\r|\n)/g, "").trim()) {
      return html;
    }
    if (_ChatPortrait.settings.disableChatPortrait) {
      doNotPrintPortrait = true;
    }
    if (doNotStyling) {
      let authorColor = "black";
      if (speakerInfo.author) {
        authorColor = speakerInfo.author.color;
      } else {
        authorColor = speakerInfo?.user.color;
      }
      const messageData = speakerInfo.message;
      _ChatPortrait.setCustomStylingText(html, messageData, authorColor, gameSystemId);
      _ChatPortrait.setChatMessageBackground(html, messageData, authorColor);
      _ChatPortrait.setChatMessageBorder(html, messageData, authorColor);
      if (_ChatPortrait.settings.displayPlayerName) {
        _ChatPortrait.appendPlayerName(
          messageHeaderElementBase,
          messageSenderElement,
          speakerInfo.author,
          gameSystemId
        );
      }
      if (_ChatPortrait.settings.displayMessageTag) {
        _ChatPortrait.injectMessageTag(html, speakerInfo, messageHeaderElementBase, gameSystemId);
        _ChatPortrait.injectWhisperParticipants(html, speakerInfo, gameSystemId);
      }
      void 0; // [D35E] Token聚焦（ChatLink）已裁剪
      return html;
    } else {
      const myPromise = _ChatPortrait.onRenderChatMessageInternal(
        chatMessage,
        html,
        speakerInfo,
        messageSenderElement,
        messageHeaderElementBase,
        elementItemImageList,
        elementItemNameList,
        elementItemContentList,
        elementItemTextList,
        imageReplacer,
        gameSystemId,
        doNotPrintPortrait,
        doOnlyPortrait
      );
      if (myPromise) {
        myPromise.then((html2) => {
          return html2;
        });
      } else {
        return html;
      }
      return void 0;
    }
  }
  /**
   * @param  {ChatMessage} chatMessage
   * @param  {JQuery} html
   * @param  {MessageRenderData} messageData
   */
  static onRenderChatMessageInternal(chatMessage, html, speakerInfo, messageSender, messageHeaderBase, elementItemImageList, elementItemNameList, elementItemContentList, elementItemTextList, imageReplacer, gameSystemId, doNotPrintPortrait, doOnlyPortrait) {
    const messageDataBase = speakerInfo;
    let imgPath;
    let authorColor = "black";
    if (messageDataBase.author) {
      authorColor = messageDataBase.author.color;
    } else {
      authorColor = messageDataBase?.user.color;
    }
    let speaker;
    if (speakerInfo.message?.user) {
      speaker = speakerInfo;
    }
    if (!speaker && speakerInfo.message) {
      speaker = speakerInfo.message.speaker;
    }
    if (!speaker) {
      speaker = speakerInfo;
    }
    if (speaker && !speaker.alias && speaker.document?.alias) {
      speaker.alias = speaker.document?.alias;
    }
    const message = speaker ? speaker.message ? speaker.message : speaker.document : null;
    if (!message) {
      warn(
        'No message thi is usually a error from other modules like midi-qol, dnd5e helper, ecc you can try to use the "preCreateChatMessage" hook by enable the module setting'
      );
      return null;
    }
    const useTokenName = _ChatPortrait.settings.useTokenName;
    if (useTokenName) {
      _ChatPortrait.replaceSenderWithTokenName(messageSender, speaker);
    }
    if (_ChatPortrait.shouldOverrideMessageUnknown(messageDataBase)) {
      imgPath = CONSTANTS.DEF_TOKEN_IMG_PATH;
    } else {
      imgPath = _ChatPortrait.loadImagePathForChatMessage(speaker);
    }
    const chatPortraitCustomData = {
      customIconPortraitImage: imgPath,
      customImageReplacer: {},
      customImageReplacerData: API.imageReplacerIconizer
    };
    Hooks.call("ChatPortraitReplaceData", chatPortraitCustomData, chatMessage);
    if (chatPortraitCustomData.customIconPortraitImage) {
      imgPath = chatPortraitCustomData.customIconPortraitImage;
    }
    let imageReplacerToUse = [];
    if (!!chatPortraitCustomData.customImageReplacerData && typeof chatPortraitCustomData.customImageReplacerData == "object") {
      imageReplacerToUse = chatPortraitCustomData.customImageReplacerData;
    } else if (chatPortraitCustomData.customImageReplacer && !!chatPortraitCustomData.customImageReplacer && typeof chatPortraitCustomData.customImageReplacer == "object") {
      const imageReplacerToUseOLD = chatPortraitCustomData.customImageReplacer;
      for (const key in imageReplacerToUseOLD) {
        imageReplacerToUse.push({
          name: key,
          icon: imageReplacerToUseOLD[key]
        });
      }
    }
    return _ChatPortrait.generatePortraitImageElement(imgPath, gameSystemId).then((imgElement) => {
      if (!imgElement) {
        imgElement = document.createElement("img");
        imgElement.src = "";
        const size = _ChatPortrait.settings.portraitSize;
        if (size && size > 0) {
          imgElement.width = size;
          imgElement.height = size;
        }
        if (_ChatPortrait.settings.useAvatarImage) {
          imgElement.src = _ChatPortrait.getUserAvatarImageFromChatMessage(speaker);
        }
        if (!imgElement.src || imgElement.src.length <= 0) {
          imgElement.src = CONSTANTS.INV_UNIDENTIFIED_BOOK;
        }
        if (!imgElement.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
          imgElement.classList.add(`chat-portrait-message-portrait-${gameSystemId}`);
        }
      }
      const headerTextElement = messageHeaderBase;
      headerTextElement.prepend(imgElement);
      if (!headerTextElement.classList.contains(`chat-portrait-message-header-${gameSystemId}`)) {
        headerTextElement.classList.add(`chat-portrait-message-header-${gameSystemId}`);
      }
      const headerTextElement3 = document.createElement("h4");
      if (!headerTextElement3.classList.contains(`chat-portrait-text-content-name-${gameSystemId}`)) {
        headerTextElement3.classList.add(`chat-portrait-text-content-name-${gameSystemId}`);
      }
      if (!headerTextElement3.classList.contains(`chat-portrait-flexrow`)) {
        headerTextElement3.classList.add(`chat-portrait-flexrow`);
      }
      const messageContent = html.find(".message-content")[0];
      messageContent?.insertBefore(headerTextElement3, messageContent.firstChild);
      if (doOnlyPortrait) {
        return html;
      }
      const messageData = messageDataBase.message;
      const isRollTable = messageData.flags?.core?.RollTable ? true : false;
      let messageHtmlContent = void 0;
      try {
        messageHtmlContent = $(messageData.content);
      } catch (e) {
        messageHtmlContent = void 0;
      }
      const isEnhancedConditionsCUB = messageHtmlContent ? messageHtmlContent.hasClass("enhanced-conditions") : false;
      const isMidiDisplaySave = messageHtmlContent ? $(messageData.content).find(".midi-qol-saves-display")?.length > 0 : false;
      const isStarwarsffgDiceRoll = messageHtmlContent ? messageHtmlContent.hasClass("starwarsffg dice-roll") : false;
      const doNotPrependImage = isRollTable || isEnhancedConditionsCUB || isMidiDisplaySave || isStarwarsffgDiceRoll;
      const doNotImageReplacer = isMidiDisplaySave;
      if (doNotPrintPortrait) {
        imgElement.style.display = "none";
      }
      _ChatPortrait.setImageBorder(imgElement, authorColor);
      if (!messageSender.classList.contains(`chat-portrait-text-size-name-${gameSystemId}`)) {
        messageSender.classList.add(`chat-portrait-text-size-name-${gameSystemId}`);
        messageSender.style.alignSelf = "center";
      }
      if (_ChatPortrait.settings.textSizeName > 0) {
        const size = _ChatPortrait.settings.textSizeName;
        messageSender.style.fontSize = size + "px";
      }
      if (_ChatPortrait.settings.textSizeName > 0) {
        const size = _ChatPortrait.settings.textSizeName;
        headerTextElement.style.fontSize = size + "px";
      }
      void 0; // [D35E] Token聚焦（ChatLink）已裁剪
      if (elementItemImageList.length > 0 && _ChatPortrait.settings.portraitSizeItem != 36 && _ChatPortrait.settings.portraitSizeItem > 0) {
        for (let i = 0; i < elementItemImageList.length; i++) {
          const elementItemImage = elementItemImageList[i];
          if (!elementItemImage) {
            continue;
          }
          const size = _ChatPortrait.settings.portraitSizeItem;
          if (size && size > 0) {
            elementItemImage.width = size;
            elementItemImage.height = size;
          }
          if (!elementItemImage.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
            elementItemImage.classList.add(`chat-portrait-message-portrait-${gameSystemId}`);
          }
        }
      }
      if (elementItemNameList.length > 0) {
        for (let i = 0; i < elementItemNameList.length; i++) {
          const elementItemName = elementItemNameList[i];
          if (elementItemName) {
            if (!elementItemName.classList.contains(`chat-portrait-text-size-name-${gameSystemId}`)) {
              elementItemName.classList.add(`chat-portrait-text-size-name-${gameSystemId}`);
            }
            let value = "";
            let images = { iconMainReplacer: "", iconsDamageType: [] };
            if (_ChatPortrait.useImageReplacer(html)) {
              images = _ChatPortrait.getImagesReplacerAsset(
                imageReplacerToUse,
                elementItemName.innerText,
                elementItemContentList[i]
              );
              if (images && images.iconMainReplacer) {
                value = images.iconMainReplacer;
              }
            }
            if (value) {
              if (elementItemImageList.length > 0) {
                const elementItemImage = elementItemImageList[i];
                if (!elementItemImage) {
                  continue;
                }
                const size = _ChatPortrait.settings.portraitSizeItem;
                if (size && size > 0) {
                  elementItemImage.width = size;
                  elementItemImage.height = size;
                }
                if (value.length > 0 && !doNotImageReplacer) {
                  elementItemImage.src = value;
                }
                if (elementItemImage.classList.contains(
                  `chat-portrait-message-portrait-${gameSystemId}`
                )) {
                  elementItemImage.classList.remove(`chat-portrait-message-portrait-${gameSystemId}`);
                }
                if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                  if (
                    // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                    !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                    !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                  ) {
                    elementItemImage.classList.add(`chat-portrait-image-size-name-${gameSystemId}`);
                    elementItemName.prepend(elementItemImage);
                  }
                }
                if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                  const elementItemContainerDamageTypes = document.createElement("div");
                  for (const [index, itemImage] of images.iconsDamageType.entries()) {
                    const elementItemImage2 = document.createElement("img");
                    const size2 = _ChatPortrait.settings.portraitSizeItem;
                    if (size2 && size2 > 0) {
                      elementItemImage2.width = size2;
                      elementItemImage2.height = size2;
                    }
                    if (itemImage.length > 0) {
                      elementItemImage2.src = itemImage;
                    }
                    if (!elementItemImage2.classList.contains(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    )) {
                      elementItemImage2.classList.add(
                        `chat-portrait-message-portrait-${gameSystemId}`
                      );
                    }
                    elementItemContainerDamageTypes.appendChild(elementItemImage2);
                  }
                  elementItemName.parentNode?.insertBefore(
                    elementItemContainerDamageTypes,
                    elementItemName.nextSibling
                  );
                }
              } else {
                if (_ChatPortrait.useImageReplacer(html)) {
                  const elementItemImage = document.createElement("img");
                  const size = _ChatPortrait.settings.portraitSizeItem;
                  if (size && size > 0) {
                    elementItemImage.width = size;
                    elementItemImage.height = size;
                  }
                  if (value.length > 0 && !doNotImageReplacer) {
                    elementItemImage.src = value;
                  }
                  if (elementItemImage.classList.contains(
                    `chat-portrait-message-portrait-${gameSystemId}`
                  )) {
                    elementItemImage.classList.remove(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    );
                  }
                  if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                    if (
                      // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                      !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                      !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                    ) {
                      elementItemImage.classList.add(
                        `chat-portrait-image-size-name-${gameSystemId}`
                      );
                      elementItemName.prepend(elementItemImage);
                    }
                  }
                  if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                    const elementItemContainerDamageTypes = document.createElement("div");
                    for (const [index, itemImage] of images.iconsDamageType.entries()) {
                      const elementItemImage2 = document.createElement("img");
                      const size2 = _ChatPortrait.settings.portraitSizeItem;
                      if (size2 && size2 > 0) {
                        elementItemImage2.width = size2;
                        elementItemImage2.height = size2;
                      }
                      if (itemImage.length > 0) {
                        elementItemImage2.src = itemImage;
                      }
                      if (!elementItemImage2.classList.contains(
                        `chat-portrait-message-portrait-${gameSystemId}`
                      )) {
                        elementItemImage2.classList.add(
                          `chat-portrait-message-portrait-${gameSystemId}`
                        );
                      }
                      elementItemContainerDamageTypes.appendChild(elementItemImage2);
                    }
                    elementItemName.parentNode?.insertBefore(
                      elementItemContainerDamageTypes,
                      elementItemName.nextSibling
                    );
                  }
                }
              }
            } else {
              if (elementItemImageList.length > 0) {
                const elementItemImage = elementItemImageList[i];
                if (!elementItemImage) {
                  continue;
                }
                const size = _ChatPortrait.settings.portraitSizeItem;
                if (size && size > 0) {
                  elementItemImage.width = size;
                  elementItemImage.height = size;
                }
                if (!elementItemImage.src || elementItemImage.src?.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
                  elementItemImage.src = "";
                  if (messageHtmlContent) {
                    const itemName = messageHtmlContent.find(".item-name").length > 0 ? messageHtmlContent.find(".item-name")[0].textContent : "";
                    if (itemName) {
                      const actorIdMerchant = messageHtmlContent.attr("data-actor-id");
                      let item;
                      if (actorIdMerchant) {
                        item = game.actors?.get(actorIdMerchant)?.items?.find((myItem) => {
                          return myItem.name == itemName;
                        });
                      } else {
                        item = game.items?.find((myItem) => {
                          return myItem.name == itemName;
                        });
                      }
                      if (item?.img) {
                        elementItemImage.src = item.img;
                      }
                      if (!elementItemImage.src || elementItemImage.src?.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
                        elementItemImage.src = "";
                      }
                    }
                  }
                }
                if (elementItemImage.classList.contains(
                  `chat-portrait-message-portrait-${gameSystemId}`
                )) {
                  elementItemImage.classList.remove(`chat-portrait-message-portrait-${gameSystemId}`);
                }
                if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                  if (
                    // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                    !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                    !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                  ) {
                    elementItemImage.classList.add(`chat-portrait-image-size-name-${gameSystemId}`);
                    elementItemName.prepend(elementItemImage);
                  }
                }
                if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                  const elementItemContainerDamageTypes = document.createElement("div");
                  for (const [index, itemImage] of images.iconsDamageType.entries()) {
                    const elementItemImage2 = document.createElement("img");
                    const size2 = _ChatPortrait.settings.portraitSizeItem;
                    if (size2 && size2 > 0) {
                      elementItemImage2.width = size2;
                      elementItemImage2.height = size2;
                    }
                    if (itemImage.length > 0) {
                      elementItemImage2.src = itemImage;
                    }
                    if (!elementItemImage2.classList.contains(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    )) {
                      elementItemImage2.classList.add(
                        `chat-portrait-message-portrait-${gameSystemId}`
                      );
                    }
                    elementItemContainerDamageTypes.appendChild(elementItemImage2);
                  }
                  elementItemName.parentNode?.insertBefore(
                    elementItemContainerDamageTypes,
                    elementItemName.nextSibling
                  );
                }
              } else {
                if (_ChatPortrait.useImageReplacer(html)) {
                  const elementItemImage = document.createElement("img");
                  const size = _ChatPortrait.settings.portraitSizeItem;
                  if (size && size > 0) {
                    elementItemImage.width = size;
                    elementItemImage.height = size;
                  }
                  if (!doNotImageReplacer && (!elementItemImage.src || elementItemImage.src?.includes(CONSTANTS.DEF_TOKEN_IMG_NAME))) {
                    elementItemImage.src = "";
                    if (messageHtmlContent) {
                      const itemName = messageHtmlContent.find(".item-name").length > 0 ? messageHtmlContent.find(".item-name")[0].textContent : "";
                      if (itemName) {
                        const actorIdMerchant = messageHtmlContent.attr("data-actor-id");
                        let item;
                        if (actorIdMerchant) {
                          item = game.actors?.get(actorIdMerchant)?.items?.find((myItem) => {
                            return myItem.name == itemName;
                          });
                        } else {
                          item = game.items?.find((myItem) => {
                            return myItem.name == itemName;
                          });
                        }
                        if (item?.img) {
                          elementItemImage.src = item.img;
                        }
                        if (!elementItemImage.src || elementItemImage.src?.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
                          elementItemImage.src = "";
                        }
                      }
                    }
                  }
                  if (elementItemImage.classList.contains(
                    `chat-portrait-message-portrait-${gameSystemId}`
                  )) {
                    elementItemImage.classList.remove(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    );
                  }
                  if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                    if (
                      // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                      !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                      !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                    ) {
                      elementItemImage.classList.add(
                        `chat-portrait-image-size-name-${gameSystemId}`
                      );
                      elementItemName.prepend(elementItemImage);
                    }
                  }
                  if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                    const elementItemContainerDamageTypes = document.createElement("div");
                    for (const [index, itemImage] of images.iconsDamageType.entries()) {
                      const elementItemImage2 = document.createElement("img");
                      const size2 = _ChatPortrait.settings.portraitSizeItem;
                      if (size2 && size2 > 0) {
                        elementItemImage2.width = size2;
                        elementItemImage2.height = size2;
                      }
                      if (itemImage.length > 0) {
                        elementItemImage2.src = itemImage;
                      }
                      if (!elementItemImage2.classList.contains(
                        `chat-portrait-message-portrait-${gameSystemId}`
                      )) {
                        elementItemImage2.classList.add(
                          `chat-portrait-message-portrait-${gameSystemId}`
                        );
                      }
                      elementItemContainerDamageTypes.appendChild(elementItemImage2);
                    }
                    elementItemName.parentNode?.insertBefore(
                      elementItemContainerDamageTypes,
                      elementItemName.nextSibling
                    );
                  }
                }
              }
            }
          }
        }
      } else {
        for (let i = 0; i < elementItemTextList.length; i++) {
          const elementItemText = elementItemTextList[i];
          if (!elementItemText.classList.contains(`chat-portrait-text-size-name-${gameSystemId}`)) {
            elementItemText.classList.add(`chat-portrait-text-size-name-${gameSystemId}`);
          }
          let value = "";
          let images = { iconMainReplacer: "", iconsDamageType: [] };
          if (_ChatPortrait.useImageReplacer(html)) {
            images = _ChatPortrait.getImagesReplacerAsset(
              imageReplacerToUse,
              elementItemText.innerText,
              elementItemContentList[i]
            );
            if (images && images.iconMainReplacer) {
              value = images.iconMainReplacer;
            }
          }
          if (value) {
            if (elementItemImageList.length > 0) {
              const elementItemImage = elementItemImageList[i];
              if (!elementItemImage) {
                continue;
              }
              const size = _ChatPortrait.settings.portraitSizeItem;
              if (size && size > 0) {
                elementItemImage.width = size;
                elementItemImage.height = size;
              }
              if (value.length > 0 && !doNotImageReplacer) {
                elementItemImage.src = value;
              }
              if (elementItemImage.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
                elementItemImage.classList.remove(`chat-portrait-message-portrait-${gameSystemId}`);
              }
              if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                if (
                  // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                  !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                  !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                ) {
                  elementItemImage.classList.add(`chat-portrait-image-size-name-${gameSystemId}`);
                  elementItemText.prepend(elementItemImage);
                }
              }
              if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                const elementItemContainerDamageTypes = document.createElement("div");
                for (const [index, itemImage] of images.iconsDamageType.entries()) {
                  const elementItemImage2 = document.createElement("img");
                  const size2 = _ChatPortrait.settings.portraitSizeItem;
                  if (size2 && size2 > 0) {
                    elementItemImage2.width = size2;
                    elementItemImage2.height = size2;
                  }
                  if (itemImage.length > 0) {
                    elementItemImage2.src = itemImage;
                  }
                  if (!elementItemImage2.classList.contains(
                    `chat-portrait-message-portrait-${gameSystemId}`
                  )) {
                    elementItemImage2.classList.add(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    );
                  }
                  elementItemContainerDamageTypes.appendChild(elementItemImage2);
                }
                elementItemText.parentNode?.insertBefore(
                  elementItemContainerDamageTypes,
                  elementItemText.nextSibling
                );
              }
            } else {
              if (_ChatPortrait.useImageReplacer(html)) {
                const elementItemImage = document.createElement("img");
                const size = _ChatPortrait.settings.portraitSizeItem;
                if (size && size > 0) {
                  elementItemImage.width = size;
                  elementItemImage.height = size;
                }
                if (value.length > 0 && !doNotImageReplacer) {
                  elementItemImage.src = value;
                }
                if (elementItemImage.classList.contains(
                  `chat-portrait-message-portrait-${gameSystemId}`
                )) {
                  elementItemImage.classList.remove(`chat-portrait-message-portrait-${gameSystemId}`);
                }
                if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                  if (
                    // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                    !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                    !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                  ) {
                    elementItemImage.classList.add(`chat-portrait-image-size-name-${gameSystemId}`);
                    elementItemText.prepend(elementItemImage);
                  }
                }
                if (images && images.iconsDamageType.length > 0 && _ChatPortrait.settings.useImageReplacerDamageType) {
                  const elementItemContainerDamageTypes = document.createElement("div");
                  for (const [index, itemImage] of images.iconsDamageType.entries()) {
                    const elementItemImage2 = document.createElement("img");
                    const size2 = _ChatPortrait.settings.portraitSizeItem;
                    if (size2 && size2 > 0) {
                      elementItemImage2.width = size2;
                      elementItemImage2.height = size2;
                    }
                    if (itemImage.length > 0) {
                      elementItemImage2.src = itemImage;
                    }
                    if (!elementItemImage2.classList.contains(
                      `chat-portrait-message-portrait-${gameSystemId}`
                    )) {
                      elementItemImage2.classList.add(
                        `chat-portrait-message-portrait-${gameSystemId}`
                      );
                    }
                    elementItemContainerDamageTypes.appendChild(elementItemImage2);
                  }
                  elementItemText.parentNode?.insertBefore(
                    elementItemContainerDamageTypes,
                    elementItemText.nextSibling
                  );
                }
              }
            }
          } else {
            if (elementItemImageList.length > 0) {
              const elementItemImage = elementItemImageList[i];
              if (!elementItemImage) {
                continue;
              }
              const size = _ChatPortrait.settings.portraitSizeItem;
              if (size && size > 0) {
                elementItemImage.width = size;
                elementItemImage.height = size;
              }
              if (elementItemImage.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
                elementItemImage.classList.remove(`chat-portrait-message-portrait-${gameSystemId}`);
              }
              if (!doNotImageReplacer && !doNotPrependImage && !elementItemImage.src.endsWith("/game")) {
                if (
                  // PATCH FOR MONK JOURNAL https://github.com/p4535992/foundryvtt-chat-portrait/issues/16
                  !elementItemImage.classList.contains(`chat-actor-icon`) && // PATCH FOR PF2E DAMAGE https://github.com/p4535992/foundryvtt-chat-portrait/issues/15
                  !(game.system.id === "pf2e" && messageContent.querySelectorAll(".damage-application")?.length > 0)
                ) {
                  elementItemImage.classList.add(`chat-portrait-image-size-name-${gameSystemId}`);
                  elementItemText.prepend(elementItemImage);
                }
              }
            } else {
              if (_ChatPortrait.useImageReplacer(html))
                ;
            }
          }
        }
      }
      _ChatPortrait.setCustomStylingText(html, messageData, authorColor, gameSystemId);
      _ChatPortrait.setChatMessageBackground(html, messageData, authorColor);
      _ChatPortrait.setChatMessageBorder(html, messageData, authorColor);
      if (_ChatPortrait.settings.displayPlayerName) {
        _ChatPortrait.appendPlayerName(headerTextElement3, messageSender, speaker.author, gameSystemId);
      }
      if (_ChatPortrait.settings.displayMessageTag) {
        _ChatPortrait.injectMessageTag(html, messageData, headerTextElement3, gameSystemId);
        _ChatPortrait.injectWhisperParticipants(html, messageData, gameSystemId);
      }
      void 0; // [D35E] Token聚焦（ChatLink）已裁剪
      return html;
    });
  }
  /**
   * Load the appropriate actor image path for a given message, leveraging token or actor or actor search.
   * @param  {{scene?:string;actor?:string;token?:string;alias?:string;}} speaker
   * @returns string
   */
  static loadImagePathForChatMessage(speakerInfo) {
    const message = speakerInfo.message ? speakerInfo.message : speakerInfo.document ? speakerInfo.document : speakerInfo;
    const speaker = message.speaker ? message.speaker : speakerInfo;
    const isOOC = _ChatPortrait.getMessageTypeVisible(speakerInfo) === CONST.CHAT_MESSAGE_TYPES.OOC;
    const imgFinal = CONSTANTS.DEF_TOKEN_IMG_PATH;
    const flaggedPreChatSrc = message.flags?.[CONSTANTS.MODULE_ID]?.src;
    if (flaggedPreChatSrc) {
      if (message.user && isOOC) {
        const imgAvatar = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
        if (imgAvatar && !imgAvatar.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          return imgAvatar;
        } else {
          warn(
            `No specific avatar player image found it for player "'${_ChatPortrait.getUserNameFromChatMessage(
              message
            )}'"`
          );
          return imgAvatar ? imgAvatar : imgFinal;
        }
      } else {
        return flaggedPreChatSrc;
      }
    }
    if (!_ChatPortrait.settings.disablePortraitForAliasGmMessage && _ChatPortrait.settings.setUpPortraitForAliasGmMessage?.length > 0) {
      const userByAlias = game.users?.find((u) => {
        return (speakerInfo.alias === u.name || speakerInfo.author.name === u.name) && u?.isGM;
      });
      if (userByAlias) {
        return _ChatPortrait.settings.setUpPortraitForAliasGmMessage;
      }
    }
    if (message.user && isOOC) {
      const imgAvatar = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
      if (imgAvatar && !imgAvatar.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgAvatar;
      } else {
        warn(
          'No specific avatar player image found it for player "' + _ChatPortrait.getUserNameFromChatMessage(message) + '"'
        );
        return imgAvatar ? imgAvatar : imgFinal;
      }
    }
    if (speaker) {
      if (!speaker.token && !speaker.actor || _ChatPortrait.settings.useAvatarImage) {
        if (message.user && _ChatPortrait.settings.useAvatarImage && !_ChatPortrait.isSpeakerGM(message)) {
          const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
          if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
            return imgAvatar2;
          } else {
            warn(
              'No specific avatar player image found it for player "' + _ChatPortrait.getUserNameFromChatMessage(message) + '"'
            );
            return imgAvatar2 ? imgAvatar2 : imgFinal;
          }
        } else if (!speaker.token && !speaker.actor) {
          if (message.user && _ChatPortrait.settings.useAvatarImage) {
            const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
            if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
              return imgAvatar2;
            }
          } else {
            return imgFinal;
          }
        }
      }
      let useTokenImage = _ChatPortrait.settings.useTokenImage;
      const actor = _ChatPortrait.getActorFromSpeaker(speaker);
      const doNotUseTokenImageWithSpecificType = _ChatPortrait.settings.doNotUseTokenImageWithSpecificType ? String(_ChatPortrait.settings.doNotUseTokenImageWithSpecificType).split(",") : [];
      if (doNotUseTokenImageWithSpecificType.length > 0 && doNotUseTokenImageWithSpecificType.includes(actor?.type)) {
        useTokenImage = false;
      }
      if (actor?.type == "character" && _ChatPortrait.settings.useAvatarImage && !_ChatPortrait.isSpeakerGM(message)) {
        const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
        if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          return imgAvatar2;
        }
      }
      let tokenDocumentData;
      if (speaker.token) {
        let tokenDocument = _ChatPortrait.getTokenFromSpeaker(speaker);
        if (!tokenDocument) {
          try {
            tokenDocument = canvas?.tokens?.getDocuments().find((token) => token.id === speaker.token);
          } catch (e) {
          }
          if (!tokenDocument) {
            tokenDocumentData = game.scenes?.get(speaker.scene)?.tokens?.find((t) => t.id === speaker.token);
          } else {
            tokenDocumentData = tokenDocument;
          }
        } else {
          tokenDocumentData = tokenDocument;
        }
        let imgToken = "";
        if (tokenDocumentData) {
          if (useTokenImage) {
            if (tokenDocumentData?.randomImg) {
              if (tokenDocumentData?.texture?.src) {
                imgToken = tokenDocumentData.texture.src;
              } else {
                imgToken = CONSTANTS.DEF_TOKEN_IMG_PATH;
              }
            }
            if (tokenDocumentData?.texture?.src) {
              imgToken = tokenDocumentData.texture.src;
            }
            if ((!imgToken || _ChatPortrait.isWildcardImage(imgToken)) && tokenDocumentData?.img) {
              imgToken = tokenDocumentData?.texture.src;
            }
          } else {
            if (tokenDocumentData?.delta?.img) {
              imgToken = tokenDocumentData.delta.img;
            }
            if ((!imgToken || _ChatPortrait.isWildcardImage(imgToken)) && //@ts-ignore
            tokenDocumentData?.delta?.img) {
              imgToken = tokenDocumentData?.delta.img;
            }
            if (tokenDocumentData?.actor?.img) {
              imgToken = tokenDocumentData.actor.img;
            }
            if ((!imgToken || _ChatPortrait.isWildcardImage(imgToken)) && //@ts-ignore
            tokenDocumentData?.actor?.img) {
              imgToken = tokenDocumentData?.actor.img;
            }
          }
          if (imgToken && !_ChatPortrait.isWildcardImage(imgToken) && !imgToken.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
            return imgToken;
          }
        }
      }
      let imgActor = "";
      if (actor) {
        if ((!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) && useTokenImage) {
          imgActor = actor?.token?.texture.src;
          if (imgActor && _ChatPortrait.isWildcardImage(imgActor)) {
            imgActor = "";
          }
        }
        if ((!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) && useTokenImage) {
          imgActor = actor?.token?.texture.src;
          if (imgActor && _ChatPortrait.isWildcardImage(imgActor)) {
            imgActor = "";
          }
        }
        if (!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          imgActor = actor.img;
        }
        if (imgActor && !imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          return imgActor;
        }
      }
      const imgAvatar = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
      if (imgAvatar && !imgAvatar.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgAvatar;
      } else {
        return imgAvatar ? imgAvatar : CONSTANTS.INV_UNIDENTIFIED_BOOK;
      }
    } else if (message && message.user) {
      const imgAvatar = _ChatPortrait.getUserAvatarImageFromChatMessage(message);
      if (imgAvatar && !imgAvatar.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgAvatar;
      } else {
        warn(
          "No specific avatar player image found it for player '" + _ChatPortrait.getUserNameFromChatMessage(message) + "'"
        );
        return imgAvatar ? imgAvatar : imgFinal;
      }
    } else {
      return imgFinal;
    }
  }
  /**
   * Generate portrait HTML Image Element to insert into chat messages.
   * @param  {string} imgPath
   * @returns HTMLImageElement
   */
  static async generatePortraitImageElement(imgPath, gameSystemId) {
    if (!imgPath) {
      return;
    }
    const img = document.createElement("img");
    img.src = "";
    const size = _ChatPortrait.settings.portraitSize;
    if (imgPath.includes(".webm") || _ChatPortrait.isVideo(imgPath)) {
      try {
        const video = _ChatPortrait.createVideoElement(imgPath);
        if (!video) {
          const imgThumb = size && size > 0 ? await ImageHelper.createThumbnail(imgPath, { width: size, height: size }) : await ImageHelper.createThumbnail(imgPath);
          if (imgPath.includes(".webm")) {
            img.src = imgThumb.thumb;
            if (size && size > 0) {
              img.width = size;
              img.height = size;
            }
          } else {
            img.src = imgThumb.src;
            if (size && size > 0) {
              img.width = size;
              img.height = size;
            }
          }
        } else {
          if (size && size > 0) {
            video.width = size;
            video.height = size;
          }
          if (!video.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
            video.classList.add(`chat-portrait-message-portrait-${gameSystemId}`);
          }
          return video;
        }
      } catch {
        img.src = imgPath;
        if (size && size > 0) {
          img.width = size;
          img.height = size;
        }
      }
    } else {
      img.src = imgPath;
      if (size && size > 0) {
        img.width = size;
        img.height = size;
      }
    }
    if (!img.classList.contains(`chat-portrait-message-portrait-${gameSystemId}`)) {
      img.classList.add(`chat-portrait-message-portrait-${gameSystemId}`);
    }
    return img;
  }
  /**
   * Set portrait image border shape
   * @param  {HTMLImageElement} img
   * @param  {string} authorColor
   */
  static setImageBorder(img, authorColor) {
    const borderShape = _ChatPortrait.settings.borderShape;
    const borderWidth = _ChatPortrait.settings.borderWidth;
    const borderColor = _ChatPortrait.settings.useUserColorAsBorderColor ? authorColor : _ChatPortrait.settings.borderColor;
    switch (borderShape) {
      case "square":
        img.style.border = `${borderWidth}px solid ${borderColor}`;
        break;
      case "circle":
        img.style.border = `${borderWidth}px solid ${borderColor}`;
        img.style.borderRadius = "50%";
        break;
      case "none":
        img.style.border = "none";
        break;
    }
  }
  static setCustomStylingText(html, messageData, authorColor, gameSystemId) {
    const elementItemTextList = html.find(`.chat-portrait-text-size-name-${gameSystemId}`);
    for (let i = 0; i < elementItemTextList.length; i++) {
      const elementItemText = elementItemTextList[i];
      if (elementItemText) {
        if (_ChatPortrait.settings.customStylingMessageText) {
          elementItemText.style.cssText = _ChatPortrait.settings.customStylingMessageText;
        }
      }
    }
    const elementItemImageList = html.find(`.chat-portrait-image-size-name-${gameSystemId}`);
    for (let i = 0; i < elementItemImageList.length; i++) {
      const elementItemImage = elementItemTextList[i];
      if (elementItemImage) {
        if (_ChatPortrait.settings.customStylingMessageImage) {
          elementItemImage.style.cssText = _ChatPortrait.settings.customStylingMessageImage;
        }
      }
    }
  }
  /**
   * Set the background color of the entire message to be the color for the author.
   * Only do so if
   *  - chatBackgroundColor setting is true AND
   * @param  {JQuery} html
   * @param  {MessageRenderData} messageData
   * @param  {string} authorColor
   */
  static setChatMessageBackground(html, messageData, authorColor) {
    const useUserBackgroundColor = _ChatPortrait.settings.useUserColorAsChatBackgroundColor;
    if (useUserBackgroundColor) {
      // [D35E] 双层背景：半透明玩家颜色层（完全覆盖元素、无平铺边缘缝隙）+ 羊皮纸材质透出纹理
      //（与系统 whisper 消息的 linear-gradient + 材质 双层做法一致；浓度 0.25 可调）
      const { r, g, b } = _ChatPortrait.hexToRgb(authorColor);
      html[0].style.backgroundImage = `linear-gradient(rgba(${r}, ${g}, ${b}, 0.25), rgba(${r}, ${g}, ${b}, 0.25)), url("systems/D35E/icons/ui/parchment-tile.png")`;
      html[0].style.backgroundSize = "288px";
      html[0].style.backgroundPositionY = "40px";
    }
  }
  /** [D35E] 十六进制颜色 → {r,g,b}（染色淡色用） */
  static hexToRgb(hex) {
    let h = String(hex ?? "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  /**
   * Set the border color of the entire message to be the color for the author.
   * Only do so if
   *  - chatBorderColor setting is true AND
   *  - someone further up the chain hasn't already changed the color
   * @param  {JQuery} html
   * @param  {MessageRenderData} messageData
   * @param  {string} authorColor
   */
  static setChatMessageBorder(html, messageData, authorColor) {
    const useUserBorderColor = _ChatPortrait.settings.useUserColorAsChatBorderColor;
    if (useUserBorderColor && !messageData.borderColor) {
      html[0].style.borderColor = authorColor;
      messageData.borderColor = authorColor;
    }
  }
  static get settings() {
    return {
      //borderShapeList: Settings.getBorderShapeList(),
      disableChatPortrait: SettingsForm.getDisableChatPortrait(),
      useTokenImage: SettingsForm.getUseTokenImage(),
      doNotUseTokenImageWithSpecificType: SettingsForm.getDoNotUseTokenImageWithSpecificType(),
      useTokenName: SettingsForm.getUseTokenName(),
      portraitSize: SettingsForm.getPortraitSize(),
      portraitSizeItem: SettingsForm.getPortraitSizeItem(),
      borderShape: SettingsForm.getBorderShape(),
      useUserColorAsBorderColor: SettingsForm.getUseUserColorAsBorderColor(),
      borderColor: SettingsForm.getBorderColor(),
      borderWidth: SettingsForm.getBorderWidth(),
      useUserColorAsChatBackgroundColor: SettingsForm.getUseUserColorAsChatBackgroundColor(),
      useUserColorAsChatBorderColor: SettingsForm.getUseUserColorAsChatBorderColor(),
      // flavorNextToPortrait: SettingsForm.getFlavorNextToPortrait(),
      forceNameSearch: SettingsForm.getForceNameSearch(),
      // hoverTooltip: SettingsForm.getHoverTooltip(),
      textSizeName: SettingsForm.getTextSizeName(),
      displaySetting: SettingsForm.getDisplaySetting(),
      useAvatarImage: SettingsForm.getUseAvatarImage(),
      displayPlayerName: SettingsForm.getDisplayPlayerName(),
      // displayUnknown: SettingsForm.getDisplayUnknown(),
      // displayUnknownPlaceHolderActorName: SettingsForm.getDisplayUnknownPlaceHolderActorName(),
      // displayUnknownPlaceHolderItemName: SettingsForm.getDisplayUnknownPlaceHolderItemName(),
      // displayUnknownPlaceHolderItemIcon: SettingsForm.getDisplayUnknownPlaceHolderItemIcon(),
      displaySettingOTHER: SettingsForm.getDisplaySettingOTHER(),
      displaySettingOOC: SettingsForm.getDisplaySettingOOC(),
      displaySettingIC: SettingsForm.getDisplaySettingIC(),
      displaySettingEMOTE: SettingsForm.getDisplaySettingEMOTE(),
      displaySettingWHISPER: SettingsForm.getDisplaySettingWHISPER(),
      displaySettingROLL: SettingsForm.getDisplaySettingROLL(),
      displaySettingWhisperToOther: SettingsForm.getDisplaySettingWhisperToOther(),
      // customStylingMessageSystem: SettingsForm.getCustomStylingMessageSystem(),
      customStylingMessageText: SettingsForm.getCustomStylingMessageText(),
      customStylingMessageImage: SettingsForm.getCustomStylingMessageImage(),
      displayMessageTag: SettingsForm.getDisplayMessageTag(),
      // displayMessageTagNextToName: SettingsForm.getDisplayMessageTagNextToName(),
      useImageReplacer: SettingsForm.getUseImageReplacer(),
      useImageReplacerDamageType: SettingsForm.getUseImageReplacerDamageType(),
      applyOnCombatTracker: SettingsForm.getApplyOnCombatTracker(),
      // applyPreCreateChatMessagePatch: SettingsForm.getApplyPreCreateChatMessagePatch(),
      disablePortraitForAliasGmMessage: SettingsForm.getDisablePortraitForAliasGmMessage(),
      setUpPortraitForAliasGmMessage: SettingsForm.getSetUpPortraitForAliasGmMessage()
    };
  }
  /**
   * Get default settings object.
   * @returns ChatPortraitSetting
   */
  static get defaultSettings() {
    return {
      useTokenImage: false,
      doNotUseTokenImageWithSpecificType: "",
      useTokenName: false,
      portraitSize: 36,
      portraitSizeItem: 36,
      borderShape: "square",
      useUserColorAsBorderColor: true,
      borderColor: "#000000",
      borderWidth: 2,
      useUserColorAsChatBackgroundColor: false,
      useUserColorAsChatBorderColor: false,
      // flavorNextToPortrait: false,
      forceNameSearch: false,
      // hoverTooltip: false,
      textSizeName: 0,
      displaySetting: "allCards",
      useAvatarImage: false,
      displayPlayerName: false,
      //   displayUnknown: "none",
      //   displayUnknownPlaceHolderActorName: "Unknown Actor",
      //   displayUnknownPlaceHolderItemName: "Unknown Item",
      //   displayUnknownPlaceHolderItemIcon: `modules/${CONSTANTS.MODULE_ID}/assets/inv-unidentified.png`,
      displaySettingOTHER: true,
      displaySettingOOC: true,
      displaySettingIC: true,
      displaySettingEMOTE: true,
      displaySettingWHISPER: true,
      displaySettingROLL: true,
      displaySettingWhisperToOther: false,
      // customStylingMessageSystem: false,
      customStylingMessageText: "",
      customStylingMessageImage: "",
      displayMessageTag: false,
      // displayMessageTagNextToName: false,
      useImageReplacer: true,
      useImageReplacerDamageType: true,
      applyOnCombatTracker: false,
      // applyPreCreateChatMessagePatch: false,
      disablePortraitForAliasGmMessage: false,
      setUpPortraitForAliasGmMessage: ""
    };
  }
  // static getSpeakerImage = function (message, useTokenImage):string {
  //   const speaker = message.speaker;
  //   if (speaker) {
  //       if (speaker.token && useTokenImage) {
  //           const token = canvas?.tokens?.getDocuments().get(speaker.token);
  //           if (token) {
  //               return token.texture.src;
  //           }
  //       }
  //       if (speaker.actor && !useTokenImage) {
  //           const actor = Actors.instance.get(speaker.actor);
  //           if (actor) {
  //             return actor.img;
  //           }
  //       }
  //   }
  //   return "icons/svg/mystery-man.svg";
  // }
  // static showSpeakerImage = function (message, useTokenImage):boolean {
  //   const speaker = message.speaker;
  //   if (!speaker) {
  //       return false;
  //   } else {
  //     let bHasImage = false;
  //     if (speaker.token && useTokenImage) {
  //         const token = canvas?.tokens?.getDocuments().get(speaker.token);
  //         if (token) {
  //             bHasImage = bHasImage || token.texture.src != null;
  //         }
  //     }
  //     if (speaker.actor) {
  //         const actor = Actors.instance.get(speaker.actor);
  //         if (actor) {
  //             bHasImage = bHasImage || actor.img != null;
  //         }
  //     }
  //     if (!bHasImage) {
  //         return false;
  //     }else{
  //       return true;
  //     }
  //   }
  // }
  static getActorFromSpeaker(speaker) {
    let actor = game.actors?.get(speaker.actor);
    if (!actor) {
      actor = game.actors?.tokens[speaker.token];
    }
    if (!actor) {
      actor = Actors.instance.get(speaker.actor);
    }
    const forceNameSearch = _ChatPortrait.settings.forceNameSearch;
    if (!actor && forceNameSearch) {
      actor = game.actors?.find((a) => a.token?.name === speaker.alias);
    }
    return actor;
  }
  static getActorFromActorID(actorID, tokenID) {
    let actor = game.actors?.get(actorID);
    if (!actor) {
      actor = game.actors?.tokens[tokenID];
    }
    if (!actor) {
      actor = Actors.instance.get(actorID);
    }
    return actor;
  }
  static getImagesReplacerAsset(imageReplacer, innerText, elementItemContent) {
    const value = new ImageReplacerData();
    let innerTextTmp = innerText;
    const textToCheck = $(elementItemContent)[0]?.innerText || "";
    const fullTextContent = textToCheck.toLowerCase().trim();
    const check2 = i18n(`${CONSTANTS.MODULE_ID}.labels.check`);
    const ability = i18n(`${CONSTANTS.MODULE_ID}.labels.ability`);
    const skill = i18n(`${CONSTANTS.MODULE_ID}.labels.skill`);
    const checkEN = i18n(`${CONSTANTS.MODULE_ID}.labels.checkEN`);
    const abilityEN = i18n(`${CONSTANTS.MODULE_ID}.labels.abilityEN`);
    const skillEN = i18n(`${CONSTANTS.MODULE_ID}.labels.skillEN`);
    const innerTextDamageTmp = fullTextContent;
    if (innerTextTmp) {
      innerTextTmp = innerTextTmp.toLowerCase().trim();
      const arr1 = innerTextTmp.split(/\r?\n/);
      for (let i = 0; i < arr1.length; i++) {
        let text2 = arr1[i];
        if (text2) {
          if (text2.indexOf(check2) !== -1 || text2.indexOf(ability) !== -1 || text2.indexOf(skill) !== -1 || text2.indexOf(checkEN) !== -1 || text2.indexOf(abilityEN) !== -1 || text2.indexOf(skillEN) !== -1)
            ;
          else {
            continue;
          }
          text2 = text2.replace(/\W/g, " ");
          text2 = text2.replace(skill, "");
          text2 = text2.replace(check2, "");
          text2 = text2.replace(ability, "");
          text2 = text2.replace(skillEN, "");
          text2 = text2.replace(checkEN, "");
          text2 = text2.replace(abilityEN, "");
          text2 = text2.replace(/[0-9]/g, "");
          text2 = text2.toLowerCase().trim();
          for (const objKey in imageReplacer) {
            const obj = imageReplacer[objKey];
            if (obj) {
              const key = obj.name;
              const mykeyvalue = i18n(key);
              if (mykeyvalue) {
                let keyValue = mykeyvalue;
                if (keyValue) {
                  keyValue = keyValue.replace(/\W/g, " ");
                  keyValue = keyValue.replace(skill, "");
                  keyValue = keyValue.replace(check2, "");
                  keyValue = keyValue.replace(ability, "");
                  keyValue = keyValue.replace(skillEN, "");
                  keyValue = keyValue.replace(checkEN, "");
                  keyValue = keyValue.replace(abilityEN, "");
                  keyValue = keyValue.replace(/[0-9]/g, "");
                  keyValue = keyValue.toLowerCase().trim();
                  if (text2.trim().indexOf(i18n(keyValue).toLowerCase()) !== -1) {
                    value.iconMainReplacer = obj.icon;
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
    if (_ChatPortrait.settings.useImageReplacerDamageType && innerTextDamageTmp) {
      const damageTypes = [];
      const arr4 = innerTextDamageTmp.split(/\r?\n/);
      for (let i = 0; i < arr4.length; i++) {
        let textDamage = arr4[i];
        if (textDamage) {
          textDamage = textDamage.replace(/\W/g, " ");
          textDamage = textDamage.replace(skill, "");
          textDamage = textDamage.replace(check2, "");
          textDamage = textDamage.replace(ability, "");
          textDamage = textDamage.replace(skillEN, "");
          textDamage = textDamage.replace(checkEN, "");
          textDamage = textDamage.replace(abilityEN, "");
          textDamage = textDamage.replace(/[0-9]/g, "");
          textDamage = textDamage.toLowerCase().trim();
          for (const keydamageObjeKey in API.imageReplacerDamageType) {
            const keydamageObj = API.imageReplacerDamageType[keydamageObjeKey];
            const keydamage = keydamageObj.name;
            const mykeydamagevalue = i18n(keydamage);
            if (mykeydamagevalue) {
              let damageValue = mykeydamagevalue;
              if (damageValue) {
                damageValue = damageValue.replace(/\W/g, " ");
                damageValue = damageValue.replace(skill, "");
                damageValue = damageValue.replace(check2, "");
                damageValue = damageValue.replace(ability, "");
                damageValue = damageValue.replace(skillEN, "");
                damageValue = damageValue.replace(checkEN, "");
                damageValue = damageValue.replace(abilityEN, "");
                damageValue = damageValue.replace(/[0-9]/g, "");
                damageValue = damageValue.toLowerCase().trim();
                damageValue = " " + damageValue;
                if (textDamage.trim().indexOf(i18n(damageValue).toLowerCase()) !== -1) {
                  const srcdamageType = keydamageObj.icon;
                  damageTypes.push(srcdamageType);
                }
              }
            }
          }
        }
        value.iconsDamageType = damageTypes;
      }
    }
    return value;
  }
  static useImageReplacer(html) {
    if (_ChatPortrait.settings.useImageReplacer) {
      return true;
    }
    return false;
  }
  static injectMessageTag(html, messageData, messageElement, gameSystemId) {
    const indicatorElement = document.createElement("span");
    if (!indicatorElement.classList.contains(`chat-portrait-indicator-${gameSystemId}`)) {
      indicatorElement.classList.add(`chat-portrait-indicator-${gameSystemId}`);
    }
    const whisperTargets = messageData.whisper;
    const isBlind = messageData.blind || false;
    const isWhisper = whisperTargets?.length > 0 || false;
    const isSelf = isWhisper && whisperTargets.length === 1 && whisperTargets[0] === messageData.user;
    const isRoll = messageData.rolls !== void 0;
    if (isBlind) {
      indicatorElement.innerText = game.i18n.localize("CHAT.RollBlind");
      messageElement.appendChild(indicatorElement);
    } else if (isSelf && whisperTargets[0]) {
      indicatorElement.innerText = game.i18n.localize("CHAT.RollSelf");
      messageElement.appendChild(indicatorElement);
    } else if (isRoll && isWhisper) {
      indicatorElement.innerText = game.i18n.localize("CHAT.RollPrivate");
      messageElement.appendChild(indicatorElement);
    } else if (isWhisper) {
      indicatorElement.innerText = game.i18n.localize("chat-portrait.whisper");
      messageElement.appendChild(indicatorElement);
    }
  }
  static injectWhisperParticipants(html, messageData, gameSystemId) {
    const alias = messageData.alias;
    const whisperTargetString = messageData.whisperTo;
    const whisperTargetIds = messageData.whisper;
    const isWhisper = whisperTargetIds?.length > 0 || false;
    const isRoll = messageData.rolls !== void 0;
    const authorId = messageData.user;
    const userId = game.user?.id;
    if (!isWhisper)
      return;
    if (userId !== authorId && !whisperTargetIds.includes(userId))
      return;
    html.find(`.chat-portrait-whisper-to-${gameSystemId}`).detach();
    if (isRoll)
      return;
    const messageHeader = html.find(".card-header");
    const whisperParticipants = $("<span>");
    whisperParticipants.addClass(`chat-portrait-whisper-to-${gameSystemId}`);
    const whisperFrom = $("<span>");
    whisperFrom.text(`${game.i18n.localize("chat-portrait.from")}: ${alias}`);
    const whisperTo = $("<span>");
    whisperTo.text(`${game.i18n.localize("CHAT.To")}: ${whisperTargetString}`);
    whisperParticipants.append(whisperFrom);
    whisperParticipants.append(whisperTo);
    messageHeader.append(whisperParticipants);
  }
  static isWildcardImage(imgUrl) {
    try {
      const filename = imgUrl.split("/").pop();
      const baseFileName = filename.substr(0, filename.lastIndexOf("."));
      return baseFileName == "*";
    } catch (e) {
      return false;
    }
  }
  static isVideo(imgSrc) {
    const re = /(?:\.([^.]+))?$/;
    const ext = re.exec(imgSrc)?.[1];
    return ext === "webm";
  }
  static createVideoElement(videoSrc) {
    const video = document.createElement("video");
    video.src = videoSrc;
    video.autoplay = false;
    video.controls = false;
    video.muted = true;
    return video;
  }
  static loadImagePathForCombatTracker(tokenID, actorID, userID, sceneID, isOwnedFromPLayer) {
    const imgFinal = CONSTANTS.DEF_TOKEN_IMG_PATH;
    if (!tokenID && !actorID || _ChatPortrait.settings.useAvatarImage) {
      if (userID && _ChatPortrait.settings.useAvatarImage && !_ChatPortrait.isGMFromUserID(userID)) {
        const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromUserID(userID);
        if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          return imgAvatar2;
        } else {
          warn(
            "No specific avatar player image found it for player '" + _ChatPortrait.getUserNameFromUserID(userID) + "'"
          );
          return imgAvatar2 ? imgAvatar2 : imgFinal;
        }
      } else if (!tokenID && !actorID) {
        if (userID && _ChatPortrait.settings.useAvatarImage) {
          const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromUserID(userID);
          if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
            return imgAvatar2;
          }
        } else {
          return imgFinal;
        }
      }
    }
    let useTokenImage = _ChatPortrait.settings.useTokenImage;
    const actor = _ChatPortrait.getActorFromActorID(actorID, tokenID);
    const doNotUseTokenImageWithSpecificType = _ChatPortrait.settings.doNotUseTokenImageWithSpecificType ? String(_ChatPortrait.settings.doNotUseTokenImageWithSpecificType).split(",") : [];
    if (doNotUseTokenImageWithSpecificType.length > 0 && doNotUseTokenImageWithSpecificType.includes(actor?.type)) {
      useTokenImage = false;
    }
    if (actor?.type == "character" && _ChatPortrait.settings.useAvatarImage && !_ChatPortrait.isGMFromUserID(userID)) {
      const imgAvatar2 = _ChatPortrait.getUserAvatarImageFromUserID(userID);
      if (imgAvatar2 && !imgAvatar2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgAvatar2;
      }
    }
    let tokenDocument;
    let tokenDocumentData;
    if (tokenID) {
      tokenDocument = _ChatPortrait.getTokenFromIds(sceneID, tokenID, actorID);
      if (!tokenDocument) {
        try {
          tokenDocument = canvas?.tokens?.getDocuments().find((token) => token.id === tokenID);
        } catch (e) {
        }
        if (!tokenDocument) {
          tokenDocumentData = game.scenes?.get(sceneID)?.tokens?.find((t) => t.id === tokenID);
        } else {
          tokenDocumentData = tokenDocument;
        }
      } else {
        tokenDocumentData = tokenDocument;
      }
      let imgToken2 = "";
      if (tokenDocumentData) {
        if (useTokenImage) {
          if (tokenDocumentData?.img) {
            imgToken2 = tokenDocumentData.img;
          }
          if ((!imgToken2 || _ChatPortrait.isWildcardImage(imgToken2)) && tokenDocumentData?.img) {
            imgToken2 = tokenDocumentData?.img;
          }
        } else {
          if (tokenDocumentData?.delta?.img) {
            imgToken2 = tokenDocumentData.delta.img;
          }
          if ((!imgToken2 || _ChatPortrait.isWildcardImage(imgToken2)) && tokenDocumentData?.delta?.img) {
            imgToken2 = tokenDocumentData.delta.img;
          }
        }
        if (imgToken2 && !_ChatPortrait.isWildcardImage(imgToken2) && !imgToken2.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
          return imgToken2;
        }
      }
    }
    let imgToken = "";
    if (!useTokenImage && !isOwnedFromPLayer) {
      if (tokenDocumentData?.img) {
        imgToken = tokenDocumentData.img;
      }
      if ((!imgToken || _ChatPortrait.isWildcardImage(imgToken)) && tokenDocumentData?.texture.src) {
        imgToken = tokenDocumentData?.texture.src;
      }
      if (imgToken && !_ChatPortrait.isWildcardImage(imgToken) && !imgToken.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgToken;
      }
    }
    let imgActor = "";
    if (actor) {
      if ((!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) && useTokenImage) {
        imgActor = actor?.token?.texture.src;
        if (imgActor && _ChatPortrait.isWildcardImage(imgActor)) {
          imgActor = "";
        }
      }
      if ((!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) && useTokenImage) {
        imgActor = actor?.token?.texture.src;
        if (imgActor && _ChatPortrait.isWildcardImage(imgActor)) {
          imgActor = "";
        }
      }
      if (!imgActor || imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        imgActor = actor?.img;
      }
      if (imgActor && !imgActor.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
        return imgActor;
      }
    }
    const imgAvatar = _ChatPortrait.getUserAvatarImageFromUserID(userID);
    if (imgAvatar && !imgAvatar.includes(CONSTANTS.DEF_TOKEN_IMG_NAME)) {
      return imgAvatar;
    } else {
      return imgAvatar ? imgAvatar : CONSTANTS.INV_UNIDENTIFIED_BOOK;
    }
  }
};
__name(_ChatPortrait, "ChatPortrait");
let ChatPortrait = _ChatPortrait;
ChatPortrait.getActorNameFromSpeaker = function(speaker) {
  const actor = ChatPortrait.getActorFromSpeaker(speaker);
  if (actor) {
    return actor.name;
  }
  return speaker.alias;
};
ChatPortrait.getPrototypeTokenNameFromSpeaker = function(speaker) {
  const actor = ChatPortrait.getActorFromSpeaker(speaker);
  if (actor) {
    if (actor?.prototypeToken) {
      return actor?.prototypeToken.name;
    } else if (actor.token) {
      return actor.token.name;
    }
  }
  return speaker.alias;
};
ChatPortrait.getTokenNameFromSpeaker = function(speaker) {
  if (speaker.token) {
    const token = ChatPortrait.getTokenFromSpeaker(speaker);
    if (token) {
      return token.name;
    }
  }
  if (speaker.actor) {
    const actor = game.actors?.get(speaker.actor);
    if (actor) {
      if (actor?.prototypeToken) {
        return actor?.prototypeToken.name;
      } else if (actor.token) {
        return actor.token.name;
      }
      if (actor.hasPlayerOwner) {
        return actor.name;
      }
    }
  }
  if (game.user?.isGM) {
    return speaker.alias;
  }
  return "";
};
ChatPortrait.getTokenFromSpeaker = function(speaker) {
  let token = null;
  if (speaker.token) {
    const sceneSpeaker = speaker.scene ? speaker.scene : game.scenes?.current?.id;
    const scene = game.scenes?.get(sceneSpeaker);
    const tokenSpeaker = scene?.tokens.get(speaker.token);
    token = ChatPortrait._getTokenFromScene(scene?.id, tokenSpeaker?.id);
    if (!token) {
      token = ChatPortrait._getTokenFromId(tokenSpeaker?.id);
    }
    if (!token && speaker.actor) {
      token = ChatPortrait._getTokenFromActor(speaker.actor);
    }
  }
  if (!token) {
    const actor = game.actors?.get(speaker.actor);
    if (actor) {
      if (actor?.prototypeToken) {
        token = actor?.prototypeToken;
      } else if (actor.token) {
        token = actor.token;
      }
    }
  }
  return !token ? null : token;
};
ChatPortrait.getTokenFromIds = function(sceneID, tokenID, actorID) {
  let tokenDocument = ChatPortrait._getTokenFromScene(sceneID, tokenID);
  if (!tokenDocument) {
    tokenDocument = ChatPortrait._getTokenFromId(tokenID);
  }
  if (!tokenDocument && actorID) {
    tokenDocument = ChatPortrait._getTokenFromActor(actorID);
  }
  return tokenDocument;
};
ChatPortrait._getTokenFromActor = function(actorID) {
  let token = null;
  const scene = game.scenes?.get(game.user?.viewedScene);
  if (scene) {
    const thisSceneToken = scene.tokens.find((tokenTmp) => {
      return tokenTmp.actor && tokenTmp.actor.id === actorID;
    });
    if (thisSceneToken) {
      token = ChatPortrait._getTokenFromId(thisSceneToken.id);
    }
  }
  return token;
};
ChatPortrait._getTokenFromId = function(tokenId) {
  try {
    return canvas.tokens?.get(tokenId)?.document;
  } catch (e) {
    return null;
  }
};
ChatPortrait._getTokenFromScene = function(sceneID, tokenID) {
  const specifiedScene = game.scenes?.get(sceneID);
  if (specifiedScene) {
    if (!specifiedScene) {
      return null;
    }
    const tokenDoc = specifiedScene.tokens.find((tokenTmp) => {
      return tokenTmp.id === tokenID;
    });
    return tokenDoc;
  }
  let foundToken = null;
  game.scenes?.find((sceneTmp) => {
    if (!sceneTmp) {
      foundToken = null;
    }
    foundToken = sceneTmp.tokens.find((token) => {
      return token.id === tokenID;
    });
    return !!foundToken;
  });
  return foundToken;
};
ChatPortrait.getFirstSelectedToken = function() {
  try {
    canvas;
  } catch (e) {
    return null;
  }
  let token = null;
  const controlled = canvas.tokens?.controlled;
  if (controlled.length && controlled.length > 1) {
    token = controlled[0];
  }
  return token;
};
ChatPortrait.getFirstPlayerToken = function() {
  try {
    canvas;
  } catch (e) {
    return null;
  }
  let token = ChatPortrait.getFirstSelectedToken();
  if (!token) {
    token = canvas.tokens.placeables.find((token2) => token2.id === game.user?.character.id);
    if (!token && !game.user?.isGM) {
      token = canvas.tokens?.ownedTokens[0];
    }
  }
  return token;
};
ChatPortrait.isSpeakerGM = function(message) {
  if (message.user) {
    let user = game.users?.get(message.user);
    if (!user) {
      user = game.users?.get(message?.user?.id);
    }
    if (user) {
      return user.isGM;
    } else {
      return false;
    }
  }
  return false;
};
ChatPortrait.isGMFromUserID = function(userID) {
  if (userID) {
    const user = game.users?.get(userID);
    if (user) {
      return user.isGM;
    } else {
      return false;
    }
  }
  return false;
};
ChatPortrait.shouldOverrideMessageUnknown = function(message) {
  const speaker = message?.message?.speaker;
  let actor;
  if (!speaker) {
    actor = game.users?.get(message.user)?.character;
    actor?.type;
  } else if (!speaker.token && !speaker.actor) {
    actor = game.users?.get(message.user)?.character;
    actor?.type;
  } else {
    actor = ChatPortrait.getActorFromSpeaker(speaker);
    actor?.type;
  }
  return false;
};
ChatPortrait.shouldOverrideMessageStyling = function(message) {
  const setting = game.settings.get(CONSTANTS.MODULE_ID, "displaySetting");
  if (setting !== "none") {
    let user = game.users?.get(message.user);
    if (!user) {
      user = game.users?.get(message.user?.id);
    }
    if (!user) {
      user = game.users?.get(message.document?.user?.id);
    }
    if (user) {
      const isSelf = user.id === game.user?.id;
      const isGM = user.isGM;
      if (setting === "allCards" || setting === "self" && isSelf || setting === "selfAndGM" && (isSelf || isGM) || setting === "gm" && isGM || setting === "player" && !isGM) {
        return true;
      }
    } else {
      error("Impossible to get message user");
    }
  }
  return false;
};
ChatPortrait.getUserColor = function(message) {
  let user = game.users?.get(message.user);
  if (!user) {
    user = game.users?.get(message.user.id);
    if (user) {
      return user.color;
    }
  }
  return "";
};
ChatPortrait.getUserAvatarImageFromChatMessage = function(message) {
  let userId = "";
  if (message.document?.user?.id) {
    userId = message.document.user.id;
  }
  if (!userId && message.user?.id) {
    userId = message.user.id;
  }
  if (!userId && message.user) {
    userId = message.user;
  }
  if (userId) {
    const user = game.users?.get(userId);
    if (user) {
      if (user && user.avatar) {
        return user.avatar;
      }
    }
  }
  return CONSTANTS.DEF_TOKEN_IMG_PATH;
};
ChatPortrait.getUserAvatarImageFromUserID = function(userId) {
  const user = game.users?.get(userId);
  if (user) {
    if (user && user.avatar) {
      return user.avatar;
    }
  }
  return CONSTANTS.DEF_TOKEN_IMG_PATH;
};
ChatPortrait.getUserNameFromChatMessage = function(message) {
  let user = game.users?.get(message.user);
  if (!user) {
    user = game.users?.get(message.user.id);
  }
  if (user) {
    if (user && user.avatar) {
      return user.name;
    }
  }
  return "";
};
ChatPortrait.getUserNameFromUserID = function(userID) {
  const user = game.users?.get(userID);
  if (user) {
    if (user && user.avatar) {
      return user.name;
    }
  }
  return "";
};
ChatPortrait.isWhisperToOther = function(speakerInfo) {
  const whisper = speakerInfo?.message?.whisper;
  return whisper && whisper.length > 0 && whisper.indexOf(game.userId) === -1;
};
ChatPortrait.replaceSenderWithTokenName = function(messageSenderElem, speakerInfo) {
  const speaker = speakerInfo.message.speaker;
  const alias = speaker.alias;
  const actorName = (ChatPortrait.getActorNameFromSpeaker(speaker) || "").trim();
  const prototypeTokenName = (ChatPortrait.getPrototypeTokenNameFromSpeaker(speaker) || "").trim();
  const tokenName = (ChatPortrait.getTokenNameFromSpeaker(speaker) || "").trim();
  debug(`replaceSenderWithTokenName | Alias '${alias}'`);
  debug(`replaceSenderWithTokenName | Actor Name '${actorName}'`);
  debug(`replaceSenderWithTokenName | Prototype Token Name '${prototypeTokenName}'`);
  debug(`replaceSenderWithTokenName | Token Name '${tokenName}'`);
  if (tokenName && tokenName !== alias) {
    debug(`replaceSenderWithTokenName | Use token name replaced '${alias}' with '${tokenName}'`);
    ChatPortrait.replaceMatchingTextNodes(messageSenderElem[0], tokenName, alias);
  }
};
ChatPortrait.replaceMatchingTextNodes = function(parent, match, replacement) {
  if (!parent || !parent.hasChildNodes()) {
    return;
  }
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.wholeText.trim() === match) {
        node.parentNode.replaceChild(document.createTextNode(replacement), node);
      }
    } else {
      ChatPortrait.replaceMatchingTextNodes(node, match, replacement);
    }
  }
};
ChatPortrait.appendPlayerName = function(headerTextElement, messageSenderElem, author, gameSystemId) {
  const playerName = author.name;
  const playerNameElem = document.createElement("span");
  playerNameElem.appendChild(document.createTextNode(playerName));
  if (!playerNameElem.classList.contains(`chat-portrait-playerName-${gameSystemId}`)) {
    playerNameElem.classList.add(`chat-portrait-playerName-${gameSystemId}`);
  }
  headerTextElement.appendChild(playerNameElem);
};
ChatPortrait.getMessageTypeVisible = function(speakerInfo) {
  let messageType = speakerInfo.message?.type;
  switch (messageType) {
    case CONST.CHAT_MESSAGE_TYPES.OTHER:
      return CONST.CHAT_MESSAGE_TYPES.OTHER;
    case CONST.CHAT_MESSAGE_TYPES.OOC:
      return CONST.CHAT_MESSAGE_TYPES.OOC;
    case CONST.CHAT_MESSAGE_TYPES.IC:
      return CONST.CHAT_MESSAGE_TYPES.IC;
    case CONST.CHAT_MESSAGE_TYPES.EMOTE:
      return CONST.CHAT_MESSAGE_TYPES.EMOTE;
    case CONST.CHAT_MESSAGE_TYPES.WHISPER:
      return CONST.CHAT_MESSAGE_TYPES.WHISPER;
    case CONST.CHAT_MESSAGE_TYPES.ROLL:
      return CONST.CHAT_MESSAGE_TYPES.ROLL;
    default:
      return;
  }
};
ChatPortrait.getLogElement = function(chatLog) {
  const el = chatLog.element;
  const log = el.length ? el[0].querySelector("#chat-log") : null;
  return log;
};
ChatPortrait.shouldScrollToBottom = function(log) {
  const propOfClientHeightScrolled = (log.scrollHeight - log.clientHeight - log.scrollTop) / log.clientHeight;
  return propOfClientHeightScrolled <= 0.5;
};
let chatPortraitSocket;
function registerSocket() {
  debug("Registered chatPortraitSocket");
  if (chatPortraitSocket) {
    return chatPortraitSocket;
  }
  chatPortraitSocket = socketlib.registerModule(CONSTANTS.MODULE_ID);
  setSocket(chatPortraitSocket);
  return chatPortraitSocket;
}
__name(registerSocket, "registerSocket");
const CSS_PREFIX = `${CONSTANTS.MODULE_ID}--`;
const CSS_CURRENT_SPEAKER = CSS_PREFIX + "currentSpeaker";
const CHAT_MESSAGE_SUB_TYPES = {
  NONE: 0,
  DESC: 1,
  AS: 2
};
let image;
let text;
let locked;
let lastHoveredToken;
let currentSpeakerDisplay;
function getThisSceneTokenObj(speaker) {
  let token = getTokenObj(speaker.token);
  if (!token) {
    token = getThisSceneTokenObjForActor(speaker.actor);
  }
  return token;
}
__name(getThisSceneTokenObj, "getThisSceneTokenObj");
function getThisSceneTokenObjForActor(actorID) {
  let token = null;
  const scene = game.scenes?.get(game.user?.viewedScene);
  if (scene) {
    const thisSceneToken = scene.tokens.find((token2) => {
      return token2.actor && token2.actor.id === actorID;
    });
    if (thisSceneToken) {
      token = getTokenObj(thisSceneToken.id);
    }
  }
  return token;
}
__name(getThisSceneTokenObjForActor, "getThisSceneTokenObjForActor");
function getTokenObj(id) {
  if (!canvas.ready) {
    info(`getTokenObj(${id}) bailed - canvas is not ready yet`);
    return void 0;
  }
  return canvas.tokens?.get(id);
}
__name(getTokenObj, "getTokenObj");
const initSpeakingAs = /* @__PURE__ */ __name(function() {
  currentSpeakerDisplay = document.createElement("div");
  currentSpeakerDisplay.classList.add(CSS_CURRENT_SPEAKER);
  image = `<img class="${CSS_CURRENT_SPEAKER}--icon">`;
  text = `<span class="${CSS_CURRENT_SPEAKER}--text"></span>`;
  locked = `<i class="fa-solid fa-unlock ${CSS_CURRENT_SPEAKER}--locked"></i>`;
  let oocButton = $(
    $.parseHTML(
      `<i class="fa-solid fa-user ${CSS_CURRENT_SPEAKER}--button" data-tooltip=""><i class="${CSS_CURRENT_SPEAKER}--buttonInset fa-solid fa-inverse" mode="0"></i></i>`
    )
  );
  oocButton.click(function(event) {
    event.stopPropagation();
    let classes = ["", "fa-circle-1", "fa-repeat"];
    $(`.${CSS_CURRENT_SPEAKER}--buttonInset`).attr("mode", mode() >= 2 ? 0 : mode() + 1);
    $(`.${CSS_CURRENT_SPEAKER}--buttonInset`).removeClass(classes.at(mode() - 1) ?? "").addClass(classes.at(mode()));
    updateSpeaker();
  });
  $(currentSpeakerDisplay).append(image).append(text).append(locked).append(oocButton);
}, "initSpeakingAs");
const hoverIn = /* @__PURE__ */ __name((event, speaker) => {
  let token = getThisSceneTokenObj(speaker);
  if (token && token.isVisible) {
    event.fromChat = true;
    token._onHoverIn(event);
    lastHoveredToken = token;
  }
}, "hoverIn");
const hoverOut = /* @__PURE__ */ __name((event) => {
  if (lastHoveredToken) {
    event.fromChat = true;
    lastHoveredToken._onHoverOut(event);
    lastHoveredToken = null;
  }
}, "hoverOut");
const panToSpeaker = /* @__PURE__ */ __name((speaker) => {
  panToToken(getThisSceneTokenObj(speaker));
}, "panToSpeaker");
const panToToken = /* @__PURE__ */ __name((token) => {
  if (token && token.isVisible) {
    const scale = Math.max(1, canvas.stage?.scale.x);
    canvas.animatePan({ ...token.center, scale, duration: 1e3 });
  }
}, "panToToken");
const hasTokenOnSheet = /* @__PURE__ */ __name((actor) => {
  return !!getThisSceneTokenObjForActor(actor.id);
}, "hasTokenOnSheet");
const selectActorToken = /* @__PURE__ */ __name((actor) => {
  let token = getThisSceneTokenObjForActor(actor.id);
  token.control();
  panToToken(token);
}, "selectActorToken");
function updateMessageData(messageData, ...args) {
  return messageData.updateSource.apply(messageData, args);
}
__name(updateMessageData, "updateMessageData");
function convertToOoc(messageData) {
  const isInCharacter = CONST.CHAT_MESSAGE_TYPES.IC === messageData.type;
  const newType = isInCharacter ? CONST.CHAT_MESSAGE_TYPES.OOC : messageData.type;
  const newActor = isInCharacter ? null : messageData.speaker.actor;
  const newToken = isInCharacter ? null : messageData.speaker.token;
  const newTokenD = isInCharacter ? null : messageData.token;
  const newActorD = isInCharacter ? null : messageData.actor;
  const user = messageData.user instanceof User ? messageData.user : game.users?.get(messageData.user);
  updateMessageData(messageData, {
    type: newType,
    speaker: {
      actor: newActor,
      alias: user.name,
      token: newToken
    },
    token: newTokenD,
    actor: newActorD
  });
}
__name(convertToOoc, "convertToOoc");
function overrideMessage(messageData) {
  if (mode() === 0)
    return;
  switch (messageData?.flags?.cgmp?.subType) {
    case CHAT_MESSAGE_SUB_TYPES.AS:
    case CHAT_MESSAGE_SUB_TYPES.DESC: {
      break;
    }
    default: {
      convertToOoc(messageData);
      break;
    }
  }
  if (mode() === 1) {
    $(`.${CSS_CURRENT_SPEAKER}--buttonInset`).attr("mode", 0);
    $(`.${CSS_CURRENT_SPEAKER}--buttonInset`).removeClass("fa-circle-1");
    updateSpeaker();
  }
}
__name(overrideMessage, "overrideMessage");
function mode() {
  return Number($(`.${CSS_CURRENT_SPEAKER}--buttonInset`).attr("mode"));
}
__name(mode, "mode");
function updateSpeaker() {
  let tokenDocument = fromUuidSync(`Scene.${ChatMessage.getSpeaker().scene}.Token.${ChatMessage.getSpeaker().token}`);
  let name = ChatMessage.getSpeaker().alias;
  let lockReason = false;
  if (mode() !== 0) {
    lockReason = game.i18n.localize("chat-portrait.self-locked");
    name = game.user?.name;
  }
  const speakerObject = name !== game.user?.name ? {
    actor: tokenDocument?.actor?.id,
    alias: name,
    scene: tokenDocument?.parent?.id ?? game.user?.viewedScene,
    token: tokenDocument?.id
  } : {
    alias: name,
    scene: game.user?.viewedScene
  };
  if (game.modules.get("CautiousGamemastersPack")?.active) {
    if (game.user?.isGM && game.settings.get("CautiousGamemastersPack", "gmSpeakerMode") === 3 || !game.user?.isGM && game.settings.get("CautiousGamemastersPack", "playerSpeakerMode") === 3) {
      name = game.user?.name;
      lockReason = `${game.i18n.format("chat-portrait.locked", { module: "Cautious Gamemaster's Pack" })}`;
    }
    if (game.user?.isGM && game.settings.get("CautiousGamemastersPack", "gmSpeakerMode") === 1 && tokenDocument?.actor?.hasPlayerOwner) {
      name = game.user?.name;
      lockReason = `${game.i18n.format("chat-portrait.locked", { module: "Cautious Gamemaster's Pack" })}`;
    }
    if (game.user?.isGM && game.settings.get("CautiousGamemastersPack", "gmSpeakerMode") === 2 || !game.user?.isGM && game.settings.get("CautiousGamemastersPack", "playerSpeakerMode") === 2) {
      tokenDocument = game.user?.character?.prototypeToken;
      name = game.user?.character?.name;
      lockReason = `${game.i18n.format("chat-portrait.locked", { module: "Cautious Gamemaster's Pack" })}`;
    }
  }
  if (tokenDocument && name !== game.user?.name) {
    image = `<img src="${tokenDocument.texture?.src}" class="${CSS_CURRENT_SPEAKER}--icon" style="transform: scale(${tokenDocument.texture.scaleX})">`;
  } else {
    image = `<img src="${game.user?.avatar}" class="${CSS_CURRENT_SPEAKER}--icon">`;
  }
  text = `<span class="${CSS_CURRENT_SPEAKER}--text">${name}</span>`;
  locked = $(
    $.parseHTML(
      `<i class="fa-solid fa-unlock ${CSS_CURRENT_SPEAKER}--locked" data-tooltip="${game.i18n.localize(
        "chat-portrait.unlocked"
      )}"></i>`
    )
  );
  if (lockReason) {
    $(locked).attr("data-tooltip", lockReason);
    $(locked).removeClass("fa-unlock").addClass("fa-lock");
  }
  image = $(image);
  text = $(text);
  locked = $(locked);
  var textAndImage = $().add(image).add(text);
  textAndImage.hover(
    (event) => {
      hoverIn(event, speakerObject);
    },
    (event) => {
      hoverOut(event);
    }
  ).hover(function() {
    if (name !== game.user?.name)
      $(this).toggleClass(`shadow`);
  }).dblclick(() => panToSpeaker(speakerObject));
  $(image).on("load", () => {
    if ($(`${CSS_CURRENT_SPEAKER}--icon`).html() !== image.html()) {
      $(`.${CSS_CURRENT_SPEAKER}--icon`).replaceWith(image);
    }
    if ($(`${CSS_CURRENT_SPEAKER}--text`).html() !== text.html()) {
      $(`.${CSS_CURRENT_SPEAKER}--text`).replaceWith(text);
    }
    if ($(`${CSS_CURRENT_SPEAKER}--locked`).html() !== locked.html()) {
      $(`.${CSS_CURRENT_SPEAKER}--locked`).replaceWith(locked);
    }
    setTimeout(checkWarn(), 0);
  });
}
__name(updateSpeaker, "updateSpeaker");
Hooks.once("renderChatLog", () => {
  if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakingAs")) {
    const chatControls = document.getElementById("chat-controls");
    setTimeout(async () => {
      chatControls.parentNode?.insertBefore(currentSpeakerDisplay, chatControls);
      $(`.${CSS_CURRENT_SPEAKER}--button`).attr("data-tooltip", i18n("chat-portrait.buttonHint"));
    }, 0);
    const currentSpeakerToggleMenu = new ContextMenu($(chatControls?.parentNode), "." + CSS_CURRENT_SPEAKER, []);
    const originalRender = currentSpeakerToggleMenu.render.bind(currentSpeakerToggleMenu);
    currentSpeakerToggleMenu.render = (...args) => {
      const actors = game.actors?.contents.filter((a) => a.isOwner && hasTokenOnSheet(a));
      const speakerOptions = [];
      for (let actor of actors) {
        speakerOptions.push({
          name: actor.name,
          icon: "",
          callback: () => {
            selectActorToken(actor);
          }
        });
      }
      currentSpeakerToggleMenu.menuItems = speakerOptions;
      originalRender(...args);
    };
    setTimeout(async () => {
      updateSpeaker();
      $("#chat-message").on("input", () => {
        checkWarn();
      });
      $("#chat-message").on("keydown", () => {
        $("#chat-message").removeClass(CSS_PREFIX + "warning");
        game.tooltip.deactivate();
      });
    }, 0);
    if (game.modules.get("illandril-chat-enhancements")?.active) {
      document.getElementsByClassName("illandril-chat-enhancements--current-speaker")[0]?.remove();
    }
  }
});
function checkWarn() {
  if (game.settings.get(CONSTANTS.MODULE_ID, "speakingAsWarningCharacters") === "" || $(".chat-portrait--currentSpeaker--text").text() !== game.user?.name || // Return if speaking out of character
  ["/ic", "/ooc", "/emote"].some((str) => $("#chat-message").val()?.includes(str))) {
    $("#chat-message").removeClass(CSS_PREFIX + "warning");
    game.tooltip.deactivate();
    return;
  }
  const regex = new RegExp(game.settings.get(CONSTANTS.MODULE_ID, "speakingAsWarningCharacters"));
  if (regex.test($("#chat-message").val())) {
    $("#chat-message").addClass(CSS_PREFIX + "warning");
    game.tooltip.activate($("#chat-message")[0], {
      text: i18nFormat("chat-portrait.speakingAs.buttonHint.warning", {
        characters: game.settings.get(CONSTANTS.MODULE_ID, "speakingAsWarningCharacters")
      }),
      direction: "LEFT"
    });
  } else {
    $("#chat-message").removeClass(CSS_PREFIX + "warning");
    game.tooltip.deactivate();
  }
}
__name(checkWarn, "checkWarn");
var color;
var height;
var bgcolor;
var width = "80%";
var checkedSetting = false;
const readySpeakAs = /* @__PURE__ */ __name(function() {
  const btn = document.querySelector("#speakerSwitch");
  btn?.addEventListener("click", (event) => {
    checkedSetting = document?.getElementById("speakerSwitch")?.checked;
  });
  Hooks.on("chatMessage", (dialog, $element, targets) => {
    let namelist = document.getElementById("namelist");
    let checkedSpeakAS = document.getElementById("speakerSwitch")?.checked;
    if (!checkedSpeakAS) {
      debug(`checkedSpeakAS is not checked`);
      return;
    }
    if (!namelist) {
      warn(`namelist is not checked`);
      return;
    }
    switch (namelist.value) {
      case "userName": {
        targets.speaker.actor = null;
        targets.speaker.token = null;
        targets.speaker.alias = null;
        break;
      }
      default: {
        let map = game.scenes?.find((scene) => scene.isView);
        let tokenTarget = map.tokens.find((token) => {
          return (
            // token.name === namelist.options[namelist.selectedIndex].text ||
            // token.actor?.name === namelist.options[namelist.selectedIndex].text ||
            token.id === namelist.options[namelist.selectedIndex].value || token.actor?.id === namelist.options[namelist.selectedIndex].value
          );
        });
        if (!tokenTarget) {
          debug(`No target is been found`);
          let myactors = game.actors.filter((actor) => actor.permission >= 2);
          let actorTarget = myactors?.find((actor) => {
            return actor?.name === namelist.options[namelist.selectedIndex].text || actor?.id === namelist.options[namelist.selectedIndex].value;
          });
          if (actorTarget) {
            targets.speaker.actor = actorTarget.id;
          }
          targets.speaker.alias = namelist.options[namelist.selectedIndex].text;
        }
        if (tokenTarget) {
          targets.speaker.token = tokenTarget.id;
          targets.speaker.alias = namelist.options[namelist.selectedIndex].text;
        }
        break;
      }
    }
  });
  Hooks.on("renderActorDirectory", (dialog, $element, targets) => {
    $("#divnamelist").remove();
    $("#chat-controls.flexrow").before(updateSpeakerList());
    check();
    $(".roll-type-select").css("color") ? color = $(".roll-type-select").css("color") : null;
    $(".roll-type-select").css("height") ? height = $(".roll-type-select").css("height") : null;
    $(".roll-type-select").css("background") ? bgcolor = $(".roll-type-select").css("background") : null;
    var x = document.querySelectorAll("#namelist");
    if (!x.length) {
      return;
    }
    {
      x[0].style.setProperty("width", width, "important");
    }
    if (color) {
      x[0].style.setProperty("color", color, "important");
    }
    if (height) {
      x[0].style.setProperty("height", height, "important");
    }
    if (bgcolor) {
      x[0].style.setProperty("background", bgcolor, "important");
    }
  });
}, "readySpeakAs");
const renderSidebarTabSpeakAs = /* @__PURE__ */ __name(function(dialog, $element, targets) {
  let HTML = $("div#chat-controls.flexrow")[0];
  if (!HTML) {
    return;
  }
  $("#divnamelist").remove();
  $("#chat-controls.flexrow").before(updateSpeakerList());
  $(".roll-type-select").css("color") ? color = $(".roll-type-select").css("color") : null;
  $(".roll-type-select").css("height") ? height = $(".roll-type-select").css("height") : null;
  $(".roll-type-select").css("background") ? bgcolor = $(".roll-type-select").css("background") : null;
  check();
  var x = document.querySelectorAll("#namelist");
  {
    x[0].style.setProperty("width", width, "important");
  }
  if (color) {
    x[0].style.setProperty("color", color, "important");
  }
  if (height) {
    x[0].style.setProperty("height", height, "important");
  }
  if (bgcolor) {
    x[0].style.setProperty("background", bgcolor, "important");
  }
  $("#namelist").attr("title", "Speak As……");
  $("#speakerSwitch").attr("title", "Disable Speak As…… if unchecked");
}, "renderSidebarTabSpeakAs");
function resortCharacter(activeActor, characterList, selectedCharacter) {
  let newCharacterList = [];
  for (let index = 0; index < characterList.length; index++) {
    let check2 = false;
    for (let index2 = 0; index2 < activeActor.length; index2++) {
      if (activeActor[index2] === characterList[index].name) {
        check2 = true;
        break;
      }
    }
    if (selectedCharacter === characterList[index].name)
      break;
    if (check2)
      newCharacterList.unshift(characterList[index]);
    else
      newCharacterList.push(characterList[index]);
  }
  let uniq = [...new Set(newCharacterList)];
  return uniq;
}
__name(resortCharacter, "resortCharacter");
function updateSpeakerList() {
  let myUser = game.users?.find((user) => user.id == game.userId);
  let myactors = game.actors?.filter((actor) => actor.permission >= 2);
  myactors = myactors.sort((a, b) => a.name.localeCompare(b.name));
  let selectedCharacter = myactors.find((actor) => actor.id === myUser.character?.id);
  const users = game.users.filter((user) => user.active);
  let playerNames = users.map((u) => u.character?.name);
  myactors = resortCharacter(playerNames, myactors, selectedCharacter?.name);
  const options = [];
  if (selectedCharacter) {
    options.push(
      `<option data-image="${selectedCharacter.img}" selected="selected" value="${selectedCharacter.id}">${selectedCharacter.name}</option>`
    );
    options.push(
      `<option data-image="${myUser.avatar}" name="${myUser.name}" value="userName">${myUser.name}</option>`
    );
  } else {
    options.push(
      `<option data-image="${myUser.avatar}" selected="selected" name="${myUser.name}" value="userName">${myUser.name}</option>`
    );
  }
  myactors.forEach((a) => {
    options.push(`<option data-image="${a.img}"  value="${a.id}">${a.name}</option>`);
  });
  let addText = `
	<div style="flex: 0;" id="divnamelist">
		<input type="checkbox" id="speakerSwitch" name="speakerSwitch" checked>
		<select 
			class="actor-template" 
			id="namelist"
			name="namelist" 
			class="namelist"
			data-dtype="String" 
			is="ms-dropdown-chat-portrait"
			data-enable-auto-filter
			>
			<optgroup label="Speak As....">
			${options.join("")}
			</optgroup>
		</select>
    </div>
    `;
  return addText;
}
__name(updateSpeakerList, "updateSpeakerList");
function check() {
  let speaker = document.getElementById("speakerSwitch");
  if (speaker) {
    speaker.checked = checkedSetting;
  }
}
__name(check, "check");
const mapCombatTrackerPortrait = /* @__PURE__ */ new Map();
const initHooks = /* @__PURE__ */ __name(() => {
  if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakingAs")) {
    initSpeakingAs();
  }
}, "initHooks");
const setupHooks = /* @__PURE__ */ __name(async () => {
  setApi(API);
  let imageReplacer;
  let currentSpeakerBackUp;
  Hooks.on("renderChatMessage", async (message, html, speakerInfo) => {
    if (!speakerInfo.message.speaker.token && currentSpeakerBackUp?.token) {
      if (currentSpeakerBackUp.scene)
        ;
      if (currentSpeakerBackUp.actor)
        ;
      if (currentSpeakerBackUp.token)
        ;
      if (currentSpeakerBackUp.alias)
        ;
    }
    if (!message.speaker.token && currentSpeakerBackUp?.token) {
      if (currentSpeakerBackUp.scene)
        ;
      if (currentSpeakerBackUp.actor)
        ;
      if (currentSpeakerBackUp.token)
        ;
      if (currentSpeakerBackUp.alias)
        ;
    }
    ChatPortrait.onRenderChatMessage(message, html, speakerInfo, imageReplacer);
    setTimeout(function() {
      const log = document.querySelector("#chat-log");
      const shouldForceScroll = log ? ChatPortrait.shouldScrollToBottom(log) : false;
      if (log && shouldForceScroll) {
        log.scrollTo({ behavior: "smooth", top: log.scrollHeight });
      }
    }, 50);
  });
  Hooks.on("preCreateChatMessage", (message, options, render, userId) => {
    if (message.speaker?.token) {
      const src = ChatPortrait.loadImagePathForChatMessage(message.speaker);
      if (src) {
        message.updateSource({
          flags: {
            "D35E": {
              src
            }
          }
        });
      }
    }
    if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakingAs")) {
      overrideMessage(message);
    }
  });
  Hooks.on("controlToken", (token, options) => {
    if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakingAs")) {
      updateSpeaker();
    }
  });
}, "setupHooks");
const readyHooks = /* @__PURE__ */ __name(async () => {
  if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakAs")) {
    readySpeakAs();
  }
  Hooks.on("renderSidebarTab", (dialog, $element, targets) => {
    if (game.settings.get(CONSTANTS.MODULE_ID, "enableSpeakAs")) {
      renderSidebarTabSpeakAs();
    }
  });
  Hooks.on("renderCombatTracker", async (app, html, options) => {
    if (game.settings.get(CONSTANTS.MODULE_ID, "applyOnCombatTracker")) {
      if (game.combat) {
        const combatants = game.combat?.combatants;
        combatants.forEach(async (c) => {
          const $combatant = html.find(`.combatant[data-combatant-id="${c.id}"]`);
          const img = $combatant.find(".token-image")[0];
          const tokenID = c.token?.id;
          let imgPath = CONSTANTS.DEF_TOKEN_IMG_PATH;
          if (!mapCombatTrackerPortrait.get(tokenID)) {
            const actorID = c.actor?.id;
            const token = ChatPortrait._getTokenFromId(tokenID);
            let userID = "";
            let isOwnedFromPLayer = false;
            let useTokenImage = ChatPortrait.settings.useTokenImage;
            const actor = ChatPortrait.getActorFromSpeaker(token.actor);
            const doNotUseTokenImageWithSpecificType = ChatPortrait.settings.doNotUseTokenImageWithSpecificType ? String(ChatPortrait.settings.doNotUseTokenImageWithSpecificType).split(",") : [];
            if (doNotUseTokenImageWithSpecificType.length > 0 && doNotUseTokenImageWithSpecificType.includes(actor?.type)) {
              useTokenImage = false;
            }
            if (ChatPortrait.settings.useAvatarImage && !useTokenImage) {
              const permissions = token.actor?.permission;
              for (const keyPermission in permissions) {
                const valuePermission = permissions[keyPermission];
                if (game.user?.isGM) {
                  if (game.user?.id != keyPermission && valuePermission === CONST.ENTITY_PERMISSIONS.OWNER) {
                    userID = keyPermission;
                    break;
                  }
                } else {
                  if (game.user?.id === keyPermission && valuePermission === CONST.ENTITY_PERMISSIONS.OWNER) {
                    userID = game.user?.id;
                    isOwnedFromPLayer = true;
                    break;
                  }
                }
              }
            }
            const sceneID = (canvas.tokens?.get(token.id)).scene.id;
            imgPath = ChatPortrait.loadImagePathForCombatTracker(
              tokenID,
              actorID,
              userID,
              sceneID,
              isOwnedFromPLayer
            );
            if (imgPath?.includes(".webm")) {
              try {
                const imgThumb = await ImageHelper.createThumbnail(imgPath);
                if (imgPath.includes(".webm")) {
                  imgPath = imgThumb.thumb;
                } else {
                  imgPath = imgThumb.src;
                }
              } catch {
              }
            }
            mapCombatTrackerPortrait.set(tokenID, imgPath);
          } else {
            imgPath = mapCombatTrackerPortrait.get(tokenID);
          }
          if (imgPath) {
            img.setAttribute("data-src", imgPath);
          }
        });
      } else {
        mapCombatTrackerPortrait.clear();
      }
    }
  });
  Hooks.on("renderSettingsConfig", (app, html, data) => {
    const nameBorderColor = `${CONSTANTS.MODULE_ID}.borderColor`;
    const colourBorderColor = game.settings.get(CONSTANTS.MODULE_ID, "borderColor");
    $("<input>").attr("type", "color").attr("data-edit", nameBorderColor).val(colourBorderColor).insertAfter($(`input[name="${nameBorderColor}"]`, html).addClass("color"));
    const nameCustomStylingMessageText = `${CONSTANTS.MODULE_ID}.customStylingMessageText`;
    game.settings.get(CONSTANTS.MODULE_ID, "customStylingMessageText");
    $(`input[name="${nameCustomStylingMessageText}"]`).attr(
      "placeholder",
      `.chat-portrait-text-size-name-dnd5e .chat-portrait-system-dnd5e {
			display: flex;
			margin: auto;
		}
		`
    ).attr("id", nameCustomStylingMessageText).each(function() {
      const style = $(this).attr("style");
      const name = $(this).attr("name");
      const id = $(this).attr("id");
      const datadtype = $(this).attr("data-dtype");
      const value = $(this).attr("value");
      const placeholder = $(this).attr("placeholder");
      const textbox = $(document.createElement("textarea")).attr("style", style).attr("name", name).attr("id", id).attr("data-dtype", datadtype).attr("value", value).attr("placeholder", placeholder);
      textbox.val(value);
      $(this).replaceWith(textbox);
    });
    const nameCustomStylingMessageImage = `${CONSTANTS.MODULE_ID}.customStylingMessageImage`;
    game.settings.get(CONSTANTS.MODULE_ID, "customStylingMessageImage");
    $(`input[name="${nameCustomStylingMessageImage}"]`).attr(
      "placeholder",
      `.chat-portrait-image-size-name-dnd5e .chat-portrait-system-dnd5e {
			display: flex;
			margin: auto;
		}
		`
    ).attr("id", nameCustomStylingMessageImage).each(function() {
      const style = $(this).attr("style");
      const name = $(this).attr("name");
      const id = $(this).attr("id");
      const datadtype = $(this).attr("data-dtype");
      const value = $(this).attr("value");
      const placeholder = $(this).attr("placeholder");
      const textbox = $(document.createElement("textarea")).attr("style", style).attr("name", name).attr("id", id).attr("data-dtype", datadtype).attr("value", value).attr("placeholder", placeholder);
      textbox.val(value);
      $(this).replaceWith(textbox);
    });
  });
}, "readyHooks");
Hooks.once("init", async () => {
  console.log(`${CONSTANTS.MODULE_ID} | Initializing ${CONSTANTS.MODULE_ID}`);
  registerSettings();
  initHooks();
  await preloadTemplates();
});
Hooks.once("setup", function() {
  setupHooks();
});
Hooks.once("ready", () => {
  readyHooks();
});
function setApi(api) {
  const data = game.modules.get(CONSTANTS.MODULE_ID) || game.system;
  data.api = api;
}
__name(setApi, "setApi");
function getApi() {
  const data = game.modules.get(CONSTANTS.MODULE_ID) || game.system;
  return data.api;
}
__name(getApi, "getApi");
function setSocket(socket) {
  const data = game.modules.get(CONSTANTS.MODULE_ID) || game.system;
  data.socket = socket;
}
__name(setSocket, "setSocket");
function getSocket() {
  const data = game.modules.get(CONSTANTS.MODULE_ID) || game.system;
  return data.socket;
}
__name(getSocket, "getSocket");
export {
  getApi,
  getSocket,
  setApi,
  setSocket
};
//# sourceMappingURL=module.js.map
