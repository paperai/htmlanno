const RelationAnnotation = require("./relationannotation.js");

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

  _createRelation(relation, endingCircle, text){
    this.annotations.add(relation);
    relation.setEndingCircle(endingCircle);
    relation.label.setContent(text);

    return relation;
  }

  createOnewayRelation(id, startingCircle, endingCircle, text){
    const relation = RelationAnnotation.createOneway(id, startingCircle);

    return this._createRelation(relation, endingCircle, text);
  }

  createTwowayRelation(id, startingCircle, endingCircle, text){
    const relation = RelationAnnotation.createTwoway(id, startingCircle);

    return this._createRelation(relation, endingCircle, text);
  }

  createLinkRelation(id, startingCircle, endingCircle, text){
    const relation = RelationAnnotation.createLink(id, startingCircle);

    return this._createRelation(relation, endingCircle, text);
  }

  addToml(id, toml){
    let startAnnotation   = this.annotations.findById(parseInt(toml.ids[0]));
    let enteredAnnotation = this.annotations.findById(parseInt(toml.ids[1]));

    const relation =
      new RelationAnnotation(id, startAnnotation.circle, toml.dir);
    this._createRelation(relation, enteredAnnotation.circle, toml.label);
  }

  remove(){
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof RelationAnnotation) {
        this.annotations.remove(i);
      }
    });
  }

  removeAnnotation(arrow){
    this.annotations.remove(arrow);
  }
}

module.exports = ArrowConnector;
