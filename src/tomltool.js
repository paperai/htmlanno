const TomlParser = require("toml");
const Highlight = require("./highlight.js");
const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

exports.saveToml = (annotationSet)=>{
  const data = ["version = 0.1"];
  let id = 1;
  annotationSet.forEach((annotation)=>{
    annotation._id = id;
    id ++;
  });
  annotationSet.forEach((annotation)=>{
    data.push("");
    data.push(`[${annotation._id}]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

exports.renderAnnotation = (annotationFileObj, tomlObj, highlighter, arrowConnector, referenceId, color) => {
  for(key in tomlObj) {
    if ("version" == key) {
      continue;
    }
    let annotation = undefined;
    // Span.
    if (Highlight.isMydata(tomlObj[key])) {
      annotation = highlighter.addToml(key, tomlObj[key], referenceId);
    }
    // Relation(one-way, two-way, or link)
    if (RelationAnnotation.isMydata(tomlObj[key])) {
      annotation = arrowConnector.addToml(key, tomlObj[key], referenceId);
    }
    if (null == annotation) {
      console.log(`Cannot create an annotation. id: ${key}, referenceId: ${referenceId}, toml(the following).`);
      console.log(tomlObj[key]);
    } else if (undefined != color) {
      annotation.setColor(color);
    }
    annotation.setFileContent(annotationFileObj);
  }
};

/**
 * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
 * @param highlighter ... Highlight annotation containr.
 * @param arrowConnector ... Relation annotation container.
 * @param referenceId (optional) ... Used to identify annotations.
 */
exports.loadToml = (annotationFileObj, highlighter, arrowConnector, referenceId, color)=>{
  const toml = 'string' == typeof(annotationFileObj.content) ?
    TomlParser.parse(annotationFileObj.content) :
    annotationFileObj.content;

  exports.renderAnnotation(annotationFileObj, toml, highlighter, arrowConnector, referenceId, color);
};
