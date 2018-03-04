import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'

window.$ = $

$(() => {
  Vue.component('html_viewer', {
    template: '<div id="viewer" v-html="content"></div>',
    data: () => {
      return {
        content: ''
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
      }
    },
    // cannot used '=> {}', because need 'this' as Vue instance.
    mounted: function() {
      this.loadUri('./sample.BIOES').then((resolve, reject) => {
        this.parseBioes(resolve).then((resolve, reject) => {
            this.content = resolve.content
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
