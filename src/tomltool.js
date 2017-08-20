const TomlParser = require("toml");
const rangy = require("rangy");
const Highlight = require("./highlight.js");
const RelationAnnotation = require("./relationannotation.js");

exports.saveToml = (annotationSet)=>{
  let data = ["version = 0.1"];
  annotationSet.forEach((annotation)=>{
    data.push("");
    data.push(`[${annotation.getId()}]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

/**
 * @param fileBlobOrText ... File(Blob) object that created by &lt;file&gt; tag.
 * @param highlighter ... Highlight annotation containr.
 * @param arrowConnector ... Relation annotation container.
 * @param extension (optional) ... Used to identify annotations.
 */
exports.loadToml = (fileBlobOrText, highlighter, arrowConnector, extension)=>{
  const renderAnnotation = (toml)=>{
    let data = TomlParser.parse(toml);
    for(key in data) {
      if ("version" == key) {
        continue;
      }
      let annotation = undefined;
      // Span.
      if (Highlight.isMydata(data[key])) {
        annotation = highlighter.addToml(key, data[key]);
      }
      // Relation(one-way, two-way, or link)
      if (RelationAnnotation.isMydata(data[key])) {
        annotation = arrowConnector.addToml(key, data[key]);
      }
      if (undefined != extension) {
        annotation.setExtension(extension);
      }
    }
  };

  if ('string' == typeof(fileBlobOrText)) {
    renderAnnotation(fileBlobOrText);
  } else{
    let reader = new FileReader();
    reader.onload = ()=>{
      renderAnnotation(reader.result);
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

