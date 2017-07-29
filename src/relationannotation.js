const $ = require("jquery");
const RenderRelation = require("./renderrelation.js");
const globalEvent = window.globalEvent;

class RelationAnnotation{
  constructor(id, startingCircle, direction){
    this.id = id;
    this.startingCircle = startingCircle;
    this.enteredCircle = null;
    this.endingCircle = null;

    this.mouseX = null;
    this.mouseY = null;
    this.direction = direction;

    this.arrow = new RenderRelation(id, startingCircle.positionCenter(), direction);
    this.arrow.appendTo($("#htmlanno-svg-screen"));
    this.arrow.on("click", (e)=>{
      globalEvent.emit("relationselect", {event: e, annotation: this});
    });
    this.arrow.on("mouseenter", this.handleHoverIn.bind(this));
    this.arrow.on("mouseleave", this.handleHoverOut.bind(this));

    globalEvent.on(this, "removecircle", (cir)=>{
      if (this.startingCircle === cir || this.endingCircle === cir){
        this.remove();
        globalEvent.emit("removearrowannotation", this);
      }
    });
  }

  static createLink(id, startingCircle){
    return new RelationAnnotation(id, startingCircle, 'link');
  }

  static createOneway(id, startingCircle){
    return new RelationAnnotation(id, startingCircle, 'one-way');
  }

  static createTwoway(id, startingCircle){
    return new RelationAnnotation(id, startingCircle, 'two-way');
  }

  connect(){
    const cir = this.enteredCircle;
    this.removeDragListener();

    if (cir && this.startingCircle !== cir && cir.isHit(this.mouseX, this.mouseY)){
      this.arrow.point(cir.positionCenter());
      this.endingCircle = cir;
      globalEvent.on(this, "resizewindow", this.reposition.bind(this));
      globalEvent.emit("arrowannotationconnect", this);
    } else{
      this.arrow.remove();
    }
  }

  setEndingCircle(cir){
    this.enteredCircle = cir;
    this.mouseX = cir.positionCenter().left;
    this.mouseY = cir.positionCenter().top;
    this.connect();
  }

  positionCenter(){
    const p1 = this.startingCircle.positionCenter();
    const p2 = this.enteredCircle.positionCenter();
    return {left: (p1.left+p2.left)/2, top: (p1.top+p2.top)/2};
  }

  reposition(){
    if (this.arrow){
      this.arrow.move(this.startingCircle.positionCenter());
      if(this.endingCircle){
        this.arrow.point(this.endingCircle.positionCenter());
      }
    }
  }

  select(){
    this.arrow.select();
    globalEvent.emit("editlabel", {target: this});
  }

  blur(){
    this.arrow.blur();
  }

  remove(){
    this.arrow.remove();
    globalEvent.removeObject(this);
  }

  removeDragListener(){
    const map = globalEvent.eventMap(this);
    for (var [event, handler] of map){
      if (event !== "removecircle"){
        globalEvent.removeListenerForObject(this, event);
      }
    }
  }

  handleHoverIn(e){
    this.arrow.handleHoverIn();
    globalEvent.emit("annotationhoverin", this);
  }

  handleHoverOut(e){
    this.arrow.handleHoverOut();
    globalEvent.emit("annotationhoverout", this);
  }

  saveToml(){
    return [
      'type = "relation"',
      `dir = "${this.direction}"`,
      `ids = ["${this.startingCircle.highlight.id}", "${this.enteredCircle.highlight.id}"]`,
      `label = "${this.content()}"`
    ].join("\n");
  }

  equals(obj){
    if (undefined == obj || this !== obj) {
      return false;
    }
    else {
      // TODO: 同一ID、同一のstarting/entering等でチェックするか？
      return true;
    }
  }

  getId(){
    return this.id;
  }

  static isMydata(toml){
    return (
      undefined !== toml && "relation" === toml.type && 
      ("one-way" === toml.dir || "two-way" === toml.dir || "link" === toml.dir)
    );
  }

  setContent(text){
    this.arrow.setContent(text);
  }

  content(){
    return this.arrow.content();
  }
}

module.exports = RelationAnnotation;

