const $ = require("jquery");
const Htmlanno = require("./htmlanno.js");
window.$ = $;

$(()=>{
  console.log("hello");
  htmlanno = new Htmlanno();
  window.htmlanno = htmlanno;
});
