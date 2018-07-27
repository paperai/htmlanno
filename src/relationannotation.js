const $ = require("jquery");
const RenderRelation = require("./renderrelation.js");
const globalEvent = window.globalEvent;
const Annotation = require("./annotation.js");

class RelationAnnotation extends Annotation {
  constructor(startingCircle, endingCircle, direction, referenceId){
    super(referenceId);
    this.startingCircle = startingCircle;
    this.endingCircle = endingCircle;

    this._direction = direction;

    this.arrow = new RenderRelation(
      Annotation.createId(this.uuid, this.referenceId),
      startingCircle.positionCenter(),
      this._direction
    );
    this.arrow.appendTo($("#htmlanno-svg-screen"));
    this.arrow.on("click", (e)=>{
      this.select();
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
    if (this.selected) {
      this.blur();
    } else {
      this.arrow.select();
      this._selected = true;
      if (this.isEditable()) {
        this.dispatchWindowEvent('annotationSelected', this);
      }
    }
  }

  blur(){
    this.arrow.blur();
    super.blur();
  }

  remove(){
    this.blur();
    this.arrow.remove();
    globalEvent.removeObject(this);
    this.dispatchWindowEvent('annotationDeleted', {uuid: this.uuid});
  }

  handleHoverIn(e){
    this.arrow.handleHoverIn();
    this.dispatchWindowEvent('annotationHoverIn', this);
  }

  handleHoverOut(e){
    this.arrow.handleHoverOut();
    this.dispatchWindowEvent('annotationHoverOut', this);
  }

  saveToml(){
    // There is used '_id'. the uuid is set by constructor inner process, the _id is set by TomlTool#saveToml().
    return [
      `head = "${this.startingCircle.highlight._id}"`,
      `tail = "${this.endingCircle.highlight._id}"`,
      `label = "${this.content()}"`
    ].join("\n");
  }

  static isMydata(toml){
    return (
      undefined !== toml && RelationAnnotation.Type === toml.type
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

  setColor(color) {
    this.arrow.setColor(color);
  }

  removeColor() {
    this.arrow.removeColor();
  }

  get type() {
    return RelationAnnotation.Type;
  }

  get direction() {
    return this._direction;
  }

  get scrollTop() {
    return this.startingCircle.positionCenter().top;
  }

  static get Type() {
    return 'relation';
  }

  static updateLabelIfExistsSelectedRelation(label, annotationContainer) {
    return new Promise((resolve, reject) => {
      let targetExists = false;
      annotationContainer.forEachPromise((annotation) => {
        if (annotation.selected && RelationAnnotation.Type == annotation.type && label.type == annotation.direction) {
          // Change label and color.
          annotation.setColor(label.color);
          annotation.setContent(label.text);
          targetExists = true;
        }
      });
      resolve(targetExists);
    });
  }
}

module.exports = RelationAnnotation;

