const $ = require("jquery");
const Circle = require("./circle.js");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const EventEmitter = window.globalEvent;

class Highlight{
  constructor(id, highlighter, selection, elements){
    this.id = id;
    this.highlighter = highlighter;
    this.selection = selection;
    this.ranges = selection.getAllRanges();
    this.elements = elements;
    this.topElement = elements[0];

    console.log(this.elements, this.getBoundingClientRect());
    this.addCircle();
    this.setClass();
    $(`.${this.getClassName()}`).hover(
        this.handleHoverIn.bind(this),
        this.handleHoverOut.bind(this)
        );
  }

  handleHoverIn(){
    this.elements.forEach((e)=>{
      $(e).addClass("border");
    });
  }

  handleHoverOut(){
    this.elements.forEach((e)=>{
      $(e).removeClass("border");
    });
  }

  addCircle(){
    this.topElement.setAttribute("style", "position:relative;");
    this.circle = new Circle(this.id, this);
    this.circle.appendTo(this.topElement);
    // $(`<div class = "selected-highlight"></div>`).appendTo(element);
  }

  getClassName(){
    return `hl-${this.id}`;
  }

  getBoundingClientRect(){
    const rect = {top:999999, bottom:0, left:999999, right:0};
    this.elements.forEach((e)=>{
      const r = e.getBoundingClientRect();
      rect.top = Math.min(rect.top, r.top);
      rect.bottom = Math.max(rect.bottom, r.bottom);
      rect.left = Math.min(rect.left, r.left);
      rect.right = Math.max(rect.right, r.right);
    });
    return rect;
  }

  setClass(){
    this.elements.forEach((e)=>{
      $(e).addClass(this.getClassName());
    });
  }

  select(){
    const rect = this.getBoundingClientRect();
    const circlePosition = this.circle.positionCenter();
    const jo = $(`<div id="sh-${this.id}" class="selected-highlight"></div>`);
    const w = rect.right - rect.left;
    const h = rect.bottom - rect.top;

    const pad = 4;
    jo.appendTo(this.topElement);
    jo.css("width", w);
    jo.css("height", h);
    jo.css("top", -pad);
    jo.css("left", -circlePosition.left+rect.left-pad);
    jo.css("background-position", `0px 0px, ${w}px ${h}px, 0px ${h}px, ${w}px 0px`);

    const keyframes =
      `@keyframes border-dance-${this.id} {
        0% {
          background-position: 0px 0px, 15px ${h+pad}px, 0px 15px, ${w+pad}px 0px;
        }
        100% {
          background-position: 15px 0px, 0px ${h+pad}px, 0px 0px, ${w+pad}px 15px;
        }
      }`;

    const styleSheet = document.styleSheets[0];
    console.log(document.styleSheets);
    console.log(document.styleSheets.cssRules);
    styleSheet.insertRule(keyframes, styleSheet.length);
    jo.css("animation-name",  `border-dance-${this.id}`);
    this.selectFrame = jo;
  }

  blur(){
    if (this.selectFrame){
      this.selectFrame.remove();
    }
  }

  remove(){
    // this.selection.nativeSelection.removeAllRanges();
    console.log(this.selection, this.selection.getAllRanges(), this.ranges);
    var intersectingHighlights = this.highlighter.highlighter.getIntersectingHighlights( this.ranges );
    this.highlighter.highlighter.removeHighlights(intersectingHighlights);
    // this.highlighter.highlighter.unhighlightSelection(this.selection);
    this.circle.remove();
    // if (this.temporaryElements.length > 0){
  }
  }

  module.exports = Highlight;
