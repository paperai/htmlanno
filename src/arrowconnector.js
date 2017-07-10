const ArrowAnnotation = require("./arrowannotation.js");

class ArrowConnector{
  constructor(annotationContainer){
    this.annotations = annotationContainer;
    this.dragingArrow = null;
  }

  get(id){
    this.annotations.findById(id);
  }

  add(data){
    this.annotations.add(data);
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
    this.annotations.add(arrow);
    arrow.setEndingCircle(endingCircle);
    arrow.label.setContent(text);
    return arrow;
  }

  addToml(id, toml){
    let startAnnotation   = this.annotations.findById(parseInt(toml.ids[0]));
    let enteredAnnotation = this.annotations.findById(parseInt(toml.ids[1]));
    this.create(
      id,
      startAnnotation.circle, enteredAnnotation.circle,
      toml.label
    );
  }

  remove(){
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof ArrowAnnotation) {
        this.annotations.remove(i);
      }
    });
  }

  removeAnnotation(arrow){
    this.annotations.remove(arrow);
  }
}

module.exports = ArrowConnector;
