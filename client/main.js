const $ = require("jquery");
window.$ = $;
window.jQuery = $;

const Htmlanno = require("./htmlanno.js");

$(()=>{
  console.log("hello!");
  htmlanno = new Htmlanno();
  window.htmlanno = htmlanno;
});

