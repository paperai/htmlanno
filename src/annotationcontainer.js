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

  findById(id){
    let obj = null;
    this.set.forEach((elm)=>{
      if (elm.getId() == id) {
        obj = elm;
      }
    });
    return obj;
  }

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
   */
  removeAll(referenceId) {
    this.forEach((annotation) => {
      this._removeIfDefined(annotation);
    });
    this.set = new Set();
  }

  /**
   * Remove all primary annotation.
   */
  removePrimaryAll() {
    const newSet = new Set();
    this.forEach((annotation) => {
      if (annotation.isPrimary()) {
        this._removeIfDefined(annotation);
      } else {
        newSet.add(annotation);
      }
    });
    this.set = newSet;
  }

  /**
   * Remove all the specified reference annotation.
   * @param referenceId ... referenceId of target reference annotations.
   */
  removeReference(referenceId) {
    if (undefined == referenceId) {
      throw new "referenceId is undefined."
    }
    const newSet = new Set();
    this.forEach((annotation) => {
      if (referenceId == annotation.getReferenceId()) {
        this._removeIfDefined(annotation);
      } else {
        newSet.add(annotation);
      }
    });
    this.set = newSet;
  }

  _removeIfDefined(object) {
    return undefined == object.remove ? undefined : object.remove();
  }

  /**
   * htmlanno only
   */
  forEach(callback){
    this.set.forEach(callback);
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
    let list = [];
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
    let list = [];
    this.set.forEach((a) => {
      if (a.isPrimary()) {
        list.push(a);
      }
    });
    return list;
  }

  // TODO: pdfanno only
  enableAll(){
  }

  // TODO: pdfanno only
  disableAll(){
  }
}
module.exports = AnnotationContainer;
