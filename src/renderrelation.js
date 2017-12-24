const $ = require("jquery");
const globalEvent = window.globalEvent;
const Circle = require('./circle.js');

class RenderRelation{
  constructor(id, position, direction){
    this.id = id;
    this.move(position);
    this.eventHandlers = [];

    switch(direction){
      case 'one-way':
        this.jObject = this._createOnewayArrowHead();
        break;
      case 'two-way':
        this.jObject = this._createTwowayArrowHead();
        break;
      case 'link':
        this.jObject = this._createLinkHead();
        break;
      default:
        console.log('ERROR! Undefined type: ' + type);
    }

    this.jObjectOutline = $(`
        <path
        id="${this.domId()}-outline"
        class="htmlanno-arrow-outline"
        d="M 0,0 C 0,0 0,0 0,0" />
        `);

    globalEvent.on(this, "svgupdate", this.retouch.bind(this));
  }

  _createLinkHead(){
    return $(`
        <path
        id="${this.domId()}"
        class="htmlanno-arrow"
        d="M 0,0 C 0,0 0,0 0,0" />
    `);
  }

  _createOnewayArrowHead(){
    return this._createLinkHead().attr(
      'marker-end', 'url(#htmlanno-arrow-head)'
    );
  }

  _createTwowayArrowHead(){
    return this._createOnewayArrowHead().attr(
      'marker-start', 'url(#htmlanno-arrow-head)'
    );
  }

  curvePath(fromX, fromY, toX, toY){
    const arcHeight = 30;

    // As default, start from right side of marker and end right side.
    // When start position is left than end position, start from left side of maker, and end right side.
    if (fromX < toX) {
      fromX += Circle.size;
    } else {
      toX += Circle.size;
    }
    const dx = (fromX - toX) / 4;
    const y = Math.min(fromY, toY) - arcHeight;
    if (Math.abs(fromX - toX) < arcHeight) {
      // the FROM is near the TO on x-axis.
      if (fromY > toY) {
        // the FROM is under the TO
        return `M ${fromX}, ${fromY} C ${fromX + arcHeight}, ${y} ${toX - dx},${y} ${toX}, ${toY}`;
      } else {
        // right half circle curve.
        const dy = (fromY - toY) / 2;
        return `M ${fromX}, ${fromY} Q ${fromX + arcHeight}, ${fromY - dy} ${toX}, ${toY}`;
      }
    } else {
      return `M ${fromX}, ${fromY} C ${fromX - dx},${y} ${toX + dx}, ${y} ${toX}, ${toY}`;
    }
  }

  on(name, handler){
    this.eventHandlers.push({name: name, handler: handler});
    this.jObject.on(name, handler);
  }

  off(name){
    this.eventHandlers = this.eventHandlers.filter((eh)=>{
      return (name != eh.name);
    });
    this.jObject.off(name);
  }

  domId(){
    return "arrow-" + this.id;
  }

  retouch(){
    this.jObject = $(`#${this.domId()}`);
    this.jObjectOutline = $(`#${this.domId()}-outline`);
    this.element = this.jObject.get(0);
    this.eventHandlers.forEach((eh)=>{
      this.jObject.on(eh.name, eh.handler);
    });
  }

  appendTo(target){
    this.jObjectOutline.appendTo(target);
    this.jObjectOutline.hide();
    this.jObject.appendTo(target);
    $("#htmlanno-svg-screen").html($("#htmlanno-svg-screen").html());
    globalEvent.emit("svgupdate", this);
  }

  /**
   * Set start position.
   * @param position ... right-top of the marker.
   *
   *    + <-- position
   * ###  <-- the marker
   * ###
   * ========== <-- span
   *
   */
  move(position){
    this.fromX = position.left;
    this.fromY = position.top;
  }

  /**
   * Set end position, adjust start position, and draw arc angle.
   */
  point(position){
    const path = this.curvePath(this.fromX, this.fromY, position.left, position.top);
    this.jObject.attr("d", path);
    this.jObjectOutline.attr("d", path);
  }

  select(){
    this.jObjectOutline.show();
  }

  blur(){
    this.jObjectOutline.hide();
  }

  /**
   * @param batch ... Not use, this is for Highlight class.
   */ 
  remove(batch = false){
    this.jObject.remove();
    this.jObjectOutline.remove();
    globalEvent.removeObject(this);
  }

  handleHoverIn(e){
    this.jObject.addClass("htmlanno-arrow-hover");
  }

  handleHoverOut(e){
    this.jObject.removeClass("htmlanno-arrow-hover");
  }

  setContent(value){
    this.jObject[0].setAttribute('data-label', value);
  }

  content(){
    return this.jObject[0].getAttribute('data-label');
  }

  setExtension(value){
    this.jObject[0].setAttribute('data-ext', value);
  }

  extension(){
    return this.jObject[0].getAttribute('data-ext');
  }

  setColor(color) {
    this.jObject[0].style.stroke = color;
    this.jObject[0].setAttribute('opacity', '0.2');
  }

  removeColor() {
    this.jObject[0].style.stroke = undefined;
    this.jObject[0].removeAttribute('opacity');
  }
}

module.exports = RenderRelation;
