const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");

const EventEmitter = require('events').EventEmitter

const eventEmitter = new EventEmitter();

const cumulativeOffset = function(element) {
  let top = 0;
  let left = 0;
  do {
    top += element.offsetTop  || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while(element);

  return { top: top, left: left };
};

class Arrow{
  constructor(position){
    this.move(position);

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

    // TODO
    this.halfY = this.y(0.55, fromY, y, y, toY);

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

  move(position){
    this.fromX = position.left;
    this.fromY = position.top;
  }

  point(position){

    const path = this.curvePath(this.fromX, this.fromY, position.left, position.top);
    this.jObject.attr("d", path);
  }

  y(t, y1, y2, y3, y4){
    const tp = 1 - t;
    return t*t*t*y4 + 3*t*t*tp*y3 + 3*t*tp*tp*y2 + tp*tp*tp*y1;
  }
}

class ArrowAnnotation{
  constructor(startingCircle){
    this.startingCircle = startingCircle;
    this.enteredCircle = null;
    this.endingCircle = null;

    this.arrow = new Arrow(startingCircle.positionCenter());
    this.arrow.appendTo($("#svg-screen"));
    this.mouseX = null;
    this.mouseY = null;

    this.label = null;

    eventEmitter.on("drag", (e)=>{
      this.mouseX = e.originalEvent.pageX - 1;
      this.mouseY = e.originalEvent.pageY - 1;
      this.arrow.point({left: this.mouseX, top: this.mouseY});
    });

    eventEmitter.on("dragenter", (data)=>{
      this.enteredCircle = data.circle;
      data.circle.jObject.addClass("circle-hover");
    });

    eventEmitter.on("dragleave", (data)=>{
      data.circle.jObject.removeClass("circle-hover");
      data.circle.jObject.css("transition", "0.1s");
    });

    eventEmitter.on("dragend", (data)=>{
      const cir = this.enteredCircle;
      if (cir && this.startingCircle !== cir && cir.isHit(this.mouseX, this.mouseY)){
        this.arrow.point(cir.positionCenter());
        this.endingCircle = cir;
        eventEmitter.on("resizewindow", this.reposition.bind(this));
        eventEmitter.emit("arrowconnect", this);
      } else{
        this.arrow.remove();
      }

      this.removeListener();
    });
  }

  positionCenter(){
    const p1 = this.startingCircle.positionCenter();
    const p2 = this.enteredCircle.positionCenter();
    return {left: (p1.left+p2.left)/2, top: (p1.top+p2.top)/2};
  }

  reposition(){
    if(this.arrow){
      this.arrow.move(this.startingCircle.positionCenter());
      if(this.endingCircle){
        this.arrow.point(this.endingCircle.positionCenter());
      }
    }
  }

  removeListener(){
    eventEmitter.removeAllListeners("drag");
    eventEmitter.removeAllListeners("dragenter");
    eventEmitter.removeAllListeners("dragleave");
    eventEmitter.removeAllListeners("dragend");
  }
}

class Circle{
  constructor(){
    this.jObject = $('<div draggable="true" class="circle"></div>');

    this.jObject.on("dragstart", (e)=>{
      eventEmitter.emit("dragstart", {event: e, circle: this});

      // hide drag image
      e.originalEvent.dataTransfer.setDragImage(this.emptyImg(), 0, 0);
      e.originalEvent.dataTransfer.setData("text/plain",e.originalEvent.target.id);
      e.originalEvent.stopPropagation();
    });

    this.jObject.on("dragend", (e)=>{
      eventEmitter.emit("dragend", {event: e});
    });

    this.jObject.on("dragenter", (e)=>{
      eventEmitter.emit("dragenter", {event: e, circle: this});
    });

    this.jObject.on("dragleave", (e)=>{
      eventEmitter.emit("dragleave", {event: e, circle: this});
    });
  }

  emptyImg(){
    const img = document.createElement('img');
    // empty image
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    return img;
  }

  positionCenter(){
    const position = cumulativeOffset(this.jObject.get(0));
    position.left += 5;
    position.top += 5;
    return position;
  }

  appendTo(target){
    this.jObject.appendTo(target);
  }

  isHit(x, y){
    const rect = this.jObject.get(0).getBoundingClientRect();
    return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
  }
}

class Label{
  handleInputBlur() {
    const content = this.element.value.trim();
    if (content !== ""){
      this.element.style.border = `1px solid red`;
      $("#ruler").text(content);
      $("#ruler").css("fontSize", 11);
      const width = $("#ruler").width() + 8;
      this.element.style.width = width + "px";
      this.element.style.left = (this.position.left - width/2) + "px";
    } else{
      this.element.style.display = "none";
    }
  }

  handleInputKeyup(e) {
    if (e.keyCode === 27) {
      // closeInput();
    }
  }

  constructor(position){
    this.position = position;
    const x = position.left;
    const y = position.top;
    const input = document.createElement('input');
    input.setAttribute('id', 'text-input');
    input.setAttribute('placeholder', 'Enter text');
    input.style.border = `3px solid green`;
    input.style.borderRadius = '3px';
    input.style.position = 'absolute';
    input.style.width = "100px";
    input.style.top = `${y}px`;
    input.style.left = `${x-50}px`;
    input.style.fontSize = 10;
    input.addEventListener('blur', this.handleInputBlur.bind(this));
    input.addEventListener('keyup', this.handleInputKeyup.bind(this));

    document.body.appendChild(input);
    input.focus();

    this.element = input;
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

    $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
    $(window).on("resize", (e)=>{
      eventEmitter.emit("resizewindow", null);
      $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
    });

    $(document).on("dragover", (e)=>{
      if (e.originalEvent.pageX && e.originalEvent.pageY){
        eventEmitter.emit("drag", e);
      }
    });

    let arrowAnno = null;

    eventEmitter.on("dragstart", (data)=>{
      arrowAnno = new ArrowAnnotation(data.circle);
    });
    eventEmitter.on("arrowconnect", (data)=>{
      const position = {left: data.positionCenter().left, top: data.arrow.halfY};
      const label = new Label(position);
      data.label = label;
      arrowAnno = null;
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

