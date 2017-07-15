const $ = require("jquery");
const Label = require("./label.js");
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
    this.label = null;
    this.direction = direction;

    this.arrow = new RenderRelation(id, startingCircle.positionCenter(), direction);
    this.arrow.appendTo($("#htmlanno-svg-screen"));
    this.arrow.on("click", (e)=>{
      globalEvent.emit("arrowannotationselect", this);
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
      this.label = new Label(this.id, this.labelPosition());
      this.label.jObject.hover(
          this.handleHoverIn.bind(this),
          this.handleHoverOut.bind(this)
          );
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
  }

  blur(){
    this.arrow.blur();
    if (this.label){
      this.label.blur();
    }
  }

  remove(){
    this.arrow.remove();
    if (this.label){
      this.label.remove();
    }
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

  saveToml(){
    return [
      'type = "relation"',
      `dir = "${this.direction}"`,
      `ids = ["${this.startingCircle.highlight.id}", "${this.enteredCircle.highlight.id}"]`,
      `label = "${this.label.content()}"`
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
}

module.exports = RelationAnnotation;

