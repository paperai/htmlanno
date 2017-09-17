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

  // TODO: 排他制御
  remove(annotationOrId){
    let elm = typeof(annotationOrId) === "string" ?
      this.findById(annotationOrId):
      this.findById(annotationOrId.getId());

    if (undefined != elm) {
      if (undefined != elm.remove) {
        elm.remove();
      }
      return this.set.delete(elm);
    }
    return false;
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
   * Get all annotations from the container.
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

  // TODO: pdfanno only
  enableAll(){
  }

  // TODO: pdfanno only
  disableAll(){
  }
}
module.exports = AnnotationContainer;
