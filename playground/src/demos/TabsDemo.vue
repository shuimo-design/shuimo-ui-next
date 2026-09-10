<script setup lang="ts">
import { ref } from "vue";
import { MTabs, MTabPane, MButton, type TabName, type TabsPosition } from "@shuimo-design/ui";

const active = ref<TabName>("shan");
const log = ref("还没切过");
function onChange(name: TabName) {
  log.value = `切到了 ${name}`;
}

const position = ref<TabsPosition>("top");
const positions: TabsPosition[] = ["top", "bottom", "left", "right"];

/** 可关闭 + 新增：组件只报 tabRemove，增删都由使用方改列表 */
let seq = 3;
const editable = ref([
  { name: "t1", label: "第一页", body: "白日依山尽" },
  { name: "t2", label: "第二页", body: "黄河入海流" },
  { name: "t3", label: "第三页", body: "欲穷千里目" },
]);
const editableActive = ref<TabName>("t1");
function remove(name: TabName) {
  editable.value = editable.value.filter((t) => t.name !== name);
}
function add() {
  seq += 1;
  const name = `t${seq}`;
  editable.value.push({ name, label: `第 ${seq} 页`, body: `新开的第 ${seq} 页` });
  editableActive.value = name;
}

const lazyLog = ref<string[]>([]);
function mounted(name: string) {
  lazyLog.value.push(name);
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">基础用法：标签是手写体，导航条下一条笔触线，激活项压一横朱笔</p>
    <MTabs v-model="active" @change="onChange">
      <MTabPane name="shan" label="山">
        <p style="margin: 0">远山如黛，近水含烟。</p>
      </MTabPane>
      <MTabPane name="shui" label="水">
        <p style="margin: 0">流水不腐，户枢不蠹。</p>
      </MTabPane>
      <MTabPane name="yun" label="云" disabled>
        <p style="margin: 0">看不到。</p>
      </MTabPane>
      <MTabPane name="yue" label="月">
        <p style="margin: 0">月上柳梢头，人约黄昏后。</p>
      </MTabPane>
    </MTabs>
    <p class="demo__hint">{{ log }}（当前 {{ active }}）。方向键左右切换，Home / End 跳到两头</p>

    <p class="demo__caption">card 型：每个标签一条宣纸签条，激活的那条像书签一样插进内容区的框里</p>
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
      <MTabs :position="position">
        <MTabPane name="a" label="第一">
          <p style="margin: 0">line 型换位置，笔触线跟着换到对应那一边。</p>
        </MTabPane>
        <MTabPane name="b" label="第二">
          <p style="margin: 0">第二页。</p>
        </MTabPane>
        <MTabPane name="c" label="第三">
          <p style="margin: 0">第三页。</p>
        </MTabPane>
      </MTabs>
      <MTabs type="card" :position="position">
        <MTabPane name="a" label="甲">
          <p style="margin: 0">card 型换位置，签条从对应那一边插进来，朝内容区那面不画框线。</p>
        </MTabPane>
        <MTabPane name="b" label="乙">
          <p style="margin: 0">乙。</p>
        </MTabPane>
      </MTabs>
    </div>

    <p class="demo__caption">
      可关闭 + extra 插槽：关闭只发 tabRemove，增删由使用方改列表；删掉当前页会自动落到邻居
    </p>
    <MTabs v-model="editableActive" type="card" closable @tab-remove="remove">
      <MTabPane v-for="t in editable" :key="t.name" :name="t.name" :label="t.label">
        <p style="margin: 0">{{ t.body }}</p>
      </MTabPane>
      <template #extra>
        <MButton type="text" @click="add">新增一页</MButton>
      </template>
    </MTabs>

    <p class="demo__caption">stretch：标签平分宽度</p>
    <MTabs stretch>
      <MTabPane name="a" label="东"><p style="margin: 0">东。</p></MTabPane>
      <MTabPane name="b" label="南"><p style="margin: 0">南。</p></MTabPane>
      <MTabPane name="c" label="西"><p style="margin: 0">西。</p></MTabPane>
      <MTabPane name="d" label="北"><p style="margin: 0">北。</p></MTabPane>
    </MTabs>

    <p class="demo__caption">label 插槽 + lazy：懒的那页首次激活才渲染</p>
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
    <MTabs disabled>
      <MTabPane name="a" label="不能点"><p style="margin: 0">全部禁用。</p></MTabPane>
      <MTabPane name="b" label="也不能点"><p style="margin: 0">看不到。</p></MTabPane>
    </MTabs>
  </div>
</template>
