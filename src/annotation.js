class Annotation {
  constructor(id, referenceId) {
    this.id = id;
    this.referenceId = referenceId;
  }

  getId() {
    return Annotation.createId(this.id, this.referenceId);
  }

  getReferenceId() {
    return this.referenceId;
  }

  /**
   * Returns annotation object Identifier (Unique in all(highlight and relation) object).
   * This method expects the subclass to implement #getClassName ().
   *
   * For Anno-ui annoListDropDown. This interface calls `annotation.uuid` as the identifier.
   */
  get uuid() {
    return this.getId();
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

  blink() {
    return;
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
