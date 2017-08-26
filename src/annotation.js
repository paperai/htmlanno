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
