const TomlParser = require("toml");
const rangy = require("rangy");
const Highlight = require("./highlight.js");
const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

exports.saveToml = (annotationSet)=>{
  let data = ["version = 0.1"];
  annotationSet.forEach((annotation)=>{
    data.push("");
    data.push(`[${annotation.getId()}]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

exports.renderAnnotation = (tomlObj, highlighter, arrowConnector, referenceId, color) => {
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
  }
};

/**
 * @param objectOrText ... TomlObject(Hash) or Toml source text.
 * @param highlighter ... Highlight annotation containr.
 * @param arrowConnector ... Relation annotation container.
 * @param referenceId (optional) ... Used to identify annotations.
 */
exports.loadToml = (objectOrText, highlighter, arrowConnector, referenceId, color)=>{
  if ('string' == typeof(objectOrText)) {
    exports.renderAnnotation(TomlParser.parse(objectOrText), highlighter, arrowConnector, referenceId, color);
  } else{
    exports.renderAnnotation(objectOrText, highlighter, arrowConnector, referenceId, color);
  }
};
