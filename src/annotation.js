const AnnoUI = require('anno-ui');

class Annotation {
  constructor(referenceId) {
    this.referenceId = referenceId;
    this._selected = false;
    this._selectedTimestamp = undefined;
    this._uuid = AnnoUI.util.uuid();
    this.__id = undefined;
  }

  getId() {
    return Annotation.createId(this.uuid, this.referenceId);
  }

  getReferenceId() {
    return this.referenceId;
  }

  equals(obj) {
    return undefined != obj && this === obj;
  }

  /**
   * Set ID (This is not UUID and referenceID).
   * _id(getter/setter) is only used by TomlTool#saveToml().
   */
  set _id(value) {
    this.__id = value;
  }

  /**
   * Set ID (This is not UUID and referenceID).
   * _id(getter/setter) is only used by TomlTool#saveToml().
   */
  get _id() {
    return this.__id;
  }

  /**
   * Returns annotation object Identifier (Unique in all(highlight and relation) object).
   *
   * For Anno-ui annoListDropDown. This interface calls `annotation.uuid` as the identifier.
   */
  get uuid() {
    return this._uuid;
  }

  /**
   * Returns annotation type.
   * this method expects ths subclass to override.
   * type ::= 'span'|'relation'|'area' (but 'area' is not used in htmlanno.)
   *
   * For Anno-ui annoListDropDown.
   *
  get type() {
    return undefined;
  }

  /**
   * Returns annotation direction.
   * direction ::= 'one-way'|'two-way'|'link'
   * this method expects ths subclass to override.
   *
   * For Anno-ui annoListDropDown.
   */
  get direction() {
    return undefined;
  }

  /**
   * Returns annotation label.
   *
   * For Anno-ui annoListDropDown.
   */
  get text() {
    return this.content();
  }

  /**
   * Returns the Y coordinate of the annotation object.
   * this method expects ths subclass to override.
   */
  get scrollTop() {
    return 0;
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    this._selected = value;
    this._selectedTimestamp = value ? new Date() : undefined;
  }

  get selectedTimestamp() {
    return this._selectedTimestamp;
  }

  blur() {
    this._selected = false;
    this.dispatchWindowEvent('annotationDeselected', this);
  }

  blink() {
    return;
  }

  setColor(color) {
  }

  removeColor() {
  }

  isPrimary() {
    return this.referenceId == undefined;
  }

  // TODO: Anno-UI events 辺りで提供してほしい
  dispatchWindowEvent(eventName, data) {
    let event = document.createEvent('CustomEvent')
    event.initCustomEvent(eventName, true, true, data)
    window.dispatchEvent(event)
  }

  static createId(id, referenceId) {
    if (undefined == referenceId) {
      referenceId = '';
    } else {
      referenceId = `-${referenceId.replace(/[().#]/g, '_')}`;
    }
    return `${id}${referenceId}`;
  }
}

module.exports = Annotation;
