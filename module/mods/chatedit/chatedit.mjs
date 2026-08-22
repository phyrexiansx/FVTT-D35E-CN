const MODULE = "chatedit";
const MODULE_SETTINGS = "D35E";
const CHATEDIT_CONST = {
  CHAT_MESSAGE_STYLES: {
    EMOTE: 3,
    IC: 2,
    OOC: 1,
    OTHER: 0
  }
};
const SETTINGS = {
  APPV2: "chatedit-appv2",
  EDIT: "chatedit-allowEdit",
  EMOJI: "chatedit-emoji",
  MARKDOWN: "chatedit-markdown",
  SHOW: "chatedit-showEdited"
};
const localize = (key) => game.i18n.localize(key);
function userAuthor() {
  return foundry.utils.isNewerVersion(12, game.version) ? "user" : "author";
}

class ModuleSettings {

  static init() {
    ModuleSettings._editing();
    ModuleSettings._markdown();
    if (!foundry.utils.isNewerVersion(12, game.version)) ModuleSettings._v2();
  }

  // Register the settings
  static _editing() {
    game.settings.register(MODULE_SETTINGS, SETTINGS.EDIT, {
      name: "CHATEDIT.SETTINGS.AllowEdit.Name",
      hint: "CHATEDIT.SETTINGS.AllowEdit.Hint",
      scope: "world",
      type: Boolean,
      config: true,
      default: true,
      requiresReload: true
    });

    game.settings.register(MODULE_SETTINGS, SETTINGS.SHOW, {
      name: "CHATEDIT.SETTINGS.ShowEdited.Name",
      hint: "CHATEDIT.SETTINGS.ShowEdited.Hint",
      scope: "world",
      type: Number,
      config: true,
      default: 2,
      requiresReload: true,
      choices: {
        0: "CHATEDIT.SETTINGS.ShowEdited.None",
        1: "CHATEDIT.SETTINGS.ShowEdited.Message",
        2: "CHATEDIT.SETTINGS.ShowEdited.Icon"
      },
      onChange: false
    });
  }

  static _markdown() {
    game.settings.register(MODULE_SETTINGS, SETTINGS.MARKDOWN, {
      name: "CHATEDIT.SETTINGS.Markdown.Name",
      hint: "CHATEDIT.SETTINGS.Markdown.Hint",
      scope: "client",
      type: Boolean,
      config: true,
      default: true,
      requiresReload: true,
      onChange: false
    });

    game.settings.register(MODULE_SETTINGS, SETTINGS.EMOJI, {
      name: "CHATEDIT.SETTINGS.Emoji.Name",
      hint: "CHATEDIT.SETTINGS.Emoji.Hint",
      scope: "world",
      type: Boolean,
      config: true,
      default: false,
      requiresReload: true
    });
  }

  static _v2() {
    game.settings.register(MODULE_SETTINGS, SETTINGS.APPV2, {
      name: "CHATEDIT.SETTINGS.AppV2.Name",
      hint: "CHATEDIT.SETTINGS.AppV2.Hint",
      scope: "client",
      type: Boolean,
      config: true,
      default: false,
      requiresReload: true,
    });
  }
}

