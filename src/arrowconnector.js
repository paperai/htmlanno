const RelationAnnotation = require("./relationannotation.js");

class ArrowConnector{
  constructor(annotationContainer){
    this.annotations = annotationContainer;
  }

  get(id){
    this.annotations.findById(id);
  }

  add(data){
    this.annotations.add(data);
  }

  createRelation(id, startingCircle, endingCircle, direction, text){
    let relation = new RelationAnnotation(id, startingCircle, endingCircle, direction);
    this.annotations.add(relation);
    relation.setContent(text);

    return relation;
  }

  addToml(id, toml){
    this.createRelation(
      id,
      this.annotations.findById(parseInt(toml.ids[0])).circle,
      this.annotations.findById(parseInt(toml.ids[1])).circle,
      toml.dir, toml.label
    );
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
