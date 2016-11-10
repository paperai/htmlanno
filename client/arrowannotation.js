const $ = require("jquery");
const Label = require("./label.js");
const Arrow = require("./arrow.js");
const globalEvent = window.globalEvent;

class ArrowAnnotation{
  constructor(id, startingCircle){
    this.id = id;
    this.startingCircle = startingCircle;
    this.enteredCircle = null;
    this.endingCircle = null;

    this.mouseX = null;
    this.mouseY = null;
    this.label = null;

    this.arrow = new Arrow(id, startingCircle.positionCenter());
    this.arrow.appendTo($("#svg-screen"));
    this.arrow.on("click", (e)=>{
      console.log("arrow click");
      globalEvent.emit("arrowannotationselect", this);
    });
    this.arrow.on("mouseenter", this.handleHoverIn.bind(this));
    this.arrow.on("mouseleave", this.handleHoverOut.bind(this));

    globalEvent.on("drag", (e)=>{
      this.mouseX = e.originalEvent.pageX - 1;
      this.mouseY = e.originalEvent.pageY - 1;
      this.arrow.point({left: this.mouseX, top: this.mouseY});
    });

    globalEvent.on("dragenter", (data)=>{
      this.enteredCircle = data.circle;
      data.circle.jObject.addClass("circle-hover");
    });

    globalEvent.on("dragleave", (data)=>{
      data.circle.jObject.removeClass("circle-hover");
      data.circle.jObject.css("transition", "0.1s");
    });

    globalEvent.on("dragend", (data)=>{
      this.connect();
    });
  }

  connect(){
    const cir = this.enteredCircle;
    if (cir && this.startingCircle !== cir && cir.isHit(this.mouseX, this.mouseY)){
      this.arrow.point(cir.positionCenter());
      this.endingCircle = cir;
      globalEvent.on("resizewindow", this.reposition.bind(this));
      this.label = new Label(this.id, this.labelPosition());
      this.label.jObject.hover(
          this.handleHoverIn.bind(this),
          this.handleHoverOut.bind(this)
          );
      globalEvent.emit("arrowannotationconnect", this);
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

  select(){
    this.arrow.select();
    if (this.label){
      this.label.select();
    }
    return;
    const p1 = this.startingCircle.positionCenter();
    const p2 = this.enteredCircle.positionCenter();

    const top = Math.min(p1.top, p2.top) - 30;
    const bottom = Math.max(p1.top, p2.top);
    const left = Math.min(p1.left, p2.left);
    const right = Math.max(p1.left, p2.left);
    const w = right - left;
    const h = bottom - top;

    const pad = 4;
    const jo = $(`<div class="selected-highlight"></div>`);
    jo.css("top", top);
    jo.css("left", left);
    jo.css("width", w);
    jo.css("height", h);
    jo.appendTo($("body"));

    jo.css("background-position", `0px 0px, ${w}px ${h}px, 0px ${h}px, ${w}px 0px`);

    const keyframes =
      `@keyframes border-dance-arrow-${this.id} {
        0% {
          background-position: 0px 0px, 15px ${h+pad}px, 0px 15px, ${w+pad}px 0px;
        }
        100% {
          background-position: 15px 0px, 0px ${h+pad}px, 0px 0px, ${w+pad}px 15px;
        }
      }`;

    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    jo.css("animation-name",  `border-dance-arrow-${this.id}`);
    this.selectFrame = jo;
  }

  blur(){
    this.arrow.blur();
    if (this.label){
      this.label.blur();
    }
    return;
    if (this.selectFrame){
      this.selectFrame.remove();
    }
  }
  remove(){
    this.arrow.remove();
    if (this.label){
      this.label.remove();
    }
  }

  removeListener(){
    // TODO
    globalEvent.removeAllListeners("drag");
    globalEvent.removeAllListeners("dragenter");
    globalEvent.removeAllListeners("dragleave");
    globalEvent.removeAllListeners("dragend");
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