const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class { });
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);
class EditorV2 extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  constructor(message) {
    super();
    this.message = message;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: EditorV2._onSubmit,
    },
    tag: "form",
    position: {
      width: 408,
      height: 830
    },
    classes: [MODULE, "edit-form-v2"],
    window: {
      title: "CHATEDIT.EDITS.Title",
      icon: "fa-solid fa-eraser",
      minimizable: true,
      resizable: true,
      contentClasses: ["standard-form"]
    },
    actions: {
      clearAlias: EditorV2._clear
    }
  }

  /** @override */
  static PARTS = {
    form: {
      template: `systems/D35E/module/mods/${MODULE}/templates/edit-form-v2.hbs`
    }
  }

  /** @override */
  async _prepareContext(options) {

    // Prepare possible speakers for selectOptions
    const chars = (game.scenes.viewed?.tokens ? Array.from(game.scenes.viewed.tokens.values()) : []).reduce((acc, t) => {
      if (t.isOwner) acc.push({
        value: t.id,
        label: t.actor?.name,
        group: CONFIG.Actor.typeLabels[t.actor?.type],
        selected: (this.message.speaker.token === t.id) ? true : false
      });
      return acc;
    }, []);
    const users = [{
      value: game.user.id,
      label: game.user.name,
      group: "USER.RolePlayer",
      selected: this.message.speaker.token ? false : true
    }];
    const speakers = users.concat(chars);

    // Prepare data & handle linebreaks
    return foundry.utils.mergeObject(options, {
      speakers,
      alias: this.message.speaker.alias ?? null,
      content: this.message.content.replace(/< *br *\/?>/gm, '\r')
    });
  }

  /** @override */
  _onRender() {
    const speaker = this.element['speaker'];
    let alias = this.element['alias'];
    Editing._alias(speaker, alias);
  }

  /**
   * The form data submission handler.
   * @param {SubmitEvent} event The form submission event.
   * @param {HTMLElement} form  The form HTML element.
   * @param {FormDataExtended} formData  The formData, from which we want the object.
   */
  static async _onSubmit(event, form, formData) {
    let data = formData.object;
    await Editing._submitEditorData(this.message, data);
  }

  /**
   * Action to clear the alias input.
   */
  static _clear() {
    this.element['alias'].value = null;
  }

  /** @override */
  close(options) {
    Editing._editors.delete(this.message.id);
    return super.close(options);
  }
}

class Editor extends FormApplication {

  /** @override */
  constructor(message) {
    super();
    this.message = message;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: true,
      editable: true,
      resizable: true,
      width: 408,
      height: 830,
      popOut: true,
      title: "CHATEDIT.EDITS.Title",
      template: `systems/D35E/module/mods/${MODULE}/templates/edit-form.hbs`,
      classes: [MODULE, "edit-form"]
    });
  }

  /** @override */
  getData(options) {

    // Prepare possible speakers for optgroups only if they have valid members
    const player = [{ value: game.user.id, name: game.user.name }];
    const characters = Object.entries(CONFIG.Actor.typeLabels).map(([type, label]) => ({
      actors: Array.from(game.scenes.viewed?.tokens?.values?.() ?? []).reduce((acc, t) => {
        if (t.actor?.type === type && t.isOwner) acc.push({
          value: t.id,
          name: t.actor?.name
        }); return acc;
      }, []),
      label,
      type,
    })).filter((a) => a.actors.length);

    // Prepare selected
    const USERAUTHOR = userAuthor();
    let selected = '';
    this.message.speaker.token ?
      selected = this.message.speaker.token :
      selected = this.message[USERAUTHOR].id;

    // Prepare data & handle linebreaks
    return foundry.utils.mergeObject(options, {
      player,
      characters,
      selected,
      alias: this.message.speaker.alias ?? null,
      content: this.message.content.replace(/< *br *\/?>/gm, '\r')
    });
  }

  /** @override */
  activateListeners(html) {
    const speaker = html[0].querySelector('select[name="speaker"]');
    let alias = html[0].querySelector('input[name="alias"]');
    Editing._alias(speaker, alias);

    // Handle close and clear
    html[0].querySelector('button[data-action="close"]').addEventListener('click', () => {
      this.close();
    });
    html[0].querySelector('button[data-action="clearAlias"]').addEventListener('click', () => {
      alias.value = null;
    });
  }

  /** @override */
  async _updateObject(event, data) {
    await Editing._submitEditorData(this.message, data);
  }

  /** @override */
  close(options) {
    Editing._editors.delete(this.message.id);
    return super.close(options);
  }
}

class Editing {

  static init() {
    if (game.settings.get(MODULE_SETTINGS, SETTINGS.EDIT)) {
      Editing._loadTemplates();
      
      // Add right click options to chat messages in the sidebar and popout chatlogs
      Hooks.on("getChatLogEntryContext", Editing._contextMenu);
    }  }

  /**
   * Register handlebars partials.
   */
  static _loadTemplates() {
    loadTemplates([
      `systems/D35E/module/mods/${MODULE}/templates/alias.hbs`,
      `systems/D35E/module/mods/${MODULE}/templates/bottom.hbs`
    ]);
  }

  /* -------------------------------------------- */
  /* Version Agnostic Form Application Handling   */
  /* -------------------------------------------- */

