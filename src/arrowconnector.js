const ArrowAnnotation = require("./arrowannotation.js");

class ArrowConnector{
  constructor(){
    this.arrowAnnotations = new Map();
    this.dragingArrow = null;
  }

  get(id){
    this.arrowAnnotations.get(id);
  }

  add(data){
    this.arrowAnnotations.set(data.id, data);
  }

  maxId(){
    let maxId = 0;
    for (let [id, value] of this.arrowAnnotations) {
      maxId = Math.max(maxId, id);
    }
    return maxId;
  }

  createDragingArrow(startingCircle){
    if (this.dragingArrow){
      this.dragingArrow.remove();
    }
    const id = this.maxId() + 1;
    this.dragingArrow = new ArrowAnnotation(id, startingCircle);
    return this.dragingArrow;
  }

  create(id, startingCircle, endingCircle, text){
    const arrow = new ArrowAnnotation(id, startingCircle);
    this.arrowAnnotations.set(id, arrow);
    arrow.setEndingCircle(endingCircle);
    arrow.label.setContent(text);
    return arrow;
  }

  remove(){
    this.arrowAnnotations.forEach((e)=>{
      e.remove();
    });
    this.arrowAnnotations = new Map();
  }

  removeAnnotation(arrow){
    this.arrowAnnotations.delete(arrow.id);
  }
}

module.exports = ArrowConnector;
