const TomlParser = require("toml");
const rangy = require("rangy");
const Highlight = require("./highlight.js");
const ArrowAnnotation = require("./arrowannotation.js");

exports.saveToml = (annotationMaps)=>{
  let data = ["version = 0.1"];
  let counter = 1;
  annotationMaps.forEach((annotationMap)=>{
    annotationMap.forEach((annotation)=>{
      data.push("");
      data.push(`[${counter}]`);
      data.push(annotation.saveToml());

      counter ++;
    });
  });
  return [data.join("\n")];
};

exports.loadToml = (fileBlob, highlighter, arrowConnector)=>{
  let reader = new FileReader();
  reader.onload = ()=>{
    let data = TomlParser.parse(reader.result);
  // Span.
    for(key in data) {
      if ("version" == key) {
        continue;
      }
      let table = data[key];
      if (Highlight.isMydata(table)) {
        highlighter.selectRange(table.position[0], table.position[1]);
        let span = highlighter.highlight();
        span.label.setContent(table.label);
        span.blur();
      }
    }
  // ArrowAnnotation(one-way).
    for(key in data) {
      if ("version" == key) {
        continue;
      }
      let table = data[key];
      if (ArrowAnnotation.isMydata(table)) {
        let arrowId = arrowConnector.maxId() + 1;
        let startAnnotation = highlighter.get(parseInt(table.ids[0]));
        let enteredAnnotation = highlighter.get(parseInt(table.ids[1]));
        arrowConnector.create(arrowId, startAnnotation.circle, enteredAnnotation.circle, table.label);
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
