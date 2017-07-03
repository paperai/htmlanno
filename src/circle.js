const $ = require("jquery");
const globalEvent = window.globalEvent;

class Circle{
  constructor(id, highlight){
    if (!Circle.instances){
      Circle.instances = [];
    }

    Circle.instances.push(this);
    this.id = id;
    this.highlight = highlight;
    this.size = 10;

    this.jObject = $(`<div id="${this.domId()}" draggable="true" class="htmlanno-circle"></div>`);

    this.jObject.on("click", (e)=>{
      globalEvent.emit("highlightselect", {event: e, annotation: this.highlight});
    });

    this.jObject.on("mouseenter", (e)=>{
      this.highlight.handleHoverIn();
      e.stopPropagation();
    });

    this.jObject.on("mouseleave", (e)=>{
      this.highlight.handleHoverOut();
    });
  }

  domId(){
    return "circle-"+this.id;
  }

  emptyImg(){
    const img = document.createElement('img');
    // empty image
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    return img;
  }

  originalPosition(){
    return this.basePosition;
  }

  samePositionCircles(){
    let n = 0;
    for (let i = 0; i < Circle.instances.length; i++){
      const cir = Circle.instances[i];
      if (cir === this){
        break;
      }
      const l1 = cir.originalPosition().left;
      const t1 = cir.originalPosition().top;
      const l2 = this.originalPosition().left;
      const t2 = this.originalPosition().top;
      if (Math.abs(Math.floor(l1-l2)) <= 3 && Math.abs(Math.floor(t1-t2)) <= 3) {
        n += 1;
      }
    }

    return n;
  }

  divPosition(){
    return {left: -this.size/2, top: -this.size -5 -(this.samePositionCircles() * 12)}
  }

  positionCenter(){
    const pos = this.divPosition();
    const p = this.originalPosition();
    pos.left += p.left;
    pos.top += p.top;
    pos.left += 5;
    pos.top += 5;

    return pos;
  }

  appendTo(target){
    this.jObject.appendTo(target);
    this.jObject.css("left", `0px`);
    this.jObject.css("top", `0px`);
    // this.jObject.css("transition", "0.0s");
    this.basePosition = this.jObject.offset();
    const pos = this.divPosition();
    this.jObject.css("left", `${pos.left}px`);
    this.jObject.css("top", `${pos.top}px`);
  }

  isHit(x, y){
    const c = this.positionCenter();
    return c.left <= x+this.size && c.left >= x-this.size && c.top <= y+this.size && c.top >= y-this.size;
  }

  resetPosition(){
    this.jObject.css("transition", "0.0s");
    this.jObject.css("left", `0px`);
    this.jObject.css("top", `0px`);
    this.basePosition = this.jObject.offset();
  }

  reposition(){
    const pos = this.divPosition();
    this.jObject.css("left", `${pos.left}px`);
    this.jObject.css("top", `${pos.top}px`);
    this.jObject.css("transition", "0.2s");
  }

  remove(){
    globalEvent.emit("removecircle", this);
    this.jObject.remove();
    globalEvent.removeObject(this);
    const idx = Circle.instances.findIndex((e)=>e===this);
    if (idx !== -1){
      Circle.instances.splice(idx, 1);
      Circle.instances.forEach((cir)=>{
        cir.resetPosition();
      });
      Circle.instances.forEach((cir)=>{
        cir.reposition();
      });
    }
  }
}

module.exports = Circle;
