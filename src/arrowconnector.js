const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

class ArrowConnector{
  constructor(annotationContainer){
    this.annotations = annotationContainer;
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
