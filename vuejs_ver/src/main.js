import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'
import Highlight from './highlight'

window.$ = $

$(() => {
  Vue.component('html_viewer', {
    template: '<div id="viewer"><div v-for="(content, index) in contents">[<span style="display: inline-block; width: 4em; text-align: right;">{{content.offset}}</span>]<div style="display: inline-block" v-html="content.content.outerHTML" :id="index"></div></div></div>',
    data: () => {
      return {
        // contents := [<content>, <content>,...]
        // content  := {startOffset: <offset>, content: <html>}
        // offset   := the offset from start of all text content that ignored HTML tag.
        // html     := HTML codes with content. e.g. `<p>This is a HTML.</p>`
        contents: [],
      };
    },
    methods: {
      loadUri: (uri) => {
        return new Promise((resolve, reject) => {
          axios.get(uri).then((http_response) => {
            resolve(http_response.data)
          })
        })
      },
      parseBioes: (bioes) => {
        return new Promise((resolve, reject) => {
          const parser = new Bioes()
          parser.parse(bioes)
          resolve(parser)
        })
      },
      setContent: function(html_src) {
        const virtualBody = document.createElement('div');
        virtualBody.innerHTML = html_src;

        let last_offset = 0;
        this.contents = [];
        for(let index = 0;index < virtualBody.childNodes.length; index ++) {
          this.contents.push({
            offset: last_offset,
            content: virtualBody.childNodes[index]
          });
          last_offset += virtualBody.childNodes[index].textContent.length;
        }
      },
      _findPositionIncluded: (position, contents) => {
        for(let index = 0; index < contents.length; index ++) {
          if (contents[index].offset >= position) {
            return (index - 1);
          }
        }
        return -1;
      },
      setAnnotation: function(annotations) {
        for(let index in annotations) {
          const startIndex = this._findPositionIncluded(annotations[index].position[0], this.contents);
          const endIndex = this._findPositionIncluded(annotations[index].position[1], this.contents);

          if (startIndex !== -1 && endIndex !== -1) {
            if (startIndex === endIndex) {
              const highlight = new Highlight(
                annotations[index].position[0] - this.contents[startIndex].offset,
                annotations[index].position[1] - this.contents[endIndex].offset,
                'test',
                $('#' + startIndex)[0]
              );
            }
            // TODO: else block; 関係するパーツを全て連結した状態のパーツと、この連結パーツ内のオフセットを計算して処理すればいい筈。
          }
        }
      },
    },
    // cannot used '=> {}', because need 'this' as Vue instance.
    mounted: function() {
      this.loadUri('./sample.BIOES').then((resolve, reject) => {
        this.parseBioes(resolve).then((resolve, reject) => {
          this.setContent(resolve.content);
          // setAnnotation() needs the real HTML tree.
          this.$nextTick(function() {
            this.setAnnotation(resolve.annotations);
          });
        })
      })
    }
  });

  const vueObj = new Vue({
    el: '#viewerWrapper',
    data: () => {
      return {};
    },
  });
});
