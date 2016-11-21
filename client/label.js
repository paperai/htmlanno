const $ = require("jquery");
const globalEvent = window.globalEvent;

class Label{
  constructor(id, position){
    this.id = id;
    this.position = position;
    this.selected = false;

    this.jObject = $(`<input id="label-${this.id}" placeholder="Enter text" class="htmlanno-label" type="text">
        `);
    this.jObject.on('blur', this.handleInputBlur.bind(this));
    this.jObject.on('keydown', this.handleInputKeydown.bind(this));
    this.jObject.on('keyup', this.handleInputKeydown.bind(this));
    this.jObject.on('keypress', this.handleInputKeypress.bind(this));

    this.jObject.appendTo($("#htmlanno-annotation"));
    this.element = this.jObject.get(0);
    this.resizeInput();
    setTimeout(()=>{this.jObject.focus()}, 1);
  }

  resizeInput(){
    const content = this.content();
    if (content !== ""){
      $("#ruler").text(content);
      const width = $("#ruler").width() + 8;
      this.jObject.css("width", width + "px");
      let left = (this.position.left - width/2);
      this.jObject.css("left", left + "px");
      this.jObject.css("top",  `${this.position.top}px`);
    } else{
      this.jObject.css("width",  "100px");
      this.jObject.css("left", `${this.position.left-50}px`);
      this.jObject.css("top",  `${this.position.top}px`);
    }
  }

  commitText(){
    const content = this.content();
    if (content !== ""){
      this.resizeInput();
    } else{
      this.hide();
    }
  }

  content(){
    return this.element.value.trim();
  }

  setContent(text){
    this.jObject.val(text);
    this.resizeInput();
  }

  reposition(position){
    this.position = position;
    this.resizeInput();
  }

  handleInputBlur() {
    this.commitText();
  }

  handleInputKeydown(e) {
    this.resizeInput();
    e.stopPropagation();
  }

  handleInputKeypress(e) {
    // enter
    if (e.keyCode === 13) {
      this.element.blur();
    }
    // esc
    if (e.keyCode === 27) {
    }
  }

  handleHoverIn(e){
    if (this.content()){
      this.jObject.addClass("htmlanno-label-hover");
    }
  }
  handleHoverOut(e){
    this.jObject.removeClass("htmlanno-label-hover");
  }

  show(){
    this.jObject.show();
  }

  hide(){
    if (!this.selected){
      this.jObject.hide();
    }
  }

  select(){
    this.selected = true;
    this.jObject.addClass("htmlanno-label-selected");
    this.show();
  }

  blur(){
    this.jObject.removeClass("htmlanno-label-selected");
    this.selected = false;
    if (this.content()){
      this.show();
    } else{
      this.hide();
    }
  }

  remove(){
    this.jObject.remove();
  }
}

module.exports = Label;
