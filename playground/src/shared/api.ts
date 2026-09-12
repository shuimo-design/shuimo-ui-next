/**
 * docs/api/<组件名>.json 的读取与整形。
 *
 * 这些 JSON 由 `scripts/gen-meta.ts` 在 `pnpm build` 时从 **core 的类型**生成，一份同时描述
 * 两个框架：每个属性 / 事件 / 插槽上都带一个 `react` 字段，写着它在 React 那边叫什么名字。
 * 所以两版文档站吃的是同一份数据，只是各自挑自己那一列 —— 这里就是"挑"的逻辑，纯函数，
 * 不引任何框架，两边的 ApiDoc 组件只负责把返回的行画成表格。
 */

/** 一个东西在 React 那边的名字；extra 是它额外带出来的 props（defaultOpen / onOpenChange） */
export interface ApiBinding {
  name: string;
  extra?: string[];
}

export interface ApiAttribute {
  name: string;
  description?: string;
  default?: string;
  required?: boolean;
  value?: { kind: "expression"; type: string };
  react?: ApiBinding;
}

export interface ApiNamed {
  name: string;
  description?: string;
  react?: ApiBinding;
}

export interface ApiDoc {
  name: string;
  attributes: ApiAttribute[];
  events: ApiNamed[];
  slots: ApiNamed[];
}

/** 属性表里的一行 */
export interface PropRow {
  name: string;
  /** 跟着这个属性一起来的其他 props，只有 React 版有（非受控的 defaultXxx、回调 onXxxChange） */
  extra: string;
  required: boolean;
  type: string;
  default: string;
  description: string;
}

/** 事件表 / 插槽表里的一行 */
export interface NameRow {
  name: string;
  description: string;
}

export interface ApiTables {
  props: PropRow[];
  events: NameRow[];
  slots: NameRow[];
  /** 两边这两张表装的不是一回事，标题跟着变 */
  eventsTitle: string;
  slotsTitle: string;
}

export type Flavor = "vue" | "react";

// 构建期把 docs/api 下全部 JSON 一次打进来（键是相对路径），按 JSON 里的组件名取
const files = import.meta.glob<ApiDoc>("../../../docs/api/*.json", {
  eager: true,
  import: "default",
});
const byName = new Map(Object.values(files).map((doc) => [doc.name, doc]));

/** 按最外层的 `|` 切开联合类型，尖括号 / 括号里面的不算 */
function splitUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < type.length; i++) {
    const ch = type[i];
    if (ch === "<" || ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ">" || ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "|" && depth === 0) {
      parts.push(type.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(type.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** 可选属性的类型里都会带一个 `| undefined`，对读者只是噪音，去掉再显示 */
function tidyType(type: string | undefined): string {
  if (!type) return "";
  return splitUnion(type)
    .filter((p) => p !== "undefined")
    .join(" | ");
}

/**
 * Vue 的 defineModel 会同时产出一个属性（modelValue / open …）和一个 update:xxx 事件。
 * 两边的表里都把这一对合并成一行：Vue 写 `v-model`，React 写属性名本身（受控），
 * 非受控的 `defaultXxx` 和回调 `onXxxChange` 挂在同一行的"配套"里。
 */
function modeledNames(doc: ApiDoc): Set<string> {
  const events = new Set(doc.events.map((e) => e.name));
  return new Set(doc.attributes.filter((a) => events.has(`update:${a.name}`)).map((a) => a.name));
}

function vueTables(doc: ApiDoc): ApiTables {
  const modeled = modeledNames(doc);
  return {
    props: doc.attributes.map((a) => ({
      name: modeled.has(a.name)
        ? a.name === "modelValue"
          ? "v-model"
          : `v-model:${a.name}`
        : a.name,
      extra: "",
      required: a.required === true,
      type: tidyType(a.value?.type),
      default: a.default ?? "",
      description: a.description ?? "",
    })),
    // update:xxx 已经并进 v-model 那一行了，事件表里不再单列
    events: doc.events
      .filter((e) => {
        const target = /^update:(.+)$/.exec(e.name)?.[1];
        return !(target && modeled.has(target));
      })
      .map((e) => ({ name: e.name, description: e.description ?? "" })),
    slots: doc.slots.map((s) => ({ name: s.name, description: s.description ?? "" })),
    eventsTitle: "事件 Events",
    slotsTitle: "插槽 Slots",
  };
}

function reactTables(doc: ApiDoc): ApiTables {
  const modeled = modeledNames(doc);
  return {
    // 没有 react 绑定的条目 = React 壳上真的没有这个属性，不列出来，别骗读者
    props: doc.attributes
      .filter((a) => a.react)
      .map((a) => ({
        name: a.react!.name,
        extra: modeled.has(a.name) ? (a.react!.extra ?? []).join(" · ") : "",
        required: a.required === true,
        type: tidyType(a.value?.type),
        default: a.default ?? "",
        description: a.description ?? "",
      })),
    // Vue 的 emit 在 React 这边就是 on 开头的属性；v-model 那一对不在这里
    events: doc.events
      .filter((e) => {
        const target = /^update:(.+)$/.exec(e.name)?.[1];
        return e.react && !(target && modeled.has(target));
      })
      .map((e) => ({ name: e.react!.name, description: e.description ?? "" })),
    // Vue 的插槽在 React 这边是 children 或者一个返回节点的属性
    slots: doc.slots
      .filter((s) => s.react)
      .map((s) => ({ name: s.react!.name, description: s.description ?? "" })),
    eventsTitle: "事件回调",
    slotsTitle: "内容与渲染属性",
  };
}

/** 取某个组件在某一版文档里要显示的三张表；没有这个组件的 JSON 就返回 undefined */
export function apiTables(name: string, flavor: Flavor): ApiTables | undefined {
  const doc = byName.get(name);
  if (!doc) return undefined;
  return flavor === "vue" ? vueTables(doc) : reactTables(doc);
}
