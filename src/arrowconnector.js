const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

class ArrowConnector{
  constructor(annotationContainer){
    this.annotations = annotationContainer;
  }

  addToml(toml, referenceId){
    let startingHighlight = undefined;
    let endingHighlight = undefined;
    annotationContainer.forEach((annotation) => {
      if (annotation._id == toml.head) {
        startingHighlight = annotation;
      }
      if (annotation._id == toml.tail) {
        endingHighlight = annotation;
      }
    });
    if (undefined != startingHighlight && undefined != endingHighlight) {
      const relation = new RelationAnnotation(
        startingHighlight.circle, endingHighlight.circle,
        'relation', // direction
        referenceId
      );
      relation.setContent(toml.label);
      annotationContainer.add(relation);

      return relation;
    } else {
      return null;
    }
  }

  remove(referenceId){
    let promises = [];
    this.annotations.forEach((annotation, i)=>{
      if (annotation instanceof RelationAnnotation) {
        if (undefined != referenceId) {
          if (referenceId == annotation.getReferenceId()) {
            promises.push(new Promise((resolve, reject) => {
              this.annotations.remove(i);
              resolve(annotation);
            })); 
          }
        } else {
          promises.push(new Promise((resolve, reject) => {
            this.annotations.remove(i);
            resolve(annotation);
          }));
        }
      }
    });
    return Promise.all(promises);
  }

  removeAnnotation(arrow){
    this.annotations.remove(arrow);
  }
}

module.exports = ArrowConnector;
