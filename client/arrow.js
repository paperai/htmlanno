const $ = require("jquery");
const globalEvent = window.globalEvent;

class Arrow{
  constructor(id, position){
    this.id = id;
    this.move(position);
    this.eventHandlers = [];

    this.jObject = $(`
        <path
        id="${this.domId()}"
        class="arrow"
        d="M 0,0 C 0,0 0,0 0,0"
        marker-end="url(#arrow-head)" />
        `);
    this.jObjectOutline = $(`
        <path
        id="${this.domId()}-outline"
        class="arrow-outline"
        d="M 0,0 C 0,0 0,0 0,0" />
        `);

    globalEvent.on(this, "svgupdate", this.retouch.bind(this));
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
    $("#svg-screen").html($("#svg-screen").html());
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
    this.jObject.addClass("arrow-hover");
  }

  handleHoverOut(e){
    this.jObject.removeClass("arrow-hover");
  }
}

module.exports = Arrow;
