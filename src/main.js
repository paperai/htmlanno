import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'
import SpanAnnotation from './spanannotation'
import bioesHtmlViewer from './vue_bioes_viewer'

window.$ = $

$(() => {
  bioesHtmlViewer()
  const vueObj = new Vue({
    el: '#content',
    data: () => {
      return {
        view_bioes: false,
        view_html: false,
        annotation_uri: ''
      }
    },
    methods: {
      load_bioes: function () {
        this.view_bioes = true;
        this.view_html  = false;
        Vue.nextTick(() => {
          this.annotation_uri = './sample/sample.BIOES'
        });
      },
      load_html: function () {
        this.view_bioes = false;
        this.view_html  = true;
        Vue.nextTick(() => {
          this.annotation_uri = './sample/sample.xhtml'
        });
      }
    },
  })
});
