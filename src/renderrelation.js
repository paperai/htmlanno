const $ = require("jquery");
const globalEvent = window.globalEvent;

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

    const y = Math.min(fromY, toY) - arcHeight;
    const dx = (fromX - toX) / 4;

    // TODO
    this.halfY = this.y(0.55, fromY, y, y, toY);

    return `M ${fromX},${fromY} C ${fromX-dx},${y} ${toX+dx},${y} ${toX},${toY}`;
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

  move(position){
    this.fromX = position.left;
    this.fromY = position.top;
  }

  point(position){
    const path = this.curvePath(this.fromX, this.fromY, position.left, position.top);
    this.jObject.attr("d", path);
    this.jObjectOutline.attr("d", path);
  }

  y(t, y1, y2, y3, y4){
    const tp = 1 - t;
    return t*t*t*y4 + 3*t*t*tp*y3 + 3*t*tp*tp*y2 + tp*tp*tp*y1;
  }

  select(){
    this.jObjectOutline.show();
  }

  blur(){
    this.jObjectOutline.hide();
  }

  remove(){
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
