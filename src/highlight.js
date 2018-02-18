const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

class Highlight {
  constructor(startOffset, endOffset, htmlClassName) {
    this.startOffset = startOffset;
    this.endOffset   = endOffset;
    this.htmlClassName =
      undefined == htmlClassName ? 'htmlanno-search-result' : htmlClassName;

    this._createDom(this.startOffset, this.endOffset);
  }

  get className() {
    return this.htmlClassName;
  }

  // 定数扱い
  get BASE_NODE(){
    return document.getElementById("viewer");
  }

  _createDom(startOffset, endOffset) {
    const selection = this._selectRange(startOffset, endOffset);
    const temporaryElements = [];
    const highlighter = rangy.createHighlighter();
    highlighter.addClassApplier(rangy.createClassApplier(
      this.className,
      {
        ignoreWhiteSpace: true,
        onElementCreate: (element)=>{temporaryElements.push(element)},
        useExistingElements: false
      }
    ));

    highlighter.highlightSelection(
      this.className,
      {exclusive: false}
    );
    if (temporaryElements.length > 0){
      this.domElements = temporaryElements;
    }
    selection.removeAllRanges();
  }

  _selectRange(startBodyOffset, endBodyOffset) {
    if (startBodyOffset > endBodyOffset){
      const tmp = startBodyOffset;
      startBodyOffset = endBodyOffset;
      endBodyOffset = tmp;
    }

    const start = this._nodeFromTextOffset(startBodyOffset);
    const end = this._nodeFromTextOffset(endBodyOffset);
    const selection = rangy.getSelection();
    const range = rangy.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.setSingleRange(range);

    return selection;
  }

  _nodeFromTextOffset(offset, node){
    if (undefined == node) {
      node = this.BASE_NODE;
    }
    for (let i = 0; i < node.childNodes.length ; i++){
      const child = node.childNodes[i];

      if (child.nodeName == "#text"){
        if (offset <= child.textContent.length){
          return {offset:offset, node:child};
        }
        offset -= child.textContent.length;
      } else{
        const ret = this._nodeFromTextOffset(offset, child);
        if (ret.node){
          return ret;
        }
        offset = ret.offset;
      }
    }

    return {offset:offset, node:null};
  }
}

module.exports = Highlight;