  /**
   * Deal with the type to style deprecation in v12.
   */
  static styleType() {
    return foundry.utils.isNewerVersion(12, game.version) ? "type" : "style";
  }

  /**
   * Version agnostic app data submission (_updateObject/_onSubmit).
   * @param {ChatMessage} message The ChatMessage to be edited.
   * @param {object} data         The relevant formData from the application.
   */
  static async _submitEditorData(message, data) {

    // The user making the edit
    const user = game.user;
    const userid = user.id;

    // Handle linebreaks
    let content;
    content = data.content.replace(/[\r\n]{2,}/gim, '<br><br>')
      .replace(/(\r\n|\r|\n)+/gim, '<br>');

    // Handle flagging the message as edited
    let flags;
    if (game.settings.get(MODULE_SETTINGS, SETTINGS.SHOW)) {
      flags = foundry.utils.mergeObject(message.flags, { "chatedit": { "edited": true } });
    } else {
      flags = message.flags;
    }
    // Determine message style based on speaker
    const id = data.speaker;
    let speaker, style;
    let STYLETYPE = Editing.styleType();

    // Handle out of character messages
    if (game.users.get(id)) {
      speaker = ChatMessage._getSpeakerFromUser({ user });
      if (message[STYLETYPE] === 0) style = message[STYLETYPE];
      else style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.OOC;
    } else {

      // Handle in character messages
      const token = game.scenes.viewed?.tokens?.get(id);
      if (token) {
        speaker = ChatMessage.getSpeaker({ token });

        // Handle emotes
        if (content.startsWith(token.name)) style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.EMOTE;
        else style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.IC;
      } else {
        speaker = ChatMessage.getSpeaker({ user });
        style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.OOC;
      }
    }
    // Don't destroy the alias
    if (data.alias) foundry.utils.mergeObject(speaker, { alias: data.alias });

    // Handle (don't destroy) markdown - [D35E] 含 HTML 标签的内容跳过 markdown 解析
    if (game.settings.get(MODULE_SETTINGS, SETTINGS.MARKDOWN) && !/<[a-zA-Z][^>]*>/.test(content)) {

      // Create the parser and parse
      const parser = new showdown.Converter({ extensions: ["inline"] });
      let parsed = parser.makeHtml(content);

      // Call the pre process hook, then process
      const callback = Hooks.call("chatedit.preProcessChatMessage", message, parsed, parser, userid);
      if (callback) content = parsed;

      // Call the processed hook
      Hooks.callAll("chatedit.processChatMessage", message, parsed, parser, userid);
    }
    // Call the pre edit hook, then edit
    const callback = Hooks.call("chatedit.preEditChatMessage", message, { content, speaker, style, flags }, data, userid);
    if (!callback) return;
    await message.update({ content, speaker, [STYLETYPE]: style, flags });

    // Call the edit hook
    Hooks.callAll("chatedit.editChatMessage", message, { content, speaker, style, flags }, data, userid);
  }

  /**
   * Handle updating the alias input on forms
   * @param {HTMLElement} speaker The select element for the speaker.
   * @param {HTMLElement} alias   The input element for the alias.
   */
  static _alias(speaker, alias) {
    speaker.addEventListener('change', () => {
      if (game.users.get(speaker.value)) alias.value = null;
      else {
        const token = game.scenes.viewed?.tokens?.get(speaker.value);
        alias.setAttribute('value', token ? ChatMessage.getSpeaker({ token }).alias : '');
      }
    });
  }

  /* -------------------------------------------- */
  /* Editor Initiatilization and Management       */
  /* -------------------------------------------- */

  /**
   * Keep track of open editors.
   */
  static _editors = new Map();

