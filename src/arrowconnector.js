const ArrowAnnotation = require("./arrowannotation.js");

class ArrowConnector{
  constructor(annotationSet){
    this.annotations = annotationSet;
    this.dragingArrow = null;
  }

  get(id){
    this.annotations.get(id);
  }

  add(data){
    this.annotations.set(data.getId(), data);
  }

  createDragingArrow(startingCircle){
    if (this.dragingArrow){
      this.dragingArrow.remove();
    }
    const id = this.annotations.nextId();
    this.dragingArrow = new ArrowAnnotation(id, startingCircle);
    return this.dragingArrow;
  }

  create(id, startingCircle, endingCircle, text){
    const arrow = new ArrowAnnotation(id, startingCircle);
    this.annotations.set(arrow);
    arrow.setEndingCircle(endingCircle);
    arrow.label.setContent(text);
    return arrow;
  }

  addToml(id, toml){
    let startAnnotation   = this.annotations.get(parseInt(toml.ids[0]));
    let enteredAnnotation = this.annotations.get(parseInt(toml.ids[1]));
    this.create(
      id,
      startAnnotation.circle, enteredAnnotation.circle,
      toml.label
    );
  }

  remove(){
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof ArrowAnnotation) {
        this.annotations.delete(i);
      }
    });
  }

  removeAnnotation(arrow){
    this.annotations.delete(arrow);
  }
}

module.exports = ArrowConnector;
