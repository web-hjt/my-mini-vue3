// runtime-dom
import { createRenderer } from '../runtime-core'
import { render } from 'vue'

let renderer
// dom平台特有的节点操作
const rendererOptions = {
  querySelector(selector) {
    return document.querySelector(selector)
  },
  insert(child, parent, anchor) {
    // anchor为null 则为appendChild
    parent.insertBefore(child, anchor || null)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  createElement(tag) {
    return document.createElement(tag)
  },
  remove: (child) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
}

// 确保renderer单例
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}

// 创建app实例
export function createApp(rootComponent) {
  // 接收组件，返回app实例

  const app = ensureRenderer().createApp(rootComponent)
  const mount = app.mount
  app.mount = function (selectorOrContainer) {
    const container = document.querySelector(selectorOrContainer)
    mount(container)
  }
  console.log(app)
  return app
}
