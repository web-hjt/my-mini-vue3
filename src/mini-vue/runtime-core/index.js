import { reactive, effect } from '../reactivity'
import { createVNode } from './vnode'

// runtime-core
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    querySelector: querySelector,
    setElementText: hostSetElementText,
    insert: hostInsert,
    remove: hostRemove,
  } = options
  // render负责渲染组件内容
  const render = (vnode, container) => {
    // 如果存在vnode则为mount或path，否则就是unmount
    if (vnode) {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode

    /**
     *
     *
     *  下方为不使用vnode写法
     */
    // // console.log('mount')
    // // 1,获取宿主
    // const container = options.querySelector(selector)
    // // 2,渲染试图
    // // 数据响应式
    // const observed = reactive(rootComponent.data())
    // // 3，为组件定一个更新函数
    // const componentUpdateFn = () => {
    //   const el = rootComponent.render.call(observed)
    //   // 清空数据
    //   options.setElementText(container, '')
    //   // 4,追加到宿主
    //   // container.appendChild(el)
    //   options.insert(el, container)
    // }
    // // 设置激活的副作用
    // effect(componentUpdateFn)
    // // 初始化执行一次
    // componentUpdateFn()
    // // 挂载钩子
    // if (rootComponent.mounted) {
    //   rootComponent.mounted.call(observed)
    // }
  }
  const patch = (n1, n2, container) => {
    // 如果n2中type为字符串，说明他是原生节点，element,否则是组件
    let { type } = n2
    if (typeof type === 'string') {
      processElement(n1, n2, container)
    } else {
      processComponent(n1, n2, container)
    }
  }
  // 原生节点
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 创建
      mountElement(n2, container)
    } else {
      patchElement(n1, n2)
    }
  }
  // 组件
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      // 挂载
      mountComponent(n2, container)
    } else {
      // patch
    }
  }
  const mountElement = (vnode, container) => {
    const el = (vnode.el = hostCreateElement(vnode.type))
    // children是文本情况
    if (typeof vnode.children === 'string') {
      el.textContent = vnode.children
    } else {
      vnode.children.forEach((child) => patch(null, child, el))
    }
    // 插入元素
    hostInsert(el, container)
  }
  // 挂载做三件事
  // 1、组件实例化
  // 2、状态初始化
  // 3、副作用安装
  const mountComponent = (intialValue, container) => {
    // 1、组件实例化
    const instance = {
      data: {},
      vnode: intialValue,
      isMounted: false,
    }
    // 2、状态初始化
    const { data: dataOptions } = instance.vnode.type
    instance.data = reactive(dataOptions())
    // 3、副作用安装
    setupRenderEffect(instance, container)
  }
  const setupRenderEffect = (instance, container) => {
    const { render } = instance.vnode.type
    // 声明组件更新函数
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 创建阶段
        // 执行组件的渲染函数获取其vnode
        // 保存最新的虚拟dom,这样下次更新时可以作为旧的vnode
        const vnode = (instance.subtree = render.call(instance.data))
        // 递归patch嵌套函数
        patch(null, vnode, container)
        // // 挂载钩子
        if (instance.vnode.type.mounted) {
          instance.vnode.type.mounted.call(instance.data)
        }
        instance.isMounted = true
      } else {
        // 更新阶段

        const prevVnode = instance.subtree
        // 获取新的vnode
        const nextVnode = render.call(instance.data)
        // 保存
        instance.subtree = nextVnode
        // 执行path，传入新旧vnode
        patch(prevVnode, nextVnode)
      }
    }
    // 建立更新机制
    effect(componentUpdateFn)
    // 首次执行组件更新函数
    componentUpdateFn()
  }
  const patchElement = (n1, n2) => {
    // 获取要更新的元素节点
    const el = (n2.el = n1.el)
    // 更新type相同的节点，实际上还要考虑key
    if (n1.type === n2.type) {
      const oldCh = n1.children
      const newCh = n2.children
      // 根据元素不同做不同的处理
      if (typeof oldCh === 'string') {
        if (typeof newCh === 'string') {
          // 文本更新
          if (oldCh !== newCh) {
            hostSetElementText(el, newCh)
          }
        } else {
          // 替换文本
          hostSetElementText(el, '')
          newCh.forEach((child) => {
            patch(null, child, el)
          })
        }
      } else {
        // 老的类型是数组
        if (typeof newCh === 'string') {
          // 新是文本
          hostSetElementText(el, newCh)
        } else {
          // 新 老 都是数组
          updateChildren(oldCh, newCh, el)
        }
      }
    }
  }
  // 简单dom操作
  const updateChildren = (oldCh, newCh, parentElm) => {
    const len = Math.min(oldCh.length, newCh.length)
    for (let i = 0; i < len; i++) {
      patch(oldCh[i], newCh[i])
    }
    // newCh若是更⻓的那个，说明有新增
    if (newCh.length > oldCh.length) {
      newCh.slice(len).forEach((child) => patch(null, child, parentElm))
    } else if (newCh.length < oldCh.length) {
      // oldCh若是更⻓的那个，说明有删减
      oldCh.slice(len).forEach((child) => hostRemove(child.el))
    }
  }
  // 返回一个渲染器实例
  return {
    render,
    createApp: createAppAPI(render),
  }
}

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    const app = {
      mount(container) {
        let vnode = createVNode(rootComponent)
        // 传入跟组件 vnode ，而非跟组件配置，render作用是将虚拟dom转化为dom并追加至宿主
        render(vnode, container)
      },
    }
    return app
  }
}
