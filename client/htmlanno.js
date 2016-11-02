const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");

function curvePath(fromX, fromY, toX, toY){
  const arcHeight = 30;

  const y = Math.min(fromY, toY) - arcHeight;
  const dx = (fromX - toX) / 4;

  return `M ${fromX},${fromY} C ${fromX-dx},${y} ${toX+dx},${y} ${toX},${toY}`;
}

class Arrow{
  constructor(fromX, fromY){
    this.fromX = fromX;
    this.fromY = fromY;

    this.jObject = $(`
        <path class="arrow" d="M 0,0 C 0,0 0,0 0,0" stroke="black" fill="none" stroke-width="1px" marker-end="url(#arrow-head)" />
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

  emptyImg(){
    const img = document.createElement('img');
    // empty image
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    return img;
  }

  createArrow(rect){
    const fromX = (rect.left + rect.right) / 2;
    const fromY = (rect.top + rect.bottom) / 2;
    const arrow = new Arrow(fromX, fromY);
    return arrow;
  }

  addCircle(element){
    element.setAttribute("style", "position:relative;");
    const circle = $('<div draggable="true" class="circle"></div>');
    circle.appendTo(element);

    let arrow = null;

    circle.on("dragstart", (e)=>{
      arrow = this.createArrow(circle.get(0).getBoundingClientRect());
      arrow.appendTo($("#svg-screen"));
      e.originalEvent.dataTransfer.setDragImage(this.emptyImg(), 0, 0);
    });

    circle.on("drag", (e)=>{
      if (e.pageX && e.pageY){
        arrow.point(e.pageX, e.pageY);
      }
    });

    circle.on("dragend", (e)=>{
      arrow.remove();
    });
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
