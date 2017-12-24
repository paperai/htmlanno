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

    this.jObject = $(`<div id="${this.domId()}" draggable="true" class="${this.className()}"></div>`);

    this.jObject.on("click", (e)=>{
      this.highlight.select();
    });

    this.jObject.hover(
      this.handleHoverIn.bind(this),
      this.handleHoverOut.bind(this)
    );
  }

  handleHoverIn(e){
    e.stopPropagation();
    this.highlight.dispatchWindowEvent('annotationHoverIn', this.highlight);
  }

  handleHoverOut(e){
    e.stopPropagation();
    this.highlight.dispatchWindowEvent('annotationHoverOut', this.highlight);
  }

  domId(){
    return "circle-"+this.id;
  }

  className() {
    return 'htmlanno-circle';
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
    return {left: - Circle.size / 2, top: - Circle.size -5 - (this.samePositionCircles() * 12)}
  }

  positionCenter(){
    const pos = this.divPosition();
    const p = this.originalPosition();
    pos.left += p.left;
    pos.top += p.top;
    pos.left += 15;
    pos.top += Circle.size + 5;

    return pos;
  }

  appendTo(target){
    this.jObject.appendTo(target);
    this.jObject.css("left", `0px`);
    this.jObject.css("top", `0px`);
    this.basePosition = this.jObject.offset();
    this.basePosition.top -= $("#viewer").offset().top;
    this.basePosition.left -= $("#viewer").offset().left;
    const pos = this.divPosition();
    this.jObject.css("left", `${pos.left}px`);
    this.jObject.css("top", `${pos.top}px`);
  }

  isHit(x, y){
    const c = this.positionCenter();
    return c.left <= x+Circle.size && c.left >= x-Circle.size && c.top <= y+CirCle.size && c.top >= y-CirCle.size;
  }

  resetPosition(){
    this.jObject.css("transition", "0.0s");
    this.jObject.css("left", `0px`);
    this.jObject.css("top", `0px`);
    this.basePosition = this.jObject.offset();
    this.basePosition.top -= $("#viewer").offset().top;
    this.basePosition.left -= $("#viewer").offset().left;
  }

  reposition(){
    const pos = this.divPosition();
    this.jObject.css("left", `${pos.left}px`);
    this.jObject.css("top", `${pos.top}px`);
    this.jObject.css("transition", "0.2s");
  }

  remove(batch = false){
    globalEvent.emit("removecircle", this);
    this.jObject.remove();
    globalEvent.removeObject(this);
    const idx = Circle.instances.findIndex((e)=>e===this);

    if (idx !== -1 && !batch){
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

Circle.size = 10;

module.exports = Circle;
