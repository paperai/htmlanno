const $ = require("jquery");
const RenderRelation = require("./renderrelation.js");
const globalEvent = window.globalEvent;
const Annotation = require("./annotation.js");

class RelationAnnotation extends Annotation {
  constructor(id, startingCircle, endingCircle, direction, referenceId){
    super(id, referenceId);
    this.startingCircle = startingCircle;
    this.endingCircle = endingCircle;

    this._direction = direction;

    this.arrow = new RenderRelation(
      Annotation.createId(id, referenceId),
      startingCircle.positionCenter(),
      this._direction
    );
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
    this.arrow.point(this.endingCircle.positionCenter());
    globalEvent.on(this, "resizewindow", this.reposition.bind(this));
    globalEvent.emit("arrowannotationconnect", this);
  }

  positionCenter(){
    const p1 = this.startingCircle.positionCenter();
    const p2 = this.endingCircle.positionCenter();
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
      `dir = "${this._direction}"`,
      `ids = ["${this.startingCircle.highlight.id}", "${this.endingCircle.highlight.id}"]`,
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

  getClassName() {
    return this.arrow.domId();
  }

  get type() {
    return 'relation';
  }

  get direction() {
    return this._direction;
  }

  get scrollTop() {
    return this.startingCircle.positionCenter().top;
  }
}

module.exports = RelationAnnotation;

