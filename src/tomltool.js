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
    if (undefined != color) {
      annotation.setColor(color);
    }
  }
};

/**
 * @param fileBlobOrText ... File(Blob) object that created by &lt;file&gt; tag.
 * @param highlighter ... Highlight annotation containr.
 * @param arrowConnector ... Relation annotation container.
 * @param referenceId (optional) ... Used to identify annotations.
 */
exports.loadToml = (fileBlobOrText, highlighter, arrowConnector, referenceId, color)=>{
  if ('string' == typeof(fileBlobOrText)) {
    exports.renderAnnotation(TomlParser.parse(fileBlobOrText), highlighter, arrowConnector, referenceId, color);
  } else{
    let reader = new FileReader();
    reader.onload = ()=>{
      exports.renderAnnotation(TomlParser.parse(reader.result), highlighter, arrowConnector, referenceId, color);
    }
    reader.onerror = ()=>{
      alert("Import failed.");  // TODO: UI実装後に適時変更
    };
    reader.onabort = ()=>{
      alert("Import aborted."); // TODO: UI実装後に適宜変更
    };

    reader.readAsText(fileBlob);
  }
};
