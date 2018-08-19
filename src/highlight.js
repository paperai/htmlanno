const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

class Highlight {
  constructor(startOffset, endOffset, htmlClassName, baseNode) {
    this._startOffset = startOffset;
    this._endOffset   = endOffset;
    this._baseNode = baseNode;
    this.htmlClassName = htmlClassName;

    this._createDom(this._startOffset, this._endOffset);
  }

  get className() {
    return this.htmlClassName;
  }

  get BASE_NODE() {
    return this._baseNode;
  }

  get SCROLL_BASE_NODE_ID() {
    return 'viewerWrapper';
  }

  get startOffset() {
    return this._startOffset;
  }

  get endOffset() {
    return this._endOffset;
  }

  get scrollOffset() {
    return this._searchNodeScrollRoot(this.domElements[0]).offsetTop;
  }

  addClass(name){
    this.domElements.forEach((e)=>{
      $(e).addClass(name);
    });
  }

  removeClass(name) {
    this.domElements.forEach((e)=>{
      $(e).removeClass(name);
    });
  }

  _createDom(startOffset, endOffset) {
    const range = this._selectRange(startOffset, endOffset, this.BASE_NODE);
    const temporaryElements = [];
    const classApplier = rangy.createClassApplier(
      this.className,
      {
        ignoreWhiteSpace: true,
        onElementCreate: (element)=>{temporaryElements.push(element)},
        useExistingElements: false
      }
    );
    classApplier.applyToRange(range);

    if (temporaryElements.length > 0){
      this.domElements = temporaryElements;
    }
  }

  _selectRange(startBodyOffset, endBodyOffset, baseNode) {
    if (startBodyOffset > endBodyOffset){
      const tmp = startBodyOffset;
      startBodyOffset = endBodyOffset;
      endBodyOffset = tmp;
    }

    const start = this._nodeFromTextOffset(startBodyOffset);
    const end = this._nodeFromTextOffset(endBodyOffset);
    const range = rangy.createRangyRange(baseNode);
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    return range;
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

  _searchNodeScrollRoot(element) {
    while(element.offsetParent.id != this.SCROLL_BASE_NODE_ID && element.offsetParent != null) {
      element = element.offsetParent;
    }
    return element;
  }
}

module.exports = Highlight;
