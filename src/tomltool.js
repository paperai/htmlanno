const TomlParser = require("toml");
const rangy = require("rangy");
const Highlight = require("./highlight.js");
const ArrowAnnotation = require("./arrowannotation.js");

exports.saveToml = (annotationSet)=>{
  let data = ["version = 0.1"];
  annotationSet.forEach((annotation)=>{
    data.push("");
    data.push(`[${annotation.getId()}]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

exports.loadToml = (fileBlob, highlighter, arrowConnector)=>{
  let reader = new FileReader();
  reader.onload = ()=>{
    let data = TomlParser.parse(reader.result);
    for(key in data) {
      if ("version" == key) {
        continue;
      }
    // Span.
      if (Highlight.isMydata(data[key])) {
        highlighter.addToml(key, data[key]);
      }
    // ArrowAnnotation(one-way).
      if (ArrowAnnotation.isMydata(data[key])) {
        arrowConnector.addToml(key, data[key]);
      }
    }
  };
  reader.onerror = ()=>{
    alert("Import failed.");  // TODO: UI実装後に適時変更
  };
  reader.onabort = ()=>{
    alert("Import aborted."); // TODO: UI実装後に適宜変更
  };

  reader.readAsText(fileBlob);
};
