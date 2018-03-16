const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

class Highlight {
  constructor(startOffset, endOffset, htmlClassName, base_node) {
    this._startOffset = startOffset;
    this._endOffset   = endOffset;
    this.htmlClassName = htmlClassName;
    this.base_node = base_node === undefined ? document.getElementById("viewer") : base_node;

    this._createDom(this._startOffset, this._endOffset);
  }

  get className() {
    return this.htmlClassName;
  }

  get BASE_NODE() {
    return this.base_node;
  }

  get SCROLL_BASE_NODE_ID() {
    return 'viewerWrapper';
  }

  get startOffset() {
    return this.startOffset;
  }

  get endOffset() {
    return this.endOffset;
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

  /**
   * 1. _startOffset, _endOffsetが含まれるテキストノードを探す -> range
   * 2. range.start.node === range.end.node の場合、ハイライトタグで括ったのち
   *     2-1. parentNode.childNodes の中から range.start.node(end.nodeでもよい)を探しだす
   *     2-2. 探し出したノードをstart.nodeの先頭からstart.offsetまでと入替
   *     2-3. 探し出したノードの直後にハイライトタグノードを追加
   *     2-4. ハイライトタグノードの直後にstart.nodeのend.offset以降を追加
   * 3. range.start.node !== range.end.node の場合、
   *     3-1. parentNode.childNodes の中から range.start.nodeを探し出す
   *     3-2. 探し出したノードをstart.nodeの先頭からstart.offsetまでと入替
   *     3-3. start.nodeのstart.offset以降からstart.node末尾までをハイライトタグで括る(ハイライトタグA)
   *     3-4. ハイライトタグAを探し出したノードの直後に追加
   *     3-5. end.nodeに達するまで、start.node以降のparentNode.childeNodes要素を処理
   *         3-5-1. 隣接ノードのchildNodes(1-n) を処理
   *             3-5-1-1, テキストノードまで下る
   *             3-5-1-2. 下って見つけたテキストノード全体をハイライトタグで括る(ハイライトタグBn)
   *             3-5-1-3. 下って見つけたテキストノードのparentNode.innerHTMLをハイライトタグBnと入替
   *     3-6. end.nodeの先頭からend.offsetまでをハイライトタグで括る(ハイライトタグC)
   *     3-7. parentNode.childNodesのend.nodeをハイライトタグCと入替
   *     3-8. end.nodeのend.offset以降をハイライトタグCの直後に追加
   */
  _createDom(_startOffset, _endOffset) {
    const range = this._selectRange(_startOffset, _endOffset);
    const parts = [];
    parts.push(range.start.node.textContent.substr(0, range.start.offset));
    parts.push('<span class="' + this.className + '">');
    if (range.start.node === range.end.node) {
      parts.push(range.start.node.textContent.substr(range.start.offset, (range.end.offset - range.start.offset)));
    } else {
      parts.push(range.start.node.textContent.substr(range.start.offset));
      parts.push('</span>');
      parts.push('<span class="' + this.className + '">');
      parts.push(range.end.node.textContent.substr(0, range.end.offset));
    }
    parts.push('</span>');
    parts.push(range.end.node.textContent.substr(range.end.offset));
    if (range.start.node === range.end.node && range.start.node.parentNode.childNodes.length === 1) {
      // current content is a single text content, update parent.innerHTML.
      range.start.node.parentNode.innerHTML = parts.join('');
    } else {
      // current content is a part of HTML elements, update parent.childNodes list.
    }
  }

  _selectRange(startBodyOffset, endBodyOffset) {
    if (startBodyOffset > endBodyOffset){
      const tmp = startBodyOffset;
      startBodyOffset = endBodyOffset;
      endBodyOffset = tmp;
    }

    const start = this._nodeFromTextOffset(startBodyOffset);
    const end = this._nodeFromTextOffset(endBodyOffset);
    return {start: start, end: end};
  }

  _nodeFromTextOffset(offset, node){
    if (undefined == node) {
      node = this.BASE_NODE;
    }
    for (let i = 0; i < node.childNodes.length ; i++){
      const child = node.childNodes[i];

      if (child.nodeName == "#text"){
        if (offset <= child.textContent.length){
          return {offset: offset, node: child};
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
