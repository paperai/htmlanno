class AnnotationContainer{
  constructor(){
    this.set = new Set();
    this.maxId = 0;
  }

  /**
   * htmlanno only
   */
  isAnnotation(obj){
    return (undefined != obj.equals && undefined != obj.getId);
  }

  /**
   * Issue a ID for annotation object.
   *
   * htmlanno only
   */
  nextId(){
    return ++this.maxId;
  }

  add(annotation){
    if (!this.isAnnotation(annotation)) {
      return false;
    }
    this.maxId = Math.max(this.maxId, parseInt(annotation.getId()));
    this.set.add(annotation);
    return true;
  }

  // id = annotation.uuid + annotation.referenceId
  findById(id) {
    for(const annotation of this.set) {
      if (id == annotation.getId()) {
        return annotation;
      }
    }
    return null;
  }

  findByUuid(uuid) {
    for(const annotation of this.set) {
      if (uuid == annotation.uuid) {
        return annotation;
      }
    }
    return null;
  }

  /**
   * Remove an annotation.
   *
   * @param annotationOrId ... Annotation object or Annotation#getId() value
   * @return removed Annotation object or false(when specified annotation does not find).
   */
  remove(annotationOrId){
    const elm = typeof(annotationOrId) === "string" ?
      this.findById(annotationOrId):
      this.findById(annotationOrId.getId());

    if (undefined != elm) {
      this._removeIfDefined(elm);
      return this.set.delete(elm);
    }
    return false;
  }

  /**
   * Remove all annotation(primary and reference).
   *
   * This method use Batch-removing mode.
   */
  removeAll(referenceId) {
    this.forEach((annotation) => {
      this._removeIfDefined(annotation, true);
    });
    this.set = new Set();
  }

  /**
   * Remove all primary annotation.
   *
   * This method use Batch-removing mode.
   */
  removePrimaryAll() {
    const newSet = new Set();
    const removed = [];
    this.forEach((annotation) => {
      if (annotation.isPrimary()) {
        this._removeIfDefined(annotation, true);
        removed.push(annotation);
      } else {
        newSet.add(annotation);
      }
    });
    this.set = newSet;
    return removed;
  }

  /**
   * Remove all the specified reference annotation.
   * @param referenceId ... referenceId of target reference annotations.
   * @return Array that includes removed annotation objects;
   *
   * This method use Batch-removing mode.
   */
  removeReference(referenceId) {
    if (undefined == referenceId) {
      throw new "referenceId is undefined."
    }
    const newSet = new Set();
    const removed = [];
    this.forEach((annotation) => {
      if (referenceId == annotation.getReferenceId()) {
        this._removeIfDefined(annotation, true);
        removed.push(annotation);
      } else {
        newSet.add(annotation);
      }
    });
    this.set = newSet;
    return removed;
  }

  /**
   * Real removing process.
   */
  _removeIfDefined(object, batch = false) {
    return undefined == object.remove ? undefined : object.remove(batch);
  }

  /**
   * htmlanno only
   */
  forEach(callback){
    this.set.forEach(callback);
  }

  /**
   * htmlanno only
   */
  forEachPromise(callback) {
    const promises = [];
    this.set.forEach((annotation) => {
      promises.push(new Promise((resolve, reject) => {
        resolve(callback(annotation));
      }));
    });
    return Promise.all(promises).then();
  }

  // TODO: pdfanno only
  destroy(){
  }

  filter(callback) {
    let newContainer = new AnnotationContainer();
    this.set.forEach((elm) => {
      if (callback(elm)) {
        newContainer.add(elm);
      }
    });
    return newContainer;
  }

  /**
   * Get all annotation from the container.
   */
  getAllAnnotations(){
    let list = [];
    this.set.forEach(a => list.push(a));
    return list;
  }

  getSelectedAnnotations(){
    const list = [];
    this.set.forEach((annotation) => {
      if (annotation.selected) {
        list.push(annotation);
      }
    });
    return list;
  }

  /**
   * Get all primary annotation from container.
   */
  getPrimaryAnnotations() {
    const list = [];
    this.set.forEach((annotation) => {
      if (annotation.isPrimary()) {
        list.push(annotation);
      }
    });
    return list;
  }

  // For labelInput: colorChangeListener -> notifyColorChanged
  /**
   * @param query { text, color, uuid, annoType }
   *  text: label text
   *  color: pickuped color(hex string)
   *  uuid: annotation's uuid(when end edit label text only)
   *  annoType: 'span' and 'relation'
   *
   * when end edit label text; uuid and color
   * when change color on color picker; text, color, and annoType
   */
  setColor(query) {
    if (undefined != query.text) {
      return this.forEachPromise((annotation) => {
        if (query.text == annotation.text) {
          switch(query.annoType) {
            case 'span':
              if (query.annoType == annotation.type) {
                annotation.setColor(query.color);
                return true;
              }
              break;

            case 'relation':
              if ('relation' == annotation.type && query.annoType == annotation.direction ) {
                annotation.setColor(query.color);
                return true;
              }
              break;

            default:
              return false;
          }
        } else {
          return false;
        }
      }).then();
    } else if (undefined != query.uuid) {
      return new Promise((resolve, reject) => {
        this.findByUuid(query.uuid).setColor(query.color);
        resolve(true);
      }).then();
    }
  }

  get size() {
    return this.set.size;
  }
 
  // TODO: pdfanno only
  enableAll(){
  }

  // TODO: pdfanno only
  disableAll(){
  }
}
module.exports = AnnotationContainer;
