const $ = require("jquery");
window.$ = $;
window.jQuery = $;

const Htmlanno = require("./htmlanno.js");

const handleMouseUp = function(e){
  console.log("mouse up");
  htmlanno.commitSelection();
}

let htmlanno = null;

$(()=>{
  console.log("hello");
  document.addEventListener("mouseup", handleMouseUp, false);
  htmlanno = new Htmlanno();
  window.htmlanno = htmlanno;
});

