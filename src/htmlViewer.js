class HtmlViewer {
    constructor() {
        this.contents = []
        this.html_obj = undefined
    }

    /**
     * @param doc Html source (String)
     */
    render(doc) {
        if (doc !== undefined) {
            const parser = new DOMParser()
            // Htmlanno uses the XHTML, but DOMParser accepted only 'text/html'.
            this.html_obj = parser.parseFromString(doc, 'text/html').body

            this.contents = []
            this.content_length = this._calculate_offset_and_register(this.html_obj, undefined, 0)
        }
        this.setDoc(this.html_obj.innerHTML)
    }
    _calculate_offset_and_register(html_node, parent_index, parent_offset) {
        let last_offset = parent_offset
        for(let index = 0; index < html_node.childNodes.length; index ++) {
            const current_node = html_node.childNodes[index]
            if (current_node.nodeName === '#text') {
                last_offset += current_node.textContent.length
            } else {
                const current_index = this.contents.length
                const id = this.contents.length + 1
                current_node.setAttribute('data-htmlanno-id', id)
                this.contents.push({ parent_index: parent_index, offset: last_offset, id: id })
                last_offset = this._calculate_offset_and_register(current_node, current_index, last_offset)
            }
            // else; #comment, etc. ignore.
        }
        return last_offset;
    }

    _findPositionIncluded(position, contents) {
        let index;
        for(index = 0; index < contents.length; index ++) {
            if (contents[index].offset > position) {
                // 1. 行き過ぎたので戻る
                // 2. contents[index]に親はいるか？
                //    2.1 親要素のテキストコンテンツにpositionが収まるまで順に親要素を探索
                if (contents[index - 1].parent_index !== undefined) {
                    return this._checkParentContentLength(position, contents, contents[index - 1].parent_index);
                } else {
                    // 3. 親がいないなら1つ前の兄弟を見る (1つ前の兄弟の範囲にpositionがある筈)
                    return (index - 1)
                }
            }
        }
        // TODO: おそらくはここの判定にバグがあり、最終行のアノテーションレンダリングが実行されていません
        return contents[index -1].offset > position && this.content_length <= position ? (index - 1) : -1;
    }

    _checkParentContentLength(target_position, contents, parent_index) {
        if (target_position > contents[parent_index].offset + parent_node.textContent.length) {
            return this._checkParentContentLength(target_position, contents, contents[parent_index].parent_index);
        } else {
            return parent_index;
        }
    }
 

    // ViewerBase相当
    setDoc(doc_html) {
        const view = document.getElementById('viewer')
        view.innerHTML = doc_html
    }
}

module.exports = HtmlViewer;
