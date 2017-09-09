const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

class ArrowConnector{
  constructor(annotationContainer){
    this.annotations = annotationContainer;
  }

  get(id, referenceId){
    this.annotations.findById(Annotation.createId(id, referenceId));
  }

  add(data){
    this.annotations.add(data);
  }

  createRelation(id, startingCircle, endingCircle, direction, text, referenceId){
    let relation = new RelationAnnotation(id, startingCircle, endingCircle, direction, referenceId);
    this.annotations.add(relation);
    relation.setContent(text);

    return relation;
  }

  addToml(id, toml, referenceId){
    return this.createRelation(
      id,
      this.annotations.findById(
        Annotation.createId(parseInt(toml.ids[0]), referenceId)
      ).circle,
      this.annotations.findById(
        Annotation.createId(parseInt(toml.ids[1]), referenceId)
      ).circle,
      toml.dir, toml.label,
      referenceId
    );
  }

  remove(referenceId){
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof RelationAnnotation) {
        if (undefined != referenceId) {
          if (referenceId == annotation.getReferenceId()) {
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
