const $ = require("jquery");
const Circle = require("./circle.js");

class Highlight{
  constructor(id, highlighter, selection, elements){
    this.id = id;
    this.highlighter = highlighter;
    this.selection = selection;
    this.ranges = selection.getAllRanges();
    this.elements = elements;
    this.topElement = elements[0];

    this.addCircle();
    this.setClass();
    $(`.${this.getClassName()}`).hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
        );
  }

  handleHoverIn(){
    this.elements.forEach((e)=>{
      $(e).addClass("border");
    });
  }

  handleHoverOut(){
    this.elements.forEach((e)=>{
      $(e).removeClass("border");
    });
  }

  addCircle(){
    this.topElement.setAttribute("style", "position:relative;");
    this.circle = new Circle(this.id, this);
    this.circle.appendTo(this.topElement);
  }

  getClassName(){
    return `hl-${this.id}`;
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
    this.addClass("highlight");
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
    this.addClass("highlight-selected");
  }

  blur(){
    this.removeClass("highlight-selected");
  }

  remove(){
    this.circle.remove();
    $(`.${this.getClassName()}`).each(function() {
      $(this).replaceWith(this.childNodes);
    });
  }
}

module.exports = Highlight;
