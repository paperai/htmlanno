const $ = require("jquery");
const Circle = require("./circle.js");
const InputLabel = require("./inputlabel.js");
const globalEvent = window.globalEvent;

class Highlight{
  constructor(id, startOffset, endOffset, elements){
    this.id = id;
    this.startOffset = startOffset;
    this.endOffset = endOffset;

    this.elements = elements;
    this.topElement = elements[0];

    this.addCircle();
    this.setClass();
    this.resetHoverEvent();

    this.inputLabel = new InputLabel($("#inputLabel")[0]);
    this.inputLabel.setup(this.endEditLabel.bind(this));
  }

  disableHoverAction(){
    $(`.${this.getClassName()}`).off("mouseenter").off("mouseleave");
    this.circle.disableHoverAction();
  }

  resetHoverEvent(){
    $(`.${this.getClassName()}`).hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
        );
    this.circle.resetHoverEvent();
  }

  handleHoverIn(){
    globalEvent.emit("highlighthoverin", this);
    this.elements.forEach((e)=>{
      $(e).addClass("htmlanno-border");
    });
    this.showLabel();
  }

  handleHoverOut(){
    globalEvent.emit("highlighthoverout", this);
    this.elements.forEach((e)=>{
      $(e).removeClass("htmlanno-border");
    });
    this.hideLabel();
  }

  addCircle(){
    this.topElement.setAttribute("style", "position:relative;");
    this.circle = new Circle(this.id, this);
    this.circle.appendTo(this.topElement);
  }

  getClassName(){
    return `htmlanno-hl-${this.id}`;
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

  select(){
    this.addClass("htmlanno-highlight-selected");
    this.showLabel();
  }

  selectForEditing(){
    this.select();
    this.startEditLabel();
  }

  blur(){
    this.removeClass("htmlanno-highlight-selected");
    this.hideLabel();
  }

  remove(){
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

  getId(){
    return this.id;
  }

  static isMydata(toml){
    return (undefined != toml && "span" == toml.type);
  }

  setContent(text){
    $(`.${this.getClassName()}`).data('label', text);
  }

  content(){
    return $(`.${this.getClassName()}`).data('label');
  }

  showLabel(){
    this.inputLabel.show(this.content());
  }

  hideLabel(){
    this.inputLabel.disable();
  }

  startEditLabel(){
    this.disableHoverAction();
    this.inputLabel.startEdit(this.content());
  }

  endEditLabel(value){
    this.setContent(value);
    this.resetHoverEvent();
  }
}

module.exports = Highlight;
