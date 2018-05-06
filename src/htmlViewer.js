class HtmlViewer {
    constructor() {
        this.contents = []
        this.body_node = undefined
    }

    /**
     * (re)rendering HTML.
     * @param doc HTMLElement of `<body>` tag (clear old content and rende) or undefined (re-render)
     */
    render(doc) {
        if (doc !== undefined) {
            this.body_node = doc;
            this.contents = []
            this.content_length = this._calculateOffsetAndRegister(this.body_node, undefined, 0)
        }
        const view = document.getElementById('viewer');
        view.innerHTML = this.body_node.innerHTML;
    }

    /**
     * search the index of contents that include position (First level, check only offset position each contents head)
     * @param position offset from text content head
     * @return index value of this.contents or -1 (not found)
     */
    findContentIndexThatIncludes(position) {
        let index;
        for(index = 0; index < this.contents.length; index ++) {
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
        // TODO: おそらくはここの判定にバグがあり、最終行のアノテーションレンダリングが実行されていません
        return siblingsContent.offset > position && siblingsContent.content_length <= position ? (index - 1) : -1;
    }

    getContentsOffset(index) {
        return this.contents[index].offset;
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
