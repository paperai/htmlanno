const $ = require("jquery");
const globalEvent = window.globalEvent;

const cumulativeOffset = function(element) {
  let top = 0;
  let left = 0;
  do {
    top += element.offsetTop  || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while(element);

  return { top: top, left: left };
};

class Circle{
  constructor(id, highlight){
    this.id = id;
    this.highlight = highlight;

    this.jObject = $(`<div id="${this.domId()}" draggable="true" class="circle"></div>`);

    this.jObject.on("dragstart", (e)=>{
      globalEvent.emit("dragstart", {event: e, circle: this});

      // hide drag image
      e.originalEvent.dataTransfer.setDragImage(this.emptyImg(), 0, 0);
      e.originalEvent.dataTransfer.setData("text/plain",e.originalEvent.target.id);
      e.originalEvent.stopPropagation();
    });

    this.jObject.on("dragend", (e)=>{
      globalEvent.emit("dragend", {event: e});
    });

    this.jObject.on("dragenter", (e)=>{
      globalEvent.emit("dragenter", {event: e, circle: this});
    });

    this.jObject.on("dragleave", (e)=>{
      globalEvent.emit("dragleave", {event: e, circle: this});
    });

    this.jObject.on("click", (e)=>{
      globalEvent.emit("highlightselect", this.highlight);
    });
  }

  domId(){
    return "circle-"+this.id;
  }

  emptyImg(){
    const img = document.createElement('img');
    // empty image
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    return img;
  }

  positionCenter(){
    const position = cumulativeOffset(this.jObject.get(0));
    position.left += 5;
    position.top += 5;
    return position;
  }

  appendTo(target){
    this.jObject.appendTo(target);
  }

  isHit(x, y){
    const rect = this.jObject.get(0).getBoundingClientRect();
    return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
  }

  remove(){
    globalEvent.emit("removecircle", this);
    this.jObject.remove();
    globalEvent.removeObject(this);
  }
}

module.exports = Circle;
