<script setup lang="ts">
import { h, ref, shallowRef } from "vue";
import {
  MButton,
  MTabPane,
  MTabs,
  type TabName,
  type TabsPosition,
  type VueTabPane,
} from "@shuimo-design/vue";

const active = ref<TabName>("shan");
const log = ref("还没切过");
function onChange(name: TabName) {
  log.value = `切到了 ${name}`;
}

/** 新写法：页就是一个数组，顺序即标签顺序 */
const basicPanes: VueTabPane[] = [
  {
    name: "shan",
    label: "山",
    content: () => h("p", { style: "margin: 0" }, "远山如黛，近水含烟。"),
  },
  {
    name: "shui",
    label: "水",
    content: () => h("p", { style: "margin: 0" }, "流水不腐，户枢不蠹。"),
  },
  { name: "yun", label: "云", disabled: true, content: "看不到。" },
  {
    name: "yue",
    label: "月",
    content: () => h("p", { style: "margin: 0" }, "月上柳梢头，人约黄昏后。"),
  },
];

const position = ref<TabsPosition>("top");
const positions: TabsPosition[] = ["top", "bottom", "left", "right"];

/** 可关闭 + 新增：组件只报 tabRemove，增删都由使用方改数组。
 *  用 shallowRef：配置项里的 content 可能是 VNode / 渲染函数，深响应会把它整棵展开 */
let seq = 3;
const editable = shallowRef<VueTabPane[]>([
  { name: "t1", label: "第一页", content: "白日依山尽" },
  { name: "t2", label: "第二页", content: "黄河入海流" },
  { name: "t3", label: "第三页", content: "欲穷千里目" },
]);
const editableActive = ref<TabName>("t1");
function remove(name: TabName) {
  editable.value = editable.value.filter((t) => t.name !== name);
}
function add() {
  seq += 1;
  const name = `t${seq}`;
  editable.value = [
    ...editable.value,
    { name, label: `第 ${seq} 页`, content: `新开的第 ${seq} 页` },
  ];
  editableActive.value = name;
}

const lazyLog = ref<string[]>([]);
function mounted(name: string) {
  lazyLog.value.push(name);
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">
      基础用法（panes 数组）：标签是手写体，导航条下一条笔触线，激活项压一横朱笔
    </p>
    <MTabs v-model="active" :panes="basicPanes" @change="onChange" />
    <p class="demo__hint">{{ log }}（当前 {{ active }}）。方向键左右切换，Home / End 跳到两头</p>

    <p class="demo__caption">
      语法糖：用 MTabPane 子组件写也行（MTabs 在渲染期按书写顺序读它们的 props，
      不渲染这些子组件本身）。card 型：每个标签一条宣纸签条，激活的那条像书签一样插进内容区的框里
    </p>
    <MTabs type="card">
      <MTabPane name="a" label="春">
        <p style="margin: 0">春眠不觉晓，处处闻啼鸟。</p>
      </MTabPane>
      <MTabPane name="b" label="夏">
        <p style="margin: 0">接天莲叶无穷碧，映日荷花别样红。</p>
      </MTabPane>
      <MTabPane name="c" label="秋">
        <p style="margin: 0">停车坐爱枫林晚，霜叶红于二月花。</p>
      </MTabPane>
    </MTabs>

    <p class="demo__caption">位置：{{ position }}</p>
    <div class="demo__row">
      <MButton v-for="p in positions" :key="p" @click="position = p">{{ p }}</MButton>
    </div>
    <div class="demo__block">
      <MTabs
        :position="position"
        :panes="[
          { name: 'a', label: '第一', content: 'line 型换位置，笔触线跟着换到对应那一边。' },
          { name: 'b', label: '第二', content: '第二页。' },
          { name: 'c', label: '第三', content: '第三页。' },
        ]"
      />
      <MTabs
        type="card"
        :position="position"
        :panes="[
          {
            name: 'a',
            label: '甲',
            content: 'card 型换位置，签条从对应那一边插进来，朝内容区那面不画框线。',
          },
          { name: 'b', label: '乙', content: '乙。' },
        ]"
      />
    </div>

    <p class="demo__caption">
      可关闭 + extra 插槽：关闭只发 tabRemove，增删由使用方改数组；删掉当前页会自动落到邻居
    </p>
    <MTabs v-model="editableActive" type="card" closable :panes="editable" @tab-remove="remove">
      <template #extra>
        <MButton type="text" @click="add">新增一页</MButton>
      </template>
    </MTabs>

    <p class="demo__caption">stretch：标签平分宽度</p>
    <MTabs
      stretch
      :panes="[
        { name: 'a', label: '东', content: '东。' },
        { name: 'b', label: '南', content: '南。' },
        { name: 'c', label: '西', content: '西。' },
        { name: 'd', label: '北', content: '北。' },
      ]"
    />

    <p class="demo__caption">labelNode + lazy：懒的那页首次激活才渲染</p>
    <MTabs>
      <MTabPane name="a">
        <template #label>
          <span>常驻 <small style="color: var(--m-fg-muted)">立即渲染</small></span>
        </template>
        <p style="margin: 0">一直在。</p>
      </MTabPane>
      <MTabPane name="b" lazy>
        <template #label>
          <span>懒加载 <small style="color: var(--m-fg-muted)">切到才渲染</small></span>
        </template>
        <p style="margin: 0" @vue:mounted="mounted('懒加载页')">现在才挂上来。</p>
      </MTabPane>
    </MTabs>
    <p class="demo__hint">挂载记录：{{ lazyLog.join("、") || "懒加载页还没渲染" }}</p>

    <p class="demo__caption">整组禁用</p>
    <MTabs
      disabled
      :panes="[
        { name: 'a', label: '不能点', content: '全部禁用。' },
        { name: 'b', label: '也不能点', content: '看不到。' },
      ]"
    />
  </div>
</template>
