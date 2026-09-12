/**
 * 素材登记：同一张现算的 SVG 只写进样式表一次，元素上只挂一个几个字符的属性值。
 * 原来每个实例把 data URL 塞进自己的 style，一页 12 张同尺寸的卡就是 12 份一样的字符串，
 * 现在是样式表里一条规则 `[data-ia-xxx="k1a2b"] { --m-xxx: url(...) }`，同一张图的实例共用。
 * 用 data 属性不用 class：Vue 更新 class 时会整体重写，命令式加上去的类名会被冲掉；模板没绑定的 data 属性它不碰。
 * 规则不撤销——不同素材的数量有限（生成器本身按尺寸分桶、带缓存），撤了再加反而让样式表反复失效。
 * 只在客户端工作；没有 document（SSR）时返回 null，调用方退回内联写法。
 */

interface Registered {
  attr: string;
  token: string;
}

let sheet: CSSStyleSheet | null | undefined;
/** `变量|url` → 登记结果 */
const registry = new Map<string, Registered>();
/** 已用过的 token → url，用来查哈希碰撞 */
const tokens = new Map<string, string>();

function getSheet(): CSSStyleSheet | null {
  if (sheet !== undefined) return sheet;
  if (typeof document === "undefined" || !document.head) return (sheet = null);
  const style = document.createElement("style");
  style.setAttribute("data-m-ink-assets", "");
  document.head.appendChild(style);
  sheet = style.sheet ?? null;
  return sheet;
}

/** FNV-1a 32 位，出来的 base36 六七个字符；撞了再补序号 */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 变量名 → 属性名：`--m-ink-stroke-border` → `data-ia-ink-stroke-border` */
export function inkVarAttr(variable: string): string {
  return `data-ia-${variable.replace(/^--m-/, "")}`;
}

/** 登记一张素材，返回要挂到元素上的属性名和值；客户端不可用时返回 null */
export function registerInkVar(variable: string, url: string): Registered | null {
  const key = `${variable}|${url}`;
  const hit = registry.get(key);
  if (hit) return hit;
  const css = getSheet();
  if (!css) return null;
  const attr = inkVarAttr(variable);
  let token = `k${hash(url)}`;
  for (let i = 2; tokens.has(token) && tokens.get(token) !== url; i++) token = `k${hash(url)}-${i}`;
  tokens.set(token, url);
  try {
    css.insertRule(`[${attr}="${token}"]{${variable}:url("${url}")}`, css.cssRules.length);
  } catch {
    // 样式表被别的脚本挪走或浏览器拒绝插入：这张退回内联，不影响别的
    return null;
  }
  const entry = { attr, token };
  registry.set(key, entry);
  return entry;
}

/**
 * 把素材挂到元素上（url 为 null 就清掉）：登记成功走属性，失败退回内联 style；
 * 两种写法互斥，换图时把另一种清干净，免得内联的老图压住新规则
 */
export function applyInkVar(el: HTMLElement, variable: string, url: string | null): void {
  const attr = inkVarAttr(variable);
  if (url === null) {
    el.removeAttribute(attr);
    el.style.removeProperty(variable);
    return;
  }
  const entry = registerInkVar(variable, url);
  if (entry) {
    el.style.removeProperty(variable);
    if (el.getAttribute(attr) !== entry.token) el.setAttribute(attr, entry.token);
  } else {
    el.removeAttribute(attr);
    el.style.setProperty(variable, `url("${url}")`);
  }
}

export interface InkVarBindings {
  /** 挂到元素上的 data 属性（v-bind） */
  attrs: Record<string, string>;
  /** 登记不了时退回的内联变量（合进 :style） */
  style: Record<string, string>;
}

/**
 * 给模板用：一组"变量 → data URL"，能登记的变成属性、登记不了的落回 style，两边一起绑到同一个元素上。
 * 值为 undefined 的跳过（比如没开引擎时不生成）。渲染期调用，url 不变时登记是纯查表。
 *
 * `registered` 决定走哪种形态，**服务端渲染必须传 false**：
 * 服务端没有 document，登记拿不到样式表、只能退回内联 style；客户端首帧却能登记成功、
 * 挂出 data 属性。两边输出对不上，水合就会报属性不匹配。
 * 所以规矩是：服务端和水合首帧一律 false（内联），挂载之后再传 true 升级成属性。
 * 默认 true 是为了照顾还没接 SSR 的调用方，行为和以前一致。
 */
export function inkVarBindings(
  vars: Record<string, string | undefined>,
  registered = true,
): InkVarBindings {
  const attrs: Record<string, string> = {};
  const style: Record<string, string> = {};
  for (const [variable, url] of Object.entries(vars)) {
    if (url === undefined) continue;
    const entry = registered ? registerInkVar(variable, url) : null;
    if (entry) attrs[entry.attr] = entry.token;
    else style[variable] = `url("${url}")`;
  }
  return { attrs, style };
}
