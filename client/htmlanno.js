const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");

let temporaryArrow = null;
let arrows = [];
let mouseX = 0;
let mouseY = 0;
let rootCircle = null;

class Arrow{
  constructor(fromX, fromY){
    this.fromX = fromX;
    this.fromY = fromY;

    this.jObject = $(`
        <path
        class="arrow"
        d="M 0,0 C 0,0 0,0 0,0"
        marker-end="url(#arrow-head)" />
        `);
  }

  curvePath(fromX, fromY, toX, toY){
    const arcHeight = 30;

    const y = Math.min(fromY, toY) - arcHeight;
    const dx = (fromX - toX) / 4;

    return `M ${fromX},${fromY} C ${fromX-dx},${y} ${toX+dx},${y} ${toX},${toY}`;
  }

  appendTo(target){
    this.jObject.appendTo(target);
    $("#svg-screen").html($("#svg-screen").html());
    this.jObject = $("path.arrow:last");
  }

  remove(){
    this.jObject.remove();
  }

  point(toX, toY){
    const path = this.curvePath(this.fromX, this.fromY, toX, toY);
    this.jObject.attr("d", path);
  }
}

class Circle{
  constructor(){
    this.jObject = $('<div draggable="true" class="circle"></div>');

    this.on("dragstart", (e)=>{
      rootCircle = this;
      temporaryArrow = this.createArrow(rootCircle.getBoundingClientRect());
      temporaryArrow.appendTo($("#svg-screen"));
      e.originalEvent.dataTransfer.setDragImage(this.emptyImg(), 0, 0);
      e.originalEvent.dataTransfer.setData("text/plain",e.originalEvent.target.id);
      e.originalEvent.stopPropagation();
    },false);

    this.on("dragend", (e)=>{
      if (temporaryArrow){
        temporaryArrow.remove();
      }
      rootCircle = null;
      temporaryArrow = null;
    });

    this.on("dragenter", (e)=>{
      if (temporaryArrow && rootCircle !== this){
        this.jObject.addClass("circle-hover");
      }
    });

    this.on("dragleave", (e)=>{
      if (temporaryArrow && rootCircle !== this){
        const rect = this.getBoundingClientRect();
        if (rect.left <= mouseX && rect.right >= mouseX && rect.top <= mouseY && rect.bottom >= mouseY){
          temporaryArrow.remove();
          temporaryArrow = null;
          const arw = this.createArrow(rootCircle.getBoundingClientRect());
          arw.point((rect.left+rect.right)/2, (rect.top+rect.bottom)/2);
          arw.appendTo($("#svg-screen"));
          arrows.push(arw);
        }
        this.jObject.removeClass("circle-hover");
      }
    });
  }

  emptyImg(){
    const img = document.createElement('img');
    // empty image
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    return img;
  }

  createArrow(rect){
    const fromX = window.pageXOffset + (rect.left + rect.right) / 2;
    const fromY = window.pageYOffset + (rect.top + rect.bottom) / 2;
    const arrow = new Arrow(fromX, fromY);
    return arrow;
  }

  appendTo(target){
    this.jObject.appendTo(target);
  }

  on(eventName, handler){
    this.jObject.on(eventName, handler);
  }

  getBoundingClientRect(){
    return this.jObject.get(0).getBoundingClientRect();
  }
}

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

class Htmlanno{
  constructor(){
    this.highlights = [];
    this.highlightId = 1;

    $(document).on("dragover", (e)=>{
      if (temporaryArrow && e.clientX && e.clientY){
        const x = window.pageXOffset + e.clientX - 1;
        const y = window.pageYOffset + e.clientY - 1;
        mouseX = x;
        mouseY = y;
        temporaryArrow.point(x, y);
      }
    });
  }

  commitSelection(){
    const selection = rangy.getSelection();
    if (selection.isCollapsed){
      return;
    }

    const highlighter = rangy.createHighlighter();
    const temporaryElements = [];
    highlighter.addClassApplier(rangy.createClassApplier("highlight", {
      ignoreWhiteSpace: true,
      onElementCreate: (element)=>{temporaryElements.push(element)}
    }));
    highlighter.highlightSelection("highlight");

    if (temporaryElements.length > 0){
      const highlight = new Highlight(this.highlightId, selection, temporaryElements);
      this.highlights.push(highlight);
      this.highlightId += 1;
    }
    selection.removeAllRanges();
  }
}

module.exports = Htmlanno;

