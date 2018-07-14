const AnnoUI = require('anno-ui');

class Annotation {
  constructor(referenceId) {
    this.referenceId = referenceId;
    this._selected = false;
    this._selectedTimestamp = undefined;
    this._uuid = AnnoUI.util.uuid();
    this.__id = undefined;
    this._cache_id = null;
    this._fileContent = undefined;
  }

  getId() {
    if (this._cache_id == null) {
      this._cache_id = Annotation.createId(this._uuid, this.referenceId);
    }
    return this._cache_id;
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

  set text(value) {
    this.setContent(value);
  }

  /**
   * Returns the Y coordinate of the annotation object.
   * this method expects ths subclass to override.
   */
  get scrollTop() {
    return 0;
  }

  /**
   * @return this annotation is selected (on GUI)
   *
   * when need to check annotation file is selected or not, use AnnotationFileObj.select.
   */
  get selected() {
    return this._selected;
  }

  /**
   * Set annotation selected status (on GUI)
   */
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

  /**
   * true is Primary annotation
   * Note:
   * _fileContent.primary can not use for primary/reference check,  because that is shared between primary and reference.
   */
  isPrimary() {
    return undefined == this.referenceId;
  }

  /**
   * true is Reference annotation
   * Note:
   * _fileContent.primary can not use for primary/reference check,  because that is shared between primary and reference.
   */
  isReference() {
    return undefined != this.referenceId;
  }

  /**
   * set fileContent that is created by FileContainer#loadFiles(), other name is "AnnotationFileObj".
   */
  setFileContent(newValue) {
    this._fileContent = newValue;
  }

  /**
   * @return AnnotationFileObj.name (nearlly equal <filename>.htmlanno)
   */
  get fileContentName() {
    return undefined == this._fileContent ? null : this._fileContent.name;
  }

  /**
   * true is the annotation can edit and delete.(reference annotation can not editable)
   */
  isEditable() {
    return !this.isReference();
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
