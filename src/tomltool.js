const TomlParser = require("toml");
const SpanAnnotation = require("./spanannotation.js");
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

const renderAnnotation = (annotationFileObj, tomlObj, highlighter, arrowConnector, referenceId, colorMap, viewer) => {
  for(key in tomlObj) {
    if ("version" == key) {
      continue;
    }
    let annotation = undefined;
    // Span.
    if (SpanAnnotation.isMydata(tomlObj[key])) {
      annotation = highlighter.addToml(key, tomlObj[key], referenceId, viewer);
      if (null != annotation) {
        annotation.setColor(_getColor(colorMap, annotation.type, annotation.text));
        annotation.setFileContent(annotationFileObj);
      }
    }
    // Relation(one-way, two-way, or link)
    if (RelationAnnotation.isMydata(tomlObj[key])) {
      annotation = arrowConnector.addToml(key, tomlObj[key], referenceId);
      if (null != annotation) {
        annotation.setColor(_getColor(colorMap, annotation.direction, annotation.text));
        annotation.setFileContent(annotationFileObj);
      }
    }
    if (null == annotation) {
      console.log(`Cannot create an annotation. id: ${key}, referenceId: ${referenceId}, toml(the following).`);
      console.log(tomlObj[key]);
    }
  }
};

/**
 * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
 * @param highlighter ... SpanAnnotation annotation container.
 * @param arrowConnector ... Relation annotation container.
 * @param referenceId (optional) ... Used to identify annotations.
 * @param colorMap
 * @param viewer HtmlViewer obj, etc.
 */
exports.loadToml = (annotationFileObj, highlighter, arrowConnector, referenceId, colorMap, viewer) => {
  const toml = 'string' == typeof(annotationFileObj.content) ?
    TomlParser.parse(annotationFileObj.content) :
    annotationFileObj.content;

  renderAnnotation(annotationFileObj, toml, highlighter, arrowConnector, referenceId, colorMap, viewer);
};

function _getColor(colorMap, type, labelText) {
  return undefined != colorMap[type][labelText] ? colorMap[type][labelText] : colorMap.default;
}

