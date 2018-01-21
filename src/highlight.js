const $ = require("jquery");
const Circle = require("./circle.js");
const Diamond = require('./diamond.js');
const globalEvent = window.globalEvent; // TODO: 移行終わったら削除
const Annotation = require("./annotation.js");

class Highlight extends Annotation {
  constructor(startOffset, endOffset, content, referenceId){
    super(referenceId);
    this.startOffset = startOffset;
    this.endOffset = endOffset;

    this.setContent(content);
  }

  setDomElements(elements) {
    this.elements = elements;
    this.topElement = this.elements[0];

    this.addCircle();
    this.setClass();
    this.jObject = $(`.${this.getClassName()}`);

    this.jObject.hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
    );
    // Move _content to jObject's data-label
    this.setContent(this._content);
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
    return `htmlanno-hl-${Highlight.createId(this.uuid, this.referenceId)}`;
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
    this.elements.forEach((e)=>{
      $(e).addClass(name);
    });
  }

  removeClass(name){
    if (undefined != this.elements) {
      this.elements.forEach((e)=>{
        $(e).removeClass(name);
      });
    }
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
      `type = "${Highlight.Type}"`,
      `position = [${this.startOffset}, ${this.endOffset}]`,
      'text = "' + (undefined == this.elements ? '' : $(this.elements).text()) + '"',
      `label = "${this.content()}"`
    ].join("\n");
  }

  static isMydata(toml){
    return (undefined != toml && Highlight.Type == toml.type);
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
    return Highlight.Type;
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
        if (annotation.selected && Highlight.Type == annotation.type) {
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

module.exports = Highlight;
