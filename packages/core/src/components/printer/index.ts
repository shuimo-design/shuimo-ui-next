/**
 * 打字机的无框架部分。
 *
 * 逐字打出是有状态、有时序的，所以写成控制器：定时器、码点切分、循环、结束回调全在这里，
 * Vue 和 React 各用十几行胶水接上去（`runtime/use-controller`），两边一个字都不重复写。
 *
 * 注意 `createPrinter` 是另一样东西 —— 控制台彩色打印（见 ./printer），旧版的 MPrinter 就是它，
 * 名字先到先得，打字机这边叫 createTypewriter。
 */
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import type { PrinterProps } from "./types";

export { createPrinter } from "./printer";
export type { ConsolePrinter, PrinterEmits, PrinterLevel, PrinterProps } from "./types";

/** 每个字的间隔 ms */
const SPEED = 80;
/** 循环时打完到重打之间停多久 ms */
const PAUSE = 1200;

export function printerClasses(done: boolean): string[] {
  return ["m-printer", ...(done ? ["m-printer--done"] : [])];
}

export interface TypewriterOptions extends PrinterProps {
  /** 一段文字全部打完时调；循环时每一轮都会调 */
  onEnd?: () => void;
}

export interface TypewriterState {
  /** 已经打出来的那一截 */
  shown: string;
  /** 这一轮打完了 */
  done: boolean;
}

export interface TypewriterController extends Controller<TypewriterState, TypewriterOptions> {
  /** 从头再打一遍；speed 不为正数时直接整段显示 */
  restart(): void;
  /** 跳到结尾，直接显示全文 */
  finish(): void;
  /** 每次渲染之后调一次：印文换了就从头再打。换没换由控制器自己比，壳里不用留状态 */
  refresh(): void;
}

export function createTypewriter(initial: TypewriterOptions = {}): TypewriterController {
  let options = initial;
  // 按码点切，emoji 之类的代理对不会被打成半个
  let chars = Array.from(initial.text ?? "");
  let count = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let connected = false;
  /** 当前这一轮打的是哪段文字：refresh() 靠它认出 props 换了印文 */
  let started: string | undefined;
  // 初值就是服务端渲染出来的样子：一个字都还没打
  const store = createStore<TypewriterState>({ shown: "", done: chars.length === 0 });

  const speed = () => options.speed ?? SPEED;

  function stop(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  function publish(): void {
    store.set({ shown: chars.slice(0, count).join(""), done: count >= chars.length });
  }

  function tick(): void {
    timer = undefined;
    if (count < chars.length) count += 1;
    publish();
    if (count < chars.length) {
      timer = setTimeout(tick, speed());
      return;
    }
    options.onEnd?.();
    if (options.loop === true && chars.length > 0) {
      timer = setTimeout(restart, options.pause ?? PAUSE);
    }
  }

  function restart(): void {
    stop();
    chars = Array.from(options.text ?? "");
    started = options.text ?? "";
    count = 0;
    publish();
    if (chars.length === 0) return;
    if (speed() <= 0) {
      finish();
      return;
    }
    timer = setTimeout(tick, speed());
  }

  function finish(): void {
    stop();
    chars = Array.from(options.text ?? "");
    started = options.text ?? "";
    count = chars.length;
    publish();
    options.onEnd?.();
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,
    /** 纯赋值：不碰定时器、不改快照。文字换了要等 refresh() 才重打 */
    update(next) {
      options = next;
    },
    connect() {
      connected = true;
      // 先记下这一轮打的是什么，autoplay 关着时 refresh() 才不会误判成"印文换了"
      started = options.text ?? "";
      if (options.autoplay !== false) restart();
    },
    disconnect() {
      connected = false;
      stop();
    },
    restart,
    finish,
    refresh() {
      if (!connected) return;
      if ((options.text ?? "") !== started) restart();
    },
  };
}
