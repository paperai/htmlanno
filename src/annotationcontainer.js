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

  // TODO: pdfanno only
  getAllAnnotations(){
  }

  // TODO: pdfanno only
  getSelectedAnnotations(){
  }

  // TODO: pdfanno only
  enableAll(){
  }

  // TODO: pdfanno only
  disableAll(){
  }
}
module.exports = AnnotationContainer;