  /**
   * Create or open the editor.
   * @param {string} id The id of the ChatMessage to be edited.
   */
  static async editMessage(id) {

    // If you see this message you're doing something you shouldn't be
    if (!Editing._canEdit(id)) return ui.notifications.warn(localize('CHATEDIT.EDITS.NotAllowed'));

    // If an editor (for the correct version) exists, focus it, and if not, create it
    const message = game.messages.get(id);
    let editor = Editing._editors.get(id);
    if (editor) {

      // Bring the active editor for this message id to the top
      if (foundry.utils.isNewerVersion(12, game.version) || !game.settings.get(MODULE_SETTINGS, SETTINGS.APPV2)) {
        editor.bringToTop();
      }
      else if (game.settings.get(MODULE_SETTINGS, SETTINGS.APPV2) && !foundry.utils.isNewerVersion(12, game.version)) {
        editor.bringToFront();
      }
    } else {

      // Create a new editor
      if (foundry.utils.isNewerVersion(12, game.version) || !game.settings.get(MODULE_SETTINGS, SETTINGS.APPV2)) {
        editor = new Editor(message);
      }
      else if (game.settings.get(MODULE_SETTINGS, SETTINGS.APPV2) && !foundry.utils.isNewerVersion(12, game.version)) {
        editor = new EditorV2(message);
      }

      // Render and track the editor
      await editor.render({ force: true });
      Editing._editors.set(id, editor);
    }
  }

  /* -------------------------------------------- */
  /* Context Menu Handling                        */
  /* -------------------------------------------- */

  /**
   * Check if the message can be edited.
   * @param {string} id The id of the ChatMessage to be tested.
   * @returns {boolean} Returns true if the message can be edited.
   */
  static _canEdit(id) {
    const message = game.messages.get(id);
    if (!message.isAuthor) return false;
    if (message.isRoll) return false;
    if (!foundry.utils.isEmpty(message.flags?.[game.system.id])) return false;
    return true;
  }

  /**
   * Check if the message is in character.
   * @param {string} id The id of the ChatMessage to be tested.
   * @returns {boolean} Returns true if the message is in character.
   */
  static _isIC(id) {
    if (!Editing._canEdit(id)) return false;
    const message = game.messages.get(id);
    return (message.speaker.actor != null || message.speaker.token != null) && !message.whisper.length;
  }

  /**
   * Check if the message is out of character.
   * @param {string} id The id of the ChatMessage to be tested.
   * @returns {boolean} Returns true if the message is out of character.
   */
  static _isOOC(id) {
    if (!Editing._canEdit(id)) return false;
    const message = game.messages.get(id);
    return (message.speaker.actor == null && message.speaker.token == null && !message.whisper.length);
  }

  /**
   * Assign a token as speaker and make the message in character.
   * @param {string} id The id of the ChatMessage to be edited.
   */
  static _makeIC(id) {
    let STYLETYPE = Editing.styleType();
    let style;
    const character = canvas.tokens.controlled[0] ?? game.user.character;
    const message = game.messages.get(id);
    const speaker = ChatMessage.getSpeaker({ actor: character });

    //Handle emotes
    message.content.startsWith(character.name) ?
      style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.EMOTE :
      style = CHATEDIT_CONST.CHAT_MESSAGE_STYLES.IC;
    message.update({ [STYLETYPE]: style, speaker });
  }

  /**
   * Assign the user as speaker and make the message out of character.
   * @param {string} id The id of the ChatMessage to be edited.
   */
  static _makeOOC(id) {
    let STYLETYPE = Editing.styleType();
    const message = game.messages.get(id);
    const speaker = ChatMessage._getSpeakerFromUser({ user: game.user });
    message.update({ [STYLETYPE]: CHATEDIT_CONST.CHAT_MESSAGE_STYLES.OOC, speaker });
  }

  /**
   * Populate the right click options for editing chat messages.
   * @param {HTMLElement} html HTML contents.
   * @param {Array} options    The context menu options.
   */
  static _contextMenu(html, options) {
    options.push(
      {
        name: "CHATEDIT.EDITS.IC",
        icon: '<i class="fa-solid fa-masks-theater"></i>',
        condition: ([li]) => {
          return Editing._isOOC(li.dataset.messageId) && (canvas.tokens.controlled[0] ?? game.user.character);
        },
        callback: ([li]) => {
          Editing._makeIC(li.dataset.messageId);
        },
        group: MODULE
      },
      {
        name: "CHATEDIT.EDITS.OOC",
        icon: '<i class="fa-solid fa-computer"></i>',
        condition: ([li]) => {
          return Editing._isIC(li.dataset.messageId);
        },
        callback: ([li]) => {
          Editing._makeOOC(li.dataset.messageId);
        },
        group: MODULE
      },
      {
        name: "CHATEDIT.EDITS.Edit",
        icon: '<i class="fa-solid fa-eraser"></i>',
        condition: ([li]) => {
          return Editing._canEdit(li.dataset.messageId);
        },
        callback: ([li]) => {
          Editing.editMessage(li.dataset.messageId);
        },
        group: MODULE
      }
    );
    return options;
  }
}

