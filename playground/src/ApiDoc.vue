<script setup lang="ts">
import { computed } from "vue";
import { MTable, MTableColumn } from "@shuimo-design/ui";

/**
 * docs/api/<组件名>.json 的结构：packages/ui/scripts/gen-meta.ts 在 `pnpm build` 时
 * 用 vue-component-meta 从 SFC 提取出来的，字段名沿用 web-types 的口径。
 */
interface ApiAttribute {
  name: string;
  description?: string;
  default?: string;
  required?: boolean;
  value?: { kind: "expression"; type: string };
}
interface ApiNamed {
  name: string;
  description?: string;
}
interface ApiDoc {
  name: string;
  attributes: ApiAttribute[];
  events: ApiNamed[];
  slots: ApiNamed[];
}

/** 表里的一行属性 */
interface PropRow {
  name: string;
  required: boolean;
  type: string;
  default: string;
  description: string;
}

const { name } = defineProps<{ name: string }>();

// 构建期把 docs/api 下全部 JSON 一次打进来（键是相对路径），按 JSON 里的组件名取
const files = import.meta.glob<ApiDoc>("../../docs/api/*.json", { eager: true, import: "default" });
const byName = new Map(Object.values(files).map((doc) => [doc.name, doc]));

const doc = computed(() => byName.get(name));

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
 * defineModel 会同时产出一个属性（modelValue / open …）和一个 update:xxx 事件，
 * 文档里把这一对合并成一行 v-model（具名的就是 v-model:xxx），事件表里不再单列。
 */
const modeled = computed(() => {
  const events = new Set(doc.value?.events.map((e) => e.name));
  return new Set(
    doc.value?.attributes.filter((a) => events.has(`update:${a.name}`)).map((a) => a.name),
  );
});

const props = computed<PropRow[]>(() =>
  (doc.value?.attributes ?? []).map((a) => ({
    name: modeled.value.has(a.name)
      ? a.name === "modelValue"
        ? "v-model"
        : `v-model:${a.name}`
      : a.name,
    required: a.required === true,
    type: tidyType(a.value?.type),
    default: a.default ?? "",
    description: a.description ?? "",
  })),
);

const events = computed<ApiNamed[]>(() =>
  (doc.value?.events ?? []).filter((e) => {
    const target = /^update:(.+)$/.exec(e.name)?.[1];
    return !(target && modeled.value.has(target));
  }),
);

const slots = computed<ApiNamed[]>(() => doc.value?.slots ?? []);
</script>

<template>
  <section v-if="doc" class="api">
    <h3 class="api__title">API</h3>

    <div v-if="props.length" class="api__block">
      <h4 class="api__sub">Props</h4>
      <MTable :data="props" align="left">
        <MTableColumn param="name" label="名称" :width="180">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.name }}</code>
            <span v-if="row.required" class="api__required">必填</span>
          </template>
        </MTableColumn>
        <MTableColumn param="type" label="类型">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.type }}</code>
          </template>
        </MTableColumn>
        <MTableColumn param="default" label="默认值" :width="110">
          <template #default="{ data: row }">
            <code v-if="row.default" class="api__code">{{ row.default }}</code>
            <span v-else class="api__none">—</span>
          </template>
        </MTableColumn>
        <MTableColumn param="description" label="说明" />
      </MTable>
    </div>

    <div v-if="events.length" class="api__block">
      <h4 class="api__sub">Events</h4>
      <MTable :data="events" align="left">
        <MTableColumn param="name" label="名称" :width="180">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.name }}</code>
          </template>
        </MTableColumn>
        <MTableColumn param="description" label="说明" />
      </MTable>
    </div>

    <div v-if="slots.length" class="api__block">
      <h4 class="api__sub">Slots</h4>
      <MTable :data="slots" align="left">
        <MTableColumn param="name" label="名称" :width="180">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.name }}</code>
          </template>
        </MTableColumn>
        <MTableColumn param="description" label="说明" />
      </MTable>
    </div>
  </section>
</template>

<style scoped>
/* 接在示例下面，隔一道分割线；三张表之间留一点气口 */
.api {
  display: grid;
  gap: 20px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--m-divider);
}
.api__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.api__block {
  display: grid;
  gap: 10px;
}
.api__sub {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--m-fg-muted);
  letter-spacing: 0.1em;
}
/* 组件库没有等宽字体变量，用系统等宽栈 */
.api__code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12.5px;
  word-break: break-word;
}
.api__required {
  margin-left: 6px;
  font-size: 11px;
  color: var(--m-seal);
}
.api__none {
  color: var(--m-fg-muted);
}
</style>
