const $ = require("jquery");

class Label{
  constructor(position){
    this.position = position;
    this.jObject = $('<input placeholder="Enter text" class="label" type="text">');
    this.jObject.css("width",  "100px");
    this.jObject.css("left", `${this.position.left-50}px`);
    this.jObject.css("top",  `${this.position.top}px`);
    this.jObject.on('blur', this.handleInputBlur.bind(this));
    this.jObject.on('keyup', this.handleInputKeyup.bind(this));
    this.jObject.on('keypress', this.handleInputKeypress.bind(this));

    this.element = this.jObject.get(0);
    document.body.appendChild(this.element);
    this.element.focus();
  }

  resizeInput(){
    const content = this.content();
    if (content !== ""){
      $("#ruler").text(content);
      const width = $("#ruler").width() + 8;
      this.jObject.css("width", width + "px");
      this.jObject.css("left", (this.position.left - width/2) + "px");
      this.jObject.css("top",  `${this.position.top}px`);
    }
  }

  commitText(){
    const content = this.content();
    if (content !== ""){
      this.resizeInput();
      this.text = content;
    } else{
      this.element.style.display = "none";
    }
  }

  content(){
    return this.element.value.trim();
  }

  reposition(position){
    this.position = position;
    this.resizeInput();
  }

  handleInputBlur() {
    this.commitText();
  }

  handleInputKeyup(e) {
    this.resizeInput();
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
    if (this.text){
      $(this.element).addClass("label-hover");
    }
  }
  handleHoverOut(e){
    $(this.element).removeClass("label-hover");
  }
}

module.exports = Label;
