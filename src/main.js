// import { createApp } from 'vue'
import { createApp } from './mini-vue'
import { createVNode } from './mini-vue/runtime-core/vnode'
// import './style.css'
import App from './App.vue'

createApp({
  data() {
    return {
      title: ['a', 'b', 'c', 'd'],
    }
  },
  render() {
    // const h1 = document.createElement('h1')
    // h1.textContent = this.title
    // return h1
    if (Array.isArray(this.title)) {
      return createVNode(
        'h1',
        {},
        this.title.map((t) => createVNode('p', {}, t))
      )
    } else {
      return createVNode('h1', {}, this.title)
    }
  },
  mounted() {
    setTimeout(() => {
      this.title = ['a', 'c', 'd']
    }, 2000)
  },
}).mount('#app')
