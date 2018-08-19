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

// TODO: 要整理。viewer.reflectBuffer() 後でないとRelationAnnotationをレンダリングできないので2周している
exports.renderAnnotation = (annotationFileObj, tomlObj, referenceId, colorMap, viewer) => {
  for(key in tomlObj) {
    if (key === SpanAnnotation.Type + 's') {
      // Span.
      _parseToml(annotationFileObj, tomlObj[key], referenceId, colorMap, viewer, SpanAnnotation);
    }
  }
  viewer.reflectBuffer();

  for(key in tomlObj) {
    if (key === RelationAnnotation.Type + 's') {
      // Relation.
      // TODO: viewerは現状使用しないがコード共通化のため渡している
      _parseToml(annotationFileObj, tomlObj[key], referenceId, colorMap, viewer, RelationAnnotation);
    } else if (key !== 'version' && key !== SpanAnnotation.Type + 's') {
      console.log(tomlObj);
      throw `Unknown key type; ${key}`;
    } 
  }
};

/**
 * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
 * @param referenceId (optional) ... Used to identify annotations.
 * @param viewer HtmlViewer
 */
exports.loadToml = (annotationFileObj, referenceId, colorMap, viewer) => {
  const toml = typeof(annotationFileObj.content) === 'string' ?
    TomlParser.parse(annotationFileObj.content) :
    annotationFileObj.content;

  exports.renderAnnotation(annotationFileObj, toml, referenceId, colorMap, viewer);
};

function _getColor(colorMap, type, labelText) {
  return undefined != colorMap[type][labelText] ? colorMap[type][labelText] : colorMap.default;
}

function _parseToml(annotationFileObj, tomlList, referenceId, colorMap, viewer, annotationClass) {
  tomlList.forEach((anToml) => {
    const annotation = annotationClass.parseToml(
      anToml, _getColor(colorMap, annotationClass.Type, anToml.label), viewer, referenceId
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
