const $ = require("jquery");
const globalEvent = window.globalEvent;

class Circle{
  constructor(id, highlight){
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
      if (Math.abs(Math.floor(l1-l2)) <= Circle.size && Math.abs(Math.floor(t1-t2)) <= Circle.size) {
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
   * Annotation A's offset is {left: 0, top: 0} ({left: 1, top: 1} maybe), because A's offset is position from B, and A position equals B.
   * This method seek the parent node that is not Annotation.
   * Annotation has class of 'htmlanno-highlight' or 'htmlanno-ref-highlight'.
   */
  _calculateBasePosition() {
    // parent is <span class="htmlanno-ll-<uuid>">.
    // this would not have class of 'htmlanno-(ref-)highlight' yet. because it is constructed now.
    let parent = this.jObject[0].offsetParent;
    const pos = {top: parent.offsetTop, left: parent.offsetLeft};

    // parent.offsetParent may be <div id="viewerwrapper"> or other <span class="htmlanno-(ref-)highlight">.
    // this <span> has class of 'htmlanno-highlight' or 'htmlanno-ref-highlight'.
    parent = parent.offsetParent;
    while(parent.classList.contains('htmlanno-highlight') || parent.classList.contains('htmlanno-ref-highlight')) {
      pos.top = parent.offsetTop;
      pos.left = parent.offsetLeft;
      parent = parent.offsetParent;
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

    if (idx !== -1){
      Circle.instances.splice(idx, 1);
      if (!batch) {
        Circle.instances.forEach((cir)=>{
          cir.reposition();
        });
      }
    }
  }

  static repositionAll() {
    return new Promise((resolve, reject) => {
      Circle.instances.forEach((cir) => {
        cir.reposition();
      });
      resolve();
    });
  }
}

Circle.size = 10;
Circle.instances = [];

module.exports = Circle;
