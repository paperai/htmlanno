const $ = require("jquery");
const globalEvent = window.globalEvent;
const Circle = require('./circle.js');

/**
 * TODO: arrowHeadはラベルテキスト(=色設定)単位での共有が可能な筈だが、共有のために必要な管理コストと照らし合わせて、どちらが効率よいのか検討が必要。
 * 共有する場合、ラベルテキストごとにUUIDを採番、このUUIDをarrowHeadのIDとして使用する。ラベルテキストとUUIDとの対応表が必要になり、arrowHeadへのアクセスの度に対応表の走査が発生する懸念がある。
 */
class RenderRelation{
  constructor(id, position, direction){
    this.id = id;
    this.move(position);
    this.eventHandlers = [];

    this.jObject = this._createOnewayArrowHead();

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
    this._createArrowHead();
    return this._createLinkHead().attr(
      'marker-end', `url(#htmlanno-arrow-head-${this.id})`
    );
  }

  _createTwowayArrowHead(){
    return this._createOnewayArrowHead().attr(
      'marker-start', `url(#htmlanno-arrow-head-${this.id})`
    );
  }

  _createArrowHead() {
    const arrowHead = document.createElement('marker');
    arrowHead.id = `htmlanno-arrow-head-${this.id}`;
    arrowHead.classList.add('htmlanno-arrow-head');
    arrowHead.setAttribute('visibility', 'visible');
    arrowHead.setAttribute('refX', 6);
    arrowHead.setAttribute('refY', 3);
    arrowHead.setAttribute('fill', 'red'); // TODO: fillの値を後から変更可能にする
    arrowHead.setAttribute('markerWidth', 6);
    arrowHead.setAttribute('markerHeight', 6);
    arrowHead.setAttribute('orient', 'auto-start-reverse');
    arrowHead.setAttribute('markerUnits', 'strokeWidth');

    const polyline = document.createElement('polyline');
    polyline.setAttribute('points', '0,0 6,3 0,6 0.2,3');
    arrowHead.appendChild(polyline);

    this._putArrowMarker(this.id, arrowHead);
  }

  curvePath(fromX, fromY, toX, toY){
    const arcHeight = 30;
    const halfCircleSize = Circle.size / 2;
    const svgParts = [];

    if (this._nearPosition(fromX, toX, arcHeight)) {
      if (this._nearPosition(fromY, toY, arcHeight)) {
        if (Math.abs(fromX - toX) < Math.abs(fromY - toY)) {
          // vertical near position (two cubic bezier curve)
          if (fromY > toY) {
            // Under to Top
            svgParts.push(`M ${fromX - halfCircleSize} ${fromY + Circle.size}`);
            svgParts.push(`C ${fromX - arcHeight} ${fromY - halfCircleSize}, ${fromX - arcHeight} ${toY}, ${toX - arcHeight} ${toY}`);
            svgParts.push(`S ${toX - arcHeight} ${toY - arcHeight}, ${toX} ${toY}`);
          } else {
            svgParts.push(`M ${fromX} ${fromY}`);
            svgParts.push(`C ${fromX - arcHeight} ${fromY - arcHeight}, ${fromX - arcHeight} ${fromY}, ${toX - arcHeight} ${fromY}`);
            svgParts.push(`S ${toX - arcHeight} ${toY - halfCircleSize}, ${toX - halfCircleSize} ${toY + Circle.size}`);
          }
        } else {
          // horizontal near position (2 times height quadratic bezier curve)
          svgParts.push(`M ${fromX} ${fromY}`);
          svgParts.push(`Q ${fromX} ${toY - (arcHeight * 2)} ${toX} ${toY}`);
        }
      } else {
        fromX += halfCircleSize;
        toX += halfCircleSize;
        svgParts.push(`M ${fromX} ${fromY}`);
        if (fromY > toY) {
          // the FROM is under the TO (right-side to right-side by cubic bezier curve)
          svgParts.push(`C ${fromX + arcHeight} ${toY - arcHeight}, ${toX + arcHeight} ${toY - arcHeight}, ${toX} ${toY}`);
        } else {
          // right-side to right-side by arc curve
          const dy = (fromY - toY) / 2;
          svgParts.push(`Q ${fromX + arcHeight} ${fromY - dy}, ${toX} ${toY}`);
        }
      }
    } else {
      const dx = (fromX - toX) / 4;
      const y = Math.min(fromY, toY) - arcHeight;
      if (fromX > toX) {
        // left-side to right-side by cubic bezier curve
        fromX -= halfCircleSize;
        toX += halfCircleSize;
        svgParts.push(`M ${fromX} ${fromY}`);
        svgParts.push(`C ${fromX - dx},${y} ${toX + dx}, ${y} ${toX}, ${toY}`);
      } else {
        // right-side to left-side by cubic bezier curve
        fromX += halfCircleSize;
        toX -= halfCircleSize;
        svgParts.push(`M ${fromX} ${fromY}`);
        svgParts.push(`C ${fromX - dx},${y} ${toX + dx}, ${y} ${toX}, ${toY}`);
      }
    }
    return svgParts.join(' ');
  }

