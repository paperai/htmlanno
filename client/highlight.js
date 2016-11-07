const $ = require("jquery");
const Circle = require("./circle.js");
const EventEmitter = window.eventEmitter;

class Highlight{
  constructor(id, selection, elements){
    this.id = id;
    this.selection = selection;
    this.elements = elements;

    this.addCircle(elements[0]);
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

  addCircle(element){
    element.setAttribute("style", "position:relative;");
    const circle = new Circle();
    circle.appendTo(element);
  }

  getClassName(){
    return `hl-${this.id}`;
  }

  setClass(){
    this.elements.forEach((e)=>{
      $(e).addClass(this.getClassName());
    });
  }
}

module.exports = Highlight;
