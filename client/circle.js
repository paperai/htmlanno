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

    this.jObject = $(`<div id="${this.domId()}" draggable="true" class="htmlanno-circle"></div>`);

    this.jObject.on("dragstart", (e)=>{
      globalEvent.emit("dragstart", {event: e, circle: this});

      // hide drag image
      e.originalEvent.dataTransfer.setDragImage(this.emptyImg(), 0, 0);
      e.originalEvent.dataTransfer.setData("text/plain",e.originalEvent.target.id);
      e.originalEvent.stopPropagation();
    });

    this.jObject.on("dragend", (e)=>{
      globalEvent.emit("dragend", {event: e});
    });

    this.jObject.on("dragenter", (e)=>{
      globalEvent.emit("dragenter", {event: e, circle: this});
    });

    this.jObject.on("dragleave", (e)=>{
      globalEvent.emit("dragleave", {event: e, circle: this});
    });

    this.jObject.on("click", (e)=>{
      globalEvent.emit("highlightselect", this.highlight);
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
      if (Math.abs(Math.floor(l1-l2)) <= 5 && Math.abs(Math.floor(t1-t2)) <= 5) {
        n += 1;
      }
    }

    return n;
  }

  divPosition(){
    return {left: -5, top: -10 - (this.samePositionCircles() * 12)}
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
    const rect = this.jObject.get(0).getBoundingClientRect();
    return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
  }

  remove(){
    globalEvent.emit("removecircle", this);
    this.jObject.remove();
    globalEvent.removeObject(this);
    const idx = Circle.instances.findIndex((e)=>e===this);
    if (idx !== -1){
      Circle.instances.splice(idx, 1);
    }
  }
}

module.exports = Circle;
