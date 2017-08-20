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
    return this.createRelation(
      id,
      this.annotations.findById(parseInt(toml.ids[0])).circle,
      this.annotations.findById(parseInt(toml.ids[1])).circle,
      toml.dir, toml.label
    );
  }

  remove(extension){
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof RelationAnnotation) {
        if (undefined != extension) {
          if (extension == annotation.extension()) {
            this.annotations.remove(i);
           }
        } else {
          this.annotations.remove(i);
        }
      }
    });
  }

  removeAnnotation(arrow){
    this.annotations.remove(arrow);
  }
}

module.exports = ArrowConnector;
