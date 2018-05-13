const $ = require("jquery");
const Circle = require("./circle.js");
const Diamond = require('./diamond.js');
const globalEvent = window.globalEvent; // TODO: 移行終わったら削除
const Annotation = require("./annotation.js");
const Highlight = require('./highlight.js');

class SpanAnnotation extends Annotation {
  // TODO: base_nodeはレンダリング高速化用途で一時的に必要なだけなので、渡し方を再検討
  constructor(startOffset, endOffset, content, referenceId, base_node){
    super(referenceId);
    // TODO: 最終的にはDOM関連部分をHighlightへ委譲
    this.domHighlight = new Highlight(startOffset, endOffset, this.getClassName(), base_node);
    this.setDomElements(this.domHighlight.domElements, base_node);

    this.setContent(content);
  }

  setDomElements(elements, base_node) {
    this.elements = elements;
    this.topElement = this.elements[0];

    this.addCircle();
    this.setClass();
    // TODO: setEventHandler, remove, setContent, content, setColor, removeColor のみ使用
    this.jObject = $(`.${this.getClassName()}`, base_node);
  }

  /**
   * set the handler for HTML event.
   * This method must be called after instance is set to real Document object
   * memo; this method uses jQuery object because be executed for each DOM element
   */
  setEventHandler () {
    this.jObject.off('mouseenter').on('mouseenter', this.handleHoverIn.bind(this));
    this.jObject.off('mouseleave').on('mouseleave', this.handleHoverOut.bind(this));

    this.circle.setEventHandler();
  }

  handleHoverIn(e){
    this.elements.forEach((e)=>{
      $(e).addClass("htmlanno-border");
    });
    this.dispatchWindowEvent('annotationHoverIn', this);
  }

  handleHoverOut(e){
    this.elements.forEach((e)=>{
      $(e).removeClass("htmlanno-border");
    });
    this.dispatchWindowEvent('annotationHoverOut', this);
  }

  addCircle(){
    this.topElement.setAttribute("style", "position:relative;");
    if (this.isPrimary()) {
      this.circle = new Circle(this.getId(), this);
    } else {
      this.circle = new Diamond(this.getId(), this);
    }
    this.circle.appendTo(this.topElement);
  }

  getClassName(){
    return `htmlanno-hl-${SpanAnnotation.createId(this.uuid, this.referenceId)}`;
  }

  getBoundingClientRect(){
    const rect = {top:999999, bottom:0, left:999999, right:0};
    this.elements.forEach((e)=>{
      const r = e.getBoundingClientRect();
      rect.top = Math.min(rect.top, r.top);
      rect.bottom = Math.max(rect.bottom, r.bottom);
      rect.left = Math.min(rect.left, r.left);
      rect.right = Math.max(rect.right, r.right);
    });
    return rect;
  }

  setClass(){
    const classNames = [this.getClassName()];
    if (this.isPrimary()) {
      classNames.push('htmlanno-highlight');
    } else {
      classNames.push('htmlanno-ref-highlight');
    }
    this.addClass(classNames.join(' '));
  }

  addClass(name){
    this.domHighlight.addClass(name);
  }

  removeClass(name){
    this.domHighlight.removeClass(name);
  }

  select(){
    if (this.selected) {
      this.blur();
    } else {
      if (this.isEditable()) {
        this.selected = true;
        this.addClass("htmlanno-highlight-selected");
        this.dispatchWindowEvent('annotationSelected', this);
      }
    }
  }

  blur(){
    this.removeClass("htmlanno-highlight-selected");
    super.blur();
  }

  remove(batch = false){
    this.blur();
    if (undefined != this.circle) {
      this.circle.remove(batch);
    }
    // ここのみjOjectを使用するとうまく動作しない(自己破壊になるため?)
    $(`.${this.getClassName()}`).each((i, elm) => {
      $(elm).replaceWith(elm.childNodes);
    });
    this.jObject = null;
    this.dispatchWindowEvent('annotationDeleted', {uuid: this.uuid});
  }

  saveToml(){
    return [
      `type = "${SpanAnnotation.Type}"`,
      `position = [${this.domHighlight.startOffset}, ${this.domHighlight.endOffset}]`,
      'text = "' + (undefined == this.elements ? '' : $(this.elements).text()) + '"',
      `label = "${this.content()}"`
    ].join("\n");
  }

  static isMydata(toml){
    return (undefined != toml && SpanAnnotation.Type == toml.type);
  }

  setContent(text){
    if (undefined == this.jObject) {
      this._content = text;
    } else {
      this.jObject[0].setAttribute('data-label', text);
      this._content = undefined;
    }
  }

  content(){
    return undefined == this.jObject ? this._content : this.jObject[0].getAttribute('data-label');
  }

  get type() {
    return SpanAnnotation.Type;
  }

  get scrollTop() {
    return this.circle.positionCenter().top;
  }

  blink() {
    if (undefined == this.jObject) {
      return;
    }
    this.circle.jObject.addClass('htmlanno-circle-hover');
    setTimeout(() => {
      this.circle.jObject.removeClass('htmlanno-circle-hover');
    }, 1000);
  }

  setColor(color) {
    if (this.isPrimary()) {
      this.jObject.each((index) => {
        this.jObject[index].style.borderColor = tinycolor(color).toRgbString();
        this.jObject[index].style.backgroundColor = tinycolor(color).setAlpha(0.2).toRgbString();
      });
    } else {
      this.jObject.each((index) => {
        this.jObject[index].style.borderBottomColor = tinycolor(color).setAlpha(0.2).toRgbString();
      });
    }
  }

  removeColor() {
    if (undefined == this.jObject) {
      return;
    }
    this.jObject[0].style.backgroundColor = undefined;
  } 

  static get Type() {
    return 'span';
  }

  static updateLabelIfExistsSelectedSpan(label, annotationContainer) {
    return new Promise((resolve, reject) => {
      let targetExists = false;
      annotationContainer.forEachPromise((annotation) => {
        if (annotation.selected && SpanAnnotation.Type == annotation.type) {
          // Change label and color.
          annotation.setColor(label.color);
          annotation.setContent(label.text);
          targetExists = true;
        }
      });
      resolve(targetExists);
    });
  }
}

module.exports = SpanAnnotation;
