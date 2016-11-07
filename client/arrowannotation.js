const $ = require("jquery");
const Label = require("./label.js");

const EventEmitter = require('events').EventEmitter

const eventEmitter = window.eventEmitter;

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
    this.element = this.jObject.get(0);
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

  handleHoverIn(e){
    console.log(this.element);
    this.element.style["stroke-width"] = "3px";
    this.jObject.addClass("arrow-hover");
  }
  handleHoverOut(e){
    this.element.style["stroke-width"] = "1px";
    this.jObject.removeClass("arrow-hover");
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
    this.selected = false;

    this.arrow.jObject.click((e)=>{
      console.log("click");
    });
    this.arrow.jObject.hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
        );

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
      this.connect();
    });
  }

  connect(){
    const cir = this.enteredCircle;
    if (cir && this.startingCircle !== cir && cir.isHit(this.mouseX, this.mouseY)){
      this.arrow.point(cir.positionCenter());
      this.endingCircle = cir;
      eventEmitter.on("resizewindow", this.reposition.bind(this));
      this.label = new Label(this.labelPosition());
      this.label.jObject.hover(
          this.handleHoverIn.bind(this),
          this.handleHoverOut.bind(this)
          );

    } else{
      this.arrow.remove();
    }

    this.removeListener();
  }

  positionCenter(){
    const p1 = this.startingCircle.positionCenter();
    const p2 = this.enteredCircle.positionCenter();
    return {left: (p1.left+p2.left)/2, top: (p1.top+p2.top)/2};
  }

  labelPosition(){
    return {left: this.positionCenter().left, top: this.arrow.halfY};
  }

  reposition(){
    if (this.arrow){
      this.arrow.move(this.startingCircle.positionCenter());
      if(this.endingCircle){
        this.arrow.point(this.endingCircle.positionCenter());
      }
    }
    if (this.label){
      this.label.reposition(this.labelPosition());
    }
  }

  removeListener(){
    eventEmitter.removeAllListeners("drag");
    eventEmitter.removeAllListeners("dragenter");
    eventEmitter.removeAllListeners("dragleave");
    eventEmitter.removeAllListeners("dragend");
  }

  handleHoverIn(e){
    this.arrow.handleHoverIn();
    if (this.label){
      this.label.handleHoverIn();
    }
  }
  handleHoverOut(e){
    this.arrow.handleHoverOut();
    if (this.label){
      this.label.handleHoverOut();
    }
  }
}

module.exports = ArrowAnnotation;