  _nearPosition(from, to, limit) {
    return (Math.abs(from - to) < limit)
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
    // TODO: jQueryからDOM処理へ変更
    $("#htmlanno-svg-screen").html($("#htmlanno-svg-screen").html());
    globalEvent.emit("svgupdate", this);
  }

  /**
   * Set start position.
   * @param position ... right-top of the marker.
   *
   *    + <-- position
   * ###  <-- the marker
   * ###
   * ========== <-- span
   *
   */
  move(position){
    this.fromX = position.left;
    this.fromY = position.top;
  }

  /**
   * Set end position, adjust start position, and draw arc angle.
   */
  point(position){
    const path = this.curvePath(this.fromX, this.fromY, position.left, position.top);
    this.jObject.attr("d", path);
    this.jObjectOutline.attr("d", path);
  }

  select(){
    this.jObjectOutline.show();
  }

  blur(){
    this.jObjectOutline.hide();
  }

  /**
   * @param batch ... Not use, this is for Highlight class.
   */ 
  remove(batch = false){
    this.jObject.remove();
    this.jObjectOutline.remove();
    globalEvent.removeObject(this);
  }

  handleHoverIn(e){
    this.jObject.addClass("htmlanno-arrow-hover");
    this.jObject[0].setAttribute('opacity', '1.0');
  }

  handleHoverOut(e){
    this.jObject.removeClass("htmlanno-arrow-hover");
    this.jObject[0].setAttribute('opacity', '0.2');
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
    const arrowHead = this._getArrowMarker(`htmlanno-arrow-head-${this.id}`);
    if (undefined != arrowHead) {
      arrowHead.setAttribute('fill', color);
    }
  }

  removeColor() {
    this.jObject[0].style.stroke = undefined;
    this.jObject[0].removeAttribute('opacity');
  }

  /**
   * @param id ID of defs tag.
   * @param arrowHead htmlElement of <marker id="htmlanno-arrow-head-${id}">
   *
   * <svg>
   *  <defs id="${id1}">
   *    ${arrowHead1}
   *  </defs>
   *  <defs id="${id2}">
   *    ${arrowHead2}
   *  </defs>
   *   :
   * </svg>
   */
  _putArrowMarker(id, arrowHead) {
    return new Promise((resolve, reject) => {
      const newDefs = document.createElement('defs');
      newDefs.id = id;
      newDefs.appendChild(arrowHead);
      const oldDefs = document.getElementById(id);
      if (undefined != oldDefs) {
        oldDefs.replaceWith(newDefs);
      } else {
        document.getElementById('htmlanno-svg-screen').appendChild(newDefs);
      }
      resolve();
    }).then();
  }

  _getArrowMarker(id) {
    return document.getElementById(id);
  }

  /**
   * @param id ID of defs tag.
   */
  _removeArrowMarker(id) {
    return new Promise((resolve, reject) => {
      const target = document.getElementById(id);
      if (undefined == target) {
        resolve(false);
      } else {
        target.remove();
        resolve(true);
      }
    }).then();
  }
}

module.exports = RenderRelation;