class ProcessChat {
  static init() {
    if (game.settings.get(MODULE_SETTINGS, SETTINGS.MARKDOWN)) {
      Hooks.on("preCreateChatMessage", ProcessChat.processShowdown);
      ProcessChat._showdownOptions();
      ProcessChat.enrichers();
    }
    Hooks.on("renderChatMessage", ProcessChat._edited);
    Hooks.on("renderChatMessage", ProcessChat._ooc);
  }

  /**
   * Make em dashes.
   */
  static enrichers() {
    CONFIG.TextEditor.enrichers.push(
      {
        pattern: /--/gim,
        enricher: async () => { return "—" }
      }
    );
  }

  /**
   * Parse the message with Showdown.
   * @param {ChatMessage} message The ChatMessage to be parsed.
   */
  static async processShowdown(message) {

    // Filter out messages that shouldn't be edited
    if (message.isRoll) return;
    if (message.content.includes('<button')) return;
    if (message.content.includes('class=\"action')) return;
    // [D35E] 内容已含 HTML 标签（核心 NUE 欢迎消息/系统卡片等）时跳过 markdown 解析，避免破坏 HTML
    if (/<[a-zA-Z][^>]*>/.test(message.content)) return;
    if (!foundry.utils.isEmpty(message.flags?.[game.system.id])) return;

    // The id of the user making the message
    const userid = game.user.id;

    // Create the parser and parse
    const parser = new showdown.Converter({ extensions: ["inline"] });
    let parsed = parser.makeHtml(message.content);

    // Call the pre process hook and process
    const callback = Hooks.call("chatedit.preProcessChatMessage", message, parsed, parser, userid);
    if (!callback) return;
    await message.updateSource({ content: parsed });

    // Call the processed hook
    Hooks.callAll("chatedit.processChatMessage", message, parsed, parser, userid);
  }

  /**
   * Configure Showdown.
   */
  static _showdownOptions() {
    showdown.setFlavor('github');
    showdown.setOption('noHeaderId', true);
    showdown.setOption('ghMentions', false);
    showdown.setOption('simpleLineBreaks', true);
    showdown.setOption('splitAdjacentBlockquotes', true);
    showdown.setOption('moreStyling', true);
    showdown.setOption('disableForced4SpacesIndentedSublists', true);
    showdown.setOption('smartIndentationFix', true);
    if (game.settings.get(MODULE_SETTINGS, SETTINGS.EMOJI)) showdown.setOption('emoji', true);
    showdown.extension("inline", function () {
      return [{
        type: "output",
        filter: function (markdown) {
          return markdown.replace(/<\/?p[^>]*>/gm, "");
        }
      }];
    });
  }

  /**
   * Insert the edited marker.
   * @param {ChatMessage} message The ChatMessage to be parsed.
   * @param {HTMLElement} html HTML contents of the message.
   */
  static _edited(message, [html]) {
    const flag = message.flags?.chatedit?.edited;
    if (!flag) return;
    const show = game.settings.get(MODULE_SETTINGS, SETTINGS.SHOW);
    if (!show) return;
    let edited;
    if (show === 1) edited = `<span class="chatedited"> ${localize('CHATEDIT.EDITS.Flag')}<span>`;
    else if (show === 2) edited = '<i class="fa-solid fa-eraser"></i>';
    const meta = html.querySelector('.message-timestamp');
    meta.insertAdjacentHTML('afterend', edited);
  }

  /**
   * Add a css class to ooc messages.
   * @param {ChatMessage} message The ChatMessage.
   * @param {HTMLElement} html HTML contents of the message.
   */
  static _ooc(message, [html]) {
    if (message.isRoll) return;
    let STYLETYPE = Editing.styleType();
    if (message[STYLETYPE] === CHATEDIT_CONST.CHAT_MESSAGE_STYLES.OOC) html.classList.add("ooc");
  }
}

Hooks.once("D35E.modSettingsInit", ModuleSettings.init);
Hooks.once("D35E.modSettingsInit", Editing.init);
Hooks.once("D35E.modSettingsInit", ProcessChat.init);
