import { triggerRef } from 'vue'
let activeEffect

export function effect(fn) {
  activeEffect = fn
}
// 接收需要做响应式处理的对象，返回代理的对象
export function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const value = Reflect.get(target, key)
      // 依赖收集
      track(target, key)
      return value
    },
    set(target, key, value) {
      // target[key] = value; 这种写法，操作成功与否，我们是不知道的
      const result = Reflect.set(target, key, value)
      trigger(target, key)
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target)
      trigger(target, key)
      return result
    },
  })
}
// 创建一个Map保存以来关系 target:{key:[fn1,fn2]}
const targetMap = new Map()
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    // 首次depsMap是不存在的，需要创建
    if (!depsMap) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    // 获取depsMap中的值
    let deps = depsMap.get(key)
    // 首次没有，需要创建
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }
    // 添加当前激活的副作用
    deps.add(activeEffect)
  }
}
function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (depsMap) {
    const deps = depsMap.get(key)
    if (deps) {
      deps.forEach((dep) => dep())
    }
  }
}
