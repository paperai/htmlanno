const Highlight = require("./highlight.js");
const Label = require("./label.js");
const $ = require("jquery");
const globalEvent = window.globalEvent;

class HighlightLabel{
  constructor(){
    this.jObject = $(`
        <div
        id="htmlanno-highlightlabel"
        class="htmlanno-highlightlabel"
        >
        <ul class="htmlanno-highlightlabel-li" >
        </ul>
        </div>
        `);

    this.jObject.appendTo($("#htmlanno-annotation"));
    this.jObject.hide();
    this.highlights = new Set();
    this.mouseX = 0;
    this.mouseY = 0;

    globalEvent.on(this, "mousemove", (e)=>{
      this.mouseX = e.originalEvent.pageX;
      this.mouseY = e.originalEvent.pageY;
    });

    globalEvent.on(this, "highlighthoverin", (data)=>{
      if (data.label.content()){
        this.highlights.add(data);
        this.update();
      }
    });

    globalEvent.on(this, "highlighthoverout", (data)=>{
      this.highlights.delete(data);
      if (this.highlights.size > 0){
        this.update();
      }else{
        this.jObject.hide();
      }
    });
  }

  update(){
    $("li", this.jObject).remove();
    for (let hl of this.highlights){
      const li = $(`<li class="htmlanno-highlightlabel-item"></li>`);
      li.text(hl.label.content());
      li.appendTo($("ul", this.jObject));
    }
    this.jObject.show();
    this.jObject.css("left", this.mouseX);
    this.jObject.css("top", this.mouseY);
  }
}

module.exports = HighlightLabel;

