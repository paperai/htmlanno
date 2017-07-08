const $ = require("jquery");
const Circle = require("./circle.js");
const Label = require("./label.js");
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
    $(`.${this.getClassName()}`).hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
        );

    this.label = new Label("hlabel-" + this.id, this.labelPosition());
  }

  labelPosition(){
    const position = this.circle.positionCenter();
    position.top -= 34;
    return position;
  }

  handleHoverIn(){
    globalEvent.emit("highlighthoverin", this);
    this.elements.forEach((e)=>{
      $(e).addClass("htmlanno-border");
    });
    this.label.show();
  }

  handleHoverOut(){
    globalEvent.emit("highlighthoverout", this);
    this.elements.forEach((e)=>{
      $(e).removeClass("htmlanno-border");
    });
    this.label.hide();
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
    this.label.show();
  }

  selectForEditing(){
    this.select();
    this.label.select();
  }

  hideLabel(){
    this.label.blur();
  }

  blur(){
    this.removeClass("htmlanno-highlight-selected");
    this.label.blur();
    this.label.hide();
  }

  remove(){
    this.circle.remove();
    $(`.${this.getClassName()}`).each(function() {
      $(this).replaceWith(this.childNodes);
    });
    this.label.remove();
  }

  saveData(){
    return [this.startOffset, this.endOffset, this.label.content()];
  }

  saveToml(){
    return [
      'type = "span"',
      `position = [${this.startOffset}, ${this.endOffset}]`,
      'text = "' + $(this.elements).text() + '"',
      `label = "${this.label.content()}"`
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
}

module.exports = Highlight;
