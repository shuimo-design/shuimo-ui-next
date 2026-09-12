/**
 * 控制器契约：所有有状态的组件逻辑都长这个样子，Vue 和 React 各用十几行胶水接上去。
 *
 * 三条铁律，违反哪一条 React 那边就会出问题：
 * 1. `update()` 是**纯赋值**——不通知订阅者、不碰 DOM、不改变 getSnapshot() 的返回值。
 *    有了这条，React 才能在渲染期直接调它；即使这次渲染被丢弃也毫无副作用。
 * 2. `getServerSnapshot()` 返回的对象引用恒定，且必须是"服务端也算得出来的值"
 *    （要量 DOM 才知道的字段，初值只能是 0 / false，由 connect() 之后的观察器补）。
 * 3. `connect()` / `disconnect()` 幂等且可反复配对——React 的 StrictMode 会跑两轮。
 *
 * 第 1 条的配套：options 变了确实需要"去做点什么"的（重新算浮层坐标之类），
 * 在 `update()` 里只记一笔账，把真正的动作放进可选的 `flush()`；两个壳的胶水会在
 * 这一轮渲染**落地之后**替你调它。自己在 `update()` 里动手的话，React 会报
 * "Cannot update a component while rendering a different component"。
 *
 * 只有副作用、没有状态要驱动渲染的（比如笔触边框），不实现这个接口，
 * 写成 `attach(el) / update(options) / dispose()` 就够了。
 */
import type { Unsubscribe } from "./store";

export interface Controller<S extends object, O> {
  getSnapshot(): S;
  getServerSnapshot(): S;
  subscribe(listener: () => void): Unsubscribe;
  /** 喂入最新的 props 和回调。纯赋值语义，见上面第 1 条 */
  update(options: O): void;
  /** 客户端挂载后调一次：装监听、量尺寸、注册到全局栈 */
  connect(): void;
  /** 卸载：撤销 connect 做的一切 */
  disconnect(): void;
  /**
   * 可选。渲染落地之后由壳调用，用来补做 `update()` 记下、但不能在渲染期做的事。
   * 每轮渲染都会被调到，所以实现里要自己判断"有没有真的变过"，没变就别动。
   */
  flush?(): void;
}
