const $ = require("jquery");
const Circle = require("./circle.js");
const globalEvent = window.globalEvent; // TODO: 移行終わったら削除
const Annotation = require("./annotation.js");

class Highlight extends Annotation {
  constructor(id, startOffset, endOffset, elements, referenceId){
    super(id, referenceId);
    this.startOffset = startOffset;
    this.endOffset = endOffset;

    this.elements = elements;
    this.topElement = elements[0];

    this.addCircle();
    this.setClass();
    $(`.${this.getClassName()}`).hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
    );
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
    this.circle = new Circle(this.id, this);
    this.circle.appendTo(this.topElement);
  }

  getClassName(){
    return `htmlanno-hl-${Highlight.createId(this.id, this.referenceId)}`;
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
    this.addClass(this.getClassName());
    this.addClass("htmlanno-highlight");
  }

  addClass(name){
    this.elements.forEach((e)=>{
      $(e).addClass(name);
    });
  }

  removeClass(name){
    this.elements.forEach((e)=>{
      $(e).removeClass(name);
    });
  }

  select(showOnly){
    this.addClass("htmlanno-highlight-selected");
    if (undefined == showOnly || !showOnly){
      globalEvent.emit("editlabel", {target: this});
    }
  }

  blur(){
    this.removeClass("htmlanno-highlight-selected");
    super.blur();
  }

  remove(){
    this.blur();
    this.circle.remove();
    $(`.${this.getClassName()}`).each(function() {
      $(this).replaceWith(this.childNodes);
    });
  }

  saveToml(){
    return [
      'type = "span"',
      `position = [${this.startOffset}, ${this.endOffset}]`,
      'text = "' + $(this.elements).text() + '"',
      `label = "${this.content()}"`
    ].join("\n");
  }

  equals(obj){
    if (undefined == obj || this !== obj) {
      return false;
    }
    else {
      // TODO: 同一ID、同一選択範囲等でチェックするか？
      return true;
    }
  }

  static isMydata(toml){
    return (undefined != toml && "span" == toml.type);
  }

  setContent(text){
    $(`.${this.getClassName()}`)[0].setAttribute('data-label', text);
  }

  content(){
    return $(`.${this.getClassName()}`)[0].getAttribute('data-label');
  }

  showLabel(){
    globaleEvent.emit("showlabel", {target: this});
  }

  hideLabel(){
    globalEvent.emit("clearlabel");
  }

  get type() {
    return 'span';
  }

  get scrollTop() {
    return this.circle.positionCenter().top;
  }

  blink() {
    this.circle.jObject.addClass('htmlanno-circle-hover');
    setTimeout(() => {
      this.circle.jObject.removeClass('htmlanno-circle-hover');
    }, 1000);
  }
}

module.exports = Highlight;
