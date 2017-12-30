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

  samePositionCircles() {
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

  /**
   * circle position based on #viewerWrapper
   */
  positionCenter(){
    const pos = this.divPosition();
    let parent = this.jObject[0].offsetParent;
    while(null != parent && 'viewerWrapper' != parent.id) {
      pos.left += parent.offsetLeft;
      pos.top  += parent.offsetTop;
      parent = parent.offsetParent;
    }
    pos.left += Circle.size / 2;
    pos.top  += Circle.size / 2;
    return pos;
  }

  appendTo(target){
    this.jObject.appendTo(target);
    this.basePosition = this._calculateBasePosition();
    const pos = this.divPosition();
    this.jObject.css("left", `${pos.left}px`);
    this.jObject.css("top", `${pos.top}px`);
  }

  /**
   * calculate offset value from parent node that is not Annotation.
   * In case of some annotations set to same position, an annotation (A) is child HTML element of other annotation (B). 
   * Annotation A's offset is {left: 0, top: 0}, because A's offset is position from B, and A position equals B.
   * This method seek the parent node that offset is not {left: 0, top:0}.
   */
  _calculateBasePosition() {
    let parent = this.jObject[0].offsetParent;
    const pos = {top: parent.offsetTop, left: parent.offsetLeft};
    while(0 == pos.top && 0 == pos.left && null != parent.offsetParent) {
      parent = parent.offsetParent;
      pos.top = parent.offsetTop;
      pos.left = parent.offsetLeft;
    }
    return pos;  
  }

  isHit(x, y){
    const c = this.positionCenter();
    return c.left <= x+Circle.size && c.left >= x-Circle.size && c.top <= y+CirCle.size && c.top >= y-CirCle.size;
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
        cir.reposition();
      });
    }
  }
}

Circle.size = 10;

module.exports = Circle;
