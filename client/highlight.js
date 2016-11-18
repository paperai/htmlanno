const $ = require("jquery");
const Circle = require("./circle.js");
const Label = require("./label.js");
const globalEvent = window.globalEvent;

class Highlight{
  constructor(id, startOffset, endOffset, text, elements){
    this.id = id;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.text = text;
    console.log(this.startOffset, this.endOffset);

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

    if (this.label.content()){
      // this.label.show();
    }
  }

  handleHoverOut(){
    globalEvent.emit("highlighthoverout", this);
    this.elements.forEach((e)=>{
      $(e).removeClass("htmlanno-border");
    });
    // this.label.hide();
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
    this.label.select();
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

  /*
  toJson(){
    return JSON.stringify({
      id: this.id,
      type: "span",
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      text: this.text,
      label: this.label.content()
    });
  }
  */

  saveData(){
    return [this.startOffset, this.endOffset, this.label.content()];
  }
}
module.exports = Highlight;
