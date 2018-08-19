const Annotation = require('./annotation')

class HtmlViewer {
    constructor() {
        /**
         * infomation about each HTMLElement offset from head of text contents.
         * [n] = {
         *   parent_index: in case of [n] is included by other HTMLElement(is not the base node), this is n for other HTMLElement, other case be undefined
         *   offset: position from head of text contents
         *   id: id attribute value as HTML tag
         * }
         */
        this.contents = []
        /**
         * original content that read from file
         * TODO: Document (Fragment) or innerHTML string ? current is Document (from DOMParser)
         */
        this.content_source = undefined
        /**
         * DocumentFragment for annotation rendering buffer
         */
        this.view_buffer = undefined
    }

    /**
     * (re)rendering HTML.
     * @param doc HTMLElement of `<body>` tag (clear old content and rende) or undefined (re-render)
     */
    render(doc) {
        if (doc !== undefined) {
            this.content_source = doc
            this.contents = []
            this.content_length = this._calculateOffsetAndRegister(this.content_source, undefined, 0)
        }
        this.$containerViewer().innerHTML = this.content_source.innerHTML
    }

    /**
     * get DocumentFragment with content source.
     * in case it is not created returns new created, and other case, returns buffer
     * @return DocumentFragment
     */
    renderingBuffer () {
        if (this.view_buffer === undefined) {
            this.view_buffer = document.createDocumentFragment()
            const view = document.createElement('div')
            view.id = 'viewer'
            view.innerHTML = this.content_source.innerHTML
            this.view_buffer.appendChild(view)
        }
        return this.view_buffer
    }

    /**
     * replace the viewer on window.document by buffer, and destroy buffer.
     */
    reflectBuffer () {
        this.$containerViewer().replaceWith(this.renderingBuffer());
        this.view_buffer = undefined
    }

    /**
     * search the index of contents that include position (First level, check only offset position each contents head)
     * @param position offset from text content head
     * @return index value of this.contents or -1 (not found)
     */
    findContentIndexThatIncludes(position) {
        for(let index = 0; index < this.contents.length; index ++) {
            if (this.contents[index].offset > position) {
                const siblingsContent = this.contents[index - 1];
                // 1. I gone too far, need back.
                // siblingsContent = |------- [position?] ----|
                // contents[index] = |------------------------|
                //                      ^ now
                if (siblingsContent.parent_index !== undefined) {
                    // 2. I am child, search on parent content (position exists on the parent or parent parent ...)
                    // contents[parent_index] = <parent tag>|----- [position?] --|
                    // siblingsContent        =             |--------------------|
                    // contents[index]        =             |--------------------|
                    // contents[index+n]      =             |--------------------|</parent tag>
                    return this._checkContentLength(position, siblingsContent.parent_index);
                } else {
                    // 3. I am top level content, position exists on the before content.
                    return (index - 1);
                }
            }
        }
        return this._checkContentLength(position, this.contents.length - 1);
    }

    getContentsOffset(index) {
        return this.contents[index].offset;
    }

    static _setupHtml () {
        const html = `
    <div id="htmlanno-annotation">
    <link rel="stylesheet" href="index.css">
    <svg id="htmlanno-svg-screen"
      visibility="hidden"
      baseProfile="full"
      pointer-events="visible"
      width="100%"
      height="100%" style="z-index: 100;">
      <defs>
        <marker id="htmlanno-arrow-head"
          class="htmlanno-arrow-head"
          visibility="visible"
          refX="6"
          refY="3"
          fill="red"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
          markerUnits="strokeWidth">
          <polyline points="0,0 6,3 0,6 0.2,3" />
        </marker>
      </defs>
    </svg>
    <span id="ruler" style="visibility:hidden;position:absolute;white-space:nowrap;"></span>
    </div>
    `

        $(html).appendTo('#viewerWrapper');
    }

    $containerViewer () {
        return document.getElementById('viewer');
    }

    /**
     * calculate offset from the text content head, and register to contents array.
     * this method is called by recursive.
     * @param html_node     target HTMLElement (when the first call; `<body>` tag, when recursive call; childNodes of html_node on calling base)
     * @param parent_index  index of parent node (when the first call; undefined , when recursive call; integer)
     * @param parent_offset offset from the text content head for html_node (when the first call; 0, when recursive call; offset at calling)
     */
    _calculateOffsetAndRegister(html_node, parent_index, parent_offset) {
        let last_offset = parent_offset;
        for(let index = 0; index < html_node.childNodes.length; index ++) {
            const current_node = html_node.childNodes[index];
            if (current_node.nodeName === '#text') {
                last_offset += current_node.textContent.length;
            } else {
                const current_index = this.contents.length;
                const id = this.contents.length + 1
                current_node.setAttribute('data-htmlanno-id', id);
                this.contents.push({
                    parent_index: parent_index,
                    offset: last_offset,
                    id: id
                });
                last_offset = this._calculateOffsetAndRegister(current_node, current_index, last_offset);
            }
        }
        return last_offset;
    }

    /**
     * search the index of contents that include position (Second level, check that position is included in offset + content-length)
     * this method is called by recursive.
     * @param position offset from text content head
     * @param index    value of this.contents
     * @return index value of this.contents
     */
    _checkContentLength(position, index) {
        if (index === undefined) {
            return -1;
        }
        const node = document.querySelector(`[data-htmlanno-id="${index + 1}"`);
        if (position > this.contents[index].offset + node.textContent.length) {
            // position exists on before or later to me, check my parent
            return this._checkContentLength(position, this.contents[index].parent_index);
        } else {
            // found.
            return index;
        }
    }
}

module.exports = HtmlViewer;
