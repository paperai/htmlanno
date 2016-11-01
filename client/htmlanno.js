const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");

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
    let circle = $('<div draggable="true" class="circle"></div>');
    circle.appendTo(element);
    circle.click((e)=>{
      console.log(e);
    });
    circle.on("dragstart", (e)=>{
      console.log(e);
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

