const TomlParser = require("toml");
const SpanAnnotation = require("./spanannotation.js");
const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

// TODO: change to AnnotationContainer.exportData (on pdfanno)
exports.saveToml = (annotationSet)=>{
  const data = ['version = "0.2.0"'];
  let id = 1;
  annotationSet.forEach((annotation)=>{
    annotation._id = id;
    id ++;
  });
  annotationSet.forEach((annotation)=>{
    data.push("");
    // Annotation.type is 'span' and 'relation', but it on TOML is 'span`s`' and 'relation`s`'
    data.push(`[[${annotation.type}s]]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

exports.renderAnnotation = (annotationFileObj, tomlObj, referenceId, colorMap) => {
  for(key in tomlObj) {
    switch(key) {
      case 'version':
        continue;

      case SpanAnnotation.Type + 's': // Span.
        _parseToml(annotationFileObj, tomlObj[key], referenceId, colorMap, SpanAnnotation);
        break;

      case RelationAnnotation.Type + 's': // Relation.
        _parseToml(annotationFileObj, tomlObj[key], referenceId, colorMap, RelationAnnotation);
        break;

      default:
        console.log(tomlObj);
        throw `Unknown key type; ${key}`;
    } 
  }
};

/**
 * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
 * @param referenceId (optional) ... Used to identify annotations.
 */
exports.loadToml = (annotationFileObj, referenceId, colorMap) => {
  const toml = typeof(annotationFileObj.content) === 'string' ?
    TomlParser.parse(annotationFileObj.content) :
    annotationFileObj.content;

  exports.renderAnnotation(annotationFileObj, toml, referenceId, colorMap);
};

function _getColor(colorMap, type, labelText) {
  return undefined != colorMap[type][labelText] ? colorMap[type][labelText] : colorMap.default;
}

function _parseToml(annotationFileObj, tomlList, referenceId, colorMap, annotationClass) {
  tomlList.forEach((anToml) => {
    const annotation = annotationClass.parseToml(
      anToml, _getColor(colorMap, annotationClass.Type, anToml.label), referenceId
    );
    if (annotation === null) {
      console.log(`Cannot create an annotation. referenceId: ${referenceId}, toml(the following).`);
      console.log(anToml);
    } else {
      annotation.setFileContent(annotationFileObj);
      annotationContainer.add(annotation);
    }
  });
}
