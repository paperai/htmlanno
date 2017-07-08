class AnnotationSet{
  constructor(){
    this.annotations = new Array();
  }

  isAnnotation(obj){
    return (undefined != obj.equals && undefined != obj.getId);
  }

  nextId(){
    this.annotations.push(undefined);
    return this.annotations.length;
  }

  set(annotation){
    if (!this.isAnnotation(annotation)) {
      return false;
    }
    for(let i in this.annotations) {
      if (undefined != this.annotations[i]) {
        if (this.annotations[i].equals(annotation)) {
          return false;
        }
      }
    }
    // TODO: idが示す位置がundefinedで無い場合どうするか？
    this.annotations[annotation.getId() - 1] = annotation;
    return true;
  }

  get(id){
    return this.annotations[id - 1];
  }

  // TODO: 排他制御
  delete(annotationOrId){
    let elm = typeof(annotationOrId) === "number" ?
      this.get(annotationOrId):
      this.get(annotationOrId.getId());

    if (undefined != elm) {
      this.annotations[elm.getId() - 1] = undefined;
      return true;
    }
    return false;
  }

  forEach(callback){
    for(let i in this.annotations) {
      if (undefined != this.annotations[i]) {
        callback(this.annotations[i], i);
      }
    }
  }
}
module.exports = AnnotationSet;
